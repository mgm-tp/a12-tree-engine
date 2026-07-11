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

import { cleanDocumentsData } from "../../../../services-utils/src/index.js";
import { Selector } from "../../selectors.js";

import { ModelEditorUtils } from "../utils.js";

// These tests should be run step by step. Don't change their orders.
test.describe("basic work flow", () => {
	let utils: ModelEditorUtils;
	let commands: PlaywrightCommands;

	test.beforeAll(async () => {
		await cleanDocumentsData({
			showcases: ["model-editor"]
		});
	});

	test.beforeEach(async ({ page }) => {
		utils = new ModelEditorUtils(page);
		commands = new PlaywrightCommands(page);
		await utils.navigateToFileExplorer();
	});

	test("should work properly", async ({ page }) => {
		await expect(page.locator("text=File Explorer")).toBeVisible();

		// Setup a basic file explorer tree
		// Create a computer
		await page.locator("#button-ed2312").click();
		await utils.fillComputerForm(["My Computer", "sa", "sa"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("My Computer")).toBeVisible();

		// Add drive C: to My Computer
		await commands.buttonByDescription(commands.getRow("My Computer"), "Insert a child", "*").click();
		await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainDrive" }).click();
		await utils.fillDriveForm(["C:", "sa", "sa"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("C:")).toBeVisible();

		// Add a document model DomainPerson.json to drive C:
		await commands.buttonByDescription(commands.getRow("C:"), "Insert a child", "*").click();
		await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainFile" }).click();
		await utils.fillFileForm(["DomainPerson", "sa", "sa", "json", "8096"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("DomainPerson")).toBeVisible();

		// Add another document model DomainTeam.json to drive C:
		await commands.buttonByDescription(commands.getRow("C:"), "Insert a child", "*").click();
		await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainFile" }).click();
		await utils.fillFileForm(["DomainTeam", "sa", "sa", "json", "2496"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("DomainTeam")).toBeVisible();

		// Create groups and fields for document model DomainPerson
		await commands.buttonByDescription(commands.getRow("DomainPerson"), "Open document model").click();
		await commands.waitUntilLoaded();
		await expect(page.getByRole("heading", { name: "Data Modeler" })).toBeVisible();

		// Check HeterogeneousInsertRootNodeDialog
		await page.getByRole("button", { name: "Add group" }).click();
		await expect(page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainGroup" })).toBeVisible();
		await expect(page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainAttachmentGroup" })).toBeVisible();
		await expect(page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainMultiSelectGroup" })).toBeVisible();

		// Create a root group of the document model
		const rootGroupName = "Basic Information";
		await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainGroup" }).click();
		await commands.waitUntilLoaded();
		await page.locator("input[id*=Name]").fill(rootGroupName);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow(rootGroupName)).toBeVisible();

		// Add a attachment group to the root group
		await commands.clickOnPopUpMenu(rootGroupName, "Insert a child");
		await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainAttachmentGroup" }).click();
		await commands.waitUntilLoaded();
		await page.locator("input[id*=Name]").fill("Image");
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("Image")).toBeVisible();

		// Check HeterogeneousInsertChildNodeDialog
		await commands.clickOnPopUpMenu(rootGroupName, "Insert a child");
		await expect(page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainAttachmentGroup" })).toBeVisible();
		await expect(page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainMultiSelectGroup" })).toBeVisible();
		await expect(page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainField" })).toBeVisible();
		await expect(page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainRule" })).toBeVisible();

		// Add a field into created group
		await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainField" }).click();
		await commands.waitUntilLoaded();
		const fullNameField = "Full Name";
		await page.locator("input[id*=Name]").fill(fullNameField);
		await page.locator("select[id*=Required]").selectOption("yes");
		await page.locator("select[id*=Global]").selectOption("yes");
		await page.locator("select[id*=Transient]").selectOption("yes");
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow(fullNameField)).toBeVisible();

		// Make Image Group as root
		const virtualRoot = page.locator(Selector.VIRTUAL_ROOT);
		await commands.dragDropWithLocator(commands.getRow("Image"), virtualRoot, "asChild");
		await commands.waitUntilLoaded();

		// Try to make Full Name Field as root
		await commands.dragDropWithLocator(commands.getRow(fullNameField), virtualRoot, "asChild");
		await expect(page.locator(Selector.DIALOG)).not.toBeVisible();

		await commands.assertNodeLevel(0, [rootGroupName, "Image"]);
		await commands.assertNodeLevel(1, [fullNameField]);

		// Re-order root nodes is possible
		const dataModelerTree = commands.getDataModelerTree();
		const treeRows = dataModelerTree.locator(Selector.BODY_ROW);
		await expect(treeRows.nth(1)).toContainText(rootGroupName);
		await expect(treeRows.nth(3)).toContainText("Image");

		const rootGroupRow = commands.getRow(rootGroupName);
		const imageRowForMove = commands.getRow("Image");
		await commands.dragDropWithLocator(rootGroupRow, imageRowForMove, "bottom");
		await commands.waitUntilLoaded();

		await expect(treeRows.nth(1)).toContainText("Image");
		await expect(treeRows.nth(2)).toContainText(rootGroupName);

		// Make sure there is no duplicated groups or fields between DomainPerson and DomainTeam
		await commands.buttonByDescription(commands.getRow("DomainPerson"), "Open document model").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow(rootGroupName)).toBeVisible();
		await expect(commands.getRow("Image")).toBeVisible();

		await commands.buttonByDescription(commands.getRow("DomainTeam"), "Open document model").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow(rootGroupName)).not.toBeVisible();
		await expect(commands.getRow("Image")).not.toBeVisible();

		// Check initial expansion of data modeller tree
		await commands.buttonByDescription(commands.getRow("DomainPerson"), "Open document model").click({ force: true });
		await commands.waitUntilLoaded();
		await commands.assertExpanded(rootGroupName, true);
		await commands.assertExpanded("Image", false);

		// Check if fullNameField has expander button (fields might not be expandable)
		const fullNameRowCheck = commands.getRow(fullNameField);
		const expanderCount = await fullNameRowCheck.locator('[data-role="tree-node-expander"]').count();
		if (expanderCount > 0) {
			await commands.assertExpanded(fullNameField, false);
		}

		// Check disability of hidden root node when add sibling
		await commands.clickPopUpMenu(rootGroupName);
		for (const modelName of ["DomainGroup", "DomainMultiSelectGroup", "DomainAttachmentGroup"]) {
			await expect(page.locator(Selector.POPUP_MENU).getByRole("button", { name: modelName })).toBeVisible();
		}
		for (const modelName of ["DomainField", "DomainRule"]) {
			// Assert disabled
			await expect(
				page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM, { hasText: modelName })
			).toContainClass("list-item--disabled");
		}
		await commands.clickPopUpMenu(rootGroupName);

		// Add sibling for hidden root node
		await utils.addGroup("root group above", rootGroupName);
		await commands.assertNodeLevel(0, [rootGroupName, "Image", "root group above"]);

		// Check disability of Full Name when add sibling
		await commands.clickPopUpMenu(fullNameField);
		for (const modelName of [
			"DomainGroup",
			"DomainMultiSelectGroup",
			"DomainAttachmentGroup",
			"DomainField",
			"DomainRule"
		]) {
			await expect(page.locator(Selector.POPUP_MENU).getByRole("button", { name: modelName })).toBeVisible();
		}
		await commands.clickPopUpMenu(fullNameField);

		// Add siblings for Full Name
		await utils.addField("field below", fullNameField);
		await utils.addRule("rule below", fullNameField, "a12-Name-field_91a2c", "11", "false");
		await utils.addGroup("group below", fullNameField);
		await utils.addMultiSelectGroup("multiselect below", fullNameField);
		await utils.addAttachmentGroup("attachment below", fullNameField);

		await commands.assertNodeLevel(0, ["root group above", rootGroupName, "Image"]);
		await commands.assertNodeLevel(1, [
			"Full Name",
			"attachment below",
			"multiselect below",
			"group below",
			"rule below",
			"field below"
		]);

		// Add sibling for rule below using shortcut

		await commands.pressRowShortcut("rule below", "ControlOrMeta+Shift+S");
		await expect(page.locator('[data-role="contentbox-title"]').filter({ hasText: "Rule" })).toBeVisible();
	});
});
