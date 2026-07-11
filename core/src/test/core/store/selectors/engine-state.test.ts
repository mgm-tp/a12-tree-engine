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

import type { TreeEngineState } from "../../../../core/store/index.js";
import { engineState, isEngineState } from "../../../../core/store/shared.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";

describe("@com.mgmtp.a12.tree-engine.core.store.selectors.engine-state", () => {
	const basicEngineState = defaultEngineState;

	function getInvalidStates(): object[] {
		const missingFields: (keyof TreeEngineState)[] = [
			"root",
			"data",
			"models",
			"selectedNodes",
			"expandedNodes",
			"matchedNodes",
			"query",
			"dialog"
		];
		return missingFields.map((field) => {
			const clonedState: TreeEngineState = { ...basicEngineState };
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete clonedState[field];
			return clonedState;
		});
	}

	describe("engineState", () => {
		describe("given a valid state", () => {
			it("the state should be returned", () => {
				expect(engineState(basicEngineState)).toBe(basicEngineState);
			});
		});
		describe("given an invalid state", () => {
			it("errors should be thrown", () => {
				const invalidStates = getInvalidStates();
				invalidStates.forEach((invalidState) => {
					expect(() => engineState(invalidState)).toThrow();
				});
			});
		});
	});

	describe("isEngineState", () => {
		describe("given a valid state", () => {
			it("it should return true", () => {
				expect(isEngineState(basicEngineState)).toBe(true);
			});
		});
		describe("given an invalid state", () => {
			it("it should return false", () => {
				const invalidStates = getInvalidStates();
				invalidStates.forEach((invalidState) => {
					expect(() => engineState(invalidState)).toThrow();
				});
			});
		});
	});
});
