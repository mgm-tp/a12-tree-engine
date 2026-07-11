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

import { cleanDocumentsData, seedData } from "../../../services-utils/src/api.js";

import { Selector } from "../selectors.js";

import { A12TeamUtils } from "./utils.js";

test.describe("readonly mode", () => {
	test.beforeAll(async () => {
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
	});

	test("should run properly", async ({ page }) => {
		const commands = new PlaywrightCommands(page);
		const utils = new A12TeamUtils(page);
		await utils.visitA12Team();

		await page.locator(`[data-role="application-header"] [data-role="popup-trigger-element"]`).click();
		await page.locator(".popup-menu").locator(Selector.LIST_ITEM).getByText("Readonly").click();

		await page.locator(`${Selector.SUB_HEADER} ${Selector.POPUP}`).first().click();
		await page.locator(Selector.LIST_ITEM).getByText("Expand All").click();

		await expect(page.locator(Selector.BUTTON).getByText("Add team").locator("..")).toBeDisabled();
		await expect(page.locator(Selector.BUTTON).getByText("Reveal target node").locator("..")).toBeDisabled();

		await page.locator(`${Selector.SUB_HEADER} ${Selector.MULTI_SELECTION_BUTTON}`).first().click();
		await expect(page.locator(Selector.BUTTON, { hasText: "Share" })).toBeDisabled();

		const checkboxes = page.locator(`button${Selector.CHECKBOX_INPUT}`);
		const checkboxCount = await checkboxes.count();
		for (let i = 0; i < checkboxCount; i++) {
			await expect(checkboxes.nth(i)).toBeDisabled();
		}

		await commands.getRow("A12").click();
		await expect(page.locator(Selector.FORM_ENGINE)).toHaveCount(0);

		const rows = commands.getRows();
		const rowCount = await rows.count();
		for (let i = 0; i < rowCount; i++) {
			const buttons = rows.nth(i).locator(`[data-role="button-group"] > button`);
			const buttonCount = await buttons.count();
			for (let j = 0; j < buttonCount; j++) {
				await expect(buttons.nth(j)).toBeDisabled();
			}
		}

		await commands.clickPopUpMenu("A12");
		await expect(page.locator(Selector.LIST_ITEM).getByText("Expand All")).toBeVisible();
		await page.locator(Selector.LIST_ITEM).getByText("Collapse All").click();

		await commands.getRow("A12").click({ button: "right" });
		const contextMenuItems = page.locator(Selector.CONTEXT_MENU_ITEM);
		const itemCount = await contextMenuItems.count();

		for (let i = 0; i < itemCount; i++) {
			const item = contextMenuItems.nth(i);
			if (i === 6) {
				await expect(item).not.toHaveClass(/list-item--readonly/);
				await expect(item).toContainText("Expand All");
			} else if (i === 7) {
				await expect(item).not.toHaveClass(/list-item--readonly/);
				await expect(item).toContainText("Collapse All");
			} else {
				await expect(item).toHaveClass(/list-item--readonly/);
			}
		}
	});
});
