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

import type { TreeModel } from "../../../../core/models/index.js";
import { Commands, Events, type Identifier, TreeEngineState } from "../../../../core/store/index.js";
import { onDialogClosedMiddleware } from "../../../../core/store/middleware/events/onDialogClosed.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";
import { setupMiddleware } from "../../../utils/store-utils.js";

import { nonMatchedAction, shouldCallNextMiddlewareAndReturnResultedAction } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.store.middleware.events.onDialogClosed", () => {
	const basicEngineState = defaultEngineState;

	function setupTest(initialState = basicEngineState) {
		return setupMiddleware(onDialogClosedMiddleware, initialState);
	}

	describe("given a matched action", () => {
		const action = Events.onDialogClosed({});
		describe("given dialog state is null", () => {
			it("should not dispatch any action", () => {
				const { store, invoke } = setupTest();
				invoke(action);
				expect(store.dispatch).not.toHaveBeenCalled();
			});

			shouldCallNextMiddlewareAndReturnResultedAction(setupTest, action);
		});

		describe("given dialog state is of type InsertChildNode", () => {
			const options = mockType<TreeEngineState.Dialog.Option[]>();
			const insertPosition = mockType<TreeEngineState.InsertPosition>();
			const button = mockType<TreeModel.TreeNodeInsertActionButton>();
			const dialog: TreeEngineState.Dialog.InsertChildNode = {
				type: TreeEngineState.Dialog.Type.INSERT_CHILD_NODE,
				options,
				insertPosition,
				button
			};
			const engineState: TreeEngineState = { ...basicEngineState, dialog };

			it("should close the dialog and dispatch a failed event action", () => {
				const { store, invoke } = setupTest(engineState);
				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onInsertChildNodeRequest.failed({
						params: { insertPosition, button },
						error: {}
					})
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given dialog state is of type InsertRootNode", () => {
			const button = mockType<TreeModel.ButtonType>();
			const dialog: TreeEngineState.Dialog.InsertRootNode = {
				type: TreeEngineState.Dialog.Type.INSERT_ROOT_NODE,
				button
			};
			const engineState: TreeEngineState = { ...basicEngineState, dialog };
			it("should close the dialog and dispatch a failed event action", () => {
				const { store, invoke } = setupTest({ ...basicEngineState, dialog });

				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onInsertRootNodeRequest.failed({ params: { button }, error: {} })
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given dialog state is of type MakeRootNode", () => {
			const parentLinks = Array.from({ length: 3 }).map(() => mockType<TreeEngineState.Link>());
			const nodeIdentifier: Identifier = { id: "DomainTeam/1", type: "DomainTeam" };

			const dialog: TreeEngineState.Dialog.Confirmation.MakeRootNode = {
				type: TreeEngineState.Dialog.Type.CONFIRMATION,
				confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.MAKE_ROOT_NODE,
				nodeIdentifier,
				parentLinks,
				nodeDisplayName: "A12"
			};

			it("should close the dialog and dispatch a failed event action", () => {
				const { store, invoke } = setupTest({ ...basicEngineState, dialog });

				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onMakeRootNodeRequest.failed({
						params: { nodeIdentifier, parentLinks },
						error: {}
					})
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest({ ...basicEngineState, dialog }), action);
		});
	});

	describe("given a non-matched action", () => {
		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, nonMatchedAction);
	});
});
