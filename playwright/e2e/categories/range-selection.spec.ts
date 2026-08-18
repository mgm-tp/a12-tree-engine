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


import { test } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { cleanDocumentsData, seedData } from "../../../services-utils/src";

import { CategoriesUtils } from "./utils";

test.describe("range-selection", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);
		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await seedData({
			preset: "categories-slim"
		});
		await page.goto("");
		await utils.navigate();
	});

	test.describe("continuous selection", () => {
		test("should work from top to bottom with click + shift-click", async ({ page }) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition");
			await commands.assertMultiSelectionState(page, {
				counter: 2,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia collector edition"],
					partlySelected: ["Nokia"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "iPhone 11 Pro Max 256GB", true);
			await commands.assertMultiSelectionState(page, {
				counter: 5,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia collector edition", "Apple", "iPhone 11 Pro Max 256GB", "iPhone 12 Pro Max 256GB"],
					partlySelected: ["Nokia"],
					deselected: [/.*/]
				}
			});
		});

		test("should work from bottom to top with click + shift-click", async ({ page }) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "iPhone 12 Pro Max 256GB");
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["iPhone 12 Pro Max 256GB"],
					partlySelected: ["Apple"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition", true);
			await commands.assertMultiSelectionState(page, {
				counter: 5,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia collector edition", "Apple", "iPhone 11 Pro Max 256GB", "iPhone 12 Pro Max 256GB"],
					partlySelected: ["Nokia"],
					deselected: [/.*/]
				}
			});
		});

		test("should work from top to bottom with click + shift-click + shift-click", async ({ page }) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "Nokia 8.1");
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia 8.1"],
					partlySelected: ["Nokia", "Nokia budget phones"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition", true);
			await commands.assertMultiSelectionState(page, {
				counter: 4,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia 8.1", "Pixel 4 XL", "Nokia collector edition"],
					partlySelected: ["Nokia", "Nokia budget phones"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "iPhone 11 Pro Max 256GB", true);
			await commands.assertMultiSelectionState(page, {
				counter: 7,
				overallState: "partlySelected",
				nodeStates: {
					selected: [
						"Nokia 8.1",
						"Pixel 4 XL",
						"Nokia collector edition",
						"Apple",
						"iPhone 11 Pro Max 256GB",
						"iPhone 12 Pro Max 256GB"
					],
					partlySelected: ["Nokia", "Nokia budget phones"],
					deselected: [/.*/]
				}
			});
		});

		test("should work from bottom to top with click + shift-click + shift-click", async ({ page }) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "iPhone 12 Pro Max 256GB");
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["iPhone 12 Pro Max 256GB"],
					partlySelected: ["Apple"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition", true);
			await commands.assertMultiSelectionState(page, {
				counter: 5,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia collector edition", "Apple", "iPhone 11 Pro Max 256GB", "iPhone 12 Pro Max 256GB"],
					partlySelected: ["Nokia"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia 8.1", true);
			await commands.assertMultiSelectionState(page, {
				counter: 7,
				overallState: "partlySelected",
				nodeStates: {
					selected: [
						"Nokia 8.1",
						"Pixel 4 XL",
						"Nokia collector edition",
						"Apple",
						"iPhone 11 Pro Max 256GB",
						"iPhone 12 Pro Max 256GB"
					],
					partlySelected: ["Nokia", "Nokia budget phones"],
					deselected: [/.*/]
				}
			});
		});

		test("should work from top to bottom with shift-click + shift-click", async ({ page }) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition", true);
			await commands.assertMultiSelectionState(page, {
				counter: 2,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia collector edition"],
					partlySelected: ["Nokia"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "iPhone 11 Pro Max 256GB", true);
			await commands.assertMultiSelectionState(page, {
				counter: 5,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia collector edition", "Apple", "iPhone 11 Pro Max 256GB", "iPhone 12 Pro Max 256GB"],
					partlySelected: ["Nokia"],
					deselected: [/.*/]
				}
			});
		});

		test("should work from bottom to top with shift-click + shift-click", async ({ page }) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "iPhone 12 Pro Max 256GB", true);
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["iPhone 12 Pro Max 256GB"],
					partlySelected: ["Apple"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition", true);
			await commands.assertMultiSelectionState(page, {
				counter: 5,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia collector edition", "Apple", "iPhone 11 Pro Max 256GB", "iPhone 12 Pro Max 256GB"],
					partlySelected: ["Nokia"],
					deselected: [/.*/]
				}
			});
		});
	});

	test.describe("intermittent selection with non-selected nodes in between", () => {
		test("should work from top to bottom when shift-clicked node does not stay between others selected node", async ({
			page
		}) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "Nokia 8.1");
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia 8.1"],
					partlySelected: ["Nokia", "Nokia budget phones"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition");
			await commands.assertMultiSelectionState(page, {
				counter: 3,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia 8.1", "Nokia collector edition"],
					partlySelected: ["Nokia", "Nokia budget phones"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "iPhone 11 Pro Max 256GB", true);
			await commands.assertMultiSelectionState(page, {
				counter: 6,
				overallState: "partlySelected",
				nodeStates: {
					selected: [
						"Nokia 8.1",
						"Nokia collector edition",
						"Apple",
						"iPhone 11 Pro Max 256GB",
						"iPhone 12 Pro Max 256GB"
					],
					partlySelected: ["Nokia", "Nokia budget phones"],
					deselected: [/.*/]
				}
			});
		});

		test("should work from bottom to top when shift-clicked node does not stay between others selected node", async ({
			page
		}) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "iPhone 12 Pro Max 256GB");
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["iPhone 12 Pro Max 256GB"],
					partlySelected: ["Apple"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition");
			await commands.assertMultiSelectionState(page, {
				counter: 3,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia collector edition", "iPhone 12 Pro Max 256GB"],
					partlySelected: ["Nokia", "Apple"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia 8.1", true);
			await commands.assertMultiSelectionState(page, {
				counter: 5,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia 8.1", "Pixel 4 XL", "Nokia collector edition", "iPhone 12 Pro Max 256GB"],
					partlySelected: ["Nokia", "Nokia budget phones", "Apple"],
					deselected: [/.*/]
				}
			});
		});

		test("should work from top to bottom shift-clicked node stays between others selected node", async ({ page }) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "Nokia 8.1");
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia 8.1"],
					partlySelected: ["Nokia", "Nokia budget phones"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "iPhone 11 Pro Max 256GB");
			await commands.assertMultiSelectionState(page, {
				counter: 2,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia 8.1", "iPhone 11 Pro Max 256GB"],
					partlySelected: ["Nokia", "Nokia budget phones", "Apple"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition", true);
			await commands.assertMultiSelectionState(page, {
				counter: 6,
				overallState: "partlySelected",
				nodeStates: {
					selected: [
						"Nokia 8.1",
						"Nokia collector edition",
						"Apple",
						"iPhone 11 Pro Max 256GB",
						"iPhone 12 Pro Max 256GB"
					],
					partlySelected: ["Nokia", "Nokia budget phones"],
					deselected: [/.*/]
				}
			});
		});

		test("should work from bottom to top when shift-clicked node stays between others selected node", async ({
			page
		}) => {
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});

			await commands.clickCheckbox(undefined, "iPhone 11 Pro Max 256GB");
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["iPhone 11 Pro Max 256GB"],
					partlySelected: ["Apple"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia 8.1");
			await commands.assertMultiSelectionState(page, {
				counter: 2,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia 8.1", "iPhone 11 Pro Max 256GB"],
					partlySelected: ["Nokia", "Nokia budget phones", "Apple"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Nokia collector edition", true);
			await commands.assertMultiSelectionState(page, {
				counter: 5,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Nokia 8.1", "Pixel 4 XL", "Nokia collector edition", "iPhone 11 Pro Max 256GB"],
					partlySelected: ["Nokia", "Nokia budget phones", "Apple"],
					deselected: [/.*/]
				}
			});
		});
	});
});
