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

test.describe("A person can belong to more than 1 team", () => {
	test.beforeAll(async () => {
		// Clean and seed data using services-utils API
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
	});

	test("should work", async ({ page }) => {
		const commands = new PlaywrightCommands(page);
		const utils = new A12TeamUtils(page);

		// Navigate to A12 team page
		await utils.visitA12Team();

		// Expand all nodes
		await page.locator(`${Selector.SUB_HEADER} ${Selector.POPUP}`).click();
		await page.locator(Selector.LIST_ITEM).getByText("Expand All").click();

		// Check initial state - each person should appear in multiple teams
		const leviRows = commands.getRows(undefined, "Levi");
		const janeRows = commands.getRows(undefined, "Jane");
		const frankieRows = commands.getRows(undefined, "Frankie");

		await expect(leviRows).toHaveCount(2);
		await expect(janeRows).toHaveCount(2);
		await expect(frankieRows).toHaveCount(2);

		// Delete Levi via right-click context menu
		const leviRow = commands.getRow("Levi").first();
		await leviRow.click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).getByText("Delete Person").click();
		await page.locator(`${Selector.DIALOG} button`).getByText("Delete").click();

		// Verify Levi is deleted but others remain
		await expect(commands.getRow("Levi")).toHaveCount(0);
		await expect(commands.getRows(undefined, "Jane")).toHaveCount(2);
		await expect(commands.getRows(undefined, "Frankie")).toHaveCount(2);

		// Create new person
		await utils.createPerson("Whacky", "UP");

		// Click on the new person
		await commands.getRow("Whacky").click();

		// Add person to Engines team via form
		const formEngine = page.locator(Selector.FORM_ENGINE);
		await formEngine.getByRole("row", { name: "Engines", exact: true }).getByRole("button").click();
		await page.locator(`${Selector.DIALOG} button`).getByText("OK").click();
		await page.getByRole("button", { name: "Save" }).click();

		// Verify Whacky now appears in both teams
		await expect(commands.getRows(undefined, "Whacky")).toHaveCount(2);
	});
});
