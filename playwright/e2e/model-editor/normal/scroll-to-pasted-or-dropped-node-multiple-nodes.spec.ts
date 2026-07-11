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

test.describe.skip("scroll to pasted or dropped node - multiple nodes", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.use({ viewport: { width: 1280, height: 600 } });

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
		await utils.navigateToFileExplorer();
	});

	test.describe("of the same group", () => {
		test("should work", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();

			// Scroll to first copy then paste as child node
			const javawsRows = commands.getRows(undefined, "javaws.exe");
			await expect(javawsRows).toHaveCount(1);
			await commands.assertLevelWithLocator(javawsRows.first(), 4);

			await commands.clickCheckbox(undefined, "javaws.exe");
			await commands.clickCheckbox(undefined, "java.exe");
			await fileExplorerTree.getByRole("button", { name: "Copy" }).click();

			await commands.openContextMenu(commands.getRow("E:"));
			await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Paste" }).click();

			const javawsRows2 = commands.getRows(undefined, "javaws.exe");
			await expect(javawsRows2.nth(1)).toBeVisible();
			await commands.assertLevelWithLocator(javawsRows2.nth(1), 2);

			// Scroll to first cut then paste as child node
			const npmRows = commands.getRows(undefined, "npm.cmd");
			await commands.assertLevelWithLocator(npmRows.first(), 4);

			await commands.clickCheckbox(undefined, "npm.cmd");
			await commands.clickCheckbox(undefined, "node.exe");
			await fileExplorerTree.getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(commands.getRow("E:"));
			await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Paste" }).click();

			const npmRows2 = commands.getRows(undefined, "npm.cmd");
			await expect(npmRows2.first()).toBeVisible();
			await commands.assertLevelWithLocator(npmRows2.first(), 2);

			// Scroll to first copy then paste above and below node
			await commands.buttonByDescription(commands.getRow("E:"), "Insert a directory as child", "*").click();
			await utils.fillDriveForm(["Data", "sa", "sa"]);
			await page.getByRole("button", { name: "Save" }).click();
			await commands.waitUntilLoaded();
			await expect(commands.getRow("Data")).toBeVisible();

			const nodeRows = commands.getRows(undefined, "Node");
			await expect(nodeRows).toHaveCount(1);
			await commands.assertLevelWithLocator(nodeRows.first(), 3);

			await commands.clickCheckbox(undefined, "Node");
			await commands.clickCheckbox(undefined, "Java");
			await fileExplorerTree.getByRole("button", { name: "Copy" }).click();

			await commands.openContextMenu(commands.getRow("Data"));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Above").click();

			await expect(nodeRows.nth(1)).toBeVisible();
			await commands.assertLevelWithLocator(nodeRows.nth(1), 2);

			await commands.openContextMenu(commands.getRow("Data"));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Below").click();

			await expect(nodeRows.nth(2)).toBeVisible();
			await commands.assertLevelWithLocator(nodeRows.nth(2), 2);

			// Scroll to first cut then paste above and below node
			await commands.assertLevelWithLocator(nodeRows.first(), 3);

			await commands.clickCheckbox(undefined, "Node");
			await commands.clickCheckbox(undefined, "Java");
			await fileExplorerTree.getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Above").click();

			await expect(nodeRows.first()).toBeVisible();
			await commands.assertLevelWithLocator(nodeRows.first(), 2);

			await commands.clickCheckbox(undefined, "Node");
			await commands.clickCheckbox(undefined, "Java");
			await fileExplorerTree.getByRole("button", { name: "Cut" }).click();

			await commands.openContextMenu(commands.getRow("Program Files"));
			await page.locator(Selector.POPUP_MENU).getByText("Paste Below").click();

			await expect(nodeRows.first()).toBeVisible();
			await commands.assertLevelWithLocator(nodeRows.first(), 2);

			// Scroll to dropped as child node
			const programFilesRows = commands.getRows(undefined, "Program Files");
			await expect(programFilesRows).toHaveCount(1);
			await commands.assertLevelWithLocator(programFilesRows.first(), 2);

			await commands.clickCheckbox(undefined, "Program Files");
			await commands.clickCheckbox(undefined, "Node");
			await commands.dragDrop("Program Files", "D:", "asChild");
			await commands.waitUntilLoaded();

			await expect(programFilesRows.first()).toBeVisible();
			await commands.assertLevelWithLocator(programFilesRows.first(), 2);

			// Scroll to dropped above and below node
			const javaRows = commands.getRows(undefined, "Java");
			await commands.assertLevelWithLocator(javaRows.first(), 2);

			await commands.clickCheckbox(undefined, "Java");
			await commands.clickCheckbox(undefined, "Node");
			await commands.dragDrop("Java", "Program Files", "top");
			await commands.waitUntilLoaded();

			await expect(javaRows.first()).toBeVisible();
			await commands.assertLevelWithLocator(javaRows.first(), 2);

			await commands.clickCheckbox(undefined, "Java");
			await commands.clickCheckbox(undefined, "Node");
			await commands.dragDrop("Java", "Program Files", "bottom");
			await commands.waitUntilLoaded();

			await expect(javaRows.first()).toBeVisible();
			await commands.assertLevelWithLocator(javaRows.first(), 2);
		});
	});

	test.describe("of different groups", () => {
		test.describe("scroll to copy/cut then paste as child node", () => {
			test("should work", async ({ page }) => {
				const fileExplorerTree = commands.getFileExplorerTree();

				// Scroll to copy then paste as child node
				const javaRows = commands.getRows(undefined, "Java");
				await expect(javaRows).toHaveCount(1);
				await commands.assertLevelWithLocator(javaRows.first(), 3);

				await commands.clickCheckbox(commands.getRow("npm.cmd"));
				await commands.clickCheckbox(commands.getRow("Java"));
				await fileExplorerTree.getByRole("button", { name: "Copy" }).click();

				await commands.openContextMenu(commands.getRow("E:"));
				await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Paste" }).click();

				await expect(javaRows.nth(1)).toBeVisible();
				await commands.assertLevelWithLocator(javaRows.nth(1), 2);

				// Scroll to cut then paste as child node
				await commands.assertLevelWithLocator(javaRows.first(), 3);
				await commands.clickCheckbox(javaRows.first());
				await commands.clickCheckbox(commands.getRow("npm.cmd"));
				await fileExplorerTree.getByRole("button", { name: "Cut" }).click();

				await commands.openContextMenu(commands.getRow("D:"));
				await page.locator(Selector.POPUP_MENU).getByRole("button", { name: "Paste" }).click();

				await expect(javaRows.first()).toBeVisible();
				await commands.assertLevelWithLocator(javaRows.first(), 2);

				// Scroll to dropped as child node
				const nodeRow = commands.getRow("Node");
				await commands.assertLevelWithLocator(nodeRow, 3);

				await commands.clickCheckbox(commands.getRow("Node"));

				await commands.dragDrop("Node", "D:", "asChild");
				await commands.waitUntilLoaded();

				await expect(nodeRow).toBeVisible();
				await expect(nodeRow).toBeFocused();
				await commands.assertLevelWithLocator(nodeRow, 2);
			});
		});
	});
});
