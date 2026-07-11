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

import type { FieldInstanceValue, GroupInstance } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { DocumentUtils } from "../../../../core/models/utils/document-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.models.utils.document-utils", () => {
	describe("DocumentUtils", () => {
		function testPredicate<T>(
			predicate: (value: T) => boolean,
			validValues: ReadonlyArray<T>,
			invalidValues: ReadonlyArray<T>
		) {
			validValues.forEach((value) => {
				describe("when given value = " + JSON.stringify(value), () => {
					it("should return true", () => {
						expect(predicate(value)).toBe(true);
					});
				});
			});

			invalidValues.forEach((value) => {
				describe("when given value = " + JSON.stringify(value), () => {
					it("should return true", () => {
						expect(predicate(value)).toBe(false);
					});
				});
			});
		}

		describe("isFieldInstanceValue", () => {
			const validValues: FieldInstanceValue[] = [
				"",
				0,
				-9007199254740991,
				Infinity,
				false,
				null,
				new Date(2020, 0, 1),
				[],
				[new Date(2020, 0, 1)],
				[new Date(2020, 0, 1), new Date(2020, 10, 2)]
			];

			const invalidValues: (GroupInstance | FieldInstanceValue | object)[] = [{}];

			describe("isInstance", () => {
				testPredicate(DocumentUtils.isFieldInstanceValue, validValues, invalidValues);
			});
		});

		describe("isGroupInstance", () => {
			type Inputs = (GroupInstance | FieldInstanceValue | object)[];

			const validValues: Inputs = [{}, { x: [] }, { x: {} }, /x/];
			const invalidValues: Inputs = ["", 0, -9007199254740991, true, false, null, new Date(2020, 0, 1)];

			testPredicate(DocumentUtils.isGroupInstance, validValues, invalidValues);
		});
	});
});
