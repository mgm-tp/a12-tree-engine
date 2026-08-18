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

test.describe("preload", () => {
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

		// Add sub team Widgets to A12
		await commands.buttonByDescription(commands.getRow("A12"), "Insert a child").click();
		await page.locator(Selector.DIALOG_NODE_TITLE).getByText("DomainTeam").click();
		await commands.waitUntilLoaded();
		await page.locator("#a12-TeamName-field_c9ad3").fill("Widgets");
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRow("A12").locator(`[data-role="tree-node-expander"]`)).toBeVisible();
		await expect(commands.getRow("Widgets").locator(`[data-role="tree-node-expander"]`)).toHaveCount(0);

		// Add person Beta to Widgets
		await commands.buttonByDescription(commands.getRow("Widgets"), "Insert a child").click();
		await page
			.locator(Selector.DIALOG_NODE_TITLE)
			.getByText(/DomainPerson$/)
			.click();
		await commands.waitUntilLoaded();
		await page.locator("#a12-FirstName-F3").fill("Beta");
		await page.getByRole("button", { name: "Save" }).click();
		await expect(page.getByText("Link person with team")).toBeVisible();
		await page.locator("#a12-Position-field_04443").fill("Dev");
		await page.getByRole("button", { name: "OK" }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRow("Widgets").locator(`[data-role="tree-node-expander"]`)).toBeVisible();
		await expect(commands.getRow("Beta").locator(`[data-role="tree-node-expander"]`)).toHaveCount(0);

		await commands.buttonByDescription(commands.getRow("Beta"), "Delete person").click();
		await page.getByRole("button", { name: "Delete" }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRow("Widgets").locator(`[data-role="tree-node-expander"]`)).toHaveCount(0);
		await expect(commands.getRow("Beta")).toHaveCount(0);

		// Move UP under Widgets
		await commands.dragDrop("UP", "Widgets", "asChild");
		await commands.waitUntilLoaded();

		await expect(commands.getRow("Widgets").locator(`[data-role="tree-node-expander"]`)).toBeVisible();

		// Move UP back under A12
		await commands.dragDrop("UP", "A12", "asChild");
		await commands.waitUntilLoaded();

		await expect(commands.getRow("Widgets").locator(`[data-role="tree-node-expander"]`)).toHaveCount(0);
	});

	test("should work with scroll to node", async ({ page }) => {
		await utils.visitA12Team();

		await utils.createSubTeam("Team A", "UP");
		await utils.createSubTeam("Team B", "UP");
		await utils.createPerson("John", "Team B");
		await utils.createSubTeam("Team C", "UP");
		await utils.createSubTeam("Team D", "Team C");
		await utils.createSubTeam("Team E", "Team C");

		await commands.buttonByDescription(commands.getRow("Team D"), "Mark as target node").click();

		await utils.visitA12Team();
		await commands.waitUntilLoaded();

		await page.getByText("Reveal target node").click();
		await commands.waitUntilLoaded();

		await commands.assertExpanded("Engines", false);
		await expect(commands.getRow("Team A").locator(Selector.TREE_NODE).getByRole("button")).not.toBeVisible();
		await commands.assertExpanded("Team B", false);
		await commands.assertExpanded("Team C", true);
		await expect(commands.getRow("Team D").locator(Selector.TREE_NODE).getByRole("button")).not.toBeVisible();
		await expect(commands.getRow("Team E").locator(Selector.TREE_NODE).getByRole("button")).not.toBeVisible();
	});
});
