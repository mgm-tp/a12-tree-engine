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

const EXPANDER = '[data-role="tree-node-expander"]';

test.describe("Copy recursively and paste as sibling with preloaded child nodes", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
		await utils.navigateToFileExplorer("File Explorer With Preload ChildNodes");
	});

	test("Above", async ({ page }) => {
		await commands.expandNode("My Computer");
		await commands.expandNode("C:");

		const programFilesRows = commands.getRows(undefined, "Program Files");
		await expect(programFilesRows).toHaveCount(1);
		await expect(programFilesRows.first().locator(EXPANDER)).toBeVisible();

		await commands.openContextMenu(commands.getRow("Program Files"));
		await page.locator(Selector.POPUP_MENU).getByText("Copy recursively", { exact: true }).click();

		await commands.openContextMenu(commands.getRow("Program Files"));
		const pasteAboveItem = page.locator(Selector.POPUP_MENU).getByText("Paste Above", { exact: true });
		await expect(pasteAboveItem).not.toBeDisabled();
		await pasteAboveItem.click();
		await commands.waitUntilLoaded();

		// The pasted copy must show its children immediately, without a page reload
		await expect(programFilesRows).toHaveCount(2);
		await expect(programFilesRows.nth(0).locator(EXPANDER)).toBeVisible();
		await expect(programFilesRows.nth(1).locator(EXPANDER)).toBeVisible();

		await commands.expandNodeWithLocator(programFilesRows.nth(0));
		await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
		await expect(commands.getRows(undefined, "Node")).toHaveCount(1);

		// The copied children are preloaded as well, so their own expanders are visible
		await expect(commands.getRow("Java").locator(EXPANDER)).toBeVisible();
		await expect(commands.getRow("Node").locator(EXPANDER)).toBeVisible();
	});

	test("Below", async ({ page }) => {
		await commands.expandNode("My Computer");
		await commands.expandNode("C:");

		const programFilesRows = commands.getRows(undefined, "Program Files");
		await expect(programFilesRows).toHaveCount(1);
		await expect(programFilesRows.first().locator(EXPANDER)).toBeVisible();

		await commands.openContextMenu(commands.getRow("Program Files"));
		await page.locator(Selector.POPUP_MENU).getByText("Copy recursively", { exact: true }).click();

		await commands.openContextMenu(commands.getRow("Program Files"));
		const pasteBelowItem = page.locator(Selector.POPUP_MENU).getByText("Paste Below", { exact: true });
		await expect(pasteBelowItem).not.toBeDisabled();
		await pasteBelowItem.click();
		await commands.waitUntilLoaded();

		// The pasted copy must show its children immediately, without a page reload
		await expect(programFilesRows).toHaveCount(2);
		await expect(programFilesRows.nth(0).locator(EXPANDER)).toBeVisible();
		await expect(programFilesRows.nth(1).locator(EXPANDER)).toBeVisible();

		await commands.expandNodeWithLocator(programFilesRows.nth(1));
		await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
		await expect(commands.getRows(undefined, "Node")).toHaveCount(1);

		// The copied children are preloaded as well, so their own expanders are visible
		await expect(commands.getRow("Java").locator(EXPANDER)).toBeVisible();
		await expect(commands.getRow("Node").locator(EXPANDER)).toBeVisible();
	});
});
