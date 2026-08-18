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

import { cleanDocumentsData, generateNodes } from "../../../../services-utils/src";
import { Selector } from "../../selectors";

import { CategoriesUtils } from "../utils";

test.describe("sizing behavior", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);

		await cleanDocumentsData({
			showcases: ["categories"]
		});
	});

	test("should NOT reduce the size below 5 unless the fullSize is less then 5", async ({ page }) => {
		await generateNodes({ categories: [1, 1, 6], products: 6 });
		await page.goto("");
		await utils.navigate("Pagination");

		await expect(commands.getChildNodeRows(undefined, "CatC0C0Level1")).toHaveCount(5);

		await commands.deleteNode(undefined, "CatC0C0C5Level2");
		await expect(commands.getChildNodeRows(undefined, "CatC0C0Level1")).toHaveCount(5);

		await commands.clickCheckbox(undefined, "CatC0C0C4Level2");
		await commands.clickCheckbox(undefined, "CatC0C0C1Level2", true);

		await page.getByTitle("Delete", { exact: true }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getChildNodeRows(undefined, "CatC0C0Level1")).toHaveCount(5);

		await commands.clickCheckbox(undefined, "ProdC0C0P5Level2");
		await commands.clickCheckbox(undefined, "ProdC0C0P2Level2", true);

		await page.getByTitle("Delete", { exact: true }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getChildNodeRows(undefined, "CatC0C0Level1")).toHaveCount(3);

		await expect(commands.getRow("CatC0C0C0Level2")).toBeVisible();
		await expect(commands.getRow("ProdC0C0P0Level2")).toBeVisible();
	});

	test("min size should remain default page size of 5 when adding a new node", async ({ page }) => {
		await generateNodes({ categories: [1, 2], products: 3 });
		await page.goto("");
		await utils.navigate("Pagination");

		await expect(commands.getChildNodeRows(undefined, "CatC0C1Level1")).toHaveCount(3);
		await utils.createCategory("Cat1", "CatC0C1Level1");
		await expect(commands.getChildNodeRows(undefined, "CatC0C1Level1")).toHaveCount(4);
		await utils.createCategory("Cat2", "CatC0C1Level1");
		await expect(commands.getChildNodeRows(undefined, "CatC0C1Level1")).toHaveCount(5);
		await utils.createCategory("Cat3", "CatC0C1Level1");
		await expect(commands.getChildNodeRows(undefined, "CatC0C1Level1")).not.toHaveCount(6);

		await expect(commands.getRow("ProdC0C1P1Level2")).toBeVisible();
		await utils.createCategory("Cat4", "CatC0C1Level1");
		await expect(commands.getChildNodeRows(undefined, "CatC0C1Level1")).toHaveCount(5);
		await expect(commands.getRow("ProdC0C1P1Level2")).not.toBeVisible();
	});

	test("drag and drop should keep the sizing stable between unless the fullSize is less then 5", async ({ page }) => {
		await generateNodes({ categories: [1, 2], products: 8 });
		await page.goto("");
		await utils.navigate("Pagination");

		await commands.dragDrop("ProdC0C1P7Level2", "CatC0C0Level1", "asChild");
		await page.locator(Selector.DIALOG).locator("button").filter({ hasText: "OK" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getChildNodeRows(undefined, "CatC0C1Level1")).toHaveCount(5);

		await commands.dragDrop("ProdC0C1P6Level2", "CatC0C0Level1", "asChild");
		await page.locator(Selector.DIALOG).locator("button").filter({ hasText: "OK" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getChildNodeRows(undefined, "CatC0C1Level1")).toHaveCount(5);

		await commands.dragDrop("ProdC0C1P5Level2", "CatC0C0Level1", "asChild");
		await page.locator(Selector.DIALOG).locator("button").filter({ hasText: "OK" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getChildNodeRows(undefined, "CatC0C1Level1")).toHaveCount(5);

		await commands.dragDrop("ProdC0C1P4Level2", "CatC0C0Level1", "asChild");
		await page.locator(Selector.DIALOG).locator("button").filter({ hasText: "OK" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getChildNodeRows(undefined, "CatC0C1Level1")).toHaveCount(4);
	});
});
