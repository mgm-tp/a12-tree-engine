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

import { Selector } from "../selectors.js";

import { A12TeamUtils } from "./utils.js";

test.describe("Button group container responsiveness and element button with hidden label", () => {
	let commands: PlaywrightCommands;
	let utils: A12TeamUtils;
	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
	});

	test.describe("large screen size and button with hidden label on sub-action bar", () => {
		test("should hide the button label in header and footer", async () => {
			await utils.visitA12Team({ custom: true });

			const editButton = commands.buttonByDescription(undefined, "Edit icon button (Alt + E)");
			await expect(editButton.locator(Selector.BUTTON_LABEL)).toHaveCount(0);

			const addButton = commands.buttonByDescription(undefined, "Add a root node");
			await expect(addButton.locator(Selector.BUTTON_LABEL)).toHaveCount(0);
		});
	});

	test.describe("small screen size and button with hidden label on sub-action bar", () => {
		test("should show the button label in popup menu for header and footer", async ({ page }) => {
			await page.setViewportSize({ width: 250, height: 900 });
			await page.goto("");

			await commands.buttonByDescription(undefined, "Open main navigation").click();
			await utils.navigateToA12Team({ custom: true });

			await page.locator(Selector.CONTENT_BOX_HEADER).locator(Selector.POPUP).click();
			await expect(
				page.locator(Selector.POPUP_MENU).locator(Selector.POPUP_ITEM).getByText("Edit icon button")
			).toBeVisible();
		});
	});

	test.describe("small screen size and collapse all, expand all buttons on sub-action bar", () => {
		test("should show the collapse all, expand all buttons in header popup menu along side others button of sub-action bar", async ({
			page
		}) => {
			await page.setViewportSize({ width: 250, height: 900 });
			await page.goto("");
			await commands.buttonByDescription(undefined, "Open main navigation").click();
			await utils.navigateToA12Team();

			await page.locator(Selector.CONTENT_BOX_HEADER).locator(Selector.POPUP).click();
			const popupMenu = page.locator(Selector.POPUP_MENU);
			await expect(popupMenu.locator(Selector.POPUP_ITEM).getByText("Expand All")).toBeVisible();
			await expect(popupMenu.locator(Selector.POPUP_ITEM).getByText("Collapse All")).toBeVisible();
			await expect(popupMenu.locator(Selector.POPUP_ITEM).getByText("Add team")).toBeVisible();
			await expect(popupMenu.locator(Selector.POPUP_ITEM).getByText("Reveal target node")).toBeVisible();
		});
	});

	test.describe("hidden label feature", () => {
		test("when labelHidden is not set, should show contentbox-heading with defined label", async ({ page }) => {
			await utils.visitA12Team();
			await expect(page.locator(Selector.CONTENT_BOX_HEADING).getByText("A12 Teams")).toBeVisible();
		});

		test("when labelHidden is set as true, should not render contentbox-heading", async ({ page }) => {
			await utils.visitA12Team({ custom: true });
			await expect(page.locator(Selector.CONTENT_BOX_HEADING)).toHaveCount(0);
		});
	});
});
