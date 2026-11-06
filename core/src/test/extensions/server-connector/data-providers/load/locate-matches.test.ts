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

import { Identifier } from "../../../../../core/store/store.js";
import {
	type SearchParentLinks,
	collectChainLinkPaths
} from "../../../../../extensions/server-connector/data-providers/load/locate-matches.js";

describe("@com.mgmtp.a12.tree-engine.extensions.server-connector.data-providers.load.locate-matches", () => {
	const A12 = "DomainTeam/A12";
	const UP = "DomainTeam/UP";
	const ENGINES = "DomainTeam/Engines";
	const LEVI = "DomainPerson/Levi";

	function teamLink(parentDocRef: string, linkId: string) {
		return { parentDocRef, linkId, relationshipModel: "TeamTeam", parentRole: "Parent", childRole: "Child" };
	}
	function personLink(parentDocRef: string, linkId: string) {
		return { parentDocRef, linkId, relationshipModel: "TeamPerson", parentRole: "Team", childRole: "Person" };
	}

	describe("collectChainLinkPaths", () => {
		it("should return the chain top followed by one identifier per ancestor link", () => {
			const parentLinks: SearchParentLinks = new Map([
				[LEVI, [personLink(UP, "TeamPerson/p1")]],
				[UP, [teamLink(A12, "TeamTeam/t1")]]
			]);

			const paths = collectChainLinkPaths(new Set([LEVI]), parentLinks);

			expect(paths).toEqual([
				[Identifier.from(A12), { type: "TeamTeam", id: "TeamTeam/t1" }, { type: "TeamPerson", id: "TeamPerson/p1" }]
			]);
		});

		it("should return one path per parent when the match is reachable several ways", () => {
			const parentLinks: SearchParentLinks = new Map([
				[LEVI, [personLink(UP, "TeamPerson/p1"), personLink(ENGINES, "TeamPerson/p2")]],
				[UP, [teamLink(A12, "TeamTeam/t1")]],
				[ENGINES, [teamLink(A12, "TeamTeam/t2")]]
			]);

			const paths = collectChainLinkPaths(new Set([LEVI]), parentLinks);

			expect(paths).toHaveLength(2);
			expect(paths.map((path) => path.map(({ id }) => id))).toEqual([
				[A12, "TeamTeam/t1", "TeamPerson/p1"],
				[A12, "TeamTeam/t2", "TeamPerson/p2"]
			]);
		});

		it("should stop at the top of a chain that never reaches a root", () => {
			const parentLinks: SearchParentLinks = new Map([[LEVI, [personLink(UP, "TeamPerson/p1")]]]);

			// The depth is still wanted, so the chain contributes as far as it climbed.
			expect(collectChainLinkPaths(new Set([LEVI]), parentLinks)).toEqual([
				[Identifier.from(UP), { type: "TeamPerson", id: "TeamPerson/p1" }]
			]);
		});

		it("should return the node alone when it has no ancestors", () => {
			expect(collectChainLinkPaths(new Set([A12]), new Map())).toEqual([[Identifier.from(A12)]]);
		});

		it("should cut a cycle instead of recursing forever", () => {
			const parentLinks: SearchParentLinks = new Map([
				[LEVI, [personLink(UP, "TeamPerson/p1")]],
				[UP, [teamLink(LEVI, "TeamTeam/t1")]]
			]);

			expect(collectChainLinkPaths(new Set([LEVI]), parentLinks)).toEqual([]);
		});
	});
});
