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

import { cleanDocumentsData, generateNodes } from "../../../services-utils/src/index.js";

import { InsertSiblingPosition } from "../types.js";
import { Selector } from "../selectors.js";

import { CategoriesUtils } from "./utils.js";

test.describe("CRUD", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;
	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);
		await cleanDocumentsData({
			showcases: ["categories"]
		});

		await page.goto("");
	});

	test.describe("add & delete links", () => {
		test("should work properly", async ({ page }) => {
			// This is the first test that runs, so we need to wait for the initial loading to finish
			if (process.env.CI) {
				await page.waitForTimeout(5000);
			}
			await utils.navigate();
			// Setup tree structure
			await utils.createCategory("Root");
			await utils.createCategory("FirstCategory", "Root");
			await utils.createCategory("SecondCategory", "Root");
			await utils.createCategory("CommonCategory", "FirstCategory");
			// Add categories
			await utils.linkCategories("CommonCategory", "SecondCategory");
			await commands.expandNode("SecondCategory");

			await commands.assertRowsVisible(["FirstCategory", "CommonCategory", "SecondCategory", "CommonCategory"], 1);

			// Delete link between CommonCategory and FirstCategory
			const rows = commands.getRows();
			await commands.buttonByDescription(rows.nth(4), "Remove this category").click();
			await commands.waitUntilLoaded();
			await page.getByRole("button", { name: "Delete" }).click();
			await commands.waitUntilLoaded();

			await commands.assertRowsVisible(["FirstCategory", "CommonCategory", "SecondCategory"], 1);

			// Add bundles & products
			await utils.createBundle("Bundle", undefined, "FirstCategory");
			await utils.createProductForBundle("Product", "Bundle");

			await commands.assertRowsVisible([
				"Root",
				"FirstCategory",
				"CommonCategory",
				"Bundle",
				"Product",
				"SecondCategory"
			]);

			// Add empty bundle
			const secondCategoryRow = commands.getRow("SecondCategory");
			await commands.buttonByDescription(secondCategoryRow, "Insert a new child").click();
			await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainBundle" }).click();
			await page.getByRole("button", { name: "Save" }).click();

			// Handle "Link product with category" dialog
			const linkDialog = page.locator('text="Link product with category"');
			await expect(linkDialog).toBeVisible();
			await page.getByRole("button", { name: "OK" }).click();

			// Check that toast doesn't exist (equivalent to cy.get(Selector.TOAST).should("not.exist"))
			await expect(page.locator(Selector.TOAST)).toHaveCount(0);
		});
	});

	test.describe("add siblings", () => {
		test.describe("with defined Document Model", () => {
			test.beforeEach(async () => {
				await generateNodes({ categories: [1, 1], products: 1 });

				await utils.navigate("Custom Categories");
			});

			test("add product", async () => {
				const positions = [InsertSiblingPosition.BELOW, InsertSiblingPosition.ABOVE];

				for (const position of positions) {
					await utils.createSiblingProduct(`product ${position}`, position, "ProdC0P0Level1");
				}

				await commands.assertRowsVisible(["CatC0Level0", "product above", "ProdC0P0Level1", "product below"]);
			});

			test("add bundle", async () => {
				const positions = [InsertSiblingPosition.BELOW, InsertSiblingPosition.ABOVE];

				for (const position of positions) {
					await utils.createBundle(`bundle ${position}`, undefined, "ProdC0P0Level1", "99", position);
				}

				await commands.assertRowsVisible(["CatC0Level0", "bundle above", "ProdC0P0Level1", "bundle below"]);
			});
			test("add a category above the first category", async () => {
				await utils.createSiblingCategory("category above", InsertSiblingPosition.ABOVE, "CatC0C0Level1");
				await commands.assertRowsVisible([
					"CatC0Level0",
					"ProdC0P0Level1",
					"category above",
					"CatC0C0Level1",
					"ProdC0C0P0Level2"
				]);
			});
		});

		test.describe("without Document Model", () => {
			test.beforeEach(async () => {
				await generateNodes({ categories: [1, 3], products: 1 });
				await utils.navigate("Custom Categories");
			});

			test("should work properly", async ({ page }) => {
				// Insert a sibling above a category
				await commands.assertRowsVisible([
					"CatC0Level0",
					"ProdC0P0Level1",
					"CatC0C2Level1",
					"ProdC0C2P0Level2",
					"CatC0C1Level1",
					"ProdC0C1P0Level2",
					"CatC0C0Level1"
				]);

				await commands.clickOnPopUpMenu("CatC0C1Level1", "Insert a sibling above");

				// Dialog should show DomainCategory only
				await expect(page.locator(Selector.DIALOG).locator(Selector.DIALOG_NODE_TITLE)).toHaveCount(1);
				await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainCategory" }).click();

				await commands.waitUntilLoaded();
				await expect(
					page.locator(Selector.FORM_ENGINE).locator(Selector.CONTENT_BOX_TITLE, { hasText: /^Category$/ })
				).toBeVisible();
				await page.locator('input[id*="a12-Name"]').fill("above CatC0C1Level1");
				await page.getByRole("button", { name: "Save" }).click();
				await commands.waitUntilLoaded();

				await commands.assertRowsVisible([
					"CatC0Level0",
					"ProdC0P0Level1",
					"CatC0C2Level1",
					"ProdC0C2P0Level2",
					"above CatC0C1Level1",
					"CatC0C1Level1",
					"ProdC0C1P0Level2",
					"CatC0C0Level1"
				]);
				await commands.assertNodeLevel(1, ["CatC0C1Level1", "above CatC0C1Level1"]);

				// Insert a sibling below a product
				await commands.clickOnPopUpMenu("ProdC0P0Level1", "Insert a sibling below");

				// Dialog should show DomainProduct and DomainBundle
				await expect(page.locator(Selector.DIALOG).locator(Selector.DIALOG_NODE_TITLE)).toHaveCount(2);
				await expect(page.locator(Selector.DIALOG).locator(Selector.DIALOG_NODE_TITLE).first()).toContainText(
					"DomainProduct"
				);
				await expect(page.locator(Selector.DIALOG).locator(Selector.DIALOG_NODE_TITLE).last()).toContainText(
					"DomainBundle"
				);
				await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainBundle" }).click();

				await commands.waitUntilLoaded();
				await expect(
					page.locator(Selector.FORM_ENGINE).getByRole("heading", { name: "Bundle", exact: true })
				).toBeVisible();
				await page.locator('input[id*="a12-Name"]').fill("bundle below ProdC0P0Level1");
				await page.getByRole("button", { name: "Save" }).click();
				await page.getByRole("button", { name: "OK" }).click();
				await commands.waitUntilLoaded();

				await commands.assertRowsVisible([
					"CatC0Level0",
					"ProdC0P0Level1",
					"bundle below ProdC0P0Level1",
					"CatC0C2Level1"
				]);
				await commands.assertNodeLevel(1, ["ProdC0P0Level1", "bundle below ProdC0P0Level1"]);
			});
		});
	});
});
