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

import { cleanDocumentsData } from "../../../services-utils/src";

import { Selector } from "../selectors";

import { A12TeamUtils } from "./utils";

test.describe("basic work flow", () => {
	let utils: A12TeamUtils;
	let commands: PlaywrightCommands;
	test.beforeEach(async ({ page }) => {
		utils = new A12TeamUtils(page);
		commands = new PlaywrightCommands(page);
		await cleanDocumentsData({
			showcases: ["a12-teams"]
		});

		await utils.visitA12Team();
	});

	test("should run properly", async ({ page }) => {
		await expect(page.getByRole("heading", { name: "A12 Teams" })).toBeVisible();

		// Create a basic team structure
		// Add root team A12
		await page.locator("#button-bafda").click();
		await commands.waitUntilLoaded();
		await page.locator("#a12-TeamName-field_c9ad3").fill("A12");
		await page.locator("button").filter({ hasText: "Save" }).click();

		await expect(commands.getRow("A12")).toBeVisible();

		await utils.createSubTeam("Widgets");
		await commands.assertHideArrowButton(["Widgets"]);

		await utils.createSubTeam("Engines");
		await commands.assertHideArrowButton(["Widgets", "Engines"]);

		await utils.createPerson("Alpha", "A12", "Developer");
		await commands.assertHideArrowButton(["Widgets", "Engines", "Alpha"]);
		await expect(commands.getRow("Alpha")).toContainText("Developer");

		await utils.createPerson("Beta");
		await expect(commands.getRow("Beta")).toContainText("Dev");
		await expect(commands.getRow("Alpha")).toContainText("Developer");
		await commands.assertHideArrowButton(["Widgets", "Engines", "Alpha", "Beta"]);

		// Check the default order of newly added links
		await commands.assertRowsVisible(["Beta", "Alpha", "Engines", "Widgets"], 1);

		// Add person Gamma to A12 with link added by relationship engine
		await commands.getRow("A12").locator(utils.getButtonSelector("Insert a child")).click();
		await page
			.locator(Selector.DIALOG_NODE_TITLE)
			.filter({ hasText: /DomainPerson$/ })
			.click();
		await commands.waitUntilLoaded();
		await page.locator("#a12-FirstName-F3").fill("Gamma");
		await page.locator(Selector.LAYOUT_PANE).nth(1).locator(Selector.BODY_ROW).filter({ hasText: "A12" }).click();
		await expect(page.locator("text=Link person with team")).toBeVisible();
		await page.locator("#a12-Position-field_04443").fill("Dev");
		await page.locator("button").filter({ hasText: "OK" }).click();
		await page.locator("button").filter({ hasText: "Save" }).click();
		await expect(commands.getRow("Gamma")).toBeVisible();

		await expect(commands.getRow("Gamma")).toContainText("Dev");
		await expect(commands.getRow("Beta")).toContainText("Dev");
		await expect(commands.getRow("Alpha")).toContainText("Developer");

		await commands.assertHideArrowButton(["Widgets", "Engines", "Alpha", "Beta", "Gamma"]);

		// Link person Alpha to Widgets by standalone relationship engine
		await commands.getRow("Widgets").locator(utils.getButtonSelector("Add link")).click();
		await commands.waitUntilLoaded();
		await page
			.getByLabel("Standalone Relationship Engine")
			// .locator("..")
			.locator(Selector.BODY_ROW)
			.filter({ hasText: "Alpha" })
			.click();
		await expect(page.locator("text=Link person with team")).toBeVisible();
		await page.locator("button").filter({ hasText: "OK" }).click();
		await page.locator("button").filter({ hasText: "Submit" }).click();
		await commands.waitUntilLoaded();
		await commands.assertExpanded("Widgets", false);
		await expect(commands.getRows(undefined, "Alpha")).toHaveCount(1);
		await commands.expandNode("Widgets");
		await expect(commands.getRows(undefined, "Alpha")).toHaveCount(2);

		// Update team Engines with a new name
		await commands.getRow("Engines").click();
		await commands.waitUntilLoaded();
		await commands.assertSelectedRow("Engines");
		await page.locator("#a12-TeamName-field_c9ad3").clear();
		await page.locator("#a12-TeamName-field_c9ad3").fill("Engines & Client");
		await commands.saveAndAssertRowVisible("Engines & Client");

		// Check initial expansion
		await utils.visitA12Team();

		await commands.assertExpanded("A12", true);
		await commands.assertExpanded("Engines & Client", false);
		await commands.assertExpanded("Widgets", false);

		// Delete a team and a person in the tree
		await commands.getRow("Alpha").locator(utils.getButtonSelector("Delete person")).click();
		await page.getByRole("button", { name: "Delete" }).click();
		await expect(commands.getRow("Alpha")).not.toBeVisible();

		await commands.getRow("Widgets").locator(utils.getButtonSelector("Delete team")).click();
		await page.getByRole("button", { name: "Delete" }).click();
		await expect(commands.getRow("Widgets")).not.toBeVisible();

		// Unlink a team from A12
		await commands.getRow("Engines & Client").locator(utils.getButtonSelector("Remove team")).click();
		await page.getByRole("button", { name: "Delete" }).click();
		await commands.assertLevel("Engines & Client", 0);

		// Add person "Sigma" to "A12" with additional fields
		await commands.getRow("A12").locator(utils.getButtonSelector("Insert a child")).click();
		await page
			.locator(Selector.DIALOG_NODE_TITLE)
			.filter({ hasText: /DomainPerson$/ })
			.click();
		await commands.waitUntilLoaded();
		await page.locator("#a12-FirstName-F3").fill("Sigma");

		await page.locator("#a12-DateOfBirth-F7").fill("06/17/2001");
		await page.locator("#a12-JoinedDate-field_c8daf").fill("07/22/2024");
		await page.locator("button").filter({ hasText: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(page.locator("text=Link person with team")).toBeVisible();
		await page.locator("button").filter({ hasText: "OK" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("Sigma")).toBeVisible();
		await expect(commands.getRow("Sigma")).toContainText("06/17/2001");
		await expect(commands.getRow("Sigma")).toContainText("07/22/2024");
	});
});
