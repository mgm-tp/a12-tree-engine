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

import { SearchSelector } from "../../../../core/store/selectors/search.js";
import type { TreeEngineState } from "../../../../core/store/store.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";

describe("@com.mgmtp.a12.tree-engine.core.store.selectors.search", () => {
	function searchingFor(matchedNodeId: string): TreeEngineState {
		return {
			...defaultEngineState,
			searchString: "term",
			matchedNodes: { DomainTeam: { [matchedNodeId]: { matchCount: 1 } } }
		};
	}

	describe("reducedViewNodes", () => {
		it("should keep the matched node only", () => {
			const result = SearchSelector.reducedViewNodes()(searchingFor("DomainTeam/1"));
			expect(result && [...result]).toEqual(["DomainTeam/1"]);
		});

		it("should follow a new set of matches", () => {
			SearchSelector.reducedViewNodes()(searchingFor("DomainTeam/1"));

			const result = SearchSelector.reducedViewNodes()(searchingFor("DomainTeam/2"));
			expect(result && [...result]).toEqual(["DomainTeam/2"]);
		});

		it("should apply no filter without a search", () => {
			expect(SearchSelector.reducedViewNodes()(defaultEngineState)).toBeUndefined();
		});
	});
});
