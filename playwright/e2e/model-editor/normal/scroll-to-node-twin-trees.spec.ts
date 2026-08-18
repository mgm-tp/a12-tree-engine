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

import { cleanDocumentsData, seedData } from "../../../../services-utils/src";
import { Selector } from "../../selectors";

import { ModelEditorUtils } from "../utils";

test.describe("scroll to node - twin trees", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.use({ viewport: { width: 1280, height: 480 } });

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);
		await cleanDocumentsData({
			showcases: ["model-editor"],
			variant: "group-management"
		});
		await seedData({
			preset: "model-editor",
			variant: "group-management"
		});
		await utils.navigationGroupManagementSubTab();
		await commands.buttonByDescription(commands.getRow("Name"), "Open twin document model").click();
		await commands.waitUntilLoaded();
	});

	test("should scroll to target when 'reveal target' is clicked", async ({ page }) => {
		const twinDataModelerTree = page.locator(Selector.TWIN_DATA_MODELER_TREE_CONTAINER);
		const twinGenderRow = commands.getRows(twinDataModelerTree, "Gender").first();

		// Scroll the Gender row into view in the twin tree
		await twinGenderRow.scrollIntoViewIfNeeded();

		// Mark Gender as target node
		await commands.openContextMenu(twinGenderRow);
		await page.locator(Selector.POPUP_MENU).getByText("Mark as target node").click();

		// Scroll to top so Gender is not visible
		await twinDataModelerTree.locator(".table__content").evaluate((el) => el.scrollTo({ top: 0 }));
		await expect(twinGenderRow).not.toBeInViewport();

		// Click on reveal-target button
		await commands.openContextMenu(commands.getRows(twinDataModelerTree).first());
		await page.locator(Selector.POPUP_MENU).getByText("Reveal target node").click();
		await expect(twinGenderRow).toBeVisible();
	});
});
