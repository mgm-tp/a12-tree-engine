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

import { test } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { cleanDocumentsData, seedData } from "../../../../services-utils/src/index.js";

import { ModelEditorUtils } from "../utils.js";

test.describe("drag and drop nodes with hidden root node and selectParent mode is turned on", () => {
	let utils: ModelEditorUtils;
	let commands: PlaywrightCommands;

	test.beforeEach(async ({ page }) => {
		utils = new ModelEditorUtils(page);
		commands = new PlaywrightCommands(page);

		await cleanDocumentsData({
			showcases: ["model-editor"]
		});
		await seedData({ preset: "model-editor" });
		await utils.navigateToFileExplorer();

		await commands
			.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model with select parent")
			.click();
		await commands.waitUntilLoaded();
	});

	test.describe("Bulk drag and drop a root group containing group nodes", () => {
		test("should work", async () => {
			await utils.addRootGroup("Group1");
			await utils.addGroup("Group2", "Group1", "Insert group");
			await utils.addGroup("Group3", "Group1", "Insert group");
			await utils.addGroup("Group4", "Group1", "Insert group");

			await commands.assertNodeLevel(0, ["Group1"]);
			await commands.assertNodeLevel(1, ["Group4", "Group3", "Group2"]);

			await commands.clickCheckbox(undefined, "Group1");

			await commands.dragDrop("Group3", "Photo", "asChild");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(2, ["Group1"]);
			await commands.assertNodeLevel(3, ["Group4", "Group3", "Group2"]);
		});
	});

	test.describe("Bulk drag and drop root nodes to a root node", () => {
		test("should work", async () => {
			await utils.addRootGroup("Group1");
			await utils.addRootGroup("Group2");
			await utils.addRootGroup("Group3");
			await utils.addRootGroup("Group4");

			await commands.assertNodeLevel(0, ["Group4", "Group3", "Group2", "Group1"]);

			await commands.clickCheckbox(undefined, "Group1");
			await commands.clickCheckbox(undefined, "Group2");
			await commands.clickCheckbox(undefined, "Group3");
			await commands.clickCheckbox(undefined, "Group4");

			await commands.dragDrop("Group3", "Person", "asChild");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(1, ["Group4", "Group3", "Group2", "Group1"]);
		});
	});
});
