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

import { cleanDocumentsData, seedData } from "../../../services-utils/src/index.js";

import { Selector } from "../selectors.js";

import { CategoriesUtils } from "./utils.js";

test.describe.skip("scroll to node", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeAll(async () => {
		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await seedData({
			preset: "categories"
		});
	});

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);

		await page.goto("");
		await utils.navigate();

		// Mark row 30th as target
		const rows = commands.getRows();
		const targetRow = rows.nth(30);

		// Open context menu and mark as target node
		await targetRow.locator(Selector.POPUP).click();
		await page.getByRole("button", { name: "Mark as target node" }).click();

		// Scroll to top so target is not visible
		await page.locator(Selector.TABLE_BODY).evaluate((el) => (el.scrollTop = 0));
		await expect(targetRow).not.toBeInViewport();
	});

	test("should scroll to target when tree is first rendered or 'reveal target' is clicked", async ({ page }) => {
		// Get the target row
		const rows = commands.getRows();
		const targetRow = rows.nth(30);

		// Click reveal target button
		await page.locator(`${Selector.SUB_HEADER} button[aria-label="Reveal target node"]`).click();

		// Verify target is now visible
		await expect(targetRow).toBeInViewport();

		// Verify focus is NOT on a button (autofocus should move to the row)
		const focusedElement = page.locator(":focus");
		const tagName = await focusedElement.evaluate((el) => el.tagName);
		expect(tagName).not.toBe("BUTTON");
	});

	test("should scroll to target when tree is first rendered or 'reveal target' is clicked without autofocus", async ({
		page
	}) => {
		// Get the target row
		const rows = commands.getRows();
		const targetRow = rows.nth(30);

		// Click reveal target button without focus
		await page.locator(`${Selector.SUB_HEADER} button[aria-label="Reveal target node (without focus)"]`).click();

		// Verify target is now visible
		await expect(targetRow).toBeInViewport();

		// Verify focus is still on the button (no autofocus)
		const focusedElement = page.locator(":focus");
		const tagName = await focusedElement.evaluate((el) => el.tagName);
		expect(tagName).toBe("BUTTON");
	});
});
