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

import { cleanDocumentsData, seedData } from "../../../../services-utils/src";
import { Selector } from "../../selectors";

import { ModelEditorUtils } from "../utils";

test.describe("advanced tests", () => {
	let utils: ModelEditorUtils;
	let commands: PlaywrightCommands;

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		await cleanDocumentsData({
			showcases: ["model-editor"]
		});
		await seedData({ preset: "model-editor" });

		await page.close();
		await context.close();
	});

	test.beforeEach(async ({ page }) => {
		utils = new ModelEditorUtils(page);
		commands = new PlaywrightCommands(page);
	});

	test.describe("suspending activity", () => {
		test.beforeEach(async () => {
			await utils.navigateToFileExplorer();
			await commands.waitUntilLoaded();
		});

		test.skip("should collapse when the collapse action is clicked", async ({ page }) => {
			await commands.collapseNode(undefined, "Node");
			await commands
				.buttonByDescription(commands.getRow("DomainPerson.json"), "Open DM temporary in full screen mode")
				.click();
			await commands.waitUntilLoaded();

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(1);
			await expect(page.locator(Selector.CONTENT_BOX_TITLE).filter({ hasText: "Data Modeler" })).toBeVisible();

			await page.locator("button").filter({ hasText: "Back" }).click();

			await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(1);
			await expect(page.locator(Selector.CONTENT_BOX_TITLE).filter({ hasText: "File Explorer" })).toBeVisible();
			await commands.assertExpanded("Node", false);

			await commands.buttonByDescription(commands.getRow("Java"), "Delete", "*").click();
			await page
				.locator(Selector.DIALOG_CONTENT)
				.locator("button")
				.filter({ hasText: /^Delete$/i })
				.click();

			await commands.waitUntilLoaded();
			await expect(commands.getRow("Java")).not.toBeVisible();
		});
	});

	test.describe("virtual root", () => {
		test.beforeEach(async ({ page }) => {
			await utils.navigateToFileExplorer();
			await commands.waitUntilLoaded();

			await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
			await commands.waitUntilLoaded();
		});

		test("should collapse when the collapse action is clicked", async ({ page }) => {
			const dataModelerTree = commands.getDataModelerTree();
			const virtualRoot = dataModelerTree.locator(Selector.VIRTUAL_ROOT);

			await commands.openContextMenu(virtualRoot);
			await page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM).filter({ hasText: "Collapse" }).click();
			await commands.assertExpanded("Person", false);

			await commands.openContextMenu(virtualRoot);
			await page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM).filter({ hasText: "Expand" }).click();

			await commands.assertExpanded("Person", true);
			await commands.assertExpanded("Photo", true);
			await commands.assertExpanded("Addresses", true);
			await commands.assertExpanded("Basic", true);

			await commands.openContextMenu(virtualRoot);
			await page
				.locator(Selector.POPUP_MENU)
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: "Attachment Group" })
				.click();
			await expect(
				page.locator(Selector.FORM_ENGINE).locator(Selector.CONTENT_BOX_TITLE).filter({ hasText: "AttachmentGroup" })
			).toBeVisible();
		});
	});

	test.describe("collapsing/enabling multiselection function", () => {
		test.beforeEach(async () => {
			await utils.navigateToFileExplorer();
			await commands.waitUntilLoaded();
		});

		test("should not change column values", async ({ page }) => {
			await checkRowContent(page);

			// Collapse multiselection
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await checkRowContent(page);

			// Enable multiselection
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await checkRowContent(page);
		});
	});

	test.describe("preload child nodes with abstract superTypes and without initial expansion", () => {
		test.beforeEach(async () => {
			await utils.navigateToFileExplorer("File Explorer With Preload ChildNodes");
			await commands.waitUntilLoaded();
		});

		test("expand button should appear correctly", async ({ page }) => {
			const rows = commands.getRows();
			await expect(rows).toHaveCount(1);

			await commands.expandNode("My Computer");
			await expect(rows).toHaveCount(4);

			// Check if rows are expandable (have expander button)
			await expect(commands.getRow("C:").locator('[data-role="tree-node-expander"]')).toBeVisible();
			await expect(commands.getRow("D:").locator('[data-role="tree-node-expander"]')).toBeVisible();
			await expect(commands.getRow("E:").locator('[data-role="tree-node-expander"]')).toBeVisible();

			await commands.expandNode("C:");
			await commands.expandNode("D:");
			await commands.expandNode("E:");
			await expect(rows).toHaveCount(9);
		});
	});
});

async function checkRowContent(page: any) {
	const npmRow = page.locator(Selector.BODY_ROW).filter({
		has: page.locator(Selector.TREE_NODE_NAME).filter({ hasText: "npm.cmd" })
	});

	const cells = npmRow.locator(Selector.BODY_ROW_SCROLL).locator(Selector.BODY_CELL);

	await expect(cells.nth(0)).toContainText("npm.cmd");
	await expect(cells.nth(1)).toContainText("833");
	await expect(cells.nth(2)).toContainText("Application");
	await expect(cells.nth(3)).toContainText("no");
	await expect(cells.nth(4)).toContainText("admin");
	await expect(cells.nth(5)).toContainText("admin");
}
