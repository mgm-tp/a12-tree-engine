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

import { test, expect } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { cleanDocumentsData, seedData } from "../../../../services-utils/src/index.js";
import { Selector } from "../../selectors.js";

import { ModelEditorUtils } from "../utils.js";

/*
This test can be run in both modes: pagination and non-pagination.
Moved to pagination part to reduce testing time.
 */
test.describe("multi-selection", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeAll(async () => {
		await cleanDocumentsData({
			showcases: ["model-editor"],
			variant: "pagination"
		});
		await seedData({
			preset: "model-editor",
			variant: "pagination",
			data: "simple"
		});
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);
	});

	test("should work properly", async ({ page }) => {
		await utils.navigateToFileExplorer("Pagination");
		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();

		const dataModelerTree = commands.getDataModelerTree();

		await commands.assertMultiSelectionState(dataModelerTree, {
			counter: 0,
			overallState: "deselected",
			nodeStates: { deselected: [/.*/] },
			hasVirtualRoot: true
		});

		await commands.clickCheckbox(dataModelerTree, "Photo");
		await commands.assertMultiSelectionState(dataModelerTree, {
			counter: 4,
			overallState: "partlySelected",
			nodeStates: { selected: ["Photo"], partlySelected: ["Person"], deselected: [/.*/] },
			hasVirtualRoot: true
		});

		await commands.expandNode("Photo");
		await commands.assertMultiSelectionState(dataModelerTree, {
			counter: 4,
			overallState: "partlySelected",
			nodeStates: {
				selected: ["Photo", "Content", "Description", "Size"],
				partlySelected: ["Person"],
				deselected: [/.*/]
			},
			hasVirtualRoot: true
		});

		await commands.clickCheckbox(dataModelerTree, "Size");
		await commands.assertMultiSelectionState(dataModelerTree, {
			counter: 2,
			overallState: "partlySelected",
			nodeStates: { selected: ["Content", "Description"], partlySelected: ["Person", "Photo"], deselected: [/.*/] },
			hasVirtualRoot: true
		});

		await commands.clickCheckbox(dataModelerTree, "Basic");
		await commands.assertMultiSelectionState(dataModelerTree, {
			counter: 5,
			overallState: "partlySelected",
			nodeStates: {
				selected: ["Content", "Description", "Basic", "Gender", "Name"],
				partlySelected: ["Person", "Photo"],
				deselected: [/.*/]
			},
			hasVirtualRoot: true
		});

		await commands.clickCheckbox(dataModelerTree, "Person");
		await commands.assertMultiSelectionState(dataModelerTree, {
			counter: 11,
			overallState: "selected",
			nodeStates: { selected: [/.*/] },
			hasVirtualRoot: true
		});

		await commands.clickCheckbox(dataModelerTree, "Street");

		// FIXME why is this not working?
		// await commands.assertMultiSelectionState(dataModelerTree, {
		// 	counter: 8,
		// 	overallState: "partlySelected",
		// 	nodeStates: {
		// 		deselected: ["Street"],
		// 		partlySelected: ["Person", "Addresses"],
		// 		selected: [/.*/]
		// 	},
		// 	hasVirtualRoot: true
		// });
		//
		// await commands.clickCheckbox(dataModelerTree, "virtual-root-overall");
		// await commands.assertMultiSelectionState(dataModelerTree, {
		// 	counter: 11,
		// 	overallState: "selected",
		// 	nodeStates: { selected: [/.*/] },
		// 	hasVirtualRoot: true
		// });
		//
		// await commands.clickCheckbox(dataModelerTree, "virtual-root-overall");
		// await commands.assertMultiSelectionState(dataModelerTree, {
		// 	counter: 0,
		// 	overallState: "deselected",
		// 	nodeStates: { deselected: [/.*/] },
		// 	hasVirtualRoot: true
		// });
	});

	test.describe("In collapsible collapsed", () => {
		test.beforeEach(async ({ page }) => {
			await utils.navigateToFileExplorer("Pagination");
			const personJsonRows = commands.getRows(undefined, "Person.json");
			const formModelRow = personJsonRows.filter({ hasText: "Form Model" });
			await commands.buttonByDescription(formModelRow, "Open form model").click();

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(2);
		});

		test("should select the row when multi selection panel is opened", async () => {
			const formModelerTree = commands.getFormModelerTree();

			await expect(formModelerTree.locator(Selector.CHECKBOX)).toHaveCount(0);

			await formModelerTree.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await expect(formModelerTree.locator(Selector.CHECKBOX)).not.toHaveCount(0);

			await commands.expandNode("Next Screen");
			await commands.waitUntilLoaded();

			await commands.getRow("Nested Inline Repeat").click();

			await commands.assertMultiSelectionState(formModelerTree, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: { selected: ["Nested Inline Repeat"], partlySelected: ["Next Screen"], deselected: [/.*/] },
				hasVirtualRoot: true
			});
		});

		test("should open the new layout when multi selection panel is closed", async ({ page }) => {
			const formModelerTree = commands.getFormModelerTree();

			await commands.expandNode("Next Screen");
			await commands.waitUntilLoaded();

			await commands.getRow("Nested Inline Repeat").click();

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(2);
			await expect(formModelerTree.locator(Selector.CHECKBOX)).toHaveCount(0);
		});
	});

	test.describe("In collapsible expanded", () => {
		test.beforeEach(async ({ page }) => {
			await utils.navigateToFileExplorer("Pagination");

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(1);
			await expect(page.locator(Selector.CHECKBOX)).not.toHaveCount(0);

			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] }
			});
		});

		test("should select the row when multi selection panel is opened", async ({ page }) => {
			await commands.getRow("DomainTeam.json").click();

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(1);
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: { selected: ["DomainTeam.json"], partlySelected: ["My Computer", "E:"], deselected: [/.*/] }
			});
		});

		test("should open the new layout when multi selection panel is closed", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();

			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await expect(page.locator(Selector.CHECKBOX)).toHaveCount(0);

			await commands.getRow("DomainTeam.json").click();

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(2);
			await expect(fileExplorerTree.locator(Selector.CHECKBOX)).toHaveCount(0);
		});
	});

	test.describe("In non-collapsible", () => {
		test.beforeEach(async ({ page }) => {
			await utils.navigateToFileExplorer("Pagination");

			await commands
				.buttonByDescription(commands.getRow("DomainTeam.json"), "Open document model (stretch mode)")
				.click();

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(1);
			await expect(page.locator(Selector.CHECKBOX)).not.toHaveCount(0);
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] },
				hasVirtualRoot: true
			});
		});

		test("should open the new layout when no row is selected", async ({ page }) => {
			await commands.getRow("Location").click();

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(2);

			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: { deselected: [/.*/] },
				hasVirtualRoot: true
			});
		});

		test("should select the row when another row is selected", async ({ page }) => {
			await commands.clickCheckbox(commands.getRow("Location"));
			await commands.getRow("Name").click();

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(1);
			await commands.assertMultiSelectionState(page, {
				counter: 2,
				overallState: "partlySelected",
				nodeStates: { selected: ["Location", "Name"], partlySelected: [/.*/] },
				hasVirtualRoot: true
			});
		});
	});
});
