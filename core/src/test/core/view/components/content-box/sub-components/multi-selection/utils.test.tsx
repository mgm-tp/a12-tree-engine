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

import { TreeModel } from "../../../../../../../core/models/index.js";
import { hasMultiSelectionComponents } from "../../../../../../../core/view/components/content-box/sub-components/multi-selection/utils.js";

export const defaultMultiSelectionConfig: TreeModel.MultiSelectionConfiguration = {
	collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED,
	counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.SIMPLE
};

describe("@com.mgmtp.a12.tree-engine.core.view.components.content-box.sub-components.multi-selection.utils", () => {
	describe("hasMultiSelectionComponents", () => {
		function setupTest(multiSelectionConfig?: TreeModel.MultiSelectionConfiguration) {
			return hasMultiSelectionComponents(multiSelectionConfig);
		}

		const testCases: [TreeModel.MultiSelectionConfiguration | undefined, boolean][] = [
			[
				{
					collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE,
					counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.SIMPLE
				},
				true
			],
			[
				{
					collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED,
					counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.NONE
				},
				true
			],
			[
				{
					collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE,
					counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.NONE,
					buttons: [{ event: "delete", id: "1" }]
				},
				true
			],
			[
				{
					collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE,
					counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.NONE
				},
				false
			],
			[
				{
					collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE,
					counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.NONE,
					buttons: []
				},
				false
			],
			[undefined, false]
		];

		it("should return the expected value", () => {
			testCases.forEach(([config, expectedValue]) => {
				const result = setupTest(config);

				expect(result).toBe(expectedValue);
			});
		});
	});
});
