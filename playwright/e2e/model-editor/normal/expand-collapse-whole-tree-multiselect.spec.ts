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

import { cleanDocumentsData, seedData } from "../../../../services-utils/src/index.js";
import { Selector } from "../../selectors.js";

import { ModelEditorUtils } from "../utils.js";

test.describe("expand/collapse whole tree during multi-selection", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeAll(async () => {
		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await utils.navigateToFileExplorer();
		await commands
			.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model (stretch mode)")
			.click();
		await commands.waitUntilLoaded();
	});

	test("should expand the whole tree when multi-selection is active", async ({ page }) => {
		const photoRow = page.locator(Selector.BODY_ROW).filter({ hasText: "Photo" }).first();
		await expect(commands.findButton(photoRow, "Expand subitems")).toBeVisible();

		await commands.clickCheckbox(undefined, "Basic");

		await page.locator(Selector.VIRTUAL_ROOT).click({ button: "right" });

		// Click "Expand" from the expand/collapse context menu group
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Expand" }).click();
		await commands.waitUntilLoaded();

		await expect(commands.findButton(photoRow, "Collapse subitems")).toBeVisible();
	});

	test("should collapse the whole tree when multi-selection is active", async ({ page }) => {
		await commands.expandNode("Photo");

		const personRow = page.locator(Selector.BODY_ROW).filter({ hasText: "Person" }).first();
		await expect(commands.findButton(personRow, "Collapse subitems")).toBeVisible();

		await commands.clickCheckbox(undefined, "Basic");

		await page.locator(Selector.VIRTUAL_ROOT).click({ button: "right" });

		// Click "Collapse" from the expand/collapse context menu group
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Collapse" }).click();

		await expect(commands.findButton(personRow, "Expand subitems")).toBeVisible();
	});
});
