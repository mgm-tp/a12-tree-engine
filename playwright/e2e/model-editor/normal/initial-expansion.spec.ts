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

import { cleanDocumentsData, seedData } from "../../../../services-utils/src";
import { Selector } from "../../selectors";

import { ModelEditorUtils } from "../utils";

test.describe("initial expansion based on file size", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
		await utils.navigateToFileExplorer();
	});

	test("should not expand any level when file size is more than 10000", async ({ page }) => {
		const personJsonRows = commands.getRows(undefined, "Person.json");
		await commands.buttonByDescription(personJsonRows.filter({ hasText: "Form Model" }), "Open form model").click();
		await commands.waitUntilLoaded();

		const dataModelerTree = page.locator(Selector.LAYOUT_PANE).nth(1);

		// Check that nodes are not expanded
		const mainScreenRow = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "Main Screen" });
		await expect(commands.findButton(mainScreenRow, "Expand subitems")).toBeVisible();

		const nextScreenRow = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "Next Screen" });
		await expect(commands.findButton(nextScreenRow, "Expand subitems")).toBeVisible();
	});

	test("should expand first 2 levels when file size from 5000 to 10000", async ({ page }) => {
		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();

		const dataModelerTree = page.locator(Selector.LAYOUT_PANE).nth(1);

		// Check that Person is expanded
		const personRow = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "Person" }).first();
		await expect(commands.findButton(personRow, "Collapse subitems")).toBeVisible();

		// Check that Photo is not expanded
		const photoRow = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "Photo" }).first();
		await expect(commands.findButton(photoRow, "Expand subitems")).toBeVisible();

		// Check that Address is expanded
		const addressRow = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "Address" }).first();
		await expect(commands.findButton(addressRow, "Collapse subitems")).toBeVisible();

		// Check that Basic is expanded
		const basicRow = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "Basic" }).first();
		await expect(commands.findButton(basicRow, "Collapse subitems")).toBeVisible();

		// Add group and fields
		await utils.addGroup("DigitalName", "Basic", "Insert group");
		await utils.addField("Nickname", "DigitalName", "Insert field");
		await utils.addField("Username", "DigitalName", "Insert field");

		// Reopen document model
		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();

		// Check that Person is expanded
		const personRow2 = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "Person" }).first();
		await expect(commands.findButton(personRow2, "Collapse subitems")).toBeVisible();

		// Check that Basic is expanded
		const basicRow2 = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "Basic" }).first();
		await expect(commands.findButton(basicRow2, "Collapse subitems")).toBeVisible();

		// Check that DigitalName is not expanded
		const digitalNameRow = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "DigitalName" }).first();
		await expect(commands.findButton(digitalNameRow, "Expand subitems")).toBeVisible();
	});

	test("should expand all when file size less than 5000", async ({ page }) => {
		await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
		await commands.buttonByDescription(commands.getRow("DomainTeam.json"), "Open document model").click();
		await commands.waitUntilLoaded();

		const dataModelerTree = page.locator(Selector.LAYOUT_PANE).nth(1);

		// Check that Team is expanded
		const teamRow = dataModelerTree.locator(Selector.BODY_ROW).filter({ hasText: "Team" }).first();
		await expect(commands.findButton(teamRow, "Collapse subitems")).toBeVisible();

		// Click on DomainPerson.json
		await commands.getRow("DomainPerson.json").click();
		await commands.waitUntilLoaded();

		// Update the size field
		await page.locator("#a12-Size-field_94519").clear();
		await page.locator("#a12-Size-field_94519").fill("4096");
		await commands.saveAndAssertRowVisible("DomainPerson.json");

		// Open document model
		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();

		// Check that Photo is expanded (because file size is now small)
		const photoRow = commands.getRow("Photo");
		await expect(commands.findButton(photoRow, "Collapse subitems")).toBeVisible();
	});
});
