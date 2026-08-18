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

import { cleanDocumentsData, seedData } from "../../../../services-utils/src/api.js";
import { Selector } from "../../selectors.js";

import { A12TeamUtils } from "../utils.js";

test.describe("loading behavior", () => {
	let commands: PlaywrightCommands;
	let utils: A12TeamUtils;
	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		await utils.visitA12Team({ pagination: true });
	});
	test.beforeAll(async ({ browser }) => {
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });

		const page = await browser.newPage();
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		await utils.visitA12Team({ pagination: true });

		await expect(commands.getRow("A12")).toBeVisible();
		await commands.assertExpanded("UP", false);
		await commands.assertExpanded("Engines", false);

		await utils.createSubTeam("Team A", "A12");
		await utils.createPerson("P1", "A12");
		await utils.createPerson("P2", "A12");
		await utils.createPerson("P3", "A12");
		await utils.createPerson("P4", "A12");
		await utils.createPerson("P5", "A12");
	});

	test("should expand whole tree", async ({ page }) => {
		await page.locator("button").filter({ hasText: "menu" }).click();
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Expand All" }).click();
		await commands.waitUntilLoaded();

		const rows = commands.getRows();
		await expect(rows.nth(0)).toContainText("A12");
		await commands.assertExpanded("A12", true);
		await expect(rows.nth(7)).toContainText("UP");
		await commands.assertExpanded("UP", true);
		await expect(rows.nth(11)).toContainText("Engines");
		await commands.assertExpanded("Engines", true);
		await expect(rows).toHaveCount(18);
	});

	test("should expand subtree", async ({ page }) => {
		await commands.getRow("A12").click({ button: "right" });
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Expand All" }).click();
		await commands.waitUntilLoaded();

		const rows = commands.getRows();
		await expect(rows.nth(0)).toContainText("A12");
		await commands.assertExpanded("A12", true);
		await expect(rows.nth(7)).toContainText("UP");
		await commands.assertExpanded("UP", true);
		await expect(rows.nth(11)).toContainText("Engines");
		await commands.assertExpanded("Engines", true);
		await expect(rows).toHaveCount(18);
	});

	test("should load more", async () => {
		await commands.loadMoreRows(undefined, "A12");
		await expect(commands.getRow("Team A").locator(Selector.TREE_NODE).getByRole("button")).not.toBeVisible();
		await expect(commands.getRow("UP").locator(Selector.TREE_NODE).getByRole("button")).toBeVisible();
		await expect(commands.getRow("Engines").locator(Selector.TREE_NODE).getByRole("button")).toBeVisible();
	});

	test("should load all", async ({ page }) => {
		await commands.loadAllRows(undefined, "A12");
		await expect(commands.getRow("Team A").locator(Selector.TREE_NODE).getByRole("button")).not.toBeVisible();
		await expect(commands.getRow("UP").locator(Selector.TREE_NODE).getByRole("button")).toBeVisible();
		await expect(commands.getRow("Engines").locator(Selector.TREE_NODE).getByRole("button")).toBeVisible();

		// pagination with 4 persons and 5 teams (page size = 5)
		await commands.buttonByDescription(commands.getRow("P5"), "Delete person").click();
		await page.getByRole("button", { name: "Delete" }).click();
		await expect(commands.getRow("P5")).not.toBeVisible();

		await utils.createSubTeam("Team B", "A12");
		await utils.createSubTeam("Team C", "A12");
		await utils.visitA12Team({ pagination: true });

		await expect(page.getByText("Load all 9 nodes")).toBeVisible();
		await commands.loadAllRows(undefined, "A12");
		await expect(page.getByText("Load all 9 nodes")).not.toBeVisible();
	});

	test("tree-node-expander should work properly after deleting node", async ({ page }) => {
		await commands.buttonByDescription(commands.getRow("P4"), "Delete person").click();
		await page.getByRole("button", { name: "Delete" }).click();
		await expect(commands.getRow("P4")).not.toBeVisible();

		await commands.buttonByDescription(commands.getRow("P3"), "Delete person").click();
		await page.getByRole("button", { name: "Delete" }).click();
		await expect(commands.getRow("P3")).not.toBeVisible();

		await commands.buttonByDescription(commands.getRow("Team C"), "Delete team").click();
		await page.getByRole("button", { name: "Delete" }).click();
		await expect(commands.getRow("Team C")).not.toBeVisible();

		await commands.buttonByDescription(commands.getRow("Team B"), "Delete team").click();
		await page.getByRole("button", { name: "Delete" }).click();
		await expect(commands.getRow("Team B")).not.toBeVisible();

		await expect(commands.getRow("UP").locator(Selector.TREE_NODE).getByRole("button")).toBeVisible();
		await expect(commands.getRow("Engines").locator(Selector.TREE_NODE).getByRole("button")).toBeVisible();
	});
});
