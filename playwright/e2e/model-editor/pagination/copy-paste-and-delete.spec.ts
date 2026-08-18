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

test.describe("copy, paste and delete", () => {
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

	test.skip("should run properly", async ({ page }) => {
		await commands.openContextMenu(commands.getRow("Java"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Copy recursively" }).click();
		await commands.waitUntilLoaded();

		for (let i = 0; i < 3; i++) {
			await commands.openContextMenu(commands.getRow("C:"));
			await page.locator(Selector.CONTEXT_MENU_ITEM).getByRole("button", { name: "Paste" }).click();
			await commands.waitUntilLoaded();
		}

		const javaRows = commands.getRows(undefined, "Java");
		await commands.clickCheckbox(javaRows.first());
		await commands.clickCheckbox(javaRows.nth(2), true);
		await page.getByRole("button", { name: "Copy" }).click();

		await expect(commands.getRows(undefined, "Java")).toHaveCount(4);

		for (let i = 0; i < 3; i++) {
			await commands.openContextMenu(commands.getRow("C:"));
			await page.locator(Selector.CONTEXT_MENU_ITEM).getByRole("button", { name: "Paste" }).click();
			await commands.waitUntilLoaded();
		}

		await expect(javaRows).toHaveCount(10);

		await commands.clickCheckbox(javaRows.nth(0));
		await commands.clickCheckbox(javaRows.nth(9), true);
		await page.getByRole("button", { name: "Copy" }).click();
		await commands.openContextMenu(commands.getRow("C:"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).getByRole("button", { name: "Paste" }).click();
		await commands.waitUntilLoaded();
		await commands.loadAllRows(undefined, "C:");
		await expect(javaRows).toHaveCount(23);

		await commands.clickCheckbox(javaRows.nth(0));
		await commands.clickCheckbox(javaRows.nth(21), true);
		await page.getByRole("button", { name: "Copy" }).click();
		await commands.openContextMenu(commands.getRow("C:"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).getByRole("button", { name: "Paste" }).click();
		await commands.waitUntilLoaded();
		await commands.loadAllRows(undefined, "C:");
		await expect(javaRows).toHaveCount(45);

		await commands.clickCheckbox(javaRows.nth(0));
		await commands.clickCheckbox(javaRows.nth(41), true);
		await page.getByRole("button", { name: "Delete" }).first().click();
		await page.locator(Selector.DIALOG).getByRole("button", { name: "Delete" }).click();
		await commands.waitUntilLoaded();

		await expect(javaRows).toHaveCount(3);

		await commands.openContextMenu(commands.getRow("Java"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Copy recursively" }).click();
		await commands.openContextMenu(commands.getRow("C:"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).getByRole("button", { name: "Paste" }).click();

		await expect(commands.getRows(undefined, "Java")).toHaveCount(4);
	});

	test("clipboard should be remain after a node is no longer part of the current list", async ({ page }) => {
		await commands.getRow("javaws.exe").click();
		await commands.getRow("java.exe").click();
		await page.getByRole("button", { name: "Copy" }).click();

		for (let i = 0; i < 4; i++) {
			await commands.openContextMenu(commands.getRow("Java"));
			await page
				.locator(Selector.CONTEXT_MENU_ITEM)
				.getByRole("button", { name: /^Paste (?!Above|Below)/ })
				.click();
			await commands.waitUntilLoaded();
		}

		await commands.openContextMenu(commands.getRow("Java"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).getByRole("button", { name: "Copy recursively" }).click();

		await commands.dragDrop("autostart.bat", "Java", "asChild");
		await commands.waitUntilLoaded();

		await commands.openContextMenu(commands.getRow("D:"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).getByRole("button", { name: "Paste" }).click();
		await commands.waitUntilLoaded();

		await commands.collapseNode(undefined, "C:");
		await commands.expandNode("Java");
		await expect(commands.getChildNodeRows(undefined, "Java")).toHaveCount(10);
		await expect(page.getByText("Load all 11 nodes")).toBeVisible();
		await expect(commands.getRow("autostart.bat")).toBeVisible();
	});
});
