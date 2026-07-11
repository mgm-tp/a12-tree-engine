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

import { CategoriesUtils } from "./utils.js";
import { A12TeamUtils } from "./../a12-team/utils.js";

test.describe("switch to another tree, test for bug ticket: A12TE-497", () => {
	let utils: CategoriesUtils;
	let a12Utils: A12TeamUtils;
	let commands: PlaywrightCommands;
	let consoleErrors: string[] = [];

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		a12Utils = new A12TeamUtils(page);
		commands = new PlaywrightCommands(page);
		consoleErrors = [];

		// Listen for console errors
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await seedData({ preset: "categories" });

		await page.goto("");
		await utils.navigate();
	});

	test("should not throw errors", async () => {
		// Click on the second row
		const rows = commands.getRows();
		await rows.nth(1).click();
		await commands.waitUntilLoaded();

		// Navigate to A12 Team
		await a12Utils.navigateToA12Team();

		// Verify no console errors were thrown
		expect(consoleErrors).toEqual([]);
	});
});
