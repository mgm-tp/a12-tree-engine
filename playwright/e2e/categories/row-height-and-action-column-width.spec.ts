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

test.describe("rowHeight and actionColumnWidth", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeAll(async () => {
		// Setup test data once for all tests
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
	});

	test("should work properly", async ({ page }) => {
		// Find Nokia row
		const nokiaRow = commands.getRow("Nokia");
		await expect(nokiaRow).toBeVisible();

		// Check that second cell contains "Nokia"
		const secondCell = nokiaRow.locator(Selector.BODY_CELL).nth(1);
		await expect(secondCell).toContainText("Nokia");

		// Check row height is 70px
		await expect(nokiaRow).toHaveCSS("height", "70px");

		// Hover over third cell to trigger tooltip
		const thirdCell = nokiaRow.locator(Selector.BODY_CELL).nth(2);
		await thirdCell.hover();

		// Check that tooltip appears
		const tooltip = page.locator('.portal [data-role="css-ellipsis-tooltip"]');
		await expect(tooltip).toBeVisible();

		// Check header cell has correct classes
		const headerRow = page.locator(Selector.HEADER_ROW);
		const lastHeaderCell = headerRow.locator(Selector.HEADER_CELL).last();
		await expect(lastHeaderCell).toHaveClass(/table__headerCell--17/);
		await expect(lastHeaderCell).toHaveClass(/table__actionCell/);
	});
});
