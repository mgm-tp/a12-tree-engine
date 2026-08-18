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

import { cleanDocumentsData, seedData } from "../../../services-utils/src/api.js";

import { Selector } from "../selectors.js";

import { A12TeamUtils } from "./utils.js";

test.describe("row-selection", () => {
	test.beforeAll(async () => {
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
	});

	test("should work", async ({ page }) => {
		const commands = new PlaywrightCommands(page);
		const utils = new A12TeamUtils(page);
		await utils.visitA12Team();

		await commands.getRow("Engines").click();
		await commands.assertSelectedRow("Engines");
		await commands.waitUntilLoaded();

		await commands.getRow("UP").click();
		await commands.assertSelectedRow("UP");
		await commands.waitUntilLoaded();

		await page.locator("#a12-TeamName-field_c9ad3").clear();
		await page.locator("#a12-TeamName-field_c9ad3").fill("UPer");

		await commands.getRow("A12").click();
		const dirtyHandlingDialog = page.getByRole("heading", { name: "Warning: Unsaved changes" });
		await expect(dirtyHandlingDialog).toBeVisible();
		await page.locator(Selector.DIALOG).getByRole("button", { name: "Go Back" }).click();

		await commands.assertSelectedRow("UP");
		await expect(commands.getRow("A12")).not.toHaveClass(/table__contentRow--selected/);

		await commands.getRow("A12").click();
		await page.locator(Selector.DIALOG).getByRole("button", { name: "Discard changes" }).click();

		await expect(commands.getRow("UP")).not.toHaveClass(/table__contentRow--selected/);
		await commands.assertSelectedRow("A12");

		await page.locator("#a12-TeamName-field_c9ad3").clear();
		await page.locator("#a12-TeamName-field_c9ad3").fill("A23");
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRow("A23")).toBeVisible();
		await expect(commands.getRow("A23")).not.toHaveClass(/table__contentRow--selected/);
	});
});
