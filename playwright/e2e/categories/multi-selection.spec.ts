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

test.describe("multi-selection", () => {
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

	test("disability", async ({ page }) => {
		await generateNodes({ categories: [1], products: 1 });
		await utils.navigate();

		// Initially, multi-selection buttons should be disabled
		(await page.locator(Selector.MULTI_SELECTION_BUTTONS).all()).forEach((button) => expect(button).toBeDisabled());
		await expect(page.locator(Selector.SUB_HEADER_BUTTONS).first()).toBeEnabled();
		await expect(page.locator(Selector.ROW_BUTTONS).first()).toBeEnabled();

		// Click multi-selection button and then click a row (should open detail pane)
		await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
		await commands.getRow("CatC0Level0").click();
		await commands.waitUntilLoaded();
		await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(2);

		// Cancel and close detail pane
		await page.getByRole("button", { name: "Cancel" }).click();
		await commands.waitUntilLoaded();

		// Enable multi-selection mode and select a category
		await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
		await commands.clickCheckbox(undefined, "CatC0Level0");

		// When items are selected, multi-selection buttons should be enabled
		// and other buttons should be disabled
		await expect(page.locator(Selector.MULTI_SELECTION_BUTTONS).first()).toBeEnabled();
		await expect(page.locator(Selector.SUB_HEADER_BUTTONS).first()).toBeDisabled();
		await expect(page.locator(Selector.ROW_BUTTONS).first()).toBeDisabled();

		// Clicking a row should not open detail pane when in multi-selection mode
		await commands.getRow("CatC0Level0").click();
		await expect(page.locator(Selector.LAYOUT_PANE)).toHaveCount(1);
	});

	test("clear confirmation dialog", async ({ page }) => {
		await generateNodes({ categories: [1], products: 5 });
		await utils.navigate();

		// Select all nodes under CatC0Level0
		await commands.clickCheckbox(undefined, "CatC0Level0");
		await expect(page.locator(Selector.COUNTER)).toContainText("6"); // Category + 5 products

		// Verify overall checkbox state
		const overallCheckbox = page
			.locator('[data-role="table-header"]')
			.locator('[data-role="checkbox"]')
			.locator(Selector.CHECKBOX_INPUT);
		await expect(overallCheckbox).toHaveAttribute("aria-checked", "true");

		// Try to exit multi-selection mode (should show dialog)
		await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
		await expect(page.locator(Selector.DIALOG)).toBeVisible();

		// Cancel should keep selection
		await page.getByRole("button", { name: "Cancel" }).click();
		await expect(page.locator(Selector.DIALOG)).toHaveCount(0);
		await expect(page.locator(Selector.COUNTER)).toContainText("6");
		await expect(overallCheckbox).toHaveAttribute("aria-checked", "true");

		// Try again and clear selection
		await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
		await expect(page.locator(Selector.DIALOG)).toBeVisible();

		await page.getByRole("button", { name: "Clear selection" }).click();
		await expect(page.locator(Selector.DIALOG)).toHaveCount(0);
		await expect(page.locator(Selector.COUNTER)).toHaveCount(0);
		await expect(page.locator(Selector.CHECKBOX)).toHaveCount(0);

		// Re-enable multi-selection mode to verify state is cleared
		await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
		await expect(page.locator(Selector.COUNTER)).toContainText("0");
		await expect(overallCheckbox).toHaveAttribute("aria-checked", "false");
	});

	test("checkbox", async ({ page }) => {
		await utils.navigate();

		// Initially, overall checkbox should be unchecked

		const overallCheckbox = page
			.locator('[data-role="table-header"]')
			.locator('[data-role="checkbox"]')
			.locator(Selector.CHECKBOX_INPUT);
		await expect(overallCheckbox).toHaveAttribute("aria-checked", "false");

		await expect(page.locator(Selector.COUNTER)).toContainText("0");

		// Generate test data
		await cleanDocumentsData({ showcases: ["categories"] });
		await generateNodes({ categories: [2, 2], products: 3 });
		await page.goto("");
		await utils.navigate();

		// Select a level 1 category (should select all its children)
		await commands.clickCheckbox(undefined, "CatC0C0Level1");
		await expect(page.locator(Selector.COUNTER)).toContainText("4"); // Category + 3 products

		// Overall checkbox should be partly selected (indeterminate)
		await expect(overallCheckbox).toHaveAttribute("aria-checked", "mixed");

		// Deselect one product
		await commands.clickCheckbox(undefined, "ProdC0C0P1Level2");
		await expect(page.locator(Selector.COUNTER)).toContainText("2"); // 2 products left

		// Deselect another product
		await commands.clickCheckbox(undefined, "ProdC0C0P0Level2");
		await expect(page.locator(Selector.COUNTER)).toContainText("1"); // 1 product left

		// Deselect last product
		await commands.clickCheckbox(undefined, "ProdC0C0P2Level2");
		await expect(page.locator(Selector.COUNTER)).toContainText("0");
		await expect(overallCheckbox).toHaveAttribute("aria-checked", "false");

		// Select the last product again
		await commands.clickCheckbox(undefined, "ProdC0C0P2Level2");
		await expect(page.locator(Selector.COUNTER)).toContainText("1");

		// Select parent category (should select all children)
		await commands.clickCheckbox(undefined, "CatC0Level0");
		await expect(page.locator(Selector.COUNTER)).toContainText("12"); // All nodes under CatC0Level0

		// Deselect one subcategory
		await commands.clickCheckbox(undefined, "CatC0C1Level1");
		await expect(page.locator(Selector.COUNTER)).toContainText("7"); // Remaining nodes

		// Deselect another subcategory
		await commands.clickCheckbox(undefined, "CatC0C0Level1");
		await expect(page.locator(Selector.COUNTER)).toContainText("3"); // Only direct products left

		// Select all using overall checkbox
		await commands.clickCheckbox(undefined, "overall");
		await expect(page.locator(Selector.COUNTER)).toContainText("24"); // All nodes
		await expect(overallCheckbox).toHaveAttribute("aria-checked", "true");

		// Deselect all using overall checkbox
		await commands.clickCheckbox(undefined, "overall");
		await expect(page.locator(Selector.COUNTER)).toContainText("0");
		await expect(overallCheckbox).toHaveAttribute("aria-checked", "false");
	});
});
