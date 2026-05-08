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

import { type Identifier } from "../../core/store/index.js";
import { TreeEngineDataHolder } from "../../extensions/client/index.js";
import { PaginationUtils } from "../../extensions/server-connector/internal/data-providers/resolver/pagination-utils.js";

import { mockType } from "../utils/mock-utils.js";

describe("@com.mgmtp.a12.tree-engine.extensions.server-connector.pagination-utils", () => {
	describe("getSize", () => {
		it("should return correct size", () => {
			const dataHolder = mockType<TreeEngineDataHolder>({
				slices: TreeEngineDataHolder.Slices.toSlices({
					fullSize: 4,
					expectedSize: 4,
					children: [mockType<Identifier>(), mockType<Identifier>()]
				})
			});

			const result = PaginationUtils.getSize(dataHolder);
			expect(result.expectedSize).toBe(4);
			expect(result.currentSize).toBe(2);
			expect(result.fullSize).toBe(4);
		});
	});

	describe("setSize", () => {
		const dataHolder = mockType<TreeEngineDataHolder>({
			slices: TreeEngineDataHolder.Slices.toSlices({
				fullSize: 8,
				children: [mockType<Identifier>(), mockType<Identifier>()]
			})
		});

		describe("direct", () => {
			it("should be able to directly set the size", () => {
				const updatedDataHolder = PaginationUtils.setSize(dataHolder, { expectedSize: 4, fullSize: 10 });
				const result = PaginationUtils.getSize(updatedDataHolder);
				expect(result.expectedSize).toBe(4);
				expect(result.currentSize).toBe(2);
				expect(result.fullSize).toBe(10);
			});
		});

		describe("offset", () => {
			it("should be able to update with offset", () => {
				let updatedDataHolder = PaginationUtils.setSize(dataHolder, { expectedSize: 4 });
				updatedDataHolder = PaginationUtils.setSize(updatedDataHolder, { expectedSizeOffset: +4, fullSizeOffset: +1 });
				const result = PaginationUtils.getSize(updatedDataHolder);
				expect(result.expectedSize).toBe(8);
				expect(result.currentSize).toBe(2);
				expect(result.fullSize).toBe(9);
			});
		});

		describe("combine", () => {
			it("should be able to combine together", () => {
				const updatedDataHolder = PaginationUtils.setSize(dataHolder, {
					expectedSize: 4,
					expectedSizeOffset: -1,
					fullSizeOffset: -1
				});
				const result = PaginationUtils.getSize(updatedDataHolder);
				expect(result.expectedSize).toBe(3);
				expect(result.currentSize).toBe(2);
				expect(result.fullSize).toBe(7);
			});
		});
	});

	describe("toPaging", () => {
		it("should use default modelPageSize if dataHolder is not loaded", () => {
			const dataHolder = mockType<TreeEngineDataHolder>({ slices: {} });
			const paging = PaginationUtils.toPaging(dataHolder, 10);
			expect(paging?.offset).toBe(0);
			expect(paging?.limit).toBe(10);
		});

		it("should load from beginning if reload = true", () => {
			const dataHolder = setupDataHolder({ currentSize: 20, expectedSize: 21, fullSize: 80 });
			const paging = PaginationUtils.toPaging(dataHolder, 10, true);
			expect(paging?.offset).toBe(0);
			expect(paging?.limit).toBe(21);
		});

		it("should load additively if expectedSize > currentSize", () => {
			const dataHolder = setupDataHolder({ currentSize: 20, expectedSize: 30, fullSize: 80 });
			const paging = PaginationUtils.toPaging(dataHolder, 10);
			expect(paging?.offset).toBe(20);
			expect(paging?.limit).toBe(10);
		});
	});

	function setupDataHolder(params: { expectedSize?: number; fullSize: number; currentSize: number }) {
		const { fullSize, expectedSize, currentSize } = params;

		return mockType<TreeEngineDataHolder>({
			slices: TreeEngineDataHolder.Slices.toSlices({
				expectedSize,
				fullSize,
				children: Array.from({ length: currentSize }).map(() => mockType<Identifier>())
			})
		});
	}
});
