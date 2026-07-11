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

import type { QueryJsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { DataOperation } from "../../../extensions/server-connector/index.js";
import { A12QueryAPIUtils } from "../../../extensions/server-connector/data-loaders/queries/utils.js";

describe("com.mgmtp.a12.tree-engine.services.query-api.internal.query-api-utils", () => {
	describe("paging utilities", () => {
		const testCases: DataOperation.Query.Paging[] = [
			{ offset: 1, limit: 5 },
			{ offset: 2, limit: 10 },
			{ offset: 20, limit: 5 },
			{ offset: 23, limit: 5 },
			{ offset: 78, limit: 5 },
			{ offset: 129, limit: 5 },
			{ offset: 15, limit: 20 },
			{ offset: 18, limit: 20 },
			{ offset: 154, limit: 20 },
			{ offset: 178, limit: 20 },
			{ offset: 699, limit: 20 },
			{ offset: 0, limit: 20 },
			{ offset: 25, limit: 50 },
			{ offset: 38, limit: 80 },
			{ offset: 125, limit: 80 },
			{ offset: 368, limit: 50 },
			{ offset: 9, limit: 50 },
			{ offset: 12, limit: 100 },
			{ offset: 45, limit: 100 },
			{ offset: 69, limit: 100 },
			{ offset: 700, limit: 100 }
		];

		testCases.forEach((testCase) => {
			it(`transformPaging for limit "${testCase.limit}", offset "${testCase.offset}"`, () => {
				const { pageSize, pageNumber } = A12QueryAPIUtils.Paging.transformPaging(testCase);

				expect(pageNumber * pageSize).lte(testCase.offset);
				expect((pageNumber + 1) * pageSize).gte(testCase.offset + testCase.limit);
			});

			it(`removeUnusedResults for limit "${testCase.limit}", offset "${testCase.offset}`, () => {
				const paging = A12QueryAPIUtils.Paging.transformPaging(testCase);
				const entries: QueryJsonRpc2Response.DocumentEntry[] = Array.from({ length: paging.pageSize }).map(
					() => ({}) as QueryJsonRpc2Response.DocumentEntry
				);

				const result = A12QueryAPIUtils.Paging.removedUnusedResults(entries, paging, testCase);

				expect(result).length(testCase.limit);
			});
		});
	});
});
