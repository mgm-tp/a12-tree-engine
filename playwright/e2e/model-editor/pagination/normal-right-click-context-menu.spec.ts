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
test.describe("right click context menu", () => {
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
			data: "simple"
		});
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await utils.navigateToFileExplorer("Pagination");

		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();
	});

	test("should display the labels correctly in different types of node", async ({ page }) => {
		const contextMenuItemLabels = {
			// prettier-ignore
			virtualRoot: ["Paste", "Add", "Group", "Attachment Group", "Multi-select Group", "Expansion", "Expand", "Collapse", "Scroll to node", "Reveal target node"],
			// prettier-ignore
			groupNode: ["Paste", "Copy", "Cut", "Remove this group", "Reload", "Add child", "Insert field", "Insert rule", "Insert group", "Insert a child", "Add sibling", "DomainField", "DomainRule", "DomainGroup", "DomainMultiSelectGroup", "DomainAttachmentGroup"],
			// prettier-ignore
			ruleNode: ["Cut", "Remove this field", "Open twin document model", "Mark as target node", "Add", "DomainField", "DomainRule", "DomainGroup", "DomainMultiSelectGroup", "DomainAttachmentGroup"]
		};

		const testLabels = async (labels: string[]) => {
			const items = page.locator(Selector.CONTEXT_MENU_ITEM);
			for (let i = 0; i < labels.length; i++) {
				await expect(items.nth(i)).toContainText(labels[i]);
			}
		};

		const dataModelerTree = commands.getDataModelerTree();
		const virtualRoot = dataModelerTree.locator(Selector.VIRTUAL_ROOT);

		// Virtual node's labels
		await virtualRoot.click({ button: "right", position: { x: 10, y: 10 } });
		await expect(page.locator(Selector.ATTACHED_PORTAL)).toBeVisible();
		await testLabels(contextMenuItemLabels.virtualRoot);

		await page.locator("body").click({ position: { x: 0, y: 0 }, force: true });

		// Group node's labels
		await commands.getRow("Addresses").click({ button: "right", position: { x: 10, y: 10 } });
		await testLabels(contextMenuItemLabels.groupNode);

		await page.locator("body").click({ position: { x: 0, y: 0 }, force: true });

		// Rule node's labels
		await commands.getRow("Street").click({ button: "right", position: { x: 10, y: 10 } });
		await testLabels(contextMenuItemLabels.ruleNode);
	});

	test("should work properly", async ({ page }) => {
		const dataModelerTree = commands.getDataModelerTree();
		const virtualRoot = dataModelerTree.locator(Selector.VIRTUAL_ROOT);

		// Reflect with action disability
		await virtualRoot.click({ button: "right", position: { x: 10, y: 10 } });
		const pasteItem = page.locator(Selector.CONTEXT_MENU_ITEM).nth(0);
		await expect(pasteItem).toHaveClass(/list-item--disabled/);
		await expect(pasteItem).toContainText("Paste");

		await page.locator("body").click({ position: { x: 0, y: 0 }, force: true });
		await expect(dataModelerTree.locator(Selector.ATTACHED_PORTAL)).toHaveCount(0);

		await commands.buttonByDescription(commands.getRow("Addresses"), "Cut", "*").click({ force: true });

		await virtualRoot.click({ button: "right", position: { x: 10, y: 10 } });
		const pasteItem2 = page.locator(Selector.CONTEXT_MENU_ITEM).nth(0);
		await expect(pasteItem2).not.toHaveClass(/list-item--disabled/);
		await expect(pasteItem2).toContainText("Paste");

		// Perform the action properly
		await page.locator(Selector.CONTEXT_MENU_ITEM).nth(3).click();
		await commands.waitUntilLoaded();
		await expect(page.locator('[data-role="contentbox-title"]').filter({ hasText: "AttachmentGroup" })).toBeVisible();
		await expect(dataModelerTree.locator(Selector.ATTACHED_PORTAL)).toHaveCount(0);
	});
});
