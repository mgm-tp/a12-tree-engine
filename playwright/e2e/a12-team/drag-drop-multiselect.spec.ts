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

test.describe("drag and drop with multiselect", () => {
	let commands: PlaywrightCommands;
	let utils: A12TeamUtils;
	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
	});

	test("should enable drag and drop if only one node is selected", async ({ page }) => {
		await utils.visitA12Team();

		const rows = commands.getRows();
		await expect(rows).toHaveCount(3);
		await expect(rows.nth(0)).toContainText("A12");
		await commands.assertExpanded("A12", true);
		await expect(rows.nth(1)).toContainText("UP");
		await commands.assertExpanded("UP", false);
		await expect(rows.nth(2)).toContainText("Engines");
		await commands.assertExpanded("Engines", false);

		await page.locator(`${Selector.SUB_HEADER} ${Selector.POPUP}`).first().click();
		await page.locator(Selector.LIST_ITEM).getByText("Expand All").click();
		await commands.waitUntilLoaded();

		await expect(rows).toHaveCount(12);
		await expect(rows.nth(0)).toContainText("A12");
		await commands.assertExpanded("A12", true);
		await expect(rows.nth(1)).toContainText("UP");
		await commands.assertExpanded("UP", true);
		await expect(rows.nth(5)).toContainText("Engines");
		await commands.assertExpanded("Engines", true);

		await commands.assertRowsVisible(
			["A12", "UP", "Jane", "Levi", "Frankie", "Engines", "Allan", "Nicolas", "Leonard", "Jane", "Levi", "Frankie"],
			0
		);

		await page.locator(Selector.MULTI_SELECTION_BUTTON).first().click();
		await commands.clickCheckbox(undefined, "Allan");

		// Test multi-selection state
		await expect(page.locator(Selector.COUNTER)).toContainText("1");

		// Test draggable state
		const allanNode = page.locator(Selector.NODE, { has: commands.getRow("Allan") });
		await expect(allanNode).toHaveAttribute("draggable", "true");

		// Test that other nodes are not draggable
		const nodes = page.locator(Selector.NODE);
		for (let i = 0; i < 12; i++) {
			if (i === 6) {
				continue; // Skip Allan
			}
			const node = nodes.nth(i);
			await expect(node).toHaveAttribute("draggable", "false");
		}

		// Perform drag and drop
		await commands.dragDrop("Allan", "UP", "asChild");

		await expect(page.getByText("Link person with team")).toBeVisible();
		await page.getByRole("button", { name: "OK" }).click();
		await commands.waitUntilLoaded();

		await commands.assertRowsVisible(
			["A12", "UP", "Allan", "Jane", "Levi", "Frankie", "Engines", "Nicolas", "Leonard", "Jane", "Levi", "Frankie"],
			0
		);

		await commands.clickCheckbox(commands.getRow("Allan"));

		// Test that multiple selection disables dragging
		await expect(page.locator(Selector.COUNTER)).toContainText("1");

		for (let i = 0; i < 12; i++) {
			const node = nodes.nth(i);
			await expect(node).toHaveAttribute("draggable", "false");
		}
	});
});
