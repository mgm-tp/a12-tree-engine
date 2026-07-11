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
import { PlaywrightCommands } from "playwright-commands";

import { Selector } from "../selectors.js";

/**
 * Helper class containing utility functions for Model Editor tests
 */
export class ModelEditorUtils {
	private commands: PlaywrightCommands;

	constructor(private page: Page) {
		this.commands = new PlaywrightCommands(page);
	}

	/**
	 * Navigate to File Explorer showcase
	 */
	async navigateToFileExplorer(showcase = "File Explorer"): Promise<void> {
		await this.page.goto("");
		await this.page.getByRole("link", { name: "Model Editor" }).click();
		await this.page.getByRole("link", { name: showcase, exact: true }).click();
		await this.commands.waitUntilLoaded(undefined, 50000);
	}

	/**
	 * Navigate to Group Management sub tab
	 */
	async navigationGroupManagementSubTab(): Promise<void> {
		await this.page.goto("");
		await this.page.getByRole("link", { name: "Model Editor" }).click();
		await this.page.getByRole("link", { name: "Group Management" }).click();

		await this.commands.waitUntilLoaded(undefined, 50000);
	}

	/**
	 * Fill computer form
	 */
	async fillComputerForm([name, owner, group]: string[]): Promise<void> {
		await this.commands.waitUntilLoaded();
		await this.page.locator("input[id*=Name]").fill(name);
		await this.page.locator("input[id*=Owner]").fill(owner);
		await this.page.locator("input[id*=Group]").fill(group);
	}

	/**
	 * Fill drive form
	 */
	async fillDriveForm([name, owner, group]: string[]): Promise<void> {
		await this.commands.waitUntilLoaded();
		await this.page.locator("input[id*=Name]").fill(name);
		await this.page.locator("input[id*=Owner]").fill(owner);
		await this.page.locator("input[id*=Group]").fill(group);
	}

	/**
	 * Fill file form
	 */
	async fillFileForm([name, owner, group, extension, size]: string[]): Promise<void> {
		await this.commands.waitUntilLoaded();
		await this.page.locator("input[id*=Name]").fill(name);
		await this.page.locator("input[id*=Owner]").fill(owner);
		await this.page.locator("input[id*=Group]").fill(group);
		await this.page.locator("input[id*=Extension]").fill(extension);
		await this.page.locator("input[id*=Size]").fill(size);
		await this.page.locator("select[id*=FileType]").selectOption("document_model");
	}

	/**
	 * Fill rule form
	 */
	async fillRule(name: string, errorField: string, errorCode: string, errorCondition: string): Promise<void> {
		await this.commands.waitUntilLoaded();
		await this.page.locator("input[id*=Name]").fill(name);
		await this.page.locator("input[id*=ErrorField]").fill(errorField);
		await this.page.locator("input[id*=ErrorCode]").fill(errorCode);
		await this.page.locator("textarea[id*=ErrorCondition]").fill(errorCondition);
	}

	/**
	 * Add element (generic helper)
	 */
	async addElement(name: string, target: string, popUpLabel: string): Promise<void> {
		await this.commands.clickOnPopUpMenu(target, popUpLabel);
		await this.page.locator("input[id*=Name]").fill(name);
		await this.commands.saveAndAssertRowVisible(name);
	}

	/**
	 * Add group
	 */
	async addGroup(name: string, target: string, popupLabel = "DomainGroup"): Promise<void> {
		await this.addElement(name, target, popupLabel);
	}

	/**
	 * Add field
	 */
	async addField(name: string, target: string, popupLabel = "DomainField"): Promise<void> {
		await this.addElement(name, target, popupLabel);
	}

	/**
	 * Add multi select group
	 */
	async addMultiSelectGroup(name: string, target: string, popupLabel = "DomainMultiSelectGroup"): Promise<void> {
		await this.commands.clickOnPopUpMenu(target, popupLabel);
		await this.page.locator("input[id*=Name]").fill(name);
		await this.page.locator("input[id*=Repeatability]").fill("1");
		await this.commands.saveAndAssertRowVisible(name);
	}

	/**
	 * Add attachment group
	 */
	async addAttachmentGroup(name: string, target: string, popupLabel = "DomainAttachmentGroup"): Promise<void> {
		await this.addElement(name, target, popupLabel);
	}

	/**
	 * Add rule
	 */
	async addRule(
		name: string,
		target: string,
		errorField: string,
		errorCode: string,
		errorCondition: string
	): Promise<void> {
		await this.commands.clickOnPopUpMenu(target, "DomainRule");
		await this.fillRule(name, errorField, errorCode, errorCondition);
		await this.commands.saveAndAssertRowVisible(name);
	}

	/**
	 * Add root group
	 */
	async addRootGroup(name: string): Promise<void> {
		await this.page.locator("button").filter({ hasText: "Add group" }).click();
		await this.page.locator(Selector.DIALOG_NODE_TITLE).filter({ hasText: "DomainGroup" }).click();
		await this.page.locator("input[id*=Name]").fill(name);
		await this.commands.saveAndAssertRowVisible(name);
	}
}
