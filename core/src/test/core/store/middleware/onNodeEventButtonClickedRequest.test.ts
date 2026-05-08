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

import { type TreeModel } from "../../../../core/models/index.js";
import { Commands, Events, type Identifier, TreeEngineState } from "../../../../core/store/index.js";
import { onNodeEventButtonClickedRequestMiddleware } from "../../../../core/store/internal/middleware/events/onNodeEventButtonClickedRequest.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";
import { setupMiddleware } from "../../../utils/store-utils.js";

import { nonMatchedAction, shouldCallNextMiddlewareAndReturnResultedAction } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.store.middleware.events.onNodeEventButtonClickedRequest", () => {
	const basicEngineState = defaultEngineState;

	function setupTest(initialEngineState = basicEngineState) {
		return setupMiddleware(onNodeEventButtonClickedRequestMiddleware, initialEngineState);
	}

	describe("given a matched action", () => {
		const nodeIdentifier: Identifier = { id: "DomainPerson/20", type: "DomainPerson" };
		const nodePath: TreeEngineState.NodePath = [
			{ id: "DomainTeam/1", type: "DomainTeam" },
			{ id: "TeamPerson/20", type: "TeamPerson" }
		];
		const button = mockType<TreeModel.TreeNodeEventActionButton>();
		const confirmation = mockType<TreeModel.ConfirmationText>();

		const action = Events.onNodeEventButtonClickedRequest({ nodeIdentifier, nodePath, button, confirmation });

		it("should open confirm dialog", () => {
			const { store, invoke } = setupTest();
			invoke(action);

			expect(store.dispatch).toHaveBeenCalledWith(
				Commands.setDialogState({
					state: {
						type: TreeEngineState.Dialog.Type.CONFIRMATION,
						confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.NODE_EVENT_BUTTON,
						confirmation,
						nodeIdentifier,
						nodePath,
						button
					}
				})
			);
		});

		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, action);
	});

	describe("given a non-matched action", () => {
		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, nonMatchedAction);
	});
});
