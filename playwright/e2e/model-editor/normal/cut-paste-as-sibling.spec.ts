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

test.describe("Cut/paste as sibling", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
		await utils.navigateToFileExplorer();
	});

	test.describe("Above/below sibling node", () => {
		test("should work", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();
			const rows = commands.getRows(fileExplorerTree);

			// Cut and paste above sibling node
			await expect(rows.nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteAbove = page
				.locator(Selector.POPUP_MENU)
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: "Paste Above" });
			await expect(pasteAbove).not.toHaveClass(/list-item--disabled/);
			await pasteAbove.click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Expand subitems")).toBeVisible();
			await expect(rows.nth(3)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(4)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(4), 3);
			await commands.expandNode("Java");
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			// Cut and paste below sibling node
			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteBelow = page
				.locator(Selector.POPUP_MENU)
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: "Paste Below" });
			await expect(pasteBelow).not.toHaveClass(/list-item--disabled/);
			await pasteBelow.click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Expand subitems")).toBeVisible();
			await expect(rows.nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await commands.expandNode("Java");
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);
		});
	});

	test.describe("Above/below parent node", () => {
		test.skip("should work", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();
			const rows = commands.getRows(fileExplorerTree);

			// Cut and paste above parent node
			await expect(rows.nth(2)).toContainText("Program Files");
			await commands.assertLevelWithLocator(rows.nth(2), 2);
			await expect(rows.nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteAbove = page
				.locator(Selector.POPUP_MENU)
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: "Paste Above" });
			await expect(pasteAbove).not.toHaveClass(/list-item--disabled/);
			await pasteAbove.click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Expand subitems")).toBeVisible();
			await expect(rows.nth(2)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(2), 2);
			await expect(rows.nth(3)).toContainText("Program Files");
			await commands.assertLevelWithLocator(rows.nth(3), 2);
			await commands.expandNode("Java");
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			// Cut and paste below parent node
			await expect(rows.nth(6)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await commands.openContextMenu(commands.getRow("Node"));
			await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteBelow = page
				.locator(Selector.POPUP_MENU)
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: "Paste Below" });
			await expect(pasteBelow).not.toHaveClass(/list-item--disabled/);
			await pasteBelow.click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "Node")).toHaveCount(1);
			await expect(commands.findButton("Node", "Expand subitems")).toBeVisible();
			await expect(rows.nth(2)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(2), 2);
			await expect(rows.nth(5)).toContainText("Program Files");
			await commands.assertLevelWithLocator(rows.nth(5), 2);
			await expect(rows.nth(6)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(6), 2);
			await commands.expandNode("Node");
			await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
			await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);
		});
	});

	test.describe("Above/below child node", () => {
		test("Above", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();
			const rows = commands.getRows(fileExplorerTree);

			// Make a child node
			await expect(rows.nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Copy" }).first().click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteItem = page
				.locator(Selector.POPUP_MENU)
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: "Paste" })
				.first();
			await expect(pasteItem).not.toHaveClass(/list-item--disabled/);
			await pasteItem.click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "Java")).toHaveCount(2);
			await expect(rows.nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(4), 4);

			// Cut and paste above child node
			const javaRows = commands.getRows(undefined, "Java");
			await commands.openContextMenu(javaRows.nth(1));
			await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(javaRows.nth(0));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Above").click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "Java")).toHaveCount(2);
			await expect(rows.nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(4), 4);
			await expect(rows.nth(5)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(5), 4);
			await commands.expandNode("Java");
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);
		});

		test("Below", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();
			const rows = commands.getRows(fileExplorerTree);

			// Make a child node
			await expect(rows.nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

			await commands.openContextMenu(commands.getRow("Java"));
			await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Copy" }).first().click();

			await commands.openContextMenu(commands.getRow("Node"));
			const pasteItem = page
				.locator(Selector.POPUP_MENU)
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: "Paste" })
				.first();
			await expect(pasteItem).not.toHaveClass(/list-item--disabled/);
			await pasteItem.click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "Java")).toHaveCount(2);
			await expect(rows.nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(4), 4);

			// Cut and paste below child node
			const javaRows = commands.getRows(undefined, "Java");
			await commands.openContextMenu(javaRows.nth(1));
			await page.locator(Selector.POPUP_MENU).getByText("Cut").first().click();

			await commands.openContextMenu(javaRows.nth(0));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Below").click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "Java")).toHaveCount(2);
			await expect(rows.nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(4), 4);
			await expect(rows.nth(5)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(5), 4);
			const javaRowsAfter = commands.getRows(undefined, "Java");
			await commands.findButton(javaRowsAfter.nth(1), "Expand subitems").click();
			await commands.waitUntilLoaded();
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);
		});
	});

	test.describe("Bulk cut and paste", () => {
		test("Above", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();
			const rows = commands.getRows(fileExplorerTree);

			await expect(rows.nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "Node")).toHaveCount(1);
			await expect(commands.findButton("Node", "Collapse subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
			await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);

			await commands.clickCheckbox(undefined, "Node");
			await commands.clickCheckbox(undefined, "Java");
			await page.getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteAbove = page
				.locator(Selector.POPUP_MENU)
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: "Paste Above" });
			await expect(pasteAbove).not.toHaveClass(/list-item--disabled/);
			await pasteAbove.click();
			await commands.waitUntilLoaded();

			await expect(rows.nth(2)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(2), 2);
			await expect(rows.nth(3)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(3), 2);
			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Expand subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "Node")).toHaveCount(1);
			await expect(commands.findButton("Node", "Expand subitems")).toBeVisible();
			await commands.expandNode("Java");
			await commands.expandNode("Node");
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
			await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);
		});

		test("Below", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();
			const rows = commands.getRows(fileExplorerTree);

			await expect(rows.nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(6)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "Node")).toHaveCount(1);
			await expect(commands.findButton("Node", "Collapse subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
			await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);

			await commands.clickCheckbox(undefined, "Node");
			await commands.clickCheckbox(undefined, "Java");
			await page.getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			const pasteBelow = page
				.locator(Selector.POPUP_MENU)
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: "Paste Below" });
			await expect(pasteBelow).not.toHaveClass(/list-item--disabled/);
			await pasteBelow.click();
			await commands.waitUntilLoaded();

			await expect(rows.nth(3)).toContainText("Node");
			await commands.assertLevelWithLocator(rows.nth(3), 2);
			await expect(rows.nth(4)).toContainText("Java");
			await commands.assertLevelWithLocator(rows.nth(4), 2);
			await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
			await expect(commands.findButton("Java", "Expand subitems")).toBeVisible();
			await expect(commands.getRows(undefined, "Node")).toHaveCount(1);
			await expect(commands.findButton("Node", "Expand subitems")).toBeVisible();
			await commands.expandNode("Java");
			await commands.expandNode("Node");
			await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);
			await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
			await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);
		});
	});
});
