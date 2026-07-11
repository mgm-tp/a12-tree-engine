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

test.describe("copy/cut and paste", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
		await utils.navigateToFileExplorer();
	});

	test("File explorer", async ({ page }) => {
		// Paste button should be disabled if there is no copied nodes
		await commands.openContextMenu(commands.getRow("D:"));
		await expect(
			page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM).filter({ hasText: "Paste" })
		).toHaveClass(/list-item--disabled/);
		await page.keyboard.press("Escape");

		// Copy file
		const nodeExeRows = commands.getRows(undefined, "node.exe");
		await expect(nodeExeRows).toHaveCount(1);
		await commands.openContextMenu(commands.getRow("node.exe"));
		await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

		await commands.collapseNode(undefined, "D:");
		await expect(commands.findButton("D:", "Expand subitems")).toBeVisible();
		await commands.openContextMenu(commands.getRow("D:"));
		await expect(
			page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM).filter({ hasText: "Paste" })
		).not.toHaveClass(/list-item--disabled/);
		await page.locator(Selector.POPUP_MENU).getByText("Paste", { exact: true }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRows(undefined, "node.exe")).toHaveCount(2);
		await expect(commands.findButton("D:", "Collapse subitems")).toBeVisible();

		// Copy directory
		await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
		await commands.openContextMenu(commands.getRow("Java"));
		await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

		await commands.openContextMenu(commands.getRow("E:"));
		await page.locator(Selector.POPUP_MENU).getByText("Paste", { exact: true }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRows(undefined, "Java")).toHaveCount(2);
		await commands.expandNodeWithLocator(commands.getRows(undefined, "Java").nth(1));
		await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);

		// Copy directory recursively
		await commands.openContextMenu(commands.getRow("Node"));
		await page.locator(Selector.POPUP_MENU).getByText("Copy recursively", { exact: true }).click();
		// Without this click, the first input in the File Form (Name input) will not be filled
		await page.locator("body").click({ position: { x: 0, y: 0 }, force: true });

		await commands.buttonByDescription(commands.getRow("Node"), "Insert a file as child").click();
		await utils.fillFileForm(["options.txt", "admin", "admin", "txt", "23762"]);
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "options.txt")).toHaveCount(1);

		await commands.openContextMenu(commands.getRow("D:"));
		await page.locator(Selector.POPUP_MENU).getByText("Paste", { exact: true }).click();
		await commands.waitUntilLoaded();

		await expect(commands.getRows(undefined, "Node")).toHaveCount(2);
		await commands.expandNodeWithLocator(commands.getRows(undefined, "Node").nth(1));
		await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(2);
		await expect(commands.getRows(undefined, "options.txt")).toHaveCount(2);

		// Bulk copy
		await commands.clickCheckbox(undefined, "My Computer");
		await page.getByRole("button", { name: "Copy" }).click();
		await page.getByRole("button", { name: "Paste" }).click();
		await commands.waitUntilLoaded();

		// Verify deselection state
		await expect(page.locator(Selector.COUNTER)).toContainText("0");
		const headerCheckbox = page.getByRole("columnheader", { name: "Action" }).first().getByRole("checkbox");
		await expect(headerCheckbox).not.toBeChecked();

		const myComputerRows = commands.getRows(undefined, "My Computer");
		await expect(myComputerRows).toHaveCount(2);
		await commands.expandNodeWithLocator(myComputerRows.nth(0));
		await commands.expandNodeWithLocator(myComputerRows.nth(1));

		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "C:")).toHaveCount(2);
		await expect(commands.getRows(undefined, "D:")).toHaveCount(2);
		await expect(commands.getRows(undefined, "E:")).toHaveCount(2);

		// Paste button should be available after pasting
		await page.getByRole("button", { name: "Paste" }).click();
		await commands.waitUntilLoaded();
		await expect(myComputerRows).toHaveCount(3);

		// Cut 2 last My Computer, action Paste should not available
		await myComputerRows.nth(1).locator('[data-role="checkbox"]').click();
		await myComputerRows.nth(2).locator('[data-role="checkbox"]').click();
		await commands.waitUntilLoaded();
		await page.getByRole("button", { name: "Cut" }).click();
		await expect(page.getByRole("button", { name: "Paste" })).toBeDisabled();

		// Copy drive E, action Paste should not be available in Drive D but the computer should be
		await myComputerRows.nth(1).locator('[data-role="checkbox"]').click();
		await myComputerRows.nth(2).locator('[data-role="checkbox"]').click();
		const eRows = commands.getRows(undefined, "E:");
		await eRows.nth(1).locator('[data-role="checkbox"]').click();
		await page.getByRole("button", { name: "Copy" }).click();
		await commands.waitUntilLoaded();
		const dRows = commands.getRows(undefined, "D:");
		await commands.openContextMenu(dRows.first());
		await expect(
			page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM).filter({ hasText: "Paste" })
		).toHaveClass(/list-item--disabled/);
		await page.keyboard.press("Escape");

		await commands.openContextMenu(myComputerRows.first());
		await expect(
			page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM).filter({ hasText: "Paste" })
		).not.toHaveClass(/list-item--disabled/);
		await page.keyboard.press("Escape");

		// Delete 2 last My Computer
		await myComputerRows.nth(1).locator('[data-role="checkbox"]').click();
		await myComputerRows.nth(2).locator('[data-role="checkbox"]').click();
		await page.getByRole("button", { name: "Delete - Delete (Delete)" }).click();
		await commands.clickDialogButton("Delete");
		await commands.waitUntilLoaded();
	});

	test("Data Modeler", async ({ page }) => {
		await commands.buttonByDescription(commands.getRow("DomainPerson.json"), "Open document model").click();
		await commands.waitUntilLoaded();

		const dataModelerTree = commands.getDataModelerTree();
		const copyButton = dataModelerTree.getByRole("button", { name: "Copy" }).first();
		const pasteButton = dataModelerTree.getByRole("button", { name: "Paste" }).first();
		const cutButton = dataModelerTree.getByRole("button", { name: "Cut" }).first();
		// Helper function to check all paste buttons
		const checkAllPasteButtons = async (shouldBeDisabled: boolean) => {
			if (shouldBeDisabled) {
				await expect(pasteButton).toBeDisabled();
			} else {
				await expect(pasteButton).not.toBeDisabled();
			}

			// Check row-level paste buttons
			const pasteButtons = await commands.buttonByDescription(commands.getRows(), "Paste", "*").all();
			for (const button of pasteButtons) {
				if (shouldBeDisabled) {
					await expect(button).toBeDisabled();
				} else {
					await expect(button).not.toBeDisabled();
				}
			}
		};

		// Copy/Cut/Paste button should be disabled initially
		await expect(copyButton).toBeDisabled();
		await expect(cutButton).toBeDisabled();
		await checkAllPasteButtons(true);

		// Copy multiple fields and keep the order between them
		const rows = commands.getRows(dataModelerTree);
		await expect(rows.nth(4)).toContainText("City");
		await expect(rows.nth(5)).toContainText("Street");
		await commands.clickCheckbox(undefined, "City");
		await commands.clickCheckbox(undefined, "Street");
		await copyButton.click();
		await commands.buttonByDescription(commands.getRow("Basic"), "Paste", "*").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "City")).toHaveCount(2);
		await expect(commands.getRows(undefined, "Street")).toHaveCount(2);
		await expect(rows.nth(9)).toContainText("City");
		await expect(rows.nth(10)).toContainText("Street");

		// Copy whole group and paste as root
		await commands.clickCheckbox(commands.getRow("Addresses"));
		await copyButton.click();
		await dataModelerTree.locator(".contentbox__header").locator("button[aria-label*='Paste']").click();
		await commands.waitUntilLoaded();
		await expect(rows.nth(11)).toContainText("Addresses");
		await commands.assertLevelWithLocator(rows.nth(11), 0);

		// Copy whole group and paste as child
		const addressesRows = commands.getRows(undefined, "Addresses");
		const lastAddressesRow = addressesRows.last();
		await lastAddressesRow.locator(Selector.CHECKBOX_INPUT).click();
		await copyButton.click();
		await commands.buttonByDescription(lastAddressesRow, "Paste", "*").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "Addresses")).toHaveCount(3);

		// Copy group and fields
		await commands.clickCheckbox(commands.getRow("Photo"));
		await commands.clickCheckbox(commands.getRow("Gender"));
		await copyButton.click();
		const firstAddressesRow = addressesRows.first();
		await commands.buttonByDescription(firstAddressesRow, "Paste", "*").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "Gender")).toHaveCount(2);
		await expect(commands.getRows(undefined, "Photo")).toHaveCount(2);
		const photoRows = commands.getRows(undefined, "Photo");
		await commands.findButton(photoRows.nth(1), "Expand subitems").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("Content")).toBeVisible();

		// Delete root group Address after copying, then button Paste should be disabled
		const addressesRowsAgain = commands.getRows(undefined, "Addresses");
		await addressesRowsAgain.nth(1).locator(Selector.CHECKBOX_INPUT).click();
		await copyButton.click();
		await checkAllPasteButtons(false);
		await dataModelerTree.getByRole("button", { name: "Delete" }).first().click();
		await commands.waitUntilLoaded();
		await page.locator(Selector.DIALOG_CONTENT).getByRole("button", { name: "Delete" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "Addresses")).toHaveCount(1);
		await checkAllPasteButtons(true);

		// Cut a child group by subheader button and paste as root
		await commands.clickCheckbox(commands.getRow("Addresses"));
		await cutButton.click();
		await commands.collapseNode(undefined, "Person");

		// The Paste buttons at Person and Address node should be disabled. Other Paste buttons are enabled.
		await expect(dataModelerTree.getByRole("button", { name: "Paste" }).first()).not.toBeDisabled();

		const allPasteButtons = await commands.buttonByDescription(commands.getRows(), "Paste", "*").all();
		for (let index = 0; index < allPasteButtons.length; index++) {
			const button = allPasteButtons[index];
			if (index === 1 || index === 2) {
				// Button Paste at row 1 (Person) and row 2 (Addresses) should be disabled
				await expect(button).toBeDisabled();
			} else {
				// Other Paste button should be enabled
				await expect(button).not.toBeDisabled();
			}
		}

		await dataModelerTree.getByRole("button", { name: "Paste" }).first().click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("Addresses")).toBeVisible();
		await expect(rows.nth(2)).toContainText("Addresses");
		await commands.assertLevelWithLocator(rows.nth(2), 0);
		await checkAllPasteButtons(true);

		// Cut a root group by row action button and paste as a child group
		const addressesRowsFirst = commands.getRows(undefined, "Addresses");
		await commands.buttonByDescription(addressesRowsFirst.first(), "Cut", "*").click();

		// The Paste buttons at subheader, virtual root, and Address node should be disabled. Other Paste buttons are enabled.
		await expect(pasteButton).toBeDisabled();

		for (let index = 0; index < allPasteButtons.length; index++) {
			const button = allPasteButtons[index];
			if (index !== 1) {
				// Button Paste at row 0 (root) and row 2 (Addresses) should be disabled
				await expect(button).toBeDisabled();
			} else {
				// Other Paste button should be enabled
				await expect(button).not.toBeDisabled();
			}
		}

		const personRows = commands.getRows(undefined, "Person");
		await commands.buttonByDescription(personRows.first(), "Paste", "*").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("Addresses")).toBeVisible();
		await expect(rows.nth(1)).toContainText("Person");
		await commands.assertLevelWithLocator(rows.nth(1), 0);
		await expect(rows.nth(8)).toContainText("Addresses");
		await commands.assertLevelWithLocator(rows.nth(8), 1);
		await checkAllPasteButtons(true);

		await commands.clickCheckbox(commands.getRow("Person"));
		await cutButton.click();
		await commands.waitUntilLoaded();
		await checkAllPasteButtons(true);

		// copy/cut and paste as root should be consistent in case of tree with hidden root node
		await commands.clickCheckbox(commands.getRow("Person"));
		await expect(rows.nth(8)).toContainText("Addresses");
		await commands.assertLevelWithLocator(rows.nth(8), 1);
		await commands.clickCheckbox(commands.getRow("Addresses"));
		await copyButton.click();
		await pasteButton.click();
		await expect(rows.nth(9)).toContainText("Addresses");
		await commands.assertLevelWithLocator(rows.nth(9), 0);

		await expect(rows.nth(3)).toContainText("Basic");
		await commands.assertLevelWithLocator(rows.nth(3), 1);
		await commands.clickCheckbox(commands.getRow("Basic"));
		await cutButton.click();
		await pasteButton.click();
		await expect(rows.nth(5)).toContainText("Basic");
		await commands.assertLevelWithLocator(rows.nth(5), 0);
	});

	// FIXME: New RE integration doesn't work with attachment?
	test.skip("With Attachment", async ({ page }) => {
		await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
		await commands.getRow("npm.cmd").click();
		await commands.waitUntilLoaded();
		await page.locator(`[data-role="file-upload-input"]`).setInputFiles("fixtures/nemo.jpg");
		await page.getByRole("button", { name: "Save" }).click();
		await commands.waitUntilLoaded();

		await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
		await commands.clickCheckbox(commands.getRow("npm.cmd"));
		await commands.clickCheckbox(commands.getRow("node.exe"));

		await page.getByRole("button", { name: "Cut" }).click();
		await commands.openContextMenu(commands.getRow("D:"));
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Paste" }).click();
		await commands.waitUntilLoaded();
		await commands.assertLevelWithLocator(commands.getRow("npm.cmd"), 2);

		await commands.assertLevelWithLocator(commands.getRow("node.exe"), 2);

		await commands.clickCheckbox(commands.getRow("npm.cmd"));
		await commands.clickCheckbox(commands.getRow("node.exe"));

		await page.getByRole("button", { name: "Copy" }).click();
		await commands.openContextMenu(commands.getRow("Node"));
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Paste" }).first().click();
		await commands.waitUntilLoaded();

		await expect(page.getByText("Request Failed")).not.toBeVisible();

		await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(2);
		await expect(commands.getRows(undefined, "node.exe")).toHaveCount(2);
	});

	test("Form Modeler", async ({ page }) => {
		const personJsonRows = commands.getRows(undefined, "Person.json");
		await commands.buttonByDescription(personJsonRows.filter({ hasText: "Form Model" }), "Open form model").click();
		await commands.waitUntilLoaded();

		const formModelerTree = commands.getFormModelerTree();
		await formModelerTree.locator(`${Selector.SUB_HEADER} ${Selector.POPUP}`).first().click();
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Expand All" }).click();
		await commands.waitUntilLoaded();

		// Cut & Paste
		await commands.openContextMenu(commands.getRow("Detach Repeat Screen"));
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Cut" }).click();

		await commands.openContextMenu(commands.getRow("Next Screen"));
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Paste" }).click();
		await commands.waitUntilLoaded();

		const formRows = commands.getRows(formModelerTree);
		await expect(formRows.nth(4)).toContainText("Detach Repeat Screen");

		// Copy & Paste
		await commands.openContextMenu(commands.getRow("Detach Repeat Screen"));
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Copy" }).click();

		await commands.openContextMenu(commands.getRow("Main Screen"));
		await page.locator(Selector.LIST_ITEM).filter({ hasText: "Paste" }).click();
		await commands.waitUntilLoaded();

		await expect(formRows.nth(2)).toContainText("Detach Repeat Screen");
		await expect(formRows.nth(5)).toContainText("Detach Repeat Screen");
	});

	test("copy/cut and paste as child should have consistent behaviors", async ({ page }) => {
		const fileExplorerTree = commands.getFileExplorerTree();

		// Make a child node
		const explorerRows = commands.getRows(fileExplorerTree);
		await expect(explorerRows.nth(3)).toContainText("Node");
		await commands.assertLevelWithLocator(explorerRows.nth(3), 3);
		await expect(explorerRows.nth(6)).toContainText("Java");
		await commands.assertLevelWithLocator(explorerRows.nth(6), 3);

		await expect(commands.getRows(undefined, "Java")).toHaveCount(1);
		await expect(commands.findButton("Java", "Collapse subitems")).toBeVisible();
		await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
		await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);
		await expect(commands.getRows(undefined, "Node")).toHaveCount(1);
		await expect(commands.findButton("Node", "Collapse subitems")).toBeVisible();
		await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
		await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);

		await commands.openContextMenu(commands.getRow("Java"));
		await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

		await commands.openContextMenu(commands.getRow("D:"));
		const pasteButton = page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM).filter({ hasText: "Paste" });
		await expect(pasteButton).not.toHaveClass(/list-item--disabled/);
		await pasteButton.click();
		await commands.waitUntilLoaded();

		await expect(commands.getRows(undefined, "Java")).toHaveCount(2);
		await expect(explorerRows.nth(10)).toContainText("Java");
		await commands.assertLevelWithLocator(explorerRows.nth(10), 2);

		const javaRows = commands.getRows(undefined, "Java");
		await commands.findButton(javaRows.nth(1), "Expand subitems").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "javaws.exe")).toHaveCount(1);
		await expect(commands.getRows(undefined, "java.exe")).toHaveCount(1);

		// Copy and paste
		await commands.openContextMenu(commands.getRow("Node"));
		await page.locator(Selector.POPUP_MENU).getByText("Copy", { exact: true }).click();

		await commands.openContextMenu(commands.getRow("D:"));
		await expect(pasteButton).not.toHaveClass(/list-item--disabled/);
		await pasteButton.click();
		await commands.waitUntilLoaded();

		await expect(commands.getRows(undefined, "Node")).toHaveCount(2);
		await expect(explorerRows.nth(11)).toContainText("Node");
		await commands.assertLevelWithLocator(explorerRows.nth(11), 2);

		const nodeRows = commands.getRows(undefined, "Node");
		await commands.findButton(nodeRows.nth(1), "Expand subitems").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
		await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);

		// Cut and paste
		await commands.openContextMenu(commands.getRow("Node"));
		await page.locator(Selector.POPUP_MENU).getByText("Cut", { exact: true }).click();

		await commands.openContextMenu(commands.getRow("D:"));
		await expect(pasteButton).not.toHaveClass(/list-item--disabled/);
		await pasteButton.click();
		await commands.waitUntilLoaded();

		await expect(commands.getRows(undefined, "Node")).toHaveCount(2);
		await expect(explorerRows.nth(8)).toContainText("Node");
		await commands.assertLevelWithLocator(explorerRows.nth(8), 2);

		await expect(explorerRows.nth(9)).toContainText("Node");
		await commands.assertLevelWithLocator(explorerRows.nth(9), 2);
		const nodeRowsFinal = commands.getRows(undefined, "Node");
		await commands.findButton(nodeRowsFinal.nth(1), "Expand subitems").click();
		await commands.waitUntilLoaded();
		await expect(commands.getRows(undefined, "npm.cmd")).toHaveCount(1);
		await expect(commands.getRows(undefined, "node.exe")).toHaveCount(1);
	});
});
7;
