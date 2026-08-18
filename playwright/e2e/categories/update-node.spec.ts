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

import { cleanDocumentsData, seedData } from "../../../services-utils/src";

import { Selector } from "../selectors";

import { CategoriesUtils } from "./utils";

test.describe("update node", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);

		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await seedData({ preset: "categories" });

		await page.goto("");
		await utils.navigate();
	});

	test.describe("add Release Date and check if the updated node is rendered correctly", () => {
		test("should add Release Date to the node", async ({ page }) => {
			await commands.waitUntilLoaded();
			await commands.findButton("Random Inc", "Delete this category").click();
			await page.locator(Selector.DIALOG).locator("button").filter({ hasText: "Delete" }).click();
			await commands.waitUntilLoaded();
			await expect(page.locator(Selector.MULTI_SELECTION_BUTTON)).toBeVisible();
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();

			await expect(commands.getRow("Nokia 8.1")).toBeVisible();
			await commands.getRow("Nokia 8.1").click();
			await commands.waitUntilLoaded();

			await expect(page.locator(Selector.FORM_ENGINE)).toBeVisible();

			// Find the Release Date field and fill it
			const releaseDateLabel = page.locator('label[data-role="textline-label"]').filter({ hasText: "Release Date" });
			const forAttr = await releaseDateLabel.getAttribute("for");
			await page.locator(`#${forAttr}`).clear();
			await page.locator(`#${forAttr}`).fill("06/17/2025");

			await page.locator(Selector.FORM_ENGINE).locator("button").filter({ hasText: "Save" }).click();

			await commands.waitUntilLoaded();
			await expect(page.locator(Selector.FORM_ENGINE)).not.toBeVisible();
			await expect(commands.getRow("Nokia 8.1")).toBeVisible();
			await expect(commands.getRow("Nokia 8.1")).toContainText("06/17/2025");

			await expect(commands.getRow("Pixel 4 XL")).toBeVisible();
			await commands.getRow("Pixel 4 XL").click();
			await commands.waitUntilLoaded();

			await expect(page.locator(Selector.FORM_ENGINE)).toBeVisible();

			// Find the Release Date field and fill it
			const releaseDateLabel2 = page.locator('label[data-role="textline-label"]').filter({ hasText: "Release Date" });
			const forAttr2 = await releaseDateLabel2.getAttribute("for");
			await page.locator(`#${forAttr2}`).clear();
			await page.locator(`#${forAttr2}`).fill("07/22/2024");

			await page.locator(Selector.FORM_ENGINE).locator("button").filter({ hasText: "Save" }).click();

			await commands.waitUntilLoaded();
			await expect(page.locator(Selector.FORM_ENGINE)).not.toBeVisible();
			await expect(commands.getRow("Pixel 4 XL")).toBeVisible();
			await expect(commands.getRow("Pixel 4 XL")).toContainText("07/22/2024");
		});
	});
});
