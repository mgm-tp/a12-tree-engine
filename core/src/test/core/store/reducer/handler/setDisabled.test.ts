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

import { Commands } from "../../../../../core/store/index.js";
import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { handleSetDisabled } from "../../../../../core/store/reducer/handler/setDisabled.js";

describe("@com.mgmtp.a12.tree-engine.core.store.reducer.handler.setDisabled", () => {
	const engineState = defaultEngineState;
	describe("handleSetDisabled", () => {
		describe("given an action with disabled value is set to true", () => {
			const action = Commands.setDisabled({ disabled: true });
			it("engine state with disabled value equals to true should be returned", () => {
				const nextState = handleSetDisabled(engineState, action);
				expect(nextState.disabled).equal(true);
			});
		});
		describe("given an action with disabled value is set to false", () => {
			const action = Commands.setDisabled({ disabled: false });
			it("engine state with disabled value equals to false should be returned", () => {
				const nextState = handleSetDisabled(engineState, action);
				expect(nextState.disabled).equal(false);
			});
		});
	});
});
