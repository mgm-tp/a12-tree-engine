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

/*
This test can be run in both modes: pagination and non-pagination.
Moved to pagination part to reduce testing time.
 */
test.describe("Copy/paste as sibling", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await cleanDocumentsData({
			showcases: ["model-editor"],
			variant: "pagination"
		});
		await seedData({
			preset: "model-editor",
			variant: "pagination",
			data: "simple"
		});
		await utils.navigateToFileExplorer("Pagination");
	});

	test.describe("Above/below sibling node", () => {
		test("Above", async ({ page }) => {
			// Copy and paste above sibling node
			const fileExplorerTree = commands.getFileExplorerTree();

			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);

			const javaRows = commands.getRows(undefined, "Java");
			await expect(javaRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(javaRows.first(), true);
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteAboveItem = page.locator(Selector.POPUP_MENU).getByText("Paste Above", { exact: true });
			await expect(pasteAboveItem).not.toBeDisabled();
			await pasteAboveItem.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(2);
			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(4)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(4), 3);
			await expect(commands.getRows(fileExplorerTree).nth(7)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(7), 3);

			await commands.assertExpandedWithLocator(javaRows.nth(0), false);
			await commands.expandNodeWithLocator(javaRows.nth(0));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			// Copy recursively and paste above sibling node
			await commands.openContextMenu(javaRows.nth(1));
			await page.locator(Selector.POPUP_MENU).getByText("Copy recursively", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteAboveItem2 = page.locator(Selector.POPUP_MENU).getByText("Paste Above", { exact: true });
			await expect(pasteAboveItem2).not.toBeDisabled();
			await pasteAboveItem2.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(3);
			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(4), 3);
			await expect(commands.getRows(fileExplorerTree).nth(5)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(5), 3);
			await expect(commands.getRows(fileExplorerTree).nth(8)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(8), 3);

			await commands.assertExpandedWithLocator(javaRows.nth(1), false);
			await commands.expandNodeWithLocator(javaRows.nth(1));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(2);
		});

		test("Below", async ({ page }) => {
			// Copy and paste below sibling node
			const fileExplorerTree = commands.getFileExplorerTree();

			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);

			const javaRows = commands.getRows(undefined, "Java");
			await expect(javaRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(javaRows.first(), true);
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteBelowItem = page.locator(Selector.POPUP_MENU).getByText("Paste Below", { exact: true });
			await expect(pasteBelowItem).not.toBeDisabled();
			await pasteBelowItem.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(2);
			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);
			await expect(commands.getRows(fileExplorerTree).nth(7)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(7), 3);

			await commands.assertExpandedWithLocator(javaRows.nth(0), false);
			await commands.expandNodeWithLocator(javaRows.nth(0));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			// Copy recursively and paste below sibling node
			await commands.openContextMenu(javaRows.nth(1));
			await page.locator(Selector.POPUP_MENU).getByText("Copy recursively", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteBelowItem2 = page.locator(Selector.POPUP_MENU).getByText("Paste Below", { exact: true });
			await expect(pasteBelowItem2).not.toBeDisabled();
			await pasteBelowItem2.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(3);
			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);
			await expect(commands.getRows(fileExplorerTree).nth(7)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(7), 3);
			await expect(commands.getRows(fileExplorerTree).nth(8)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(8), 3);

			await commands.assertExpandedWithLocator(javaRows.nth(0), false);
			await commands.expandNodeWithLocator(javaRows.nth(0));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(2);
		});
	});

	test.describe("Above/below parent node", () => {
		test("Above", async ({ page }) => {
			// Copy and paste above parent node
			const fileExplorerTree = commands.getFileExplorerTree();

			await expect(commands.getRows(fileExplorerTree).nth(2)).toContainText("Program Files");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(2), 2);
			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);

			const javaRows = commands.getRows(undefined, "Java");
			await expect(javaRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(javaRows.first(), true);
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteAboveItem = page.locator(Selector.POPUP_MENU).getByText("Paste Above", { exact: true });
			await expect(pasteAboveItem).not.toBeDisabled();
			await pasteAboveItem.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(2);
			await expect(commands.getRows(fileExplorerTree).nth(2)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(2), 2);
			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Program Files");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 2);
			await expect(commands.getRows(fileExplorerTree).nth(7)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(7), 3);

			await commands.assertExpandedWithLocator(javaRows.nth(0), false);
			await commands.expandNodeWithLocator(javaRows.nth(0));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			// Copy recursively and paste above parent node
			await commands.openContextMenu(javaRows.nth(1));
			await page.locator(Selector.POPUP_MENU).getByText("Copy recursively", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteAboveItem2 = page.locator(Selector.POPUP_MENU).getByText("Paste Above", { exact: true });
			await expect(pasteAboveItem2).not.toBeDisabled();
			await pasteAboveItem2.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(3);
			await expect(commands.getRows(fileExplorerTree).nth(2)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(2), 2);
			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 2);
			await expect(commands.getRows(fileExplorerTree).nth(4)).toContainText("Program Files");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(4), 2);
			await expect(commands.getRows(fileExplorerTree).nth(8)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(8), 3);

			await commands.assertExpandedWithLocator(javaRows.nth(1), false);
			await commands.expandNodeWithLocator(javaRows.nth(1));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(2);
		});

		test("Below", async ({ page }) => {
			// Copy and paste below parent
			const fileExplorerTree = commands.getFileExplorerTree();

			await expect(commands.getRows(fileExplorerTree).nth(2)).toContainText("Program Files");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(2), 2);
			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);

			const javaRows = commands.getRows(undefined, "Java");
			await expect(javaRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(javaRows.first(), true);
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteBelowItem = page.locator(Selector.POPUP_MENU).getByText("Paste Below", { exact: true });
			await expect(pasteBelowItem).not.toBeDisabled();
			await pasteBelowItem.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(2);
			await expect(commands.getRows(fileExplorerTree).nth(2)).toContainText("Program Files");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(2), 2);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);
			await expect(commands.getRows(fileExplorerTree).nth(9)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(9), 2);

			await commands.assertExpandedWithLocator(javaRows.nth(1), false);
			await commands.expandNodeWithLocator(javaRows.nth(1));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			// Copy recursively and paste below parent node
			await commands.openContextMenu(javaRows.nth(0));
			await page.locator(Selector.POPUP_MENU).getByText("Copy recursively", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteBelowItem2 = page.locator(Selector.POPUP_MENU).getByText("Paste Below", { exact: true });
			await expect(pasteBelowItem2).not.toBeDisabled();
			await pasteBelowItem2.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(3);
			await expect(commands.getRows(fileExplorerTree).nth(2)).toContainText("Program Files");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(2), 2);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);
			await expect(commands.getRows(fileExplorerTree).nth(9)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(9), 2);
			await expect(commands.getRows(fileExplorerTree).nth(10)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(10), 2);

			await commands.assertExpandedWithLocator(javaRows.nth(1), false);
			await commands.expandNodeWithLocator(javaRows.nth(1));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(2);
		});
	});

	test.describe("Above/below child node", () => {
		test("Above", async ({ page }) => {
			// Make a child node
			const fileExplorerTree = commands.getFileExplorerTree();

			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);

			const javaRows = commands.getRows(undefined, "Java");
			await expect(javaRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(javaRows.first(), true);
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteItem = page.locator(Selector.POPUP_MENU).getByText("Paste", { exact: true });
			await expect(pasteItem).not.toBeDisabled();
			await pasteItem.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(2);
			await expect(commands.getRows(fileExplorerTree).nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(4), 4);

			// Copy and paste above child node
			await commands.openContextMenu(javaRows.nth(1));
			await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

			await commands.openContextMenu(javaRows.nth(0));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Above", { exact: true }).click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(3);
			await expect(commands.getRows(fileExplorerTree).nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(4), 4);
			await expect(commands.getRows(fileExplorerTree).nth(5)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(5), 4);

			await commands.assertExpandedWithLocator(javaRows.nth(0), false);
			await commands.expandNodeWithLocator(javaRows.nth(0));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			// Copy recursively and paste above child node
			await commands.openContextMenu(javaRows.nth(2));
			await page.locator(Selector.POPUP_MENU).getByText("Copy recursively", { exact: true }).click();

			await commands.openContextMenu(javaRows.nth(0));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Above", { exact: true }).click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(4);
			await expect(commands.getRows(fileExplorerTree).nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(4), 4);
			await expect(commands.getRows(fileExplorerTree).nth(5)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(5), 4);

			await commands.assertExpandedWithLocator(javaRows.nth(0), false);
			await commands.expandNodeWithLocator(javaRows.nth(0));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(2);
		});

		test("Below", async ({ page }) => {
			// Make a child node
			const fileExplorerTree = commands.getFileExplorerTree();

			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);

			const javaRows = commands.getRows(undefined, "Java");
			await expect(javaRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(javaRows.first(), true);
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteItem = page.locator(Selector.POPUP_MENU).getByText("Paste", { exact: true });
			await expect(pasteItem).not.toBeDisabled();
			await pasteItem.click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(2);
			await expect(commands.getRows(fileExplorerTree).nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(4), 4);

			// Copy and paste below child node
			await commands.openContextMenu(javaRows.nth(1));
			await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

			await commands.openContextMenu(javaRows.nth(0));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Below", { exact: true }).click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(3);
			await expect(commands.getRows(fileExplorerTree).nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(4), 4);
			await expect(commands.getRows(fileExplorerTree).nth(5)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(5), 4);

			await commands.assertExpandedWithLocator(javaRows.nth(1), false);
			await commands.expandNodeWithLocator(javaRows.nth(1));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			// Copy recursively and paste below child node
			await commands.openContextMenu(javaRows.nth(2));
			await page.locator(Selector.POPUP_MENU).getByText("Copy recursively", { exact: true }).click();

			await commands.openContextMenu(javaRows.nth(0));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Below", { exact: true }).click();
			await commands.waitUntilLoaded();

			await expect(javaRows).toHaveCount(4);
			await expect(commands.getRows(fileExplorerTree).nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(4), 4);
			await expect(commands.getRows(fileExplorerTree).nth(5)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(5), 4);

			await commands.assertExpandedWithLocator(javaRows.nth(1), false);
			await commands.expandNodeWithLocator(javaRows.nth(1));
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(2);
		});
	});

	test.describe("Bulk copy and paste", () => {
		test.skip("Above", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();

			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);

			const javaRows = commands.getRows(undefined, "Java");
			await expect(javaRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(javaRows.first(), true);
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			const nodeRows = commands.getRows(undefined, "Node");
			await expect(nodeRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(nodeRows.first(), true);
			await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
			await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);

			await commands.clickCheckbox(commands.getRow("Node"));
			await commands.clickCheckbox(commands.getRow("Java"));
			await page.getByRole("button", { name: "Copy" }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteAboveItem = page.locator(Selector.POPUP_MENU).getByText("Paste Above", { exact: true });
			await expect(pasteAboveItem).not.toBeDisabled();
			await pasteAboveItem.click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(fileExplorerTree).nth(2)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(2), 2);
			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 2);

			await expect(javaRows).toHaveCount(2);
			await commands.assertExpandedWithLocator(commands.getRow("Java"), false);
			await expect(nodeRows).toHaveCount(2);
			await commands.assertExpandedWithLocator(commands.getRow("Node"), false);

			await commands.expandNodeWithLocator(javaRows.nth(0));
			await commands.expandNodeWithLocator(nodeRows.nth(0));

			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(2);
			await expect(commands.getRows(undefined, "node.exe")).toHaveCount(2);
		});

		test.skip("Below", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();

			await expect(commands.getRows(fileExplorerTree).nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(3), 3);
			await expect(commands.getRows(fileExplorerTree).nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(6), 3);

			const javaRows = commands.getRows(undefined, "Java");
			await expect(javaRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(javaRows.first(), true);
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			const nodeRows = commands.getRows(undefined, "Node");
			await expect(nodeRows).toHaveCount(1);
			await commands.assertExpandedWithLocator(nodeRows.first(), true);
			await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
			await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);

			await commands.clickCheckbox(commands.getRow("Node"));
			await commands.clickCheckbox(commands.getRow("Java"));
			await page.getByRole("button", { name: "Copy" }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteBelowItem = page.locator(Selector.POPUP_MENU).getByText("Paste Below", { exact: true });
			await expect(pasteBelowItem).not.toBeDisabled();
			await pasteBelowItem.click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(fileExplorerTree).nth(9)).toContainText("Node");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(9), 2);
			await expect(commands.getRows(fileExplorerTree).nth(10)).toContainText("Java");
			await commands.assertLevelWithLocator(commands.getRows(fileExplorerTree).nth(10), 2);

			await expect(javaRows).toHaveCount(2);
			await commands.assertExpandedWithLocator(javaRows.nth(1), false);
			await expect(nodeRows).toHaveCount(2);
			await commands.assertExpandedWithLocator(nodeRows.nth(1), false);

			await commands.expandNodeWithLocator(javaRows.nth(1));
			await commands.expandNodeWithLocator(nodeRows.nth(1));

			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(2);
			await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(2);
			await expect(commands.getRows(undefined, "node.exe")).toHaveCount(2);
		});
	});
});
