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

test.describe("expand/collapse sub-tree during multi-selection", () => {
	let commands: PlaywrightCommands;
	let utils: A12TeamUtils;

	test.beforeAll(async () => {
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		await utils.visitA12Team();
	});

	test("should expand sub-tree of a node when multi-selection is active", async ({ page }) => {
		await expect(commands.getRows()).toHaveCount(3);

		await page.locator(Selector.MULTI_SELECTION_BUTTON).first().click();
		await commands.clickCheckbox(undefined, "A12");

		await commands.expandAllNode("Engines");

		await expect(commands.getRows()).toHaveCount(9);
	});

	test("should collapse sub-tree of a node when multi-selection is active", async ({ page }) => {
		await page.locator(`${Selector.SUB_HEADER} ${Selector.POPUP}`).first().click();
		await page.locator(Selector.LIST_ITEM).getByText("Expand All").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRows()).toHaveCount(12);

		await page.locator(Selector.MULTI_SELECTION_BUTTON).first().click();
		await commands.clickCheckbox(undefined, "A12");

		await commands.clickOnPopUpMenu("Engines", "Collapse All");

		await expect(commands.getRows()).toHaveCount(6);
	});
});
