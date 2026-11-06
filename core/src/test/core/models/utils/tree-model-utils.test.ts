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

import type { TreeModel } from "../../../../core/models/tree-model.js";
import { TreeModelUtils } from "../../../../core/models/utils/tree-model-utils.js";
import { mockType } from "../../../utils/mock-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.models.utils.tree-model-utils", () => {
	function configuration(searchResultViews?: TreeModel.SearchResultView[]): TreeModel.Configuration {
		return mockType<TreeModel.Configuration>({ searchResultViews });
	}

	describe("getSearchResultViews", () => {
		it("should offer both views when the model names none", () => {
			expect(TreeModelUtils.getSearchResultViews(configuration())).toEqual(["reduced", "complete"]);
			expect(TreeModelUtils.getSearchResultViews(configuration([]))).toEqual(["reduced", "complete"]);
		});

		it("should offer only what the model names", () => {
			expect(TreeModelUtils.getSearchResultViews(configuration(["complete"]))).toEqual(["complete"]);
			expect(TreeModelUtils.getSearchResultViews(configuration(["reduced"]))).toEqual(["reduced"]);
		});

		it("should drop a repeated view", () => {
			expect(TreeModelUtils.getSearchResultViews(configuration(["complete", "complete"]))).toEqual(["complete"]);
		});
	});

	describe("resolveSearchResultView", () => {
		it("should open reduced whatever order the model lists", () => {
			// The order a modeler writes carries no meaning; only membership does.
			expect(TreeModelUtils.resolveSearchResultView(configuration(["complete", "reduced"]), undefined)).toBe("reduced");
			expect(TreeModelUtils.resolveSearchResultView(configuration(["reduced", "complete"]), undefined)).toBe("reduced");
			expect(TreeModelUtils.resolveSearchResultView(configuration(), undefined)).toBe("reduced");
		});

		it("should pin the tree to a single modeled view", () => {
			expect(TreeModelUtils.resolveSearchResultView(configuration(["complete"]), undefined)).toBe("complete");
		});

		it("should keep the view the user chose", () => {
			expect(TreeModelUtils.resolveSearchResultView(configuration(), "complete")).toBe("complete");
		});

		it("should ignore a chosen view the model does not offer", () => {
			expect(TreeModelUtils.resolveSearchResultView(configuration(["reduced"]), "complete")).toBe("reduced");
			expect(TreeModelUtils.resolveSearchResultView(configuration(["complete"]), "reduced")).toBe("complete");
		});
	});
});
