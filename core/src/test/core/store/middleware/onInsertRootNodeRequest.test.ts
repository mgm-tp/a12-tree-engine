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

import type { ModelGraph } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { RuntimeTreeModel, TreeModel } from "../../../../core/models/index.js";
import { Commands, Events } from "../../../../core/store/index.js";
import { onInsertRootNodeRequestMiddleware } from "../../../../core/store/middleware/events/onInsertRootNodeRequest.js";
import { TreeEngineState } from "../../../../core/store/index.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";
import { createEngineState } from "../../../utils/model-utils.js";
import { setupMiddleware } from "../../../utils/store-utils.js";

import { nonMatchedAction, shouldCallNextMiddlewareAndReturnResultedAction } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.store.middleware.events.onInsertRootNodeRequest", () => {
	const basicEngineState = defaultEngineState;

	function setupTest(initialEngineState = basicEngineState) {
		return setupMiddleware(onInsertRootNodeRequestMiddleware, initialEngineState);
	}

	describe("given a matched action", () => {
		const button = mockType<TreeModel.ButtonType>();
		const action = Events.onInsertRootNodeRequest.started({ button: button });

		describe("given the root document model does not have sub types", () => {
			it("should dispatch request done action", () => {
				const { store, invoke } = setupTest();
				invoke(action);
				expect(store.dispatch).toHaveBeenCalledOnce();
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onInsertRootNodeRequest.done({ params: action.payload, result: { documentModelId: "DomainTeam" } })
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(setupTest, action);
		});

		describe("given the root document have sub types", () => {
			const rootModelId = "super-type";
			const rootDocumentModelMock = mockType<ModelGraph.DocumentModel>({
				modelId: rootModelId,
				subTypes: ["sub-type-1", "sub-type-2"]
			});

			const engineState = createEngineState
				.from(basicEngineState)
				.withDocumentModels([...basicEngineState.models.modelGraph.documentModels, rootDocumentModelMock])
				.withConfigurations(mockType<RuntimeTreeModel.Configuration>({ root: { documentModelRef: rootModelId } }))
				.create();

			it("should open an insert-root dialog", () => {
				const { store, invoke } = setupTest(engineState);
				invoke(action);

				expect(store.dispatch).toHaveBeenCalledOnce();
				expect(store.dispatch).toHaveBeenCalledWith(
					Commands.setDialogState({
						state: {
							type: TreeEngineState.Dialog.Type.INSERT_ROOT_NODE,
							button
						}
					})
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given the document model id", () => {
			const action = Events.onInsertRootNodeRequest.started({ button, documentModelId: "DomainTeam" });
			it("should dispatch request Events.onInsertRootNodeRequest.done action", () => {
				const { store, invoke } = setupTest();
				invoke(action);
				expect(store.dispatch).toHaveBeenCalledOnce();
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onInsertRootNodeRequest.done({ params: action.payload, result: { documentModelId: "DomainTeam" } })
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(setupTest, action);
		});
	});

	describe("given a non-matched action", () => {
		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, nonMatchedAction);
	});
});
