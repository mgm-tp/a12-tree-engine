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

test.describe.skip("scroll to pasted or dropped node with pagination", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.use({ viewport: { width: 1280, height: 480 } });

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

	test.describe("when get new link position is set as TOP", () => {
		test("should work", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();

			await commands.clickCheckbox(commands.getRow("npm.cmd"));
			await commands.clickCheckbox(commands.getRow("node.exe"));
			await fileExplorerTree.getByRole("button", { name: "Copy" }).click();

			// Paste 5 times
			for (let i = 0; i < 5; i++) {
				await commands.openContextMenu(commands.getRow("Node"));
				await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Paste" }).first().click();
				await commands.waitUntilLoaded();
			}

			// Copy and paste as child
			await commands.clickCheckbox(commands.getRow("javaws.exe"));
			await fileExplorerTree.getByRole("button", { name: "Copy" }).click();
			await commands.openContextMenu(commands.getRow("Node"));
			await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Paste" }).first().click();

			const javawsRows = commands.getRows(undefined, "javaws.exe");
			await expect(javawsRows.nth(0)).toBeVisible();
			await commands.assertLevelWithLocator(javawsRows.nth(0), 4);

			// Cut and paste as child
			await commands.clickCheckbox(commands.getRow("java.exe"));
			await commands.clickCheckbox(commands.getRow("autostart.bat"));
			await fileExplorerTree.getByRole("button", { name: "Cut" }).click();
			await commands.openContextMenu(commands.getRow("Node"));
			await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Paste" }).first().click();

			const javaExeRow = commands.getRow("java.exe");
			await expect(javaExeRow).toBeVisible();
			await commands.assertLevelWithLocator(javaExeRow, 4);

			// Drag and drop as child
			await commands.clickCheckbox(commands.getRow("Java"));
			await commands.clickCheckbox(commands.getRow("DomainTeam.json"));
			await commands.dragDrop("Java", "D:", "asChild");
			await commands.waitUntilLoaded();

			const javaRow = commands.getRow("Java");
			await expect(javaRow).toBeVisible();
			await commands.assertLevelWithLocator(javaRow, 2);
		});
	});
});
