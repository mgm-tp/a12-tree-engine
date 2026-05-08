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

import { type Page, type Locator, expect } from "@playwright/test";

import { Selector } from "./selectors";
import { type MultiSelectionState } from "./types";

export type MovePosition = "asChild" | "top" | "bottom" | "asRoot";

/**
 * Provides helper methods for common tree engine operations
 */
export class PlaywrightCommands {
	constructor(protected page: Page) {}

	/**
	 * Wait until loading indicators disappear (equivalent to cy.waitUntilLoaded)
	 */
	async waitUntilLoaded(container?: Locator, timeout = 30000): Promise<void> {
		if (container) {
			await expect(container.locator(Selector.PROGRESS_INDICATOR)).toHaveCount(0, { timeout });
		} else {
			await expect(this.page.locator(Selector.PROGRESS_INDICATOR)).toHaveCount(0, { timeout });
		}
	}

	/**
	 * Wait for loading indicator to appear (equivalent to cy.waitForLoadingIndicator)
	 */
	async waitForLoadingIndicator(container?: Locator, timeout = 30000): Promise<void> {
		if (container) {
			await expect(container.locator(Selector.PROGRESS_INDICATOR)).toBeVisible({ timeout });
		} else {
			await expect(this.page.locator(Selector.PROGRESS_INDICATOR)).toBeVisible({ timeout });
		}
	}

	async dragDropWithLocator(source: Locator, target: Locator, position: MovePosition): Promise<void> {
		await source.hover();
		await this.page.mouse.down();

		if (position === "asRoot") {
			// For asRoot, drag to the tree container itself
			const treeRoot = this.page.locator('[data-role="tree"]', { has: source }).locator("..");
			await treeRoot.hover();
			await treeRoot.hover();
		} else {
			await target.hover();
			await target.hover();
			if (position === "top") {
				const top = this.page
					.locator(Selector.DND_BODY_ROW)
					.filter({ has: target })
					.locator(".tree-table__target.tree-table__target--top");

				await top.hover();
				await top.hover();
			} else if (position === "bottom") {
				const bottom = this.page
					.locator(Selector.DND_BODY_ROW)
					.filter({ has: target })
					.locator(".tree-table__target:not(.tree-table__target--top)");
				await bottom.hover();
				await bottom.hover();
			}
		}
		await this.page.mouse.up();
	}

	/**
	 * Drag and drop operations
	 */
	async dragDrop(source: string, target: string, position: "asChild" | "top" | "bottom" | "asRoot") {
		const sourceRow = this.getRow(source);
		const targetRow = this.getRow(target);
		await this.dragDropWithLocator(sourceRow, targetRow, position);
	}

	/**
	 * Expand a node by name
	 */
	async expandNode(name: string) {
		const row = this.getRow(name);
		await this.findButton(row, "Expand subitems").click({ force: true });
		await this.waitUntilLoaded();
	}
	/**
	 * Expand a node by name
	 */
	async expandNodeWithLocator(locator: Locator) {
		const button = this.findButton(locator, "Expand subitems");
		if ((await button.count()) > 0) {
			await button.click({ force: true });
			await this.waitUntilLoaded();
		}
	}
	/**
	 * Expand a node by name
	 */
	async expandAllNode(name: string) {
		const row = this.getRow(name);
		await row.locator('[data-role="popup"]').click();
		await this.page.locator(Selector.LIST_ITEM).getByText("Expand All").click();

		await this.waitUntilLoaded();
	}

	/**
	 * Delete a tree node (equivalent to cy.deleteNode)
	 */
	async deleteNode(container?: Locator, name?: string): Promise<void> {
		if (name && container) {
			const row = container
				.locator(Selector.BODY_ROW, {
					has: this.page.locator(Selector.TREE_NODE_NAME, { has: this.page.getByText(name, { exact: true }).first() })
				})
				.first();
			await this.buttonByDescription(row, "Delete", "*").click();
		} else if (name) {
			const row = this.getRow(name);
			await this.buttonByDescription(row, "Delete", "*").click();
		} else if (container) {
			await this.buttonByDescription(container, "Delete", "*").click();
		}
		await this.page.locator(Selector.DIALOG).locator("button").filter({ hasText: "Delete" }).click();
		await this.waitUntilLoaded();
	}

	/**
	 * Collapse a tree node (equivalent to cy.collapseNode)
	 */
	async collapseNode(container?: Locator, name?: string): Promise<void> {
		if (name && container) {
			const row = container.locator(Selector.BODY_ROW).filter({ hasText: name });
			await this.findButton(row, "Collapse subitems").click();
		} else if (name) {
			const row = this.getRow(name);
			await this.findButton(row, "Collapse subitems").click();
		} else if (container) {
			await this.findButton(container, "Collapse subitems").click();
		}
	}

