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

import { cleanDocumentsData, seedData } from "../../../../services-utils/src/api.js";
import { Selector } from "../../selectors.js";

import { ModelEditorUtils } from "../utils.js";

test.describe("circular relationship and node with different levels", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "circular-nodes" });
		await utils.navigateToFileExplorer();
	});

	test("should work", async ({ page }) => {
		// Warning tooltip should be displayed in the first looped node and that branch stop being expanded
		const programFilesRows = commands.getRows(undefined, "Program Files");
		await expect(programFilesRows).toHaveCount(2);

		// First Program Files at level 2
		const programFilesRow0 = programFilesRows.nth(0);
		await commands.assertLevelWithLocator(programFilesRow0, 2);

		// Second Program Files at level 4 and not expanded
		const programFilesRow1 = programFilesRows.nth(1);
		await commands.assertLevelWithLocator(programFilesRow1, 4);
		// Check that the expand button exists (which means it's not expanded)
		await commands.assertExpandedWithLocator(programFilesRow1, false);

		// Tooltip should be visible
		await expect(programFilesRow1.locator('[data-role="tooltip"]').first()).toBeVisible();

		// A node appears in different level should be expanded
		const nodeRows = commands.getRows(undefined, "Node");
		await expect(nodeRows).toHaveCount(2);

		// First Node at level 4 and expanded
		const nodeRow0 = nodeRows.nth(0);
		await commands.assertLevelWithLocator(nodeRow0, 4);
		await commands.assertExpandedWithLocator(nodeRow0, true);
		// Second Node at level 2 and expanded
		const nodeRow1 = nodeRows.nth(1);
		await commands.assertLevelWithLocator(nodeRow1, 2);
		await commands.assertExpandedWithLocator(nodeRow1, true);
		// Should not be able to click on circular node
		await expect(programFilesRow1.locator('[data-role="tooltip"]').first()).toBeVisible();
		await programFilesRow1.click();

		// Verify no selection (all deselected)
		const counter = page.locator(Selector.COUNTER);
		await expect(counter).toContainText("0");

		const headerCheckbox = page.getByRole("columnheader", { name: "Action" }).first().getByRole("checkbox");
		await expect(headerCheckbox).not.toBeChecked();

		// Should not be able to drop on a circular node
		const javaExeRows = commands.getRows(undefined, "java.exe");
		const javaExeRow0 = javaExeRows.nth(0);
		await commands.assertLevelWithLocator(javaExeRow0, 5);

		// Try to drag java.exe to circular Program Files node
		await commands.dragDropWithLocator(javaExeRow0, programFilesRow1, "asChild");
		await commands.waitUntilLoaded();

		// Verify java.exe is still at level 5 (drag didn't work)
		await commands.assertLevelWithLocator(javaExeRow0, 5);

		// Should not be able to drag a circular node
		await expect(programFilesRow1.locator('[data-role="tooltip"]').first()).toBeVisible();

		// Try to drag circular Program Files to D:
		await commands.dragDropWithLocator(programFilesRow1, commands.getRow("D:"), "asChild");
		await commands.waitUntilLoaded();

		// The operation should not succeed - Program Files should still be at level 4
		await commands.assertLevelWithLocator(programFilesRow1, 4);
	});
});
