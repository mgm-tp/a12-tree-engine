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

import { Events, Commands, type TreeEngineState } from "../../../../core/store/index.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { setupMiddleware } from "../../../utils/store-utils.js";
import { onColumnWidthsChangedMiddleware } from "../../../../core/store/middleware/events/onColumnWidthsChanged.js";

import { nonMatchedAction, shouldCallNextMiddlewareAndReturnResultedAction } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.store.middleware.events.onColumnWidthsChanged", () => {
	const basicEngineState = defaultEngineState;

	function setupTest(initialState = basicEngineState) {
		return setupMiddleware(onColumnWidthsChangedMiddleware, initialState);
	}

	describe("given a matched action", () => {
		const changedColumnWidths: TreeEngineState.ColumnWidths = { abc: 1, def: 2 };
		const action = Events.onColumnWidthsChanged({ changedColumnWidths });

		it("should dispatch setColumnWidths command", () => {
			const { store, invoke } = setupTest();
			invoke(action);

			expect(store.dispatch).toHaveBeenCalledOnce();
			expect(store.dispatch).toHaveBeenCalledWith(Commands.setColumnWidths({ columnWidths: changedColumnWidths }));
		});

		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, action);
	});

	describe("given a non-matched action", () => {
		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, nonMatchedAction);
	});
});
