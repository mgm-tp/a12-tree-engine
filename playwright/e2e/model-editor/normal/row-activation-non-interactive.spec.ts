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

test.describe("rowActivation: non_interactive on DomainFile in file-explorer-multiselect-parent-tree", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeAll(async () => {
		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor", variant: "pagination", data: "multiple-pages" });
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);
		await utils.navigateToFileExplorer("MultiSelect Parent");
		await commands.waitUntilLoaded();
		const multiSelectBtn = page.locator(Selector.MULTI_SELECTION_BUTTON);
		if (await multiSelectBtn.isVisible()) {
			await multiSelectBtn.click();
		}
	});

	test("DomainFile row should be marked non-interactive in DOM", async () => {
		const fileRow = commands.getRow("Java 49");
		await expect(fileRow).toBeVisible();
		// Non-interactive rows have tabindex="-1" so they're skipped in keyboard tab order.
		await expect(fileRow).toHaveAttribute("tabindex", "-1");
	});

	test("clicking DomainFile row should not open any detail form", async ({ page }) => {
		const fileRow = commands.getRow("Java 49");
		await expect(fileRow).toBeVisible();
		await expect(page.locator(Selector.FORM_ENGINE)).toHaveCount(0);

		// Click on the row body (not on any action button).
		await fileRow.locator(Selector.TREE_NODE_NAME).click();

		await expect(page.locator(Selector.FORM_ENGINE)).toHaveCount(0);
	});

	test("DomainDrive row (interactive) should remain clickable", async () => {
		const driveRow = commands.getRow("C:");
		await expect(driveRow).toBeVisible();
		// Interactive rows have tabindex="0" and are reachable via keyboard tab order.
		await expect(driveRow).toHaveAttribute("tabindex", "0");
	});
});
