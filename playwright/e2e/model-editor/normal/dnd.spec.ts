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

test.describe("dnd", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.describe("Dragged node wants to be sibling of top level node", () => {
		test.beforeEach(async ({ page }) => {
			commands = new PlaywrightCommands(page);
			utils = new ModelEditorUtils(page);

			await cleanDocumentsData({ showcases: ["model-editor"] });
			await seedData({ preset: "model-editor" });
			await utils.navigateToFileExplorer();

			const personJsonRows = commands.getRows(undefined, "Person.json");
			await commands.buttonByDescription(personJsonRows.filter({ hasText: "Form Model" }), "Open form model").click();
			await commands.waitUntilLoaded();

			const formModelerTree = commands.getFormModelerTree();
			await formModelerTree.locator(`${Selector.SUB_HEADER} ${Selector.POPUP}`).first().click();
			await page.locator(Selector.LIST_ITEM).filter({ hasText: "Expand All" }).click();
			await commands.waitUntilLoaded();
		});

		test("should work", async () => {
			const formModelerTree = commands.getFormModelerTree();
			const rows = commands.getRows(formModelerTree);

			await expect(rows.nth(1)).toContainText("Main Screen");
			await expect(commands.getRows(undefined, "Main Screen")).toHaveCount(1);
			await expect(commands.findButton("Main Screen", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(1), 0);

			await expect(rows.nth(4)).toContainText("Nested Screen");
			await expect(commands.getRows(undefined, "Nested Screen")).toHaveCount(1);
			await expect(commands.findButton("Nested Screen", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(4), 2);

			await expect(rows.nth(5)).toContainText("Inline Repeat 2");
			await expect(commands.getRows(undefined, "Inline Repeat 2")).toHaveCount(1);
			await commands.assertLevelWithLocator(rows.nth(5), 3);

			await expect(rows.nth(6)).toContainText("Next Screen");
			await expect(commands.getRows(undefined, "Next Screen")).toHaveCount(1);
			await expect(commands.findButton("Next Screen", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(6), 0);

			await commands.dragDrop("Nested Screen", "Main Screen", "asChild");
			await commands.waitUntilLoaded();

			await expect(rows.nth(3)).toContainText("Main Screen");
			await expect(commands.getRows(undefined, "Main Screen")).toHaveCount(1);
			await expect(commands.findButton("Main Screen", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(3), 0);

			await expect(rows.nth(1)).toContainText("Nested Screen");
			await expect(commands.getRows(undefined, "Nested Screen")).toHaveCount(1);
			await expect(commands.findButton("Nested Screen", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(1), 0);

			await expect(rows.nth(2)).toContainText("Inline Repeat 2");
			await expect(commands.getRows(undefined, "Inline Repeat 2")).toHaveCount(1);
			await commands.assertLevelWithLocator(rows.nth(2), 1);

			await expect(rows.nth(6)).toContainText("Next Screen");
			await expect(commands.getRows(undefined, "Next Screen")).toHaveCount(1);
			await expect(commands.findButton("Next Screen", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(6), 0);
		});
	});

	test.describe("Drag and drop node is placed on top of sibling of same type if predecessor link ref is undefined", () => {
		test.beforeEach(async ({ page }) => {
			commands = new PlaywrightCommands(page);
			utils = new ModelEditorUtils(page);

			await cleanDocumentsData({ showcases: ["model-editor"] });
			await seedData({ preset: "model-editor" });
			await utils.navigateToFileExplorer();
			await commands.waitUntilLoaded();
		});

		test("should work", async () => {
			const fileExplorerTree = commands.getFileExplorerTree();
			const rows = commands.getRows(fileExplorerTree);

			await commands.clickCheckbox(undefined, "npm.cmd");
			await commands.clickCheckbox(undefined, "node.exe");
			await commands.clickCheckbox(undefined, "javaws.exe");
			await commands.clickCheckbox(undefined, "java.exe");

			await commands.dragDrop("npm.cmd", "Program Files", "asChild");
			await commands.waitUntilLoaded();

			await expect(rows.nth(3)).toContainText("Node");
			await expect(commands.findButton("Node", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(4)).toContainText("Java");
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(4), 3);
			await expect(rows.nth(5)).toContainText("npm.cmd");
			await commands.assertLevelWithLocator(rows.nth(5), 3);
			await expect(rows.nth(6)).toContainText("node.exe");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(rows.nth(7)).toContainText("javaws.exe");
			await commands.assertLevelWithLocator(rows.nth(7), 3);
			await expect(rows.nth(8)).toContainText("java.exe");
			await commands.assertLevelWithLocator(rows.nth(8), 3);

			await commands.dragDrop("javaws.exe", "Java", "bottom");
			await commands.waitUntilLoaded();

			await expect(rows.nth(3)).toContainText("Node");
			await expect(commands.findButton("Node", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(4)).toContainText("Java");
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(4), 3);
			await expect(rows.nth(5)).toContainText("javaws.exe");
			await commands.assertLevelWithLocator(rows.nth(5), 3);
			await expect(rows.nth(6)).toContainText("npm.cmd");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(rows.nth(7)).toContainText("node.exe");
			await commands.assertLevelWithLocator(rows.nth(7), 3);
			await expect(rows.nth(8)).toContainText("java.exe");
			await commands.assertLevelWithLocator(rows.nth(8), 3);

			await commands.clickCheckbox(undefined, "npm.cmd");
			await commands.clickCheckbox(undefined, "node.exe");
			await commands.dragDrop("npm.cmd", "Java", "bottom");
			await commands.waitUntilLoaded();

			await expect(rows.nth(3)).toContainText("Node");
			await expect(commands.findButton("Node", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(4)).toContainText("Java");
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(4), 3);
			await expect(rows.nth(5)).toContainText("npm.cmd");
			await commands.assertLevelWithLocator(rows.nth(5), 3);
			await expect(rows.nth(6)).toContainText("node.exe");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(rows.nth(7)).toContainText("javaws.exe");
			await commands.assertLevelWithLocator(rows.nth(7), 3);
			await expect(rows.nth(8)).toContainText("java.exe");
			await commands.assertLevelWithLocator(rows.nth(8), 3);

			await commands.dragDrop("Person.json", "Java", "bottom");
			await commands.waitUntilLoaded();

			await expect(rows.nth(3)).toContainText("Node");
			await expect(commands.findButton("Node", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(3), 3);
			await expect(rows.nth(4)).toContainText("Java");
			await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
			await commands.assertLevelWithLocator(rows.nth(4), 3);
			await expect(rows.nth(5)).toContainText("Person.json");
			await commands.assertLevelWithLocator(rows.nth(5), 3);
			await expect(rows.nth(6)).toContainText("npm.cmd");
			await commands.assertLevelWithLocator(rows.nth(6), 3);
			await expect(rows.nth(7)).toContainText("node.exe");
			await commands.assertLevelWithLocator(rows.nth(7), 3);
			await expect(rows.nth(8)).toContainText("javaws.exe");
			await commands.assertLevelWithLocator(rows.nth(8), 3);
			await expect(rows.nth(9)).toContainText("java.exe");
			await commands.assertLevelWithLocator(rows.nth(9), 3);
		});
	});

	test.describe("Drag and drop to blank area below tree in case of non virtual root", () => {
		test.beforeEach(async ({ page }) => {
			commands = new PlaywrightCommands(page);
			utils = new ModelEditorUtils(page);
			await cleanDocumentsData({ showcases: ["model-editor"] });
			await seedData({ preset: "model-editor" });
			await utils.navigateToFileExplorer();
			await commands
				.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document modeler with non virtual root")
				.click();
			await commands.waitUntilLoaded();
		});

		test("should work", async () => {
			const dataModelerTree = commands.getDataModelerTree();
			const rows = commands.getRows(dataModelerTree);

			// Make more root nodes
			await expect(commands.findButton("Person", "Collapse subitems")).toBeVisible();
			await expect(rows.nth(0)).toContainText("Person");
			await expect(rows.nth(1)).toContainText("Photo");
			await expect(rows.nth(2)).toContainText("Addresses");
			await expect(rows.nth(5)).toContainText("Basic");

			await commands.assertLevel("Addresses", 1);
			await commands.dragDrop("Addresses", "Person", "asRoot");
			await commands.waitUntilLoaded();
			await commands.assertLevel("Addresses", 0);

			await expect(rows.nth(0)).toContainText("Person");
			await expect(rows.nth(1)).toContainText("Photo");
			await expect(rows.nth(2)).toContainText("Basic");
			await expect(rows.nth(5)).toContainText("Addresses");

			await commands.assertLevel("Basic", 1);
			await commands.dragDrop("Basic", "Person", "asRoot");
			await commands.waitUntilLoaded();
			await commands.assertLevel("Basic", 0);

			await expect(rows.nth(0)).toContainText("Person");
			await expect(rows.nth(1)).toContainText("Photo");
			await expect(rows.nth(2)).toContainText("Addresses");
			await expect(rows.nth(5)).toContainText("Basic");

			// Reorder root nodes
			await commands.collapseNode(undefined, "Person");
			await commands.collapseNode(undefined, "Addresses");
			await commands.collapseNode(undefined, "Basic");

			await commands.dragDrop("Person", "Addresses", "asRoot");
			await commands.waitUntilLoaded();

			await expect(rows.nth(0)).toContainText("Addresses");
			await expect(rows.nth(1)).toContainText("Basic");
			await expect(rows.nth(2)).toContainText("Person");

			await commands.dragDrop("Basic", "Person", "asRoot");
			await commands.waitUntilLoaded();

			await expect(rows.nth(0)).toContainText("Addresses");
			await expect(rows.nth(1)).toContainText("Person");
			await expect(rows.nth(2)).toContainText("Basic");
		});
	});

	test.describe("Drag and drop for relationship model GroupElement", () => {
		test.beforeEach(async ({ page }) => {
			commands = new PlaywrightCommands(page);
			utils = new ModelEditorUtils(page);

			await cleanDocumentsData({ showcases: ["model-editor"] });
			await seedData({ preset: "model-editor" });
			await utils.navigateToFileExplorer();
			await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
			await commands.waitUntilLoaded();
		});

		test("should work", async ({ page }) => {
			const dataModelerTree = commands.getDataModelerTree();
			const rows = commands.getRows(dataModelerTree);

			// Re-order groups
			await expect(commands.findButton("Person", "Collapse subitems")).toBeVisible();

			await expect(rows.nth(2)).toContainText("Photo");
			await expect(rows.nth(3)).toContainText("Addresses");
			await expect(rows.nth(6)).toContainText("Basic");

			await commands.dragDrop("Basic", "Photo", "top");
			await commands.waitUntilLoaded();

			await expect(rows.nth(2)).toContainText("Basic");
			await expect(rows.nth(5)).toContainText("Photo");
			await expect(rows.nth(6)).toContainText("Addresses");

			// Re-order fields
			await expect(commands.findButton("Addresses", "Collapse subitems")).toBeVisible();
			await expect(commands.findButton("Basic", "Collapse subitems")).toBeVisible();

			await expect(rows.nth(7)).toContainText("City");
			await expect(rows.nth(8)).toContainText("Street");

			await commands.dragDrop("City", "Street", "bottom");
			await commands.waitUntilLoaded();

			await expect(rows.nth(7)).toContainText("Street");
			await expect(rows.nth(8)).toContainText("City");

			// Re-order field between groups
			await commands.dragDrop("Gender", "Person", "asChild");
			await commands.waitUntilLoaded();

			await commands.collapseNode(undefined, "Basic");
			await commands.collapseNode(undefined, "Addresses");

			await commands.dragDrop("Gender", "Basic", "bottom");
			await commands.waitUntilLoaded();

			await expect(rows.nth(2)).toContainText("Basic");
			await expect(rows.nth(3)).toContainText("Gender");
			await expect(rows.nth(4)).toContainText("Photo");
			await expect(rows.nth(5)).toContainText("Addresses");

			// Re-order root groups
			await commands.assertLevel("Basic", 1);
			await commands.assertLevel("Addresses", 1);

			await commands.dragDropWithLocator(commands.getRow("Basic"), page.locator(Selector.VIRTUAL_ROOT), "asChild");
			await commands.waitUntilLoaded();

			await commands.assertLevel("Basic", 0);

			await commands.dragDrop("Addresses", "Basic", "bottom");
			await commands.waitUntilLoaded();
			await commands.assertLevel("Addresses", 0);

			await commands.collapseNode(undefined, "Person");
			await expect(rows.nth(1)).toContainText("Person");
			await expect(rows.nth(2)).toContainText("Basic");
			await expect(rows.nth(3)).toContainText("Addresses");

			// Try to make Root node as Root
			await commands.dragDropWithLocator(commands.getRow("Basic"), page.locator(Selector.VIRTUAL_ROOT), "asChild");
			await commands.waitUntilLoaded();

			await expect(page.locator(Selector.DIALOG)).not.toBeVisible();
			await expect(rows.nth(1)).toContainText("Person");
			await expect(rows.nth(2)).toContainText("Addresses");
			await expect(rows.nth(3)).toContainText("Basic");
		});
	});
});
