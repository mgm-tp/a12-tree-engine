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

test.describe("basic mutation", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);
		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await generateNodes({ categories: [1, 10], products: 6 });

		await page.goto("");
		await utils.navigate("Pagination");
	});

	test("should create new node", async () => {
		// Load more rows for the category
		await commands.loadMoreRows(undefined, "CatC0Level0");
		await commands.loadMoreRows(undefined, "CatC0Level0");

		// Create subcategory
		await utils.createCategory("SubCategoryOfCatC0Level0", "CatC0Level0");

		// Verify the category was created
		await expect(commands.getRow("SubCategoryOfCatC0Level0")).toBeVisible();
	});

	test("should delete node", async ({ page }) => {
		// Load more rows to make target visible
		await commands.loadMoreRows(undefined, "CatC0C5Level1");

		// Delete the category
		const targetRow = commands.getRow("CatC0C6Level1");
		await commands.buttonByDescription(targetRow, "Delete this category").click();
		await page.locator(`${Selector.DIALOG} button`).filter({ hasText: "Delete" }).click();

		// Verify the category was deleted
		await expect(commands.getRow("CatC0C6Level1")).toHaveCount(0);
	});

	test("should handle drag and drop", async ({ page }) => {
		// Verify initial state
		await expect(commands.getRow("ProdC0C9P1Level2")).toBeVisible();

		// Perform drag and drop
		await commands.dragDrop("ProdC0C5P4Level2", "CatC0C9Level1", "asChild");

		// Handle confirmation dialog
		await page.getByRole("button", { name: "OK" }).click();
		await commands.waitUntilLoaded();

		// Verify ProdC0C9P1Level2 is no longer visible and ProdC0C5P4Level2 is now under CatC0C9Level1
		await expect(commands.getRow("ProdC0C5P4Level2")).toBeVisible();
		await expect(commands.getRow("ProdC0C9P1Level2")).not.toBeVisible();
	});
});