	/**
	 * Click checkbox (equivalent to cy.clickCheckbox)
	 */
	async clickCheckbox(container?: Locator, nameOrShiftKey?: string | boolean, isShiftKey?: boolean): Promise<void> {
		let shiftKey: boolean | undefined;
		if (typeof nameOrShiftKey !== "string") {
			shiftKey = nameOrShiftKey;
		} else {
			shiftKey = isShiftKey;
		}

		if (typeof nameOrShiftKey !== "string") {
			if (container) {
				await container.locator('[data-role="checkbox"]').click({ modifiers: shiftKey ? ["Shift"] : [] });
			}
		} else if (nameOrShiftKey === "overall") {
			await this.page
				.locator('[data-role="table-header"]')
				.locator('[data-role="checkbox"]')
				.click({ modifiers: shiftKey ? ["Shift"] : [] });
		} else if (nameOrShiftKey === "virtual-root-overall") {
			await this.page
				.locator(Selector.VIRTUAL_ROOT)
				.locator('[data-role="checkbox"]')
				.click({ modifiers: shiftKey ? ["Shift"] : [] });
		} else {
			const row = container
				? container.locator(Selector.BODY_ROW).filter({
						has: this.page.locator(Selector.TREE_NODE_NAME, {
							has: this.page.getByText(nameOrShiftKey, { exact: true }).first()
						})
					})
				: this.getRow(nameOrShiftKey);
			await row.locator('[data-role="checkbox-input"]').click({ modifiers: shiftKey ? ["Shift"] : [] });
		}
		await this.waitUntilLoaded();
	}

	/**
	 * Open context menu (equivalent to cy.openContextMenu)
	 */
	async openContextMenu(element: Locator): Promise<void> {
		await element.locator(Selector.POPUP).click();
	}

	/**
	 * Press keyboard shortcut (equivalent to cy.press)
	 */
	async press(element: Locator, shortcut: string): Promise<void> {
		await element.press(shortcut);
	}

	/**
	 * Get rows by text content (equivalent to cy.rows)
	 */
	getRows(container?: Locator, text?: string): Locator {
		const baseSelector = `${Selector.TABLE_BODY}:not([data-role="hidden-rows"]) ${Selector.BODY_ROW}`;

		if (text) {
			if (container) {
				return container.locator(baseSelector).filter({
					has: this.page.locator(Selector.TREE_NODE_NAME, { has: this.page.getByText(text, { exact: true }) })
				});
			}
			return this.page.locator(baseSelector).filter({
				has: this.page.locator(Selector.TREE_NODE_NAME, { has: this.page.getByText(text, { exact: true }) })
			});
		} else {
			if (container) {
				return container.locator(baseSelector);
			}
			return this.page.locator(baseSelector);
		}
	}

	/**
	 * Get a single row by text content (equivalent to cy.row)
	 */
	getRow(text: string, dndWrapper?: boolean): Locator {
		const tableRowSelector = dndWrapper ? Selector.DND_BODY_ROW : Selector.BODY_ROW;
		return this.page
			.locator(tableRowSelector, {
				has: this.page.locator(Selector.TREE_NODE_NAME, { has: this.page.getByText(text, { exact: true }).first() })
			})
			.first();
	}

	/**
	 * Get row with specific level (equivalent to cy.rowWithLevel)
	 */
	getRowWithLevel(text: string, level: number): Locator {
		return this.page.locator(Selector.BODY_ROW).locator(`.treeEngine__node--level-${level}`).filter({ hasText: text });
	}

	/**
	 * Get child node rows (equivalent to cy.childNodeRows)
	 * This filters rows where the text appears within a [data-role="hidden-text"] element,
	 * which indicates child nodes belonging to a specific parent
	 */
	getChildNodeRows(container?: Locator, text?: string): Locator {
		const baseSelector = `${Selector.TABLE_BODY}:not([data-role="hidden-rows"]) ${Selector.BODY_ROW}`;

		if (text) {
			const baseLocator = container ? container.locator(baseSelector) : this.page.locator(baseSelector);
			// Filter rows that contain the text AND have it inside hidden-text within a tree node
			return baseLocator.filter({
				has: this.page
					.locator(`${Selector.BODY_CELL}`)
					.filter({
						has: this.page.locator('[data-role="tree-node-name"]')
					})
					.filter({
						has: this.page.locator(`[data-role="hidden-text"]`).filter({ hasText: text })
					})
			});
		} else {
			if (container) {
				return container.locator(baseSelector);
			}
			return this.page.locator(baseSelector);
		}
	}

