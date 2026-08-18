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

import { ModelEditorUtils } from "../utils";

test.describe("model editor - multi level rendering", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeAll(async () => {
		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);
	});

	test("should render multi-level File Explorer and Data Modeler without mutations", async () => {
		// Navigate to the multi-level showcase (read-only assertions only)
		await utils.navigateToFileExplorer("File Explorer - Multi level");

		// Assert File Explorer tree renders expected structure
		await expect(commands.getRow("My Computer")).toBeVisible();
		await expect(commands.getRow("C:")).toBeVisible();
		await expect(commands.getRow("Program Files")).toBeVisible();
		await expect(commands.getRow("DomainPerson.json")).toBeVisible();
		await expect(commands.getRow("DomainTeam.json")).toBeVisible();
		await expect(commands.getRow("Node")).toBeVisible();
		await expect(commands.getRow("Java")).toBeVisible();

		// Check non-expandable nodes (leaf nodes without expand button)
		const nodeExeRow = commands.getRow("node.exe");
		await expect(nodeExeRow).toBeVisible();
		await expect(nodeExeRow.locator('[data-role="tree-node-expander"]')).toHaveCount(0);

		const javaExeRow = commands.getRow("java.exe");
		await expect(javaExeRow).toBeVisible();
		await expect(javaExeRow.locator('[data-role="tree-node-expander"]')).toHaveCount(0);

		const javawsExeRow = commands.getRow("javaws.exe");
		await expect(javawsExeRow).toBeVisible();
		await expect(javawsExeRow.locator('[data-role="tree-node-expander"]')).toHaveCount(0);

		await expect(commands.getRow("D:")).toBeVisible();

		const autostartBatRow = commands.getRow("autostart.bat");
		await expect(autostartBatRow).toBeVisible();
		await expect(autostartBatRow.locator('[data-role="tree-node-expander"]')).toHaveCount(0);

		await expect(commands.getRow("E:")).toBeVisible();

		const nodeExeRows = commands.getRows(undefined, "node.exe");
		await expect(nodeExeRows.last()).toBeVisible();
		await expect(nodeExeRows.last().locator('[data-role="tree-node-expander"]')).toHaveCount(0);

		// Open DomainPerson document model (render-only)
		await commands
			.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model with multi level")
			.click();
		await commands.waitUntilLoaded();

		// Assert Data Modeler tree renders expected top-level groups and initial expansion
		const personRow = commands.getRow("Person");
		await expect(commands.findButton(personRow, "Collapse subitems")).toBeVisible();

		const photoRow = commands.getRow("Photo");
		await expect(photoRow).toBeVisible();
		await expect(commands.findButton(photoRow, "Expand subitems")).toBeVisible();

		const addressRow = commands.getRow("Addresses");
		await expect(addressRow).toBeVisible();
		await expect(commands.findButton(addressRow, "Expand subitems")).toBeVisible();

		const basicRow = commands.getRow("Basic");
		await expect(basicRow).toBeVisible();
		await expect(commands.findButton(basicRow, "Expand subitems")).toBeVisible();
	});
});
