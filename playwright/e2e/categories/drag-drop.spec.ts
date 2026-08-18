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

import { cleanDocumentsData, generateNodes } from "../../../services-utils/src";

import { Selector } from "../selectors";

import { CategoriesUtils } from "./utils";

test.describe("drag and drop", () => {
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

	test.describe("make a child", () => {
		test.beforeEach(async () => {
			await utils.navigate();

			// Setup tree structure
			await utils.createCategory("Root1");
			await utils.createCategory("Root2");
			await utils.createCategory("Parent", "Root1");
			await utils.createCategory("Child", "Parent");
		});

		test("should make child properly", async () => {
			// Make Child node as child of Root2
			await commands.dragDrop("Child", "Root2", "asChild");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(0, ["Root1", "Root2"]);
			await commands.assertNodeLevel(1, ["Child", "Parent"]);
			await commands.assertNodeLevel(2, []);

			// Make Root2 as a child of Root1
			await commands.dragDrop("Root2", "Root1", "asChild");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(0, ["Root1"]);
			await commands.assertNodeLevel(1, ["Root2", "Parent"]);
			await commands.assertNodeLevel(2, ["Child"]);
		});
	});

	test.describe("make a root", () => {
		test.beforeEach(async () => {
			await utils.navigate();

			// Setup tree structure
			await utils.createCategory("Root1");
			await utils.createCategory("Root2");
			await utils.createCategory("Child", "Root1");
		});

		test("should only make child as root", async ({ page }) => {
			// Try to make Root node as Root
			await commands.dragDrop("Root1", "Root1", "asRoot");

			await expect(page.locator(Selector.DIALOG)).not.toBeVisible();
			await commands.assertNodeLevel(0, ["Root1", "Root2"]);
			await commands.assertNodeLevel(1, ["Child"]);
			await commands.assertNodeLevel(2, []);

			// Make Child node as root
			await commands.dragDrop("Child", "Child", "asRoot");

			await expect(page.locator(Selector.DIALOG)).not.toBeVisible();
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(0, ["Root1", "Root2", "Child"]);
			await commands.assertNodeLevel(1, []);

			// Make Child node as root when it has multiple parents
			await commands.dragDrop("Child", "Root1", "asChild");
			await commands.waitUntilLoaded();

			await utils.linkCategories("Child", "Root2");

			await commands.assertNodeLevel(0, ["Root1", "Root2"]);
			await commands.assertNodeLevel(1, ["Child", "Child"]);

			// Try to make root when it has multiple parents - use useFirst to avoid strict mode error
			await commands.dragDrop("Child", "Child", "asRoot");

			await expect(page.locator(Selector.DIALOG)).toBeVisible();
			await page.getByRole("button", { name: "Confirm" }).click();
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(0, ["Root1", "Root2", "Child"]);
			await commands.assertNodeLevel(1, []);
		});
	});

	test.describe("make a sibling", () => {
		test.beforeEach(async () => {
			await generateNodes({ categories: [1, 1], products: 2 });
			await utils.navigate();
		});

		test("should work properly", async () => {
			const DRAG_PRODUCT_NAME = "ProdC0P1Level1";

			// Initial order verification
			await commands.assertRowsVisible([
				"CatC0Level0",
				"CatC0C0Level1",
				"ProdC0C0P1Level2",
				"ProdC0C0P0Level2",
				DRAG_PRODUCT_NAME,
				"ProdC0P0Level1"
			]);

			// Move product to below other product when performing as_child DnD
			await commands.dragDrop(DRAG_PRODUCT_NAME, "ProdC0C0P1Level2", "asChild");
			await utils.linkProductWithCategory("10");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(2, [DRAG_PRODUCT_NAME]);
			await commands.assertRowsVisible([
				"CatC0Level0",
				"CatC0C0Level1",
				"ProdC0C0P1Level2",
				DRAG_PRODUCT_NAME,
				"ProdC0C0P0Level2",
				"ProdC0P0Level1"
			]);

			await commands.dragDrop(DRAG_PRODUCT_NAME, "ProdC0P0Level1", "asChild");
			await utils.linkProductWithCategory("10");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(1, [DRAG_PRODUCT_NAME]);
			await commands.assertRowsVisible([
				"CatC0Level0",
				"CatC0C0Level1",
				"ProdC0C0P1Level2",
				"ProdC0C0P0Level2",
				"ProdC0P0Level1",
				DRAG_PRODUCT_NAME
			]);

			// Make a category as sibling of a product when performing as_child DnD
			await utils.createCategory("CatLevel2", "CatC0C0Level1");
			await commands.assertNodeLevel(2, ["CatLevel2"]);
			await commands.assertRowsVisible([
				"CatC0Level0",
				"CatC0C0Level1",
				"CatLevel2",
				"ProdC0C0P1Level2",
				"ProdC0C0P0Level2",
				"ProdC0P0Level1",
				DRAG_PRODUCT_NAME
			]);

			await commands.dragDrop("CatLevel2", DRAG_PRODUCT_NAME, "asChild");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(1, ["CatLevel2"]);
			await commands.assertRowsVisible([
				"CatC0Level0",
				"CatC0C0Level1",
				"ProdC0C0P1Level2",
				"ProdC0C0P0Level2",
				"CatLevel2",
				"ProdC0P0Level1",
				DRAG_PRODUCT_NAME
			]);

			await commands.dragDrop("CatLevel2", "ProdC0C0P0Level2", "asChild");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(2, ["CatLevel2"]);
			await commands.assertRowsVisible([
				"CatC0Level0",
				"CatC0C0Level1",
				"CatLevel2",
				"ProdC0C0P1Level2",
				"ProdC0C0P0Level2",
				"ProdC0P0Level1",
				DRAG_PRODUCT_NAME
			]);
		});

		test("should not work when dragged item and hovered item have the same parent", async () => {
			const DRAG_PRODUCT_NAME = "ProdC0C0P0Level2";
			const HOVER_PRODUCT_NAME = "ProdC0C0P1Level2";

			await commands.assertRowsVisible([
				"CatC0Level0",
				"CatC0C0Level1",
				HOVER_PRODUCT_NAME,
				DRAG_PRODUCT_NAME,
				"ProdC0P1Level1",
				"ProdC0P0Level1"
			]);

			await commands.dragDrop(DRAG_PRODUCT_NAME, HOVER_PRODUCT_NAME, "asChild");
			await commands.waitUntilLoaded();

			await commands.assertRowsVisible([
				"CatC0Level0",
				"CatC0C0Level1",
				HOVER_PRODUCT_NAME,
				DRAG_PRODUCT_NAME,
				"ProdC0P1Level1",
				"ProdC0P0Level1"
			]);
		});
	});

	test.describe(`between relationship models "ProductCategory" & "BundleProduct"`, () => {
		test.beforeEach(async () => {
			await generateNodes({ categories: [1, 2], products: 2 });
			await utils.navigate();
		});

		test("should work properly", async () => {
			await utils.createBundle("BundleLevel1", undefined, "CatC0Level0");

			await commands.assertNodeLevel(1, ["ProdC0P0Level1"]);

			await commands.dragDrop("ProdC0P0Level1", "BundleLevel1", "asChild");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(2, ["ProdC0P0Level1"]);

			await commands.assertNodeLevel(0, ["CatC0Level0"]);
			await commands.dragDrop("ProdC0P0Level1", "CatC0Level0", "asChild");
			await commands.waitUntilLoaded();

			await utils.linkProductWithCategory("1");
			await commands.waitUntilLoaded();
			await commands.assertNodeLevel(1, ["ProdC0P0Level1"]);
		});
	});

	test.describe("make a duplicatedAllowed", () => {
		test.beforeEach(async () => {
			await generateNodes({ categories: [2], products: 1 });
			await utils.navigate();
		});

		test("should work properly", async ({ page }) => {
			await commands.assertLevel("CatC0Level0", 0);

			const childRows1 = commands.getChildNodeRows(undefined, "CatC0Level0");
			await expect(childRows1).toHaveCount(1);
			await commands.assertLevelWithLocator(childRows1, 1);
			await expect(childRows1).toContainText("ProdC0P0Level1");
			await commands.assertNodeLevel(0, ["CatC1Level0"]);

			const childRows2 = commands.getChildNodeRows(undefined, "CatC1Level0");
			await expect(childRows2).toHaveCount(1);
			await commands.assertLevelWithLocator(childRows2, 1);
			await expect(childRows2).toContainText("ProdC1P0Level1");

			// Link ProdC0P0Level1 to CatC1Level0
			await commands.buttonByDescription(commands.getRow("CatC1Level0"), "Add link").click();
			await page
				.locator("#CategoriesStandaloneRelationshipEngine")
				.locator(Selector.BODY_ROW)
				.filter({ hasText: "ProdC0P0Level1" })
				.click();

			await utils.linkProductWithCategory("10");
			await commands.waitUntilLoaded();

			await page.getByRole("button", { name: "Submit" }).click();
			await commands.waitUntilLoaded();

			await expect(commands.getRows(undefined, "ProdC0P0Level1")).toHaveCount(2);
			await expect(commands.getChildNodeRows(undefined, "CatC1Level0")).toHaveCount(2);

			// Drag ProdC0P0Level1 in CatC0Level0 and drop to ProdC1P0Level1 in CatC1Level0
			const sourceRow = commands
				.getChildNodeRows(undefined, "CatC0Level0")
				.filter({ has: page.locator(Selector.TREE_NODE_NAME).filter({ hasText: "ProdC0P0Level1" }) });
			const targetRow = commands
				.getChildNodeRows(undefined, "CatC1Level0")
				.filter({ has: page.locator(Selector.TREE_NODE_NAME).filter({ hasText: "ProdC0P0Level1" }) });
			await commands.dragDropWithLocator(sourceRow, targetRow, "asChild");
			await commands.waitUntilLoaded();

			await utils.linkProductWithCategory("10");
			await commands.waitUntilLoaded();

			await expect(commands.getChildNodeRows(undefined, "CatC1Level0")).toHaveCount(3);
			await expect(commands.getChildNodeRows(undefined, "CatC0Level0")).toHaveCount(0);
		});
	});
});
