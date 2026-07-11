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

/*
This test can be run in both modes: pagination and non-pagination.
Moved to pagination part to reduce testing time.
 */
test.describe("keyboard shortcuts", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;
	const shortcuts = {
		copy: "ControlOrMeta+C",
		paste: "ControlOrMeta+V",
		delete: "Delete",
		select: "Space",
		selectAll: "Shift+Space",
		insertRootGroup: "Alt+G",
		insertAttachmentGroup: "Alt+A",
		insertMultiSelectGroup: "Alt+S",
		insertChild: "ControlOrMeta+Shift+I"
	};

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await cleanDocumentsData({
			showcases: ["model-editor"],
			variant: "pagination"
		});
		await seedData({
			preset: "model-editor",
			variant: "pagination",
			data: "simple"
		});
		await utils.navigateToFileExplorer("Pagination");
	});

	test("should work with various shortcut types", async ({ page }) => {
		// Use node insert action shortcut
		await commands.pressRowShortcut("My Computer", shortcuts.insertChild);
		await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainDrive" }).click();
		await utils.fillDriveForm(["F:", "sa", "sa"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("F:")).toBeVisible();

		// Use node event action shortcut
		await commands.pressRowShortcut("node.exe", shortcuts.delete);
		await expect(page.locator(Selector.DIALOG_MESSAGE)).toContainText("delete this file");
		await commands.clickDialogButton("Delete");
		await commands.waitUntilLoaded();
		await expect(commands.getRow("node.exe")).toHaveCount(0);

		// Use node event action shortcut in context menu
		await commands.pressRowShortcut("java.exe", shortcuts.copy);
		await commands.pressRowShortcut("D:", shortcuts.paste);
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "java.exe")).toHaveCount(2);

		// Use node builtin action shortcut
		await commands.pressRowShortcut("Node", shortcuts.select);
		await commands.assertMultiSelectionState(page, {
			counter: 2,
			overallState: "partlySelected",
			nodeStates: {
				selected: ["Node", "npm.cmd"],
				partlySelected: ["My Computer", "C:", "Program Files"],
				deselected: [/.*/]
			}
		});
		await page.locator(Selector.MULTI_SELECTION_BUTTON).click();

		// Use engine insert action shortcut from virtual root while focusing on a normal row
		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();

		await commands.pressRowShortcut("Gender", shortcuts.insertMultiSelectGroup);
		await expect(page.locator('[data-role="contentbox-title"]').filter({ hasText: "MultiSelectGroup" })).toBeVisible();
		await page.getByRole("button", { name: "Cancel" }).click();
		await commands.waitUntilLoaded();

		// Use engine builtin action shortcut
		await commands.pressRowShortcut("Gender", shortcuts.selectAll);
		await commands.waitUntilLoaded();
		await commands.assertMultiSelectionState(commands.getDataModelerTree(), {
			counter: 11,
			overallState: "selected",
			nodeStates: { selected: [/.*/] },
			hasVirtualRoot: true
		});

		// Use engine event action shortcut while focusing on a row
		await commands.pressRowShortcut("Addresses", shortcuts.delete);
		await expect(page.locator(Selector.DIALOG_MESSAGE)).toContainText("delete all selected nodes");
		await commands.waitUntilLoaded();
		await commands.clickDialogButton("Delete");
		await commands.waitUntilLoaded();
		await expect(page.getByText("Add a new element to the tree")).toBeVisible();

		// Use engine insert action while focusing on a header button in initial view
		const addGroupButton = page.locator(Selector.SUB_HEADER).getByRole("button", { name: "Add group" });
		await addGroupButton.focus();
		await addGroupButton.press(shortcuts.insertAttachmentGroup);
		await commands.waitUntilLoaded();
		await expect(page.locator('[data-role="contentbox-title"]').filter({ hasText: "AttachmentGroup" })).toBeVisible();
	});

	test("should close context menu after pressing", async ({ page }) => {
		await commands.openContextMenu(commands.getRow("autostart.bat"));
		await expect(page.locator(Selector.POPUP_MENU)).toBeVisible();
		await page.locator(Selector.POPUP_MENU).press(shortcuts.copy);
		await expect(page.locator(Selector.POPUP_MENU)).toHaveCount(0);

		await commands.pressRowShortcut("E:", shortcuts.paste);
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "autostart.bat")).toHaveCount(2);
	});

	test("should work with warning toast", async ({ page }) => {
		// Try to copy without any selected nodes should show static custom message
		await page.locator(Selector.MULTI_SELECTION_BUTTON).press("Tab");
		await commands.pressEngineShortcut(shortcuts.copy);
		await commands.assertToastMessage("Please select some nodes before copying");

		// Try to paste to some file at root level should show dynamic custom message
		await commands.clickCheckbox(commands.getRow("npm.cmd"));
		await commands.clickCheckbox(commands.getRow("node.exe"));
		await commands.pressEngineShortcut(shortcuts.copy);
		await commands.pressEngineShortcut(shortcuts.paste);
		await commands.assertToastMessage("2 selected node(s) are not allowed to paste at root level");

		// Try to perform a disabled insert action at engine scope should show the default message
		await commands.clickCheckbox(commands.getRow("npm.cmd"));
		await commands.clickCheckbox(commands.getRow("node.exe"));
		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();
		await commands.clickCheckbox(commands.getRow("Addresses"));
		await page.locator(Selector.TABLE_FOOTER).nth(1).press(shortcuts.insertRootGroup);
		await commands.assertToastMessage("This action cannot be executed.");
	});
});
