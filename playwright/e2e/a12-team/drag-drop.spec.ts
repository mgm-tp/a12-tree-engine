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


import { test } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { cleanDocumentsData } from "../../../services-utils/src/api.js";

import { A12TeamUtils } from "./utils.js";

test.describe("drag and drop", () => {
	let commands: PlaywrightCommands;
	let utils: A12TeamUtils;
	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		await cleanDocumentsData({ showcases: "a12-teams" });
		await utils.visitA12Team();

		await page.locator("#button-bafda").click();
		await commands.waitUntilLoaded();
		await page.locator("#a12-TeamName-field_c9ad3").fill("A12");
		await page.getByRole("button", { name: "Save" }).click();
	});

	test("should reorder teams", async () => {
		// Setup a team structure
		await utils.createSubTeam("Widgets");
		await utils.createSubTeam("Engines");
		await utils.createSubTeam("Services");

		await commands.assertRowsVisible(["Services", "Engines", "Widgets"], 1);
		await commands.assertHideArrowButton(["Widgets", "Engines", "Services"]);

		// Move Engines to the below of Widgets
		await commands.dragDrop("Engines", "Widgets", "bottom");

		await commands.waitUntilLoaded();
		await commands.assertRowsVisible(["Services", "Widgets", "Engines"], 1);
		await commands.assertHideArrowButton(["Widgets", "Engines", "Services"]);

		// Move Engines to the above of Services.
		await commands.dragDrop("Engines", "Services", "top");

		await commands.waitUntilLoaded();
		await commands.assertRowsVisible(["Engines", "Services", "Widgets"], 1);
		await commands.assertHideArrowButton(["Widgets", "Engines", "Services"]);

		// Move Engines to the above of Widgets by using top area
		await commands.dragDrop("Engines", "Widgets", "top");

		await commands.waitUntilLoaded();
		await commands.assertRowsVisible(["Services", "Engines", "Widgets"], 1);
		await commands.assertHideArrowButton(["Widgets", "Engines", "Services"]);
	});

	test("should reorder people", async () => {
		// Setup a team structure
		await utils.createPerson("Alpha");
		await utils.createPerson("Beta");
		await utils.createPerson("Gamma");
		await utils.createPerson("Delta");

		await commands.assertRowsVisible(["Delta", "Gamma", "Beta", "Alpha"], 1);

		// Move Beta to the above of Delta
		await commands.dragDrop("Beta", "Delta", "top");

		await commands.waitUntilLoaded();
		await commands.assertRowsVisible(["Beta", "Delta", "Gamma", "Alpha"], 1);

		// Move Delta to the below of Alpha
		await commands.dragDrop("Delta", "Alpha", "bottom");
		await commands.waitUntilLoaded();
		await commands.assertRowsVisible(["Beta", "Gamma", "Alpha", "Delta"], 1);

		// Move Gamma to the above of Delta by using top area
		await commands.dragDrop("Gamma", "Delta", "top");
		await commands.waitUntilLoaded();
		await commands.assertRowsVisible(["Beta", "Alpha", "Gamma", "Delta"], 1);
	});

	test("should move a person around", async ({ page }) => {
		await commands.assertHideArrowButton(["A12"]);

		// Setup a team structure
		await utils.createSubTeam("Management");
		await commands.assertHideArrowButton(["Management"]);

		await utils.createSubTeam("Project Management", "Management");
		await utils.createSubTeam("Release Management", "Management");
		await commands.assertHideArrowButton(["Project Management", "Release Management"]);

		await utils.createSubTeam("Engines");
		await commands.assertHideArrowButton(["Project Management", "Release Management", "Engines"]);

		await utils.createPerson("Alpha", "Project Management", "Project Manager");
		await commands.assertHideArrowButton(["Release Management", "Engines", "Alpha"]);

		await utils.createPerson("Beta", "Engines", "Developer");
		await commands.assertHideArrowButton(["Release Management", "Alpha", "Beta"]);

		await commands.assertRowsVisible(
			["Engines", "Beta", "Management", "Release Management", "Project Management", "Alpha"],
			1
		);

		// Make Beta a Release Manager
		await commands.dragDrop("Beta", "Release Management", "asChild");

		await page.getByText("Link person with team").isVisible();
		await page.locator("#a12-Position-field_04443").clear();
		await page.locator("#a12-Position-field_04443").fill("Release manager");
		await page.getByRole("button", { name: "OK" }).click();
		await commands.waitUntilLoaded();

		await commands.assertRowsVisible(
			["Engines", "Management", "Release Management", "Beta", "Project Management", "Alpha"],
			1
		);
		await commands.assertHideArrowButton(["Engines", "Alpha", "Beta"]);

		// Make Beta a Project Manager
		await commands.dragDrop("Beta", "Project Management", "asChild");
		await page.getByText("Link person with team").isVisible();
		await page.locator("#a12-Position-field_04443").clear();
		await page.locator("#a12-Position-field_04443").fill("Project manager");
		await page.getByRole("button", { name: "OK" }).click();
		await commands.waitUntilLoaded();

		await commands.assertRowsVisible(["Project Management", "Beta", "Alpha"], 4);
		await commands.assertHideArrowButton(["Engines", "Release Management", "Alpha", "Beta"]);

		// Move Beta to the below of Alpha
		await commands.dragDrop("Beta", "Alpha", "bottom");
		await page.getByText("Link person with team").isHidden();
		await commands.waitUntilLoaded();

		await commands.assertRowsVisible(["Alpha", "Beta"], 5);
		await commands.assertHideArrowButton(["Engines", "Release Management", "Alpha", "Beta"]);
	});
});
