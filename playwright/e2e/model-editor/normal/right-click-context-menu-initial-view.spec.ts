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

import { cleanDocumentsData } from "../../../../services-utils/src";
import { Selector } from "../../selectors";

import { ModelEditorUtils } from "../utils";

test.describe("right click context menu on initial view on Group Management", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;
	const x = 500;
	const y = 500;

	test.beforeAll(async () => {
		await cleanDocumentsData({
			showcases: ["model-editor"],
			variant: "group-management"
		});
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await utils.navigationGroupManagementSubTab();

		const dataModelerTree = commands.getDataModelerTree();
		const messageElement = dataModelerTree.locator(Selector.MESSAGE);
		await messageElement.click({ button: "right", position: { x, y } });
	});

	test("should display when right-clicking anywhere", async ({ page }) => {
		const contextMenuItems = page.locator(Selector.CONTEXT_MENU_ITEM);

		await expect(contextMenuItems).toHaveCount(4);
		await expect(contextMenuItems.first()).toBeVisible();
	});

	test("should display just one context menu", async ({ page }) => {
		const attachedPortals = page.locator(Selector.ATTACHED_PORTAL);

		await expect(attachedPortals).toHaveCount(1);
	});

	test("should display and close when clicking outside", async ({ page }) => {
		const messageElement = page.locator(Selector.MESSAGE);

		await messageElement.click({ position: { x: x + 1, y: y + 1 } });

		const contextMenuItems = page.locator(Selector.CONTEXT_MENU_ITEM);
		await expect(contextMenuItems).toHaveCount(0);
	});

	test("should display and close when pressing escape", async ({ page }) => {
		await commands.getDataModelerTree().press("Tab");
		await commands.getDataModelerTree().press("Escape");
		const contextMenuItems = page.locator(Selector.CONTEXT_MENU_ITEM);

		await expect(contextMenuItems).toHaveCount(0);
	});

	test("should display and close when clicking an item list", async ({ page }) => {
		await page.locator(Selector.LIST_ITEM).first().click();
		await commands.waitUntilLoaded();

		const contextMenuItems = page.locator(Selector.CONTEXT_MENU_ITEM);
		await expect(contextMenuItems).toHaveCount(0);

		const masterDetailPane = page.locator(Selector.MASTER_DETAIL_LAYOUT_PANE);
		await expect(masterDetailPane).toHaveCount(2);

		const contentBoxTitle = page.locator(Selector.CONTENT_BOX_TITLE);
		await expect(contentBoxTitle.nth(1)).toContainText("Group");
	});
});
