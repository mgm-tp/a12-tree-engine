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

test.describe("rowActivation: event 'event_toggle_expansion' on DomainDirectory in file-explorer-multi-level-tree", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeAll(async () => {
		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);
		await utils.navigateToFileExplorer("File Explorer - Multi level");
		await commands.waitUntilLoaded();
		const multiSelectBtn = page.locator(Selector.MULTI_SELECTION_BUTTON);
		if (await multiSelectBtn.isVisible()) {
			await multiSelectBtn.click();
		}
	});

	test("clicking a DomainDirectory row should collapse and then re-expand its children", async () => {
		const programFilesRow = commands.getRow("Node");
		await expect(programFilesRow).toBeVisible();
		await expect(commands.getRow("npm.cmd")).toBeVisible();
		await expect(commands.getRow("node.exe")).toBeVisible();

		// Click the row body (not the expand chevron). With rowActivation: event_toggle_expansion,
		// this should fire the same event the chevron does and collapse the node.
		await programFilesRow.locator(Selector.TREE_NODE_NAME).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRow("npm.cmd")).toHaveCount(0);
		await expect(commands.getRow("node.exe")).toHaveCount(0);

		await programFilesRow.locator(Selector.TREE_NODE_NAME).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRow("npm.cmd")).toBeVisible();
		await expect(commands.getRow("node.exe")).toBeVisible();
	});

	test("clicking a DomainDirectory row should not open a detail form", async ({ page }) => {
		const nodeDirRow = commands.getRow("Node");
		await expect(nodeDirRow).toBeVisible();
		await expect(page.locator(Selector.FORM_ENGINE)).toHaveCount(0);

		await nodeDirRow.locator(Selector.TREE_NODE_NAME).click();
		await commands.waitUntilLoaded();

		await expect(page.locator(Selector.FORM_ENGINE)).toHaveCount(0);
	});
});