	/**
	 * Load more rows for pagination (equivalent to cy.loadMoreRows)
	 */
	async loadMoreRows(container?: Locator, parentRow?: string): Promise<void> {
		const label = "Load more";
		if (parentRow) {
			const targetSelector = this.page
				.locator(Selector.PAGINATED_BODY_ROW)
				.filter({ hasText: `belongs to ${parentRow}` });
			if (container) {
				await container.locator(targetSelector).getByRole("link", { name: label }).click();
			} else {
				await targetSelector.getByRole("link", { name: label }).click();
			}
		}
		await this.waitUntilLoaded();
	}

	/**
	 * Load all rows for pagination (equivalent to cy.loadAllRows)
	 */
	async loadAllRows(container?: Locator, parentRow?: string): Promise<void> {
		const label = "Load all";
		if (parentRow) {
			const targetSelector = this.page
				.locator(Selector.PAGINATED_BODY_ROW)
				.filter({ hasText: `belongs to ${parentRow}` });
			if (container) {
				await container.locator(targetSelector).getByRole("link", { name: label }).click();
			} else {
				await targetSelector.getByRole("link", { name: label }).click();
			}
		}
		await this.waitUntilLoaded();
	}

	/**
	 * Press shortcut on engine (equivalent to cy.pressEngineShortcut)
	 */
	async pressEngineShortcut(shortcut: string): Promise<void> {
		await this.page.keyboard.press(shortcut);
	}

	/**
	 * Press shortcut on specific row (equivalent to cy.pressRowShortcut)
	 */
	async pressRowShortcut(rowName: string, shortcut: string): Promise<void> {
		const row = this.getRow(rowName);
		await row.focus();
		await row.press(shortcut);
	}

	/**
	 * Get tree containers for different modelers
	 */
	getDataModelerTree(): Locator {
		return this.page.locator(Selector.LAYOUT_PANE).filter({ hasText: "Data Modeler" });
	}

	getFormModelerTree(): Locator {
		return this.page.locator(Selector.LAYOUT_PANE).filter({ hasText: "Form Modeler" });
	}

	getFileExplorerTree(): Locator {
		return this.page.locator(Selector.LAYOUT_PANE).filter({ hasText: "File Explorer" });
	}

	/**
	 * Click dialog button (equivalent to cy.clickDialogButton)
	 */
	async clickDialogButton(buttonText: string): Promise<void> {
		await this.page.locator(Selector.DIALOG_CONTENT).locator("button").filter({ hasText: buttonText }).click();
	}

	/**
	 * Find a button by its aria-label within a container or row.
	 * Accepts either a Locator or a row name string (which will be resolved via getRow).
	 * Uses CSS attribute selector to avoid conflicts with aria-labelledby on action buttons.
	 * @param match - Optional match operator: "^" for starts-with, "*" for contains, omit for exact match
	 */
	findButton(containerOrRowName: Locator | string, label: string, match?: "^" | "*"): Locator {
		const container = typeof containerOrRowName === "string" ? this.getRow(containerOrRowName) : containerOrRowName;
		const op = match === "^" ? "^=" : match === "*" ? "*=" : "=";
		return container.locator(`button[aria-label${op}"${label}"]`);
	}

	/**
	 * Get button by description (equivalent to cy.buttonByDescription)
	 */
	buttonByDescription(container: Locator | undefined, text: string, operator?: "*" | "^"): Locator {
		const selector =
			operator === "*"
				? `button[aria-label*="${text}"]`
				: operator === "^"
					? `button[aria-label^="${text}"]`
					: `button[aria-label="${text}"]`;

		if (container) {
			return container.locator(selector);
		}
		return this.page.locator(selector);
	}

	/**
	 * Make API request to get documents (equivalent to cy.requestDocuments)
	 */
	async requestDocuments(documentName: string, text: string): Promise<unknown[]> {
		const host = new URL(this.page.url()).origin;
		const response = await this.page.request.post(`${host}/api/v2/rpc`, {
			data: [
				{
					jsonrpc: "2.0",
					id: "List",
					method: "QUERY",
					params: {
						query: {
							projectionName: "document",
							targetDocumentModel: documentName,
							paging: {
								pageNumber: 0,
								pageSize: 5
							},
							constraint: {
								operator: "SIMPLE_SEARCH_OPERATOR",
								value: text
							}
						}
					}
				}
			]
		});

		const result = await response.json();
		const [firstResponse] = result;

		if (firstResponse?.result) {
			return firstResponse.result.entries;
		}

		throw new Error("Invalid QUERY response");
	}

