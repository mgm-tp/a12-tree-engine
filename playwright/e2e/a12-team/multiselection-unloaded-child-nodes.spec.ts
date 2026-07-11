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

test.describe("multiselection concerning unloaded child nodes", () => {
	let commands: PlaywrightCommands;
	let utils: A12TeamUtils;
	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
	});

	test("should work", async ({ page }) => {
		await utils.visitA12Team();

		let rows = commands.getRows();
		await expect(rows).toHaveCount(3);
		await expect(rows.nth(0)).toContainText("A12");
		await commands.assertExpanded("A12", true);
		await expect(rows.nth(1)).toContainText("UP");
		await commands.assertExpanded("UP", false);
		await expect(rows.nth(2)).toContainText("Engines");
		await commands.assertExpanded("Engines", false);

		// Move UP under Engines
		await commands.dragDrop("UP", "Engines", "asChild");

		await page.getByRole("button", { name: "Expand functions for bulk operation" }).click();
		await commands.waitUntilLoaded();

		// Click checkbox for A12 (this should select all children including unloaded ones)
		await commands.clickCheckbox(commands.getRow("A12"));
		await commands.expandNode("UP");

		// Verify all items are selected (counter should show 12 total items)
		await expect(page.locator(Selector.COUNTER)).toContainText("12");

		// Verify overall selection state
		const checkbox = page.getByRole("columnheader", { name: "Action" }).first().getByRole("checkbox");
		await expect(checkbox).toBeChecked();

		// Verify all visible rows are selected
		rows = commands.getRows();
		const rowCount = await rows.count();
		for (let i = 0; i < rowCount; i++) {
			const rowCheckbox = rows.nth(i).locator(Selector.CHECKBOX_INPUT);
			await expect(rowCheckbox).toBeChecked();
		}
	});
});
