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

import {
	type TreeBodyStateInput,
	resolveTreeBodyState
} from "../../../../../../core/view/components/tree-engine/sub-components/tree-body-state.js";

describe("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.tree-body-state", () => {
	/**
	 * A loaded tree, no search, no virtual root — the plain case every other test varies from.
	 * Without a virtual root `rowCount` is the tree's own nodes; with one it is the nodes plus the
	 * virtual root row.
	 */
	const baseInput: TreeBodyStateInput = {
		rowCount: 12,
		busy: false,
		reducedSearchView: false,
		hasVirtualRoot: false
	};

	const resolve = (overrides: Partial<TreeBodyStateInput>) => resolveTreeBodyState({ ...baseInput, ...overrides });

	describe("without a search", () => {
		it("should render the rows", () => {
			expect(resolve({})).toBe("tree");
			expect(resolve({ hasVirtualRoot: true })).toBe("tree");
		});

		it("should invite the first node when a virtual root tree is empty", () => {
			expect(resolve({ rowCount: 1, hasVirtualRoot: true })).toBe("initial-view");
		});

		it("should render the empty table when a tree without a virtual root is empty", () => {
			// Nothing to point at: the add menu lives on the virtual root, so there is no offer to make.
			expect(resolve({ rowCount: 0 })).toBe("tree");
		});
	});

	describe("in the reduced search view", () => {
		const reduced = { reducedSearchView: true };

		it("should report an empty result when nothing is displayed", () => {
			expect(resolve({ ...reduced, rowCount: 0 })).toBe("empty-search-result");
		});

		it("should render a result that fills a single row", () => {
			// Without a virtual root the root row is not rendered, so one row is one matching node —
			// a term matching a single root node used to be reported as no result at all.
			expect(resolve({ ...reduced, rowCount: 1 })).toBe("tree");
		});

		it("should report an empty result rather than invite the first node", () => {
			// The tree is full of nodes the filter is hiding; "add your first node" would be false and
			// would offer an action on a false premise.
			expect(resolve({ ...reduced, rowCount: 1, hasVirtualRoot: true })).toBe("empty-search-result");
		});

		it("should render the rows once anything survives the filter", () => {
			expect(resolve({ ...reduced, rowCount: 2 })).toBe("tree");
			// The virtual root row does not count as a survivor, so one node beside it does.
			expect(resolve({ ...reduced, rowCount: 2, hasVirtualRoot: true })).toBe("tree");
		});
	});

	describe("in the complete search view", () => {
		// The complete view leaves `reducedSearchView` false, exactly as an inactive search does.
		const complete = { reducedSearchView: false };

		it("should never report an empty result, whatever the term matched", () => {
			// The complete view shows the whole tree by definition; a term matching nothing leaves it
			// fully visible with nothing highlighted, which is itself the answer.
			expect(resolve({ ...complete })).toBe("tree");
		});

		it("should keep the rows when the tree is collapsed down to its roots", () => {
			expect(resolve({ ...complete, rowCount: 1 })).toBe("tree");
			expect(resolve({ ...complete, rowCount: 2 })).toBe("tree");
		});

		it("should invite the first node when the tree really is empty", () => {
			expect(resolve({ ...complete, rowCount: 1, hasVirtualRoot: true })).toBe("initial-view");
		});
	});

	describe("while busy", () => {
		it("should hold back a state that is about to change", () => {
			expect(resolve({ busy: true, rowCount: 1, hasVirtualRoot: true })).toBe("pending");
			expect(resolve({ busy: true, rowCount: 0, reducedSearchView: true })).toBe("pending");
		});

		it("should still render the rows it already has", () => {
			expect(resolve({ busy: true })).toBe("tree");
		});
	});
});
