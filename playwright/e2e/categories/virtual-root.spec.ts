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

test.describe("virtual root", () => {
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
		await utils.navigate("Virtual Scroll");
	});

	test("should open the form when category insert action in virtual root is clicked", async ({ page }) => {
		const virtualRoot = page.locator(Selector.VIRTUAL_ROOT);
		await commands.openContextMenu(virtualRoot);

		await page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM).filter({ hasText: "Category" }).click();

		await expect(
			page
				.locator(Selector.FORM_ENGINE)
				.locator(Selector.CONTENT_BOX_TITLE)
				.filter({ hasText: /^Category$/ })
		).toBeVisible();
	});
});
