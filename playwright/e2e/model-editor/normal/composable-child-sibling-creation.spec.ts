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

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { PlaywrightCommands, test } from "playwright-commands";

import { cleanDocumentsData } from "../../../../services-utils/src/index.js";
import { Selector } from "../../selectors.js";
import { ModelEditorUtils } from "../utils.js";

const DIRECTORY_NAME = "Documents";
const CHILD_FILE_NAME = "DomainPerson";
const SIBLING_FILE_NAME = "DomainSibling";
const CASE_5_FILE_NAME = "DomainCase5Model";
// "Add field" is disabled while a sibling entry is selected, so the field is added via the explicit "Insert field" action.
const INSERT_FIELD_LABEL = "Insert field";

async function proceedPastOptionalNodeTypePicker(page: Page, documentModelLabel: string): Promise<void> {
	const nodeTypePicker = page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: documentModelLabel });
	const nameInput = page.locator("input[id*=Name]");
	await expect(nodeTypePicker.or(nameInput).first()).toBeVisible();
	if (await nodeTypePicker.isVisible()) {
		await nodeTypePicker.click();
	}
}

async function ensureExpanded(commands: PlaywrightCommands, name: string): Promise<void> {
	const expandButton = commands.findButton(name, "Expand subitems");
	if (await expandButton.isVisible()) {
		await expandButton.click({ force: true });
		await commands.waitUntilLoaded();
	}
}

test.describe.serial("composable entry — child and sibling creation (newRelationshipEngine: true)", () => {
	let utils: ModelEditorUtils;
	let commands: PlaywrightCommands;

	test.beforeAll(async ({ invalidateSeed }) => {
		await cleanDocumentsData({
			showcases: ["model-editor"]
		});
		invalidateSeed("model-editor");
	});

	test.beforeEach(async ({ page }) => {
		utils = new ModelEditorUtils(page);
		commands = new PlaywrightCommands(page);

		await page.goto("/composable/");
		await expect(page).toHaveTitle("[Composable] Tree Engine Showcase");
		expect(new URL(page.url()).pathname).toMatch(/\/composable\/$/);

		await page.getByRole("link", { name: "Model Editor" }).click();
		await page.getByRole("link", { name: "File Explorer", exact: true }).click();
		await commands.waitUntilLoaded(undefined, 50000);
	});

	test("creates a child file under a directory", async ({ page }) => {
		await page.locator("#button-ed2312").click();
		await utils.fillNameOwnerGroupForm(["My Computer", "sa", "sa"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("My Computer")).toBeVisible();

		await commands.buttonByDescription(commands.getRow("My Computer"), "Insert a child", "*").click();
		await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainDrive" }).click();
		await utils.fillNameOwnerGroupForm(["C:", "sa", "sa"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("C:")).toBeVisible();

		await commands.buttonByDescription(commands.getRow("C:"), "Insert a directory as child").click();
		await proceedPastOptionalNodeTypePicker(page, "DomainDirectory");
		await utils.fillNameOwnerGroupForm([DIRECTORY_NAME, "sa", "sa"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await ensureExpanded(commands, "C:");
		await expect(commands.getRow(DIRECTORY_NAME)).toBeVisible();

		await commands.buttonByDescription(commands.getRow(DIRECTORY_NAME), "Insert a file as child").click();
		await proceedPastOptionalNodeTypePicker(page, "DomainFile");

		await utils.fillFileForm([CHILD_FILE_NAME, "sa", "sa", "json", "8096"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await ensureExpanded(commands, DIRECTORY_NAME);
		await expect(commands.getRow(CHILD_FILE_NAME)).toBeVisible();
		await expect(page.locator(Selector.TOAST)).toHaveCount(0);
	});

	test("creates a sibling file below an existing file", async ({ page }) => {
		// The showcase only renders "Insert a file above/below" when the row's parent is a
		// DomainDirectory (showcase/src/views/file-explorer-tree-engine.tsx:80-82).
		await expect(commands.buttonByDescription(commands.getRow(CHILD_FILE_NAME), "Insert a file below")).toBeVisible();
		await commands.buttonByDescription(commands.getRow(CHILD_FILE_NAME), "Insert a file below").click();
		await proceedPastOptionalNodeTypePicker(page, "DomainFile");

		await utils.fillFileForm([SIBLING_FILE_NAME, "sa", "sa", "json", "1024"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRow(SIBLING_FILE_NAME)).toBeVisible();
		const referenceLevel = await commands
			.getRow(CHILD_FILE_NAME)
			.locator(Selector.TREE_NODE)
			.getAttribute("data-tree-level");
		if (referenceLevel === null) {
			throw new Error(`Row "${CHILD_FILE_NAME}" is missing a data-tree-level attribute`);
		}
		await commands.assertLevel(SIBLING_FILE_NAME, Number(referenceLevel));
		await expect(page.locator(Selector.TOAST)).toHaveCount(0);
	});

	test("creates a field as a child of a group in the Data Modeler tree (case 5: no relationship-ui reference)", async ({
		page
	}) => {
		await commands.buttonByDescription(commands.getRow(DIRECTORY_NAME), "Insert a file as child").click();
		await proceedPastOptionalNodeTypePicker(page, "DomainFile");
		await utils.fillFileForm([CASE_5_FILE_NAME, "sa", "sa", "json", "512"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await ensureExpanded(commands, DIRECTORY_NAME);
		await expect(commands.getRow(CASE_5_FILE_NAME)).toBeVisible();

		await commands.buttonByDescription(commands.getRow(CASE_5_FILE_NAME), "Open document model").click();
		await commands.waitUntilLoaded();
		await expect(page.getByRole("heading", { name: "Data Modeler" })).toBeVisible();

		const groupName = "Case 5 Group";
		await page.getByRole("button", { name: "Add group" }).click();
		await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainGroup" }).click();
		await commands.waitUntilLoaded();
		await page.locator("input[id*=Name]").fill(groupName);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow(groupName)).toBeVisible();

		const groupLevel = await commands.getRow(groupName).locator(Selector.TREE_NODE).getAttribute("data-tree-level");
		if (groupLevel === null) {
			throw new Error(`Row "${groupName}" is missing a data-tree-level attribute`);
		}

		// DomainGroup's GroupElement has no relationship-ui reference, so this insert exercises the case-5 fallback.
		const fieldName = "Case 5 Field";
		await utils.addField(fieldName, groupName, INSERT_FIELD_LABEL);
		await expect(commands.getRow(fieldName)).toBeVisible();
		await commands.assertLevel(fieldName, Number(groupLevel) + 1);
		await expect(page.locator(Selector.TOAST)).toHaveCount(0);
	});
});
