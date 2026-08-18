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


import { test, expect, type Page } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { cleanDocumentsData, generateNodes } from "../../../../services-utils/src";
import { Selector } from "../../selectors";

import { CategoriesUtils } from "../utils";

test.describe("with relationship engine", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);

		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await generateNodes({ categories: [1, 2, 6], products: 6 });

		await page.goto("");
		await utils.navigate("Pagination");
	});

	test.describe("when adding link by standalone relationship engine", () => {
		const getDualPaneContentBoxByTitle = (page: Page, title: string) =>
			page
				.locator("#CategoriesStandaloneRelationshipEngine")
				.locator(`[data-role=contentbox]`)
				.filter({ hasText: title });

		test("should update node counter and list properly", async ({ page }) => {
			await expect(page.locator("[title*=CatC0C1Level1]").nth(1)).toContainText("Load all 12 nodes");

			// Link 1 product to CatC0C1Level1 by standalone relationship engine
			const catRow = commands.getRow("CatC0C1Level1");
			await commands.buttonByDescription(catRow, "Add link").click();

			const availableProductsBox = getDualPaneContentBoxByTitle(page, "Available products");
			await availableProductsBox.locator(Selector.BODY_ROW).filter({ hasText: "ProdC0C0C0P0Level3" }).click();
			await utils.linkProductWithCategory("10");
			await commands.waitUntilLoaded();
			await page.getByRole("button", { name: "Submit" }).click();
			await commands.waitUntilLoaded();

			await expect(page.locator("[title*=CatC0C1Level1]").nth(1)).toContainText("Load all 13 nodes");
			await commands.loadAllRows(undefined, "CatC0C1Level1");
			await expect(commands.getRow("ProdC0C0C0P0Level3")).toBeVisible();

			await commands.buttonByDescription(catRow, "Add link").click();
			const candidateCategoriesBox = getDualPaneContentBoxByTitle(page, "Candidate categories");
			await candidateCategoriesBox.locator("[data-role=pagination]").locator('button[aria-label*="Next page"]').click();

			await candidateCategoriesBox.locator(Selector.BODY_ROW).filter({ hasText: "CatC0C0C5Level2" }).click();
			await page.getByRole("button", { name: "Submit" }).click();
			await commands.waitUntilLoaded();
			await expect(page.locator("[title*=CatC0C1Level1]").nth(1)).toContainText("Load all 14 nodes");
			await expect(commands.getRow("ProdC0C0C0P0Level3")).toBeVisible();
			await expect(commands.getRow("CatC0C1C5Level2")).toBeVisible();
		});

		test("should update list after deleting properly", async ({ page }) => {
			const catRow = commands.getRow("CatC0C0Level1");
			await commands.buttonByDescription(catRow, "Add link").click();

			const candidateCategoriesBox = getDualPaneContentBoxByTitle(page, "Candidate categories");
			await candidateCategoriesBox.locator(Selector.BODY_ROW).filter({ hasText: "CatC0C1C5Level2" }).click();
			await candidateCategoriesBox.locator(Selector.BODY_ROW).filter({ hasText: "CatC0C1C4Level2" }).click();
			await page.getByRole("button", { name: "Submit" }).click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "CatC0C1C5Level2")).toHaveCount(2);
			await expect(commands.getRows(undefined, "CatC0C1C4Level2")).toHaveCount(2);

			const secondCat = commands.getRows(undefined, "CatC0C1C4Level2").nth(1);
			await commands.buttonByDescription(secondCat, "Delete this category").click();
			await page.locator(Selector.DIALOG).locator("button").filter({ hasText: "Delete" }).click();
			await commands.waitUntilLoaded();

			await expect(commands.getRow("CatC0C1C4Level2")).not.toBeVisible();
			await expect(commands.getRows(undefined, "CatC0C1C5Level2")).toHaveCount(2);
		});
	});

	test.describe("when adding link by binding dual pane", () => {
		test("should update node counter and list category properly", async ({ page }) => {
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await expect(page.locator("[title*=CatC0Level0]").nth(1)).toContainText("Load all 8 nodes");
			await expect(commands.getRow("CatC0C1Level1")).toBeVisible();
			await expect(commands.getRow("CatC0C0Level1")).toBeVisible();

			// Link 1 category to CatC0Level0 by binding dual pane
			await commands.getRow("CatC0Level0").click();
			await commands.waitUntilLoaded();

			const candidateCategoriesBox = page
				.locator("#Category")
				.locator("[data-role=contentbox]")
				.filter({ hasText: "Candidate categories" });
			await candidateCategoriesBox.locator(Selector.BODY_ROW).filter({ hasText: "CatC0C1C5Level2" }).click();
			await page.getByRole("button", { name: "Save" }).click();

			await expect(page.locator("[title*=CatC0Level0]").nth(1)).toContainText("Load all 9 nodes");
			await expect(commands.getRows(undefined, "CatC0C1C5Level2")).toHaveCount(2);
			await expect(commands.getRow("CatC0C1Level1")).toBeVisible();
			await expect(commands.getRow("CatC0C0Level1")).toBeVisible();
		});
	});
});
