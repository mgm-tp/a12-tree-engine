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

import { expect, type Locator, type Page } from "@playwright/test";
import { test } from "playwright-commands";

import { Selector } from "../selectors.js";

import { CategoriesUtils } from "./utils.js";

/** The categories tree models the column visibility and marks Description initially hidden. */
const INITIALLY_HIDDEN_COLUMN = "Description";
const HIERARCHICAL_COLUMN = "Name";

test.describe("Column visibility", () => {
	let utils: CategoriesUtils;

	function trigger(page: Page): Locator {
		return page.locator(`${Selector.SUB_HEADER} button`).filter({ hasText: "view_column" });
	}

	function panel(page: Page): Locator {
		return page.locator(Selector.COLUMN_VISIBILITY_PANEL);
	}

	function columnCheckbox(page: Page, label: string): Locator {
		return page.locator(Selector.COLUMN_VISIBILITY_ITEM).filter({ hasText: label }).locator(Selector.CHECKBOX_INPUT);
	}

	function resetButton(page: Page): Locator {
		return panel(page).locator(Selector.COLUMN_VISIBILITY_RESET);
	}

	function headerCells(page: Page): Locator {
		return page.locator(`${Selector.HEADER_ROW} ${Selector.HEADER_CELL}`);
	}

	test.beforeEach(async ({ page, seed }) => {
		utils = new CategoriesUtils(page);

		await seed({ preset: "categories" });
		await page.goto("");
		await utils.navigate();
	});

	test("a column marked initially hidden is not rendered, and the trigger reports no deviation", async ({ page }) => {
		await expect(headerCells(page).filter({ hasText: INITIALLY_HIDDEN_COLUMN })).toHaveCount(0);
		await expect(headerCells(page).filter({ hasText: HIERARCHICAL_COLUMN })).toHaveCount(1);

		await trigger(page).click();

		await expect(columnCheckbox(page, INITIALLY_HIDDEN_COLUMN)).not.toBeChecked();
		await expect(resetButton(page)).toBeDisabled();
	});

	test("the hierarchical column is never offered", async ({ page }) => {
		await trigger(page).click();

		await expect(page.locator(Selector.COLUMN_VISIBILITY_ITEM).filter({ hasText: HIERARCHICAL_COLUMN })).toHaveCount(0);
	});

	test("toggling takes effect immediately and the panel stays open", async ({ page }) => {
		await trigger(page).click();

		await columnCheckbox(page, "Price").click();
		await expect(headerCells(page).filter({ hasText: "Price" })).toHaveCount(0);
		await expect(panel(page)).toBeVisible();

		await columnCheckbox(page, INITIALLY_HIDDEN_COLUMN).click();
		await expect(headerCells(page).filter({ hasText: INITIALLY_HIDDEN_COLUMN })).toHaveCount(1);
		await expect(panel(page)).toBeVisible();
	});

	test("hiding and showing a column repeatedly does not break the table", async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on("pageerror", (error) => consoleErrors.push(error.message));

		await trigger(page).click();

		for (let round = 0; round < 3; round++) {
			await columnCheckbox(page, "Quantity").click();
			await expect(headerCells(page).filter({ hasText: "Quantity" })).toHaveCount(0);

			await columnCheckbox(page, "Quantity").click();
			await expect(headerCells(page).filter({ hasText: "Quantity" })).toHaveCount(1);
		}

		expect(consoleErrors).toEqual([]);
	});

	test("reset restores the modelled visibility, hiding the initially hidden column again", async ({ page }) => {
		await trigger(page).click();

		await columnCheckbox(page, INITIALLY_HIDDEN_COLUMN).click();
		await columnCheckbox(page, "Price").click();
		await expect(resetButton(page)).toBeEnabled();

		await resetButton(page).click();

		await expect(columnCheckbox(page, INITIALLY_HIDDEN_COLUMN)).not.toBeChecked();
		await expect(columnCheckbox(page, "Price")).toBeChecked();
		await expect(headerCells(page).filter({ hasText: INITIALLY_HIDDEN_COLUMN })).toHaveCount(0);
		await expect(headerCells(page).filter({ hasText: "Price" })).toHaveCount(1);
		await expect(resetButton(page)).toBeDisabled();
	});

	test("the panel closes on Escape and on an outside click, returning focus to the trigger", async ({ page }) => {
		await trigger(page).click();
		await expect(panel(page)).toBeVisible();

		await page.keyboard.press("Escape");
		await expect(panel(page)).toBeHidden();
		await expect(trigger(page)).toBeFocused();

		await trigger(page).click();
		await expect(panel(page)).toBeVisible();

		await page.locator(Selector.TABLE_BODY).click({ position: { x: 5, y: 5 } });
		await expect(panel(page)).toBeHidden();
	});

	test("in small view the trigger moves into the heading and opens a modal", async ({ page }) => {
		await page.setViewportSize({ width: 480, height: 820 });

		const headingTrigger = page.locator(`${Selector.CONTENT_BOX_HEADING} button`).filter({ hasText: "view_column" });
		await expect(headingTrigger).toBeVisible();
		await expect(trigger(page)).toHaveCount(0);

		await headingTrigger.click();

		const modal = page.locator(Selector.DIALOG_CONTENT);
		await expect(modal).toBeVisible();
		await expect(modal.locator(Selector.COLUMN_VISIBILITY_PANEL)).toBeVisible();
		await expect(page.locator(Selector.COLUMN_VISIBILITY_ITEM).filter({ hasText: "Price" })).toBeVisible();
	});
});
