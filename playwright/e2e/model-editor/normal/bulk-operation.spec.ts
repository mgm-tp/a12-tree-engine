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

test.describe("bulk operations", () => {
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
	});

	test.describe("bulk dnd", () => {
		test("should work", async () => {
			// DnD both files & directories
			await commands.clickCheckbox(undefined, "npm.cmd");
			await commands.clickCheckbox(undefined, "node.exe");
			await commands.clickCheckbox(undefined, "autostart.bat");
			await commands.clickCheckbox(undefined, "Java");

			await commands.dragDrop("Java", "E:", "asChild");
			await commands.waitUntilLoaded();

			await commands.assertNodeLevel(2, [
				"Java",
				"DomainTeam.json",
				"Person.json",
				"DomainPerson.json",
				"npm.cmd",
				"node.exe",
				"autostart.bat"
			]);
			await commands.assertNodeLevel(3, ["javaws.exe", "java.exe"]);

			// DnD should keep the order correctly
			await commands.clickCheckbox(undefined, "Person.json");
			await commands.clickCheckbox(undefined, "DomainPerson.json");

			await commands.dragDrop("Person.json", "D:", "asChild");

			await commands.assertNodeLevel(2, ["Person.json", "DomainPerson.json"]);

			await commands.clickCheckbox(undefined, "java.exe");
			await commands.clickCheckbox(undefined, "javaws.exe");

			await commands.dragDrop("java.exe", "DomainPerson.json", "bottom");

			await commands.assertNodeLevel(2, ["Person.json", "DomainPerson.json", "javaws.exe", "java.exe"]);
		});
	});

	test.describe("bulk delete operation", () => {
		test("should delete the selected nodes", async ({ page }) => {
			await commands
				.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model (stretch mode)")
				.click();
			await commands.waitUntilLoaded();
			await expect(page.locator(Selector.LAYOUT_PANE).filter({ hasText: "File Explorer" })).not.toBeVisible();

			await commands.clickCheckbox(undefined, "Addresses");
			await commands.clickCheckbox(undefined, "Gender");

			await page.getByRole("button", { name: "Delete (Delete)" }).click();
			await commands.waitUntilLoaded();
			await commands.clickDialogButton("Delete");

			await expect(commands.getRow("Addresses")).not.toBeVisible();
			await expect(commands.getRow("City")).not.toBeVisible();
			await expect(commands.getRow("Street")).not.toBeVisible();
			await expect(commands.getRow("Gender")).not.toBeVisible();

			await expect(commands.getRow("Basic")).toBeVisible();
			await expect(commands.getRow("Name")).toBeVisible();
		});
	});

	test.describe("Bulk drag and drop on a sibling node", () => {
		test("should work", async () => {
			const fileExplorerTree = commands.getFileExplorerTree();
			const rows = fileExplorerTree.locator(Selector.BODY_ROW);

			await commands.clickCheckbox(undefined, "npm.cmd");
			await commands.clickCheckbox(undefined, "node.exe");
			await commands.clickCheckbox(undefined, "javaws.exe");
			await commands.clickCheckbox(undefined, "java.exe");

			await commands.dragDrop("npm.cmd", "Program Files", "asChild");
			await commands.waitUntilLoaded();

			// Check expanded state for Node and Java
			await expect(rows.nth(3)).toContainText("Node");
			await expect(rows.nth(3).locator('[data-role="tree-node-expander"]')).toHaveClass(
				/treeWidget__nodeArrow--active/
			);
			await expect(rows.nth(4)).toContainText("Java");
			await expect(rows.nth(4).locator('[data-role="tree-node-expander"]')).toHaveClass(
				/treeWidget__nodeArrow--active/
			);

			await commands.assertNodeLevel(3, ["Node", "Java", "npm.cmd", "node.exe", "javaws.exe", "java.exe"]);

			await commands.clickCheckbox(undefined, "DomainPerson.json");
			await commands.clickCheckbox(undefined, "Person.json");

			await commands.dragDrop("DomainPerson.json", "node.exe", "asChild");
			await commands.waitUntilLoaded();

			// Check expanded state again
			await expect(rows.nth(3)).toContainText("Node");
			await expect(rows.nth(3).locator('[data-role="tree-node-expander"]')).toHaveClass(
				/treeWidget__nodeArrow--active/
			);
			await expect(rows.nth(4)).toContainText("Java");
			await expect(rows.nth(4).locator('[data-role="tree-node-expander"]')).toHaveClass(
				/treeWidget__nodeArrow--active/
			);

			await commands.assertNodeLevel(3, [
				"Node",
				"Java",
				"npm.cmd",
				"node.exe",
				"Person.json",
				"DomainPerson.json",
				"javaws.exe",
				"java.exe"
			]);
		});
	});

	test.describe("copy file and folder then paste as child should keep node order correctly based on relationship model", () => {
		test("should work", async ({ page }) => {
			const fileExplorerTree = commands.getFileExplorerTree();

			await commands.assertNodeLevel(3, ["Node", "Java"]);
			await commands.assertNodeLevel(1, ["D:"]);
			await commands.assertNodeLevel(2, ["autostart.bat"]);

			await commands.clickCheckbox(undefined, "npm.cmd");
			await commands.clickCheckbox(undefined, "Java");

			await fileExplorerTree.locator("button").filter({ hasText: "Copy" }).click();
			const programFilesRow = commands.getRow("Program Files");
			await programFilesRow.click({ button: "right" });
			await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Paste" }).first().click();
			await commands.waitUntilLoaded();
			const programFilesChildNodes = commands.getChildNodeRows(undefined, "Program Files");
			// After paste, we should have original Node and Java at level 3, plus the pasted Java and npm.cmd also at level 3
			await commands.assertLevelWithLocator(programFilesChildNodes.nth(0), 3);
			await expect(programFilesChildNodes.nth(0).locator(Selector.TREE_NODE_NAME)).toContainText("Node");
			await commands.assertLevelWithLocator(programFilesChildNodes.nth(1), 3);
			await expect(programFilesChildNodes.nth(1).locator(Selector.TREE_NODE_NAME)).toHaveText("Java");
			await commands.assertLevelWithLocator(programFilesChildNodes.nth(2), 3);
			await expect(programFilesChildNodes.nth(2).locator(Selector.TREE_NODE_NAME)).toHaveText("Java");
			await commands.assertLevelWithLocator(programFilesChildNodes.nth(3), 3);
			await expect(programFilesChildNodes.nth(3).locator(Selector.TREE_NODE_NAME)).toHaveText("npm.cmd");
		});
	});
});
