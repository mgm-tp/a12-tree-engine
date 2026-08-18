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

test.describe("Disable drag and drop", () => {
	let commands: PlaywrightCommands;
	let utils: A12TeamUtils;
	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
	});

	test.describe("by tree engine context", () => {
		test("should work", async ({ page }) => {
			await utils.visitA12Team();

			await page.locator(Selector.APPLICATION_HEADER_POPUP).first().click();
			await page.locator(Selector.LIST_ITEM).getByText("Disable Dnd").click();

			const rows = commands.getRows();
			await expect(rows.nth(0)).toContainText("A12");
			await expect(rows.nth(0)).toHaveCount(1);
			await expect(rows.nth(1)).toContainText("UP");
			await commands.assertLevel("UP", 1);
			await expect(rows.nth(2)).toContainText("Engines");
			await commands.assertLevel("Engines", 1);

			const enginesRows = commands.getRows(undefined, "Engines");
			await expect(enginesRows).toHaveCount(1);
			await expect(enginesRows).not.toHaveAttribute("aria-expanded", "true");
			(await commands.getRows().all()).forEach(async (row) => {
				await expect(row).not.toHaveClass(/table__contentDnD/);
			});
			// await expect().not.toHaveClass(/table__contentDnD/);
			// await expect(commands.getRow( "Engines")).not.toHaveClass(/table__contentDnD/);

			// Test drag and drop (should not work when disabled)
			await commands.dragDrop("UP", "Engines", "asChild");

			// Verify structure hasn't changed
			await expect(rows.nth(1)).toContainText("UP");
			await commands.assertLevel("UP", 1);
			await expect(rows.nth(2)).toContainText("Engines");
			await commands.assertLevel("Engines", 1);

			const upRows = commands.getRows(undefined, "UP");
			await expect(upRows).toHaveCount(1);
			await expect(upRows).not.toHaveAttribute("aria-expanded", "true");
			await expect(enginesRows).toHaveCount(1);
			await expect(enginesRows).not.toHaveAttribute("aria-expanded", "true");
		});
	});

	test.describe("by modeling dnd configuration", () => {
		test("should work", async () => {
			await utils.visitA12Team({ custom: true });

			const rows = commands.getRows();
			await expect(rows.nth(1)).toContainText("A12");
			await expect(rows.nth(1)).toHaveCount(1);
			await commands.expandNode("A12");

			await expect(rows.nth(2)).toContainText("UP");
			await commands.assertLevel("UP", 1);
			await expect(rows.nth(3)).toContainText("Engines");
			await commands.assertLevel("Engines", 1);

			const enginesRows = commands.getRows(undefined, "Engines");
			await expect(enginesRows).toHaveCount(1);
			await expect(enginesRows).not.toHaveAttribute("aria-expanded", "true");

			await expect(commands.getRow("UP")).not.toHaveClass(/table__contentDnD/);
			await expect(commands.getRow("Engines")).not.toHaveClass(/table__contentDnD/);

			// Test drag and drop (should not work when disabled)
			await commands.dragDrop("UP", "Engines", "asChild");

			// Verify structure hasn't changed
			await expect(rows.nth(2)).toContainText("UP");
			await commands.assertLevel("UP", 1);
			await expect(rows.nth(3)).toContainText("Engines");
			await commands.assertLevel("Engines", 1);

			const upRows = commands.getRows(undefined, "UP");
			await expect(upRows).toHaveCount(1);
			await expect(upRows).not.toHaveAttribute("aria-expanded", "true");
			await expect(enginesRows).toHaveCount(1);
			await expect(enginesRows).not.toHaveAttribute("aria-expanded", "true");
		});
	});
});