	/**
	 * Make API request to delete documents (equivalent to cy.requestDeleteDocuments)
	 */
	async requestDeleteDocuments(...docRefs: string[]): Promise<void> {
		if (docRefs.length === 0) {
			throw new Error("No document provided. Required document references.");
		}

		const host = new URL(this.page.url()).origin;
		await this.page.request.post(`${host}/api/v2/rpc`, {
			data: docRefs.map((docRef, index) => ({
				jsonrpc: "2.0",
				id: `Delete-${index}`,
				method: "DELETE_DOCUMENT",
				params: { docRef, locale: "en" }
			}))
		});
	}

	/**
	 * Make API request to modify documents (equivalent to cy.requestModifyDocuments)
	 */
	async requestModifyDocuments(
		docSpecs: Array<{ docRef: string; document: object }>,
		updater: (docRef: string, document: object) => object
	): Promise<void> {
		if (docSpecs.length === 0) {
			throw new Error("No document provided. Required document specifications.");
		}

		const host = new URL(this.page.url()).origin;
		await this.page.request.post(`${host}/api/v2/rpc`, {
			data: docSpecs.map(({ docRef, document }, index) => ({
				jsonrpc: "2.0",
				id: `Modify-${index}`,
				method: "MODIFY_DOCUMENT",
				params: { docRef, document: updater(docRef, document), locale: "en" }
			}))
		});
	}

	/**
	 * Assert that specified nodes have hidden arrow buttons
	 */
	async assertHideArrowButton(nodeNames: string[]): Promise<void> {
		const allNodes = this.page.locator(Selector.NODE);
		const nodeCount = await allNodes.count();

		for (let i = 0; i < nodeCount; i++) {
			const node = allNodes.nth(i);

			// Skip virtual root nodes
			const isVirtualRoot = (await node.locator(Selector.VIRTUAL_ROOT.replace(/^\./, "")).count()) > 0;
			if (isVirtualRoot) {
				continue;
			}

			const nameElement = node.locator('[data-role="tree-node-name"]');
			const nodeName = await nameElement.textContent();

			if (nodeName) {
				const expectHasArrow = !nodeNames.includes(nodeName);
				const expanderCount = await node.locator('[data-role="tree-node-expander"]').count();
				const actualHasArrow = expanderCount > 0;

				if (actualHasArrow !== expectHasArrow) {
					throw new Error(`Node ${nodeName} has ${actualHasArrow ? "" : "no "}arrow button`);
				}
			}
		}
	}

	/**
	 * Assert that rows are visible in the specified order
	 */
	async assertRowsVisible(rows: string[], startIdx = 0): Promise<void> {
		const allRows = this.getRows();

		for (let i = 0; i < rows.length; i++) {
			const row = allRows.nth(i + startIdx);
			await expect(row).toContainText(rows[i]);
		}
	}

	/**
	 * Assert node levels
	 */
	async assertNodeLevel(level: number, names: string[]): Promise<void> {
		const rowLocators = [];
		if (names.length === 0) {
			rowLocators.push(this.getRows());
		} else {
			for (const name of names) {
				rowLocators.push(this.getRows(undefined, name));
			}
		}

		for (let i = 0; i < rowLocators.length; i++) {
			const locator = rowLocators[i];
			for (let i = 0; i < (await locator.count()); i++) {
				const row = locator.nth(i);
				if (names.length === 0) {
					await expect(row.locator(Selector.TREE_NODE)).not.toHaveAttribute("data-tree-level", level.toString());
				} else {
					await expect(row.locator(Selector.TREE_NODE)).toHaveAttribute("data-tree-level", level.toString());
				}
			}
		}
	}

	/**
	 * Assert toast message appears
	 */
	async assertToastMessage(message: string): Promise<void> {
		const toast = this.page.locator(Selector.TOAST);
		await expect(toast).toHaveCount(1);
		await expect(toast).toContainText(message);
		await this.buttonByDescription(toast, "Close").click();
	}

	/**
	 * Click on popup menu for a row
	 */
	async clickPopUpMenu(row: string): Promise<void> {
		const rowElement = this.getRow(row);
		await rowElement.locator(Selector.POPUP).click();
	}

	/**
	 * Click on specific item in popup menu
	 */
	async clickOnPopUpMenu(row: string, text: string): Promise<void> {
		await this.clickPopUpMenu(row);
		await this.page.locator(Selector.POPUP_MENU).locator(Selector.LIST_ITEM, { hasText: text }).click();
	}

