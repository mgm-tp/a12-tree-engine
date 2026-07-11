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

test.describe("multiselection with link documents", () => {
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

		await commands.expandNode("Engines");
		await commands.waitUntilLoaded();

		const rows = commands.getRows();
		await expect(rows).toHaveCount(9);
		await expect(rows.nth(0)).toContainText("A12");
		await commands.assertExpanded("A12", true);
		await expect(rows.nth(1)).toContainText("UP");
		await commands.assertExpanded("UP", false);
		await expect(rows.nth(2)).toContainText("Engines");
		await commands.assertExpanded("Engines", true);

		await page.locator(`${Selector.SUB_HEADER} ${Selector.MULTI_SELECTION_BUTTON}`).first().click();
		await commands.waitUntilLoaded();

		// Click Allan checkbox
		await commands.clickCheckbox(commands.getRow("Allan"));

		// Click Frankie checkbox with shift (range selection)
		await commands.clickCheckbox(commands.getRow("Frankie"), true);

		// Verify counter shows 6 selected items
		await expect(page.locator(Selector.COUNTER)).toContainText("6");

		// Verify overall state is partially selected
		const headerCheckbox = page.getByRole("columnheader", { name: "Action" }).first().getByRole("checkbox");
		await expect(headerCheckbox).toHaveAttribute("aria-checked", "mixed");

		// Verify specific selection states
		const selectedItems = ["Allan", "Nicolas", "Leonard", "Jane", "Levi", "Frankie"];
		const partlySelectedItems = ["A12", "Engines"];

		for (const item of selectedItems) {
			const checkbox = commands.getRow(item).locator(Selector.CHECKBOX_INPUT);
			await expect(checkbox).toBeChecked();
		}

		for (const item of partlySelectedItems) {
			const checkbox = commands.getRow(item).locator(Selector.CHECKBOX_INPUT);
			await expect(checkbox).toHaveAttribute("aria-checked", "mixed");
		}

		// Verify UP is deselected
		const upCheckbox = commands.getRow("UP").locator(Selector.CHECKBOX_INPUT);
		await expect(upCheckbox).not.toBeChecked();
	});
});
