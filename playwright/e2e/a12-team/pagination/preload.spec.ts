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

test.describe("tree-node-expander and list child nodes", () => {
	let commands: PlaywrightCommands;
	let utils: A12TeamUtils;
	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
		await utils.visitA12Team({ pagination: true });
	});

	test("list child nodes should display properly after adding new Team", async () => {
		await utils.createSubTeam("Team A", "A12");
		await utils.createSubTeam("Team B", "UP");

		await expect(commands.getRow("UP").locator(Selector.TREE_NODE).getByRole("button")).toBeVisible();
		await expect(commands.getRow("Engines").locator(Selector.TREE_NODE).getByRole("button")).toBeVisible();
	});

	test("list child nodes should display properly after adding new Person", async () => {
		await utils.createPerson("P7", "UP");

		await expect(commands.getRow("P7")).toBeVisible();
	});

	test("tree-node-expander should work properly", async ({ page }) => {
		await utils.createSubTeam("Team B", "UP");
		await page.locator(`${Selector.SUB_HEADER} ${Selector.POPUP}`).click();
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Expand All" }).click();

		await utils.createPerson("P6", "Team B");
		await utils.createPerson("P1", "A12");
		await utils.createPerson("P2", "A12");
		await utils.createPerson("P3", "A12");
		await utils.createPerson("P4", "A12");

		await commands.loadMoreRows(undefined, "A12");
		await commands.assertExpanded("UP", true);
		await commands.assertExpanded("Team B", true);
		await commands.getRow("Engines").scrollIntoViewIfNeeded();
		await commands.assertExpanded("Engines", true);

		await utils.visitA12Team({ pagination: true });
		await utils.createSubTeam("Team C", "UP");
		await expect(commands.getRow("Team C").locator(Selector.TREE_NODE).getByRole("button")).not.toBeVisible();
		await commands.assertExpanded("Team B", false);
	});
});
