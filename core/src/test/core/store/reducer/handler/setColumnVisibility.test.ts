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

import { Commands, type TreeEngineState } from "../../../../../core/store/index.js";
import { handleSetColumnVisibility } from "../../../../../core/store/reducer/handler/setColumnVisibility.js";
import { defaultEngineState } from "../../../../setup/basic.spec.js";

describe("@com.mgmtp.a12.tree-engine.core.store.reducer.handler.setColumnVisibility", () => {
	const engineState = defaultEngineState;

	describe("handleSetColumnVisibility", () => {
		describe("given an action with certain column visibility", () => {
			const columnVisibility: TreeEngineState.ColumnVisibility = { abc: false, def: true };
			const action = Commands.setColumnVisibility({ columnVisibility });

			it("engine state with that column visibility should be returned", () => {
				const nextState = handleSetColumnVisibility(engineState, action);
				expect(nextState.columnVisibility).equal(columnVisibility);
			});
		});

		describe("given an action with an empty map", () => {
			const action = Commands.setColumnVisibility({ columnVisibility: {} });

			it("the previous overrides should be replaced, not merged", () => {
				const previousState = handleSetColumnVisibility(
					engineState,
					Commands.setColumnVisibility({ columnVisibility: { abc: false } })
				);

				const nextState = handleSetColumnVisibility(previousState, action);
				expect(nextState.columnVisibility).deep.equal({});
			});
		});
	});
});
