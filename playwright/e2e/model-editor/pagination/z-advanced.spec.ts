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

test.describe("advanced tests", () => {
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
			data: "multiple-pages"
		});
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await utils.navigateToFileExplorer("Pagination");
	});

	test("should dnd within the same parent", async () => {
		const javaChildRows = commands.getChildNodeRows(undefined, "Java");

		await expect(javaChildRows.nth(1)).toContainText("Java 48");

		await commands.dragDrop("Java 48", "Java 45", "bottom");
		await commands.waitUntilLoaded();

		const javaChildRows2 = commands.getChildNodeRows(undefined, "Java");
		await expect(javaChildRows2).toHaveCount(10);
		await expect(javaChildRows2.nth(1)).not.toContainText("Java 48");
		await expect(javaChildRows2.nth(4)).toContainText("Java 48");

		await commands.dragDrop("Java 48", "Java 47", "top");
		await commands.waitUntilLoaded();

		const javaChildRows3 = commands.getChildNodeRows(undefined, "Java");
		await expect(javaChildRows3).toHaveCount(10);
		await expect(javaChildRows3.nth(4)).not.toContainText("Java 48");
		await expect(javaChildRows3.nth(1)).toContainText("Java 48");
	});

	test.describe("node count should be update after inserting a file to a folder", () => {
		test("node count should be updated", async ({ page }) => {
			await expect(page.getByText("Load all 62 nodes")).toBeVisible();

			// Add a document model DomainPerson.json to Directory Node
			await commands.buttonByDescription(commands.getRow("Node"), "Insert a child", "*").click();
			await page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainFile" }).click();
			await utils.fillFileForm(["DomainPerson", "sa", "sa", "json", "8096"]);
			await page.getByRole("button", { name: "Save" }).click();
			await commands.waitUntilLoaded();

			await expect(page.getByText("Load all 63 nodes")).toBeVisible();
		});
	});
});
