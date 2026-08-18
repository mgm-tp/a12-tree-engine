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

test.describe("bulk operation", () => {
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
			data: "multiple-pages"
		});
		await utils.navigateToFileExplorer("Pagination");
	});

	test("should delete", async ({ page }) => {
		await commands.loadMoreRows(undefined, "Node");

		// Verify nodes exist
		for (const number of ["49", "48", "47", "46", "45", "44", "43", "42", "41", "40"]) {
			await expect(commands.getRow(`Node ${number}`)).toBeVisible();
		}

		// Select nodes to delete
		for (const number of ["48", "47", "46", "45"]) {
			await commands.clickCheckbox(undefined, `Node ${number}`);
		}

		await page.getByRole("button", { name: "Delete" }).first().click();
		await page.locator(Selector.DIALOG).getByRole("button", { name: "Delete" }).click();
		await commands.waitUntilLoaded();

		// Verify deleted nodes are gone
		for (const number of ["48", "47", "46", "45"]) {
			await expect(commands.getRow(`Node ${number}`)).not.toBeVisible();
		}

		// Verify remaining nodes still exist
		for (const number of ["49", "44", "43", "42", "41", "40"]) {
			await expect(commands.getRow(`Node ${number}`)).toBeVisible();
		}
	});

	test.skip("should bulk dnd then create file", async ({ page }) => {
		await expect(page.getByText("Load all 62 nodes")).toBeVisible();

		await commands.loadMoreRows(undefined, "Node");
		await commands.loadMoreRows(undefined, "Node");

		await commands.clickCheckbox(commands.getRow("Node 49"));
		await commands.clickCheckbox(commands.getRow("Node 41"), true);

		await commands.dragDrop("Node 45", "D:", "asChild");
		await commands.waitUntilLoaded();

		await expect(page.getByText("Load all 53 nodes")).toBeVisible();

		await expect(commands.getRow("Node 40")).toBeVisible();
		await expect(commands.getRow("Node 39")).toBeVisible();
		await expect(commands.getRow("Node 30")).toBeVisible();
		await expect(commands.getRow("Node 21")).toBeVisible();
		await expect(commands.getRow("autostart.bat")).toBeVisible();

		await commands.buttonByDescription(commands.getRow("D:"), "Insert a file as child").click();
		await commands.waitUntilLoaded();
		await utils.fillFileForm(["vpn.exe", "admin", "admin", "exe", "4358733"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRow("vpn.exe")).toBeVisible();
		await expect(commands.getRow("autostart.bat")).not.toBeVisible();

		await page.getByText("Load all 11 nodes").click();
		await expect(commands.getRow("autostart.bat")).toBeVisible();

		// Drag and drop node that has order index greater than 10
		await commands.loadAllRows(undefined, "Node");
		await commands.loadAllRows(undefined, "Java");

		const rows = commands.getRows();
		await expect(rows.nth(43)).toContainText("Node 11");
		await expect(rows.nth(107)).toContainText("Java 0");

		await commands.dragDrop("Node 11", "Java 0", "asChild");
		await commands.waitUntilLoaded();

		await expect(rows.nth(106)).toContainText("Java 0");
		await expect(rows.nth(107)).toContainText("Node 11");
	});

	test("should bulk copy/paste", async ({ page }) => {
		await commands.loadMoreRows(undefined, "Node");

		await commands.clickCheckbox(undefined, "Node 49");
		await commands.clickCheckbox(undefined, "Node 41", true);

		await page.getByRole("button", { name: "Copy" }).click();

		await commands.openContextMenu(commands.getRow("D:"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Paste" }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRows(undefined, "Node 49")).toHaveCount(2);
		await expect(commands.getRows(undefined, "Node 41")).toHaveCount(2);
		await expect(commands.getRows(undefined, "autostart.bat")).toHaveCount(1);

		await commands.clickCheckbox(undefined, "D:");
		await page.getByRole("button", { name: "Copy" }).click();

		await commands.openContextMenu(commands.getRow("My Computer"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Paste" }).click();
		await commands.waitUntilLoaded();

		await commands.expandNode("D:");

		await expect(commands.getRows(undefined, "Node 49")).toHaveCount(3);
		await expect(commands.getRows(undefined, "Node 41")).toHaveCount(3);
		await expect(commands.getRows(undefined, "autostart.bat")).toHaveCount(2);
	});
});
