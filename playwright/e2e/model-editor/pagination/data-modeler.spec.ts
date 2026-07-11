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

test.describe("data modeler", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeAll(async () => {
		await cleanDocumentsData({
			showcases: ["model-editor"],
			variant: "pagination"
		});
		await seedData({
			preset: "model-editor",
			variant: "pagination",
			data: "multiple-pages"
		});
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await utils.navigateToFileExplorer("Pagination");
		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();
	});

	test.skip("should work with paginated hidden root node", async () => {
		await expect(commands.getRow("RootGroup 18")).not.toBeVisible();
		await commands.loadMoreRows(undefined, "root");
		await expect(commands.getRow("RootGroup 18")).toBeVisible();

		await commands.dragDrop("Basic", "Model", "asChild");
		await commands.waitUntilLoaded();

		await expect(commands.getRow("Basic")).toBeVisible();
		await expect(commands.getRow("RootGroup 18")).toBeVisible();
	});

	test("should add sibling", async ({ page }) => {
		await expect(commands.getRow("FieldA 40")).toBeVisible();

		await commands.openContextMenu(commands.getRow("FieldA 48"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "DomainField" }).click();
		await page.locator('input[id*="Name"]').fill("Additional Field below 48");
		await commands.saveAndAssertRowVisible("Additional Field below 48");

		const dataModelerTree = commands.getDataModelerTree();
		const rows = commands.getRows(dataModelerTree);

		await expect(rows.nth(11)).toContainText("FieldA 48");
		await expect(rows.nth(12)).toContainText("Additional Field below 48");

		await expect(commands.getRow("FieldA 40")).not.toBeVisible();
		await commands.loadMoreRows(undefined, "Group A");
		await expect(commands.getRow("FieldA 40")).toBeVisible();
	});

	test("should be able to scroll to node which is not part of the default paginated list", async ({ page }) => {
		await commands.loadMoreRows(undefined, "Group B");

		await commands.openContextMenu(commands.getRow("FieldB 31"));
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Mark as target node" }).click();

		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("FieldB 31")).toBeVisible();
	});

	test("should copy/paste then add a new sibling and delete a node", async ({ page }) => {
		await commands.loadMoreRows(undefined, "root");

		await commands.clickCheckbox(commands.getRow("RootGroup 1"));
		await commands.clickCheckbox(commands.getRow("RootGroup 10"), true);

		const dataModelerTree = commands.getDataModelerTree();
		await dataModelerTree.getByRole("button", { name: "Copy" }).first().click();

		await commands.getRow("RootGroup 0").click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM, { hasText: "Paste" }).first().click();
		await commands.waitUntilLoaded();

		await commands.getRow("RootGroup 9").click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "DomainField" }).click();
		await page.locator("#a12-Name-field_91a2c").fill("Additional Field below RootGroup 9");
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRow("Additional Field below RootGroup 9")).toBeVisible();
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "RootGroup 0" })).toBeVisible();

		await commands.getRow("RootGroup 8").click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Remove this group" }).click();
		await page.locator(Selector.DIALOG).getByRole("button", { name: "Delete" }).click();
		await commands.waitUntilLoaded();

		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "RootGroup 0" })).not.toBeVisible();
	});
});
