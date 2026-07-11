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

import { cleanDocumentsData, generateNodes } from "../../../../services-utils/src/index.js";
import { Selector } from "../../selectors.js";

import { CategoriesUtils } from "../utils.js";

test.describe("load more & load all buttons", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);

		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await generateNodes({ categories: [1], products: 15 });

		await page.goto("");
		await utils.navigate("Pagination");
	});

	test("should render the buttons correctly", async ({ page }) => {
		const rows = commands.getRows();

		// Initial state
		await expect(rows).toHaveCount(6);
		await expect(page.getByText("Load all 15 nodes")).toBeVisible();
		await page.getByText("Load more").click();
		await expect(rows).toHaveCount(11);
		await expect(page.getByText("Load all 15 nodes")).toBeVisible();

		// Delete last row
		await rows.last().click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Delete" }).click();
		await page.locator(Selector.DIALOG).locator("button").filter({ hasText: "Delete" }).click();
		await commands.waitUntilLoaded();

		await expect(rows).toHaveCount(11);
		await page.getByText("Load all 14 nodes").click();
		await expect(rows).toHaveCount(15);

		// Delete last row again
		await rows.last().click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Delete" }).click();
		await page.locator(Selector.DIALOG).locator("button").filter({ hasText: "Delete" }).click();
		await commands.waitUntilLoaded();

		await expect(rows).toHaveCount(14);
		await expect(page.getByText("Load more")).not.toBeVisible();

		// Create categories
		await utils.createCategory("SubCat1", "CatC0Level0");
		await utils.createCategory("SubCat2", "CatC0Level0");
		await utils.createCategory("SubCat3", "CatC0Level0");
	});

	test("should keep the current paging even after remove & add new product", async ({ page }) => {
		await page.getByText("Load more").click();
		await commands.waitUntilLoaded();
		await page.getByText("Load more").click();
		await commands.waitUntilLoaded();
		await expect(page.getByText("Load more")).not.toBeVisible();

		await utils.createBundle("Bundle", undefined, "CatC0Level0");
		await expect(page.getByText("Load more")).toBeVisible();
		await expect(page.getByText("Load all 16 nodes")).toBeVisible();
	});
});
