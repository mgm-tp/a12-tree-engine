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

import { type Page, expect } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { Selector } from "../selectors";
import { type InsertSiblingPosition } from "../types";

/**
 * Helper class containing utility functions for Categories tests
 */
export class CategoriesUtils {
	private commands: PlaywrightCommands;

	constructor(private page: Page) {
		this.commands = new PlaywrightCommands(page);
	}

	/**
	 * Navigate to Categories/Products Management page with optional module selection
	 */
	async navigate(module = "Products Tree"): Promise<void> {
		await this.page.getByRole("link", { name: "Products Management" }).click();
		await this.page.getByRole("link", { name: module, exact: true }).click();
		await this.commands.waitUntilLoaded();
	}

	/**
	 * Create a new category
	 */
	async createCategory(name: string, parent?: string): Promise<void> {
		if (parent === undefined) {
			// Create root category
			await this.page.locator("#button-ed2312").click();
		} else {
			// Create child category
			const parentRow = this.commands.getRow(parent);
			await this.commands.buttonByDescription(parentRow, "Insert a new child").click();
			await this.page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainCategory" }).click();
		}

		await this.commands.waitUntilLoaded();
		await this.page.locator("#a12-Name-field_04d07").fill(name);
		await this.page.getByRole("button", { name: "Save" }).click();
		await this.commands.waitUntilLoaded();
		await expect(this.commands.getRow(name)).toBeVisible();
	}

	/**
	 * Create a bundle for a category
	 */
	async createBundle(
		name: string,
		child?: string,
		parent = "Root",
		quantity = "99",
		position?: InsertSiblingPosition
	): Promise<void> {
		if (position) {
			// Create sibling bundle with position
			const parentRow = this.commands.getRow(parent);
			await parentRow.locator(Selector.POPUP).click();
			await this.page
				.locator(".popup-menu")
				.locator(Selector.LIST_ITEM)
				.filter({ hasText: `Insert a Bundle ${position}` })
				.click();
		} else {
			// Create child bundle
			if (parent === undefined) {
				await this.page.locator("#button-ed2312").click();
			} else {
				const parentRow = this.commands.getRow(parent);
				await this.commands.buttonByDescription(parentRow, "Insert a new child").click();
			}
			await this.page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainBundle" }).click();
		}

		await this.commands.waitUntilLoaded();
		await this.page.locator("#a12-Name-F1").fill(name);

		if (child !== undefined) {
			// Select child in the second layout pane
			await this.page
				.locator(Selector.LAYOUT_PANE)
				.nth(1)
				.locator(Selector.BODY_ROW)
				.filter({ hasText: child })
				.click();
		}

		await this.page.getByRole("button", { name: "Save" }).click();
		await this.linkProductWithCategory(quantity);
		await expect(this.commands.getRow(name)).toBeVisible();
	}

	/**
	 * Create a product for a bundle
	 */
	async createProductForBundle(name: string, parent: string): Promise<void> {
		const parentRow = this.commands.getRow(parent);
		await parentRow.locator(Selector.POPUP).click();
		await this.page.locator(".popup-menu").locator(Selector.LIST_ITEM).filter({ hasText: "Add product" }).click();
		await this.page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainProduct" }).click();
		await this.commands.waitUntilLoaded();
		await this.page.locator("#a12-Name-field_e19c8").fill(name);
		await this.page.getByRole("button", { name: "Save" }).click();
		await this.commands.waitUntilLoaded();
		await expect(this.commands.getRow(name)).toBeVisible();
	}

	/**
	 * Create a sibling product
	 */
	async createSiblingProduct(
		name: string,
		position: InsertSiblingPosition,
		parent: string,
		quantity = "99"
	): Promise<void> {
		const parentRow = this.commands.getRow(parent);
		await parentRow.locator(Selector.POPUP).click();
		await this.page
			.locator(".popup-menu")
			.locator(Selector.LIST_ITEM)
			.filter({ hasText: `Insert a Product ${position}` })
			.click();
		await this.commands.waitUntilLoaded();

		await this.page.locator("#a12-Name-field_e19c8").fill(name);
		await this.page.getByRole("button", { name: "Save" }).click();
		await this.linkProductWithCategory(quantity);
		await expect(this.commands.getRow(name)).toBeVisible();
	}

	/**
	 * Create a sibling category
	 */
	async createSiblingCategory(name: string, position: InsertSiblingPosition, parent: string): Promise<void> {
		const parentRow = this.commands.getRow(parent);
		await parentRow.locator(Selector.POPUP).click();
		await this.page
			.locator(".popup-menu")
			.locator(Selector.LIST_ITEM)
			.filter({ hasText: `Insert a sibling ${position}` })
			.click();
		await this.page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainCategory" }).click();
		await this.commands.waitUntilLoaded();

		await this.page.locator("#a12-Name-field_04d07").fill(name);
		await this.page.getByRole("button", { name: "Save" }).click();
		await this.commands.waitUntilLoaded();
		await expect(this.commands.getRow(name)).toBeVisible();
	}

	/**
	 * Link categories together
	 */
	async linkCategories(name: string, parent: string): Promise<void> {
		const parentRow = this.commands.getRow(parent);
		await this.commands.buttonByDescription(parentRow, "Add link").click();
		await this.commands.waitUntilLoaded();

		await this.page
			.locator("#CategoriesStandaloneRelationshipEngine")
			.locator(Selector.BODY_ROW)
			.filter({ hasText: name })
			.click();
		await this.page.getByRole("button", { name: "Submit" }).click();
		await this.commands.waitUntilLoaded();
	}

	/**
	 * Link product with category
	 */
	async linkProductWithCategory(quantity = "99"): Promise<void> {
		await expect(this.page.getByRole("heading", { name: "Link product with category" })).toBeVisible();
		await this.page.getByRole("textbox", { name: "Quantity" }).fill(quantity);
		await this.page.getByRole("button", { name: "OK" }).click();
		await this.commands.waitUntilLoaded();
	}
}
