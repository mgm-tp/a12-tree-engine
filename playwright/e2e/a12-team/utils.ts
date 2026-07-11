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

import { type Page, expect, type Locator } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { Selector } from "../selectors.js";
import type { InsertSiblingPosition } from "../types.js";

/**
 * Helper class containing utility functions for A12 Team tests
 */
export class A12TeamUtils {
	private commands: PlaywrightCommands;

	constructor(private page: Page) {
		this.commands = new PlaywrightCommands(page);
	}

	/**
	 * Navigate to A12 Team page with optional parameters
	 */
	async visitA12Team(params?: { custom?: true; pagination?: true; multiLevel?: boolean }) {
		await this.page.goto("");
		await this.navigateToA12Team(params);
		await this.commands.waitUntilLoaded();
	}

	/**
	 * Navigate to A12 Team from the menu
	 */
	async navigateToA12Team(params?: { custom?: true; pagination?: true; multiLevel?: boolean }) {
		await this.page.getByRole("link", { name: "A12 Team" }).click();

		if (params?.custom) {
			await this.page.getByRole("link", { name: "A12 Tree (Custom)" }).click();
		} else if (params?.pagination) {
			await this.page.getByRole("link", { name: "A12 Tree Pagination" }).click();
		} else if (params?.multiLevel) {
			await this.page.getByRole("link", { name: "A12 Tree - Multi-Level" }).click();
		} else {
			await this.page.getByRole("link", { name: "A12 Tree", exact: true }).click();
		}
	}

	/**
	 * Get button selector for aria-label
	 */
	getButtonSelector(description: string, operator = "") {
		return operator === "*" ? `button[aria-label*="${description}"]` : `button[aria-label="${description}"]`;
	}

	/**
	 * Get a button by its aria-label attribute
	 */
	private getButtonByDescription(container: Locator, description: string, operator?: "*" | "^") {
		return this.commands.buttonByDescription(container, description, operator);
	}

	/**
	 * Create a sub team under a parent team
	 */
	async createSubTeam(name: string, parent = "A12") {
		// Add sub team to parent

		const parentRow = this.commands.getRow(parent);
		await this.getButtonByDescription(parentRow, "Insert a child").click();

		await this.page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainTeam" }).click();
		await this.commands.waitUntilLoaded();

		await this.typeTeamNameAndCreate(name, parent);
	}

	/**
	 * Create a sibling team next to an existing team
	 */
	async createSiblingTeam(target: string, parent = "A12", position: InsertSiblingPosition) {
		const name = `Team ${position} ${target}`;
		// Add sibling team with specified position

		const targetRow = this.commands.getRow(target);
		await this.getButtonByDescription(targetRow, `Insert a Team ${position}`).click();
		await this.commands.waitUntilLoaded();

		await this.typeTeamNameAndCreate(name, parent);
	}

	/**
	 * Type team name and save
	 */
	private async typeTeamNameAndCreate(name: string, parent: string) {
		await this.page.locator("#a12-TeamName-field_c9ad3").fill(name);
		await this.page.locator("button").filter({ hasText: "Save" }).click();
		await this.commands.waitUntilLoaded();

		if (parent) {
			const nameRow = this.commands.getRow(name);
			await expect(nameRow).toBeVisible();

			const hiddenText = nameRow.locator(`[data-role=tree-node] [data-role=hidden-text]`).first();
			await expect(hiddenText.filter({ hasText: "belongs to" })).toBeVisible();
			await expect(hiddenText.filter({ hasText: parent })).toBeVisible();
		} else {
			await this.commands.waitUntilLoaded();
		}
	}

	/**
	 * Create a person under a parent team
	 */
	async createPerson(name: string, parent = "A12", role = "Dev") {
		// Add person to parent with specified role

		const parentRow = this.commands.getRow(parent);
		await this.getButtonByDescription(parentRow, "Insert a child").click();

		await this.page
			.locator(Selector.DIALOG_NODE_TITLE)
			.filter({ hasText: /DomainPerson$/ })
			.click();
		await this.commands.waitUntilLoaded();

		await this.typePersonFirstNameAndCreate(name, role);
	}

	/**
	 * Create a sibling person next to an existing person
	 */
	async createSiblingPerson(parent: string, position: InsertSiblingPosition, role = "Dev") {
		const siblingName = `Person ${position} ${parent}`;

		const parentRow = this.commands.getRow(parent);
		await this.getButtonByDescription(parentRow, `Insert a person ${position}`).click();
		await this.commands.waitUntilLoaded();

		await this.typePersonFirstNameAndCreate(siblingName, role);
	}

	/**
	 * Type person first name and create with role
	 */
	private async typePersonFirstNameAndCreate(name: string, role: string) {
		await this.page.locator("#a12-FirstName-F3").fill(name);
		await this.page.locator("button").filter({ hasText: "Save" }).click();
		await this.commands.waitUntilLoaded();

		await expect(this.page.locator("text=Link person with team")).toBeVisible();

		await this.page.locator("#a12-Position-field_04443").fill(role);
		await this.page.locator("button").filter({ hasText: "OK" }).click();
		await this.commands.waitUntilLoaded();

		await expect(this.commands.getRow(name)).toBeVisible();
	}
}

/**
 * Factory function to create A12TeamUtils instance
 */
export function createA12TeamUtils(page: Page): A12TeamUtils {
	return new A12TeamUtils(page);
}
