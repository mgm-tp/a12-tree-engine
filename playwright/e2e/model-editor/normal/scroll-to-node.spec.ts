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

test.describe.skip("scroll to node", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeAll(async () => {
		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
	});

	test.use({ viewport: { width: 1280, height: 480 } });

	test.describe("single tree", () => {
		test.beforeEach(async ({ page }) => {
			commands = new PlaywrightCommands(page);
			utils = new ModelEditorUtils(page);

			await utils.navigateToFileExplorer();
			await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
			await commands.waitUntilLoaded();
		});

		test("should scroll to target when tree is first rendered or 'reveal target' is clicked", async ({ page }) => {
			const dataModelerTree = commands.getDataModelerTree();

			// Mark Name as target node
			await commands.openContextMenu(commands.getRow("Name"));
			await page.getByRole("button", { name: "Mark as target node" }).click();

			// Scroll to top so Name is not visible
			await dataModelerTree.locator(".table__content").evaluate((el) => el.scrollTo({ top: 0 }));
			await expect(commands.getRow("Name")).not.toBeInViewport();

			// Click on reveal-target button
			await commands.openContextMenu(commands.getRows(dataModelerTree).first());
			await page.getByRole("button", { name: "Reveal target node" }).click();
			await expect(commands.getRow("Name")).toBeVisible();

			// When first navigate to, should scroll to target
			await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
			await commands.waitUntilLoaded();
			await expect(commands.getRow("Name")).toBeVisible();
		});
	});

	test.describe("preload child nodes", () => {
		test.beforeEach(async ({ page }) => {
			commands = new PlaywrightCommands(page);
			utils = new ModelEditorUtils(page);

			await utils.navigateToFileExplorer();
		});

		test("should scroll to target node when tree is first rendered and consider preload child nodes", async ({
			page
		}) => {
			// Remove child nodes of Basic
			await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
			await commands.waitUntilLoaded();

			const personRow = commands.getRow("Person");
			await expect(commands.findButton(personRow, "Collapse subitems")).toBeVisible();

			const photoRow = commands.getRow("Photo");
			await expect(commands.findButton(photoRow, "Expand subitems")).toBeVisible();

			const addressRow = commands.getRow("Addresses");
			await expect(commands.findButton(addressRow, "Collapse subitems")).toBeVisible();

			const basicRow = commands.getRow("Basic");
			await expect(commands.findButton(basicRow, "Collapse subitems")).toBeVisible();

			await commands.clickCheckbox(commands.getRow("Gender"));
			await commands.clickCheckbox(commands.getRow("Name"));

			const dataModelerTree = commands.getDataModelerTree();
			await dataModelerTree.getByRole("button", { name: "Delete" }).first().click();
			await commands.waitUntilLoaded();
			await commands.clickDialogButton("Delete");

			await expect(commands.findButton(personRow, "Collapse subitems")).toBeVisible();
			await expect(commands.findButton(photoRow, "Expand subitems")).toBeVisible();
			await expect(commands.findButton(addressRow, "Collapse subitems")).toBeVisible();
			await expect(basicRow.locator('[data-role="tree-node-expander"]')).toHaveCount(0);

			// Check scroll to node
			await utils.navigateToFileExplorer();
			await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
			await commands.waitUntilLoaded();

			await commands.openContextMenu(commands.getRow("Street"));
			await page.locator(Selector.POPUP_MENU).getByText("Mark as target node").click();

			await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
			await commands.waitUntilLoaded();

			await expect(commands.getRow("Street")).toBeVisible();

			const personRow2 = commands.getRow("Person");
			await expect(commands.findButton(personRow2, "Collapse subitems")).toBeVisible();

			const photoRow2 = commands.getRow("Photo");
			await expect(commands.findButton(photoRow2, "Expand subitems")).toBeVisible();

			const addressRow2 = commands.getRow("Addresses");
			await expect(commands.findButton(addressRow2, "Collapse subitems")).toBeVisible();

			const basicRow2 = commands.getRow("Basic");
			await expect(basicRow2.locator('[data-role="tree-node-expander"]')).toHaveCount(0);
		});
	});

	test.describe("scroll to pasted or dropped node", () => {
		test.beforeEach(async ({ page }) => {
			commands = new PlaywrightCommands(page);
			utils = new ModelEditorUtils(page);

			await utils.navigateToFileExplorer();
		});

		test.describe("single node", () => {
			test("should work", async ({ page }) => {
				// Scroll to copy then paste as child node
				const nodeExeRows = commands.getRows(undefined, "node.exe");
				await expect(nodeExeRows).toHaveCount(1);
				await commands.assertLevelWithLocator(nodeExeRows.first(), 4);

				await commands.openContextMenu(commands.getRow("node.exe"));
				await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

				await commands.openContextMenu(commands.getRow("E:"));
				await page.locator(Selector.POPUP_MENU).getByText("Paste", { exact: true }).click();
				await commands.waitUntilLoaded();

				// Verify scrolled to the pasted node
				const nodeExeRows2 = commands.getRows(undefined, "node.exe");
				await expect(nodeExeRows2.nth(1)).toBeVisible();
				await commands.assertLevelWithLocator(nodeExeRows2.nth(1), 2);

				// Scroll to cut then paste as child node
				const nodeRows = commands.getRows(undefined, "Node");
				await expect(nodeRows).toHaveCount(1);
				await commands.assertLevelWithLocator(nodeRows.first(), 3);

				await commands.openContextMenu(commands.getRow("Node"));
				await page.locator(Selector.POPUP_MENU).getByText("Cut", { exact: true }).click();

				await commands.openContextMenu(commands.getRow("E:"));
				await page.locator(Selector.POPUP_MENU).getByText("Paste", { exact: true }).click();
				await commands.waitUntilLoaded();

				const nodeRowsAfterCut = commands.getRows(undefined, "Node");
				await expect(nodeRowsAfterCut.first()).toBeVisible();
				await commands.assertLevelWithLocator(nodeRowsAfterCut.first(), 2);

				// Scroll to copy then paste above and below node
				const nodeRows2 = commands.getRows(undefined, "Node");
				await expect(nodeRows2).toHaveCount(1);
				await commands.assertLevelWithLocator(nodeRows2.first(), 2);

				await commands.openContextMenu(commands.getRow("Node"));
				await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

				await commands.openContextMenu(commands.getRow("Program Files"));
				await page.locator(Selector.POPUP_MENU).getByText("Paste Above").click();
				await commands.waitUntilLoaded();

				const nodeRows3 = commands.getRows(undefined, "Node");
				await expect(nodeRows3.first()).toBeVisible();
				await commands.assertLevelWithLocator(nodeRows3.first(), 2);

				await commands.openContextMenu(commands.getRow("Program Files"));
				await page.locator(Selector.POPUP_MENU).getByText("Paste Below").click();
				await commands.waitUntilLoaded();

				const nodeRows4 = commands.getRows(undefined, "Node");
				await expect(nodeRows4.nth(1)).toBeVisible();
				await commands.assertLevelWithLocator(nodeRows4.nth(1), 2);

				// Scroll to cut then paste above and below node
				const javaRows = commands.getRows(undefined, "Java");
				await expect(javaRows).toHaveCount(1);
				await commands.assertLevelWithLocator(javaRows.first(), 3);

				await commands.openContextMenu(commands.getRow("Java"));
				await page.locator(Selector.POPUP_MENU).getByText("Cut", { exact: true }).click();

				await commands.openContextMenu(commands.getRow("Program Files"));
				await page.locator(Selector.POPUP_MENU).getByText("Paste Above").click();
				await commands.waitUntilLoaded();

				await expect(javaRows.first()).toBeVisible();
				await commands.assertLevelWithLocator(javaRows.first(), 2);

				await commands.openContextMenu(javaRows.first());
				await page.locator(Selector.POPUP_MENU).getByText("Cut", { exact: true }).click();

				await commands.openContextMenu(commands.getRow("Program Files"));
				await page.locator(Selector.POPUP_MENU).getByText("Paste Below").click();
				await commands.waitUntilLoaded();

				await expect(javaRows.first()).toBeVisible();
				await commands.assertLevelWithLocator(javaRows.first(), 2);

				const autostartBatRow = commands.getRow("autostart.bat");
				// Scroll to dropped as child node
				await commands.assertLevelWithLocator(autostartBatRow, 2);
				await commands.dragDrop("autostart.bat", "E:", "asChild");
				await commands.waitUntilLoaded();

				await commands.assertLevelWithLocator(autostartBatRow, 2);
				await expect(autostartBatRow).toBeVisible();
				await expect(autostartBatRow).toBeInViewport();
				await expect(autostartBatRow).toBeFocused();

				// Scroll to dropped above and below node
				await commands.expandNode("Java");
				const javaExeRow = commands.getRow("java.exe");
				await commands.assertLevelWithLocator(javaExeRow.first(), 3);

				const javawsRow = commands.getRow("javaws.exe");

				await commands.dragDropWithLocator(javaExeRow, javawsRow, "top");
				await commands.waitUntilLoaded();

				await expect(javaExeRow.first()).toBeFocused();

				await commands.dragDropWithLocator(javaExeRow, javawsRow, "bottom");
				await commands.waitUntilLoaded();

				await expect(javaExeRow.first()).toBeFocused();
			});
		});

		test.describe("hidden root node", () => {
			test("should work", async ({ page }) => {
				await commands
					.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document modeler with non virtual root")
					.click();
				await commands.waitUntilLoaded();

				const dataModelerTree = commands.getDataModelerTree();

				// Copy then paste as root - single node
				await commands.clickCheckbox(commands.getRow("Photo"));
				await dataModelerTree.getByRole("button", { name: "Copy" }).first().click();
				await dataModelerTree.getByRole("button", { name: "Paste" }).first().click();

				const photoRows = commands.getRows(undefined, "Photo");
				await expect(photoRows.nth(1)).toBeVisible();
				await commands.assertLevelWithLocator(photoRows.nth(1), 0);

				// Copy then paste as root - multiple nodes
				await commands.clickCheckbox(commands.getRow("Basic"));
				await commands.clickCheckbox(commands.getRow("Addresses"));
				await dataModelerTree.getByRole("button", { name: "Copy" }).first().click();
				await dataModelerTree.getByRole("button", { name: "Paste" }).first().click();

				const basicRows = commands.getRows(undefined, "Basic");
				await expect(basicRows.nth(1)).toBeVisible();
				await commands.assertLevelWithLocator(basicRows.nth(1), 0);

				// Cut then paste as root - cleanup first
				const addressesRows = commands.getRows(undefined, "Addresses");
				await commands.clickCheckbox(addressesRows.nth(1));
				await commands.clickCheckbox(basicRows.nth(1));
				await commands.clickCheckbox(photoRows.nth(1));
				await dataModelerTree.getByRole("button", { name: "Delete" }).first().click();
				await page.locator(Selector.DIALOG).getByRole("button", { name: "Delete" }).click();
				await commands.waitUntilLoaded();

				// Cut then paste as root - single node
				await commands.clickCheckbox(undefined, "Photo");
				await dataModelerTree.getByRole("button", { name: "Cut" }).first().click();
				await dataModelerTree.getByRole("button", { name: "Paste" }).first().click();

				await expect(photoRows.first()).toBeVisible();
				await commands.assertLevelWithLocator(photoRows.first(), 0);

				// Cut then paste as root - multiple nodes
				await commands.clickCheckbox(commands.getRow("Basic"));
				await commands.clickCheckbox(commands.getRow("Addresses"));
				await dataModelerTree.getByRole("button", { name: "Cut" }).first().click();
				await dataModelerTree.getByRole("button", { name: "Paste" }).first().click();

				await expect(basicRows.first()).toBeVisible();
				await commands.assertLevelWithLocator(basicRows.first(), 0);

				// Drag and drop as root - cleanup first
				await commands.clickCheckbox(commands.getRow("Addresses"));
				await commands.clickCheckbox(commands.getRow("Basic"));
				await commands.clickCheckbox(commands.getRow("Photo"));
				await commands.dragDrop("Photo", "Person", "asChild");
				await commands.waitUntilLoaded();

				// Drag and drop as root - single node
				const fileExplorerTree = commands.getFileExplorerTree();
				await commands
					.buttonByDescription(
						fileExplorerTree.locator(Selector.BODY_ROW).filter({ hasText: "DomainPerson.json" }),
						"Open document model"
					)
					.click();
				await commands.waitUntilLoaded();
				await commands.clickCheckbox(commands.getRow("Photo"));
				await commands.dragDrop("Photo", "Model", "asChild");
				await commands.waitUntilLoaded();

				await expect(photoRows.first()).toBeVisible();
				await commands.assertLevelWithLocator(photoRows.first(), 0);

				// Drag and drop as root - multiple nodes
				await commands.clickCheckbox(commands.getRow("Addresses"));
				await commands.clickCheckbox(commands.getRow("Basic"));
				await commands.dragDrop("Addresses", "Model", "asChild");
				await commands.waitUntilLoaded();

				const addressRows = commands.getRows(undefined, "Addresses");
				await expect(addressRows.first()).toBeVisible();
				await commands.assertLevelWithLocator(addressRows.first(), 0);
			});
		});
	});
});
