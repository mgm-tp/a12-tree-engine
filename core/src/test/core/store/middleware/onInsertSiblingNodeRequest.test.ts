/*
 * SPDX-License-Identifier: EUPL-1.2 OR LicenseRef-commercial
 *
 * Copyright (c) 2012-2026 mgm technology partners GmbH
 *
 * Dual License
 * ------------
 * This source file is part of the mgm A12 Platform and available under
 * a choice of two different licenses:
 *
 * 1. Open-Source License - EUPL v1.2
 *    You may redistribute and/or modify this file under the terms of the
 *    European Union Public License, version 1.2 - see https://eupl.eu/.
 *
 * 2. Commercial License
 *    Alternatively, you may obtain a commercial license from
 *    mgm technology partners GmbH, that permits use of this software
 *    under different terms (including support and maintenance services).
 *
 *    Please contact a12-license@mgm-tp.com for more information.
 *
 * You must select and comply with exactly one of the above license options.
 *
 * Warranty Disclaimer (applies to either option)
 * ----------------------------------------------
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT WARRANTY OF ANY KIND,
 * WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NON-INFRINGEMENT, EXCEPT WHERE SUCH DISCLAIMERS ARE HELD TO BE
 * LEGALLY INVALID. SEE THE RESPECTIVE LICENSE TEXT FOR DETAILS.
 */

import { TreeModel } from "../../../../core/models/index.js";
import { Commands, Events, type Identifier, TreeEngineState } from "../../../../core/store/index.js";
import { onInsertSiblingNodeRequestMiddleware } from "../../../../core/store/internal/middleware/events/onInsertSiblingNodeRequest.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";
import { setupMiddleware } from "../../../utils/store-utils.js";
import { createMockPerson } from "../../../utils/state-utils.js";

import { nonMatchedAction, shouldCallNextMiddlewareAndReturnResultedAction } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.store.middleware.events.onInsertSiblingNodeRequest", () => {
	const basicEngineState = defaultEngineState;

	function setupTest(initialEngineState = basicEngineState) {
		return setupMiddleware(onInsertSiblingNodeRequestMiddleware, initialEngineState);
	}

	describe("given a matched action", () => {
		describe("the document model id is missing", () => {
			const parentIdentifier: Identifier = { id: "DomainTeam/2", type: "DomainTeam" };
			const parentPath: TreeEngineState.NodePath = [parentIdentifier];
			const nodeIdentifier = { id: "DomainPerson/166", type: "DomainPerson" };
			const button = mockType<TreeModel.TreeNodeInsertActionButton>();
			const insertPosition: TreeEngineState.InsertPosition = {
				target: { nodeIdentifier, nodePath: [...parentPath, { id: "167", type: "TeamPerson" }] },
				position: TreeModel.InsertPosition.BELOW
			};

			it("should open a dialog", () => {
				const action = Events.onInsertSiblingNodeRequest.started({ button, insertPosition });
				const { invoke, store } = setupTest();
				invoke(action);

				expect(store.dispatch).toHaveBeenCalledOnce();
				expect(store.dispatch).toHaveBeenCalledWith(
					Commands.setDialogState({
						state: {
							type: TreeEngineState.Dialog.Type.INSERT_SIBLING_NODE,
							insertPosition,
							button,
							options: [
								expect.objectContaining({
									childRelationshipConfiguration: expect.objectContaining({
										relationshipModelRef: "TeamPerson",
										parentRole: "Team"
									}),
									documentModelId: "DomainPerson"
								})
							]
						}
					})
				);
			});
		});

		describe("given the document model id", () => {
			const nodeIdentifier = { id: "DomainTeam/1", type: "DomainTeam" };
			const button = mockType<TreeModel.TreeNodeInsertActionButton>();
			const documentModelId = "DomainTeam";
			const insertPosition: TreeEngineState.InsertPosition = {
				target: { nodeIdentifier, nodePath: [nodeIdentifier] },
				position: TreeModel.InsertPosition.BELOW
			};

			describe("given target is a root node > should dispatch insert root node request done action", () => {
				const action = Events.onInsertSiblingNodeRequest.started({
					button,
					insertPosition,
					documentModelId
				});
				const { store, invoke } = setupTest();
				invoke(action);
				expect(store.dispatch).toHaveBeenCalledOnce();
				expect(store.dispatch).toHaveBeenCalledWith({
					type: Events.onInsertRootNodeRequest.done.type,
					payload: {
						params: { button, insertPosition, documentModelId },
						result: {
							documentModelId
						}
					}
				});

				shouldCallNextMiddlewareAndReturnResultedAction(setupTest, action);
			});

			describe("given the target node is a child node", () => {
				const parentIdentifier: Identifier = { id: "DomainTeam/22", type: "DomainTeam" };
				const parentPath: TreeEngineState.NodePath = [parentIdentifier];
				const {
					identifier: firstPersonIdentifier,
					linkIdentifier: firstPersonLinkIdentifier,
					nodePath: firstPersonPath,
					link: firstPersonLink
				} = createMockPerson("DomainPerson/20", parentPath, parentIdentifier);

				const { linkIdentifier: secondPersonLinkIdentifier, link: secondPersonLink } = createMockPerson(
					"DomainPerson/21",
					parentPath,
					parentIdentifier
				);

				const children: Identifier[] = [
					{ id: "TeamTeam/21", type: "TeamTeam" },
					firstPersonLinkIdentifier,
					secondPersonLinkIdentifier
				];
				const parentNode: TreeEngineState.Node = { identifier: parentIdentifier, document: {}, children };
				const engineState: TreeEngineState = {
					...basicEngineState,
					root: { ...basicEngineState.root, children: [...basicEngineState.root.children, parentIdentifier] },
					data: {
						...basicEngineState.data,
						["TeamPerson"]: {
							...basicEngineState.data["TeamPerson"],
							[firstPersonLinkIdentifier.id]: firstPersonLink,
							[secondPersonLinkIdentifier.id]: secondPersonLink
						},
						["DomainTeam"]: {
							...basicEngineState.data["DomainTeam"],
							[parentIdentifier.id]: parentNode
						}
					}
				};

				const payloadParams: Events.InsertSiblingNodeRequestPayload.Param = {
					button,
					insertPosition: {
						target: { nodeIdentifier: firstPersonIdentifier, nodePath: firstPersonPath },
						position: TreeModel.InsertPosition.BELOW
					},
					documentModelId: "DomainPerson"
				};
				const action = Events.onInsertSiblingNodeRequest.started(payloadParams);

				const { store, invoke } = setupTest(engineState);
				invoke(action);
				expect(store.dispatch).toHaveBeenCalledOnce();
				expect(store.dispatch).toHaveBeenCalledWith({
					type: Events.onInsertSiblingNodeRequest.done.type,
					payload: {
						params: payloadParams,
						result: {
							documentModelId: payloadParams.documentModelId,
							childRelationshipConfiguration: expect.objectContaining({
								relationshipModelRef: "TeamPerson",
								parentRole: "Team"
							})
						}
					}
				});

				shouldCallNextMiddlewareAndReturnResultedAction(setupTest, action);
			});
		});
	});

	describe("given a non-matched action", () => {
		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, nonMatchedAction);
	});
});