	/**
	 * Save and assert row is visible
	 */
	async saveAndAssertRowVisible(row: string): Promise<void> {
		await this.page.locator("button").filter({ hasText: "Save" }).click();
		await this.waitUntilLoaded();
		await expect(this.getRow(row)).toBeVisible();
	}

	/**
	 * Assert if a row is expanded or collapsed
	 */
	async assertExpanded(name: string, expanded: boolean) {
		const row = this.getRow(name);
		if (expanded) {
			await expect(this.findButton(row, "Collapse subitems")).toBeTruthy();
		} else {
			await expect(this.findButton(row, "Expand subitems")).toBeTruthy();
		}
	}

	/**
	 * Assert if a row is expanded or collapsed
	 */
	async assertExpandedWithLocator(locator: Locator, expanded: boolean) {
		if (expanded) {
			await expect(this.findButton(locator, "Collapse subitems")).toBeTruthy();
		} else {
			await expect(this.findButton(locator, "Expand subitems")).toBeTruthy();
		}
	}
	/**
	 * Assert if a row is selected
	 */
	async assertSelectedRow(name: string): Promise<void> {
		const row = this.getRow(name);
		await expect(row).toHaveClass(/selected/);
	}

	/**
	 * Assert the level of a node
	 */
	async assertLevel(name: string, level: number): Promise<void> {
		const row = this.getRow(name);
		await expect(row.locator(Selector.TREE_NODE)).toHaveAttribute("data-tree-level", level.toString());
	}

	/**
	 * Assert the level of a node
	 */
	async assertLevelWithLocator(locator: Locator, level: number): Promise<void> {
		await expect(locator.locator(Selector.TREE_NODE)).toHaveAttribute("data-tree-level", level.toString());
	}
	/**
	 * Get multiple rows by text content (enhanced version)
	 */
	getMultipleRows(text: string): Locator {
		return this.getRows(undefined, text);
	}

	/**
	 * Helper function to verify multi-selection state
	 */
	async assertMultiSelectionState(
		page: Page | Locator,
		params: {
			counter?: number;
			overallState: MultiSelectionState;
			nodeStates: Partial<Record<MultiSelectionState, (string | RegExp)[]>>;
			hasVirtualRoot?: boolean;
		}
	) {
		// Check counter
		if (params.counter !== undefined) {
			await expect(page.locator(Selector.COUNTER)).toContainText(String(params.counter));
		}

		// Check overall state
		const headerCheckbox = params.hasVirtualRoot
			? page.locator(Selector.VIRTUAL_ROOT).getByRole("checkbox")
			: page.getByRole("columnheader", { name: "Action" }).first().getByRole("checkbox");
		if (params.overallState === "selected") {
			await expect(headerCheckbox).toBeChecked();
		} else if (params.overallState === "partlySelected") {
			await expect(headerCheckbox).toHaveAttribute("aria-checked", "mixed");
		} else {
			await expect(headerCheckbox).not.toBeChecked();
		}

		// Build expected states map
		const expectedStates: Record<string, MultiSelectionState> = {};
		const allNodes = page.locator(Selector.NODE).locator('[data-role="tree-node-name"]');
		const nodeCount = await allNodes.count();

		for (let i = 0; i < nodeCount; i++) {
			const nodeName = await allNodes.nth(i).textContent();
			if (nodeName) {
				let found = false;
				for (const state of ["selected", "partlySelected", "deselected"] as MultiSelectionState[]) {
					const matchers = params.nodeStates[state] ?? [];
					for (const matcher of matchers) {
						if (typeof matcher === "string") {
							if (matcher === nodeName) {
								expectedStates[nodeName] = state;
								found = true;
								break;
							}
						} else if (matcher.test(nodeName)) {
							expectedStates[nodeName] = state;
							found = true;
							break;
						}
					}
					if (found) {
						break;
					}
				}
			}
		}

		// Verify each node's selection state
		for (let i = 0; i < nodeCount; i++) {
			const nodeName = await allNodes.nth(i).textContent();
			if (nodeName && expectedStates[nodeName]) {
				const row = this.getRow(nodeName);
				const checkbox = row.locator('[data-role="checkbox-input"]');

				const expectedState = expectedStates[nodeName];
				if (expectedState === "selected") {
					await expect(checkbox).toBeChecked();
				} else if (expectedState === "partlySelected") {
					await expect(checkbox).toHaveAttribute("aria-checked", "mixed");
				} else {
					await expect(checkbox).not.toBeChecked();
				}
			}
		}
	}
}
