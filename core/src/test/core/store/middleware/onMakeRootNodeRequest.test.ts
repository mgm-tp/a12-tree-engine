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

import { Commands, Events, type Identifier, TreeEngineState } from "../../../../core/store/index.js";
import { onMakeRootNodeRequestMiddleware } from "../../../../core/store/internal/middleware/events/onMakeRootNodeRequest.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";
import { setupMiddleware } from "../../../utils/store-utils.js";

import { nonMatchedAction, shouldCallNextMiddlewareAndReturnResultedAction } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.store.middleware.events.onEventButtonClickedRequest", () => {
	const basicEngineState = defaultEngineState;
	const basicNodeIdentifier: Identifier = { id: "DomainTeam/1", type: "DomainTeam" };

	function setupTest(initialEngineState = basicEngineState) {
		return setupMiddleware(onMakeRootNodeRequestMiddleware, initialEngineState);
	}

	describe("given a matched action", () => {
		const parentLinks = Array.from({ length: 3 }).map(() => mockType<TreeEngineState.Link>());
		const action = Events.onMakeRootNodeRequest.started({ parentLinks, nodeIdentifier: basicNodeIdentifier });

		it("should open a dialog", () => {
			const { invoke, store } = setupTest();

			invoke(action);

			expect(store.dispatch).toHaveBeenCalledOnce();
			expect(store.dispatch).toHaveBeenCalledWith(
				Commands.setDialogState({
					state: {
						type: TreeEngineState.Dialog.Type.CONFIRMATION,
						confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.MAKE_ROOT_NODE,
						nodeIdentifier: basicNodeIdentifier,
						nodeDisplayName: "A12",
						parentLinks
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
