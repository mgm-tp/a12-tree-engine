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

import { test, expect, type Page } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { cleanDocumentsData, seedData } from "../../../services-utils/src/api.js";

import { Selector } from "../selectors.js";

import { A12TeamUtils } from "./utils.js";

test.describe("multi level tree", () => {
	let commands: PlaywrightCommands;
	let utils: A12TeamUtils;
	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
	});

	async function createLocation(page: Page, name: string, parent = "A12") {
		await commands.buttonByDescription(commands.getRow(parent), "Insert a child").click();
		await page.locator(Selector.DIALOG_NODE_TITLE).getByText("Location", { exact: true }).click();
		await commands.waitUntilLoaded();
		await page.locator("#a12-Name-field_048f2").fill(name);
		await page.getByRole("button", { name: "Submit" }).click();
		await commands.waitUntilLoaded();
	}

	test("should run properly with preload child nodes", async ({ page }) => {
		await utils.visitA12Team({ multiLevel: true });

		await utils.createSubTeam("TPS", "A12");
		// Self-repeat chain (Team -> Team) and a terminal relation (Team -> Person)
		await utils.createSubTeam("Core", "TPS");
		await utils.createSubTeam("Platform", "Core");
		await utils.createPerson("Alice", "Core");
		await expect(commands.getRow("A12")).toBeVisible();

		await createLocation(page, "Da Nang", "TPS");
		await createLocation(page, "Hai Chau", "Da Nang");
		await createLocation(page, "Quang Trung", "Hai Chau");
		await createLocation(page, "1st floor", "Quang Trung");
		await utils.visitA12Team({ multiLevel: true });

		await expect(commands.getRow("A12")).toBeVisible();
		await commands.assertExpanded("A12", true);
		await expect(commands.getRow("UP")).toBeVisible();
		await commands.assertExpanded("UP", true);

		await expect(commands.getRow("Engines")).toBeVisible();
		await commands.assertExpanded("Engines", true);

		await expect(commands.getRows(undefined, "Jane")).toHaveCount(2);
		await expect(commands.getRow("TPS")).toBeVisible();
		await commands.assertExpanded("TPS", true);

		// Core is under TPS; with preload, children are mapped but not shown until expanded
		await expect(commands.getRow("Core")).toBeVisible();
		await expect(commands.getRow("Da Nang")).toBeVisible();
		await commands.assertExpanded("Da Nang", true);

		await expect(commands.getRow("Hai Chau")).toBeVisible();
		await commands.assertExpanded("Hai Chau", true);

		await expect(commands.getRow("Quang Trung")).toBeVisible();
		await commands.assertExpanded("Quang Trung", true);

		await expect(commands.getRow("1st floor")).toHaveCount(0);

		// Expanding Core should reveal Platform (last self-repeat level) and Alice (terminal TeamPerson)
		await commands.expandNode("Core");
		await expect(commands.getRow("Platform")).toBeVisible();
		await expect(commands.getRow("Platform")).not.toHaveAttribute("aria-expanded");
		await expect(commands.getRow("Alice")).toBeVisible();

		// Expanding Quang Trung should show its nested location
		await commands.expandNode("Quang Trung");
		await expect(commands.getRow("1st floor")).toBeVisible();
		await expect(commands.getRow("1st floor")).not.toHaveAttribute("aria-expanded");
	});

	test("should handle expand all nodes", async ({ page }) => {
		await utils.visitA12Team({ multiLevel: true });

		await commands.assertExpanded("A12", true);

		await commands.assertExpanded("UP", true);

		await commands.assertExpanded("Engines", true);

		await utils.createSubTeam("Content Engine", "Engines");
		await utils.createSubTeam("Data Binding", "Content Engine");
		await utils.createSubTeam("Editor", "Content Engine");
		await utils.createPerson("Nam", "Content Engine");
		await utils.createPerson("Mai", "Data Binding");

		await utils.visitA12Team({ multiLevel: true });

		await commands.assertExpanded("A12", true);

		await commands.assertExpanded("UP", true);

		await commands.assertExpanded("Engines", true);

		await commands.assertExpanded("Content Engine", true);

		await expect(commands.getRow("Data Binding")).toHaveCount(0);
		await expect(commands.getRow("Editor")).toHaveCount(0);

		await commands.getRow("Content Engine").click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).getByText("Expand All").click();

		await expect(commands.getRow("Data Binding")).toBeVisible();
		await expect(commands.getRow("Editor")).toBeVisible();
		await expect(commands.getRow("Nam")).toBeVisible();
		await expect(commands.getRow("Mai")).toBeVisible();
	});

	test("should select parent nodes when all children are selected", async ({ page }) => {
		await utils.visitA12Team({ multiLevel: true });

		await page.locator(`${Selector.SUB_HEADER} ${Selector.MULTI_SELECTION_BUTTON}`).first().click();
		await commands.waitUntilLoaded();

		await commands.assertExpanded("UP", true);
		await commands.assertExpanded("Engines", true);

		const getCheckbox = (name: string) => commands.getRow(name).locator(Selector.CHECKBOX_INPUT);
		const upCheckbox = getCheckbox("UP");
		await expect(upCheckbox).not.toBeChecked();
		await expect(upCheckbox).not.toHaveAttribute("aria-checked", "mixed");

		const children = ["Jane", "Levi", "Frankie"] as const;
		for (const child of children) {
			const checkbox = getCheckbox(child);
			await checkbox.click();
			await expect(checkbox).toBeChecked();
		}

		await expect(upCheckbox).toBeChecked();

		const a12Checkbox = getCheckbox("A12");
		await expect(a12Checkbox).toHaveAttribute("aria-checked", "mixed");

		const enginesCheckbox = getCheckbox("Engines");
		await expect(enginesCheckbox).not.toBeChecked();
		await expect(enginesCheckbox).not.toHaveAttribute("aria-checked", "mixed");
	});

	/**
	 * Tests that creating a node at a deep level after expanding updates the tree correctly.
	 * After creating L3 under L2 (which is already expanded), the save handler should use
	 * overrideExpansionDepth matching the currently expanded depth, so L3 appears with the
	 * correct expander state without a full reload.
	 */
	test("should show new child node with expander after creating at deep level", async ({ page }) => {
		await utils.visitA12Team({ multiLevel: true });

		await utils.createSubTeam("L1", "UP");
		await utils.createSubTeam("L2", "L1");

		await expect(commands.getRow("L1")).toBeVisible();
		await commands.assertExpanded("L1", true);
		await expect(commands.getRow("L2")).toBeVisible();

		// L2 should have no expander (no children yet)
		await expect(commands.getRow("L2")).not.toHaveAttribute("aria-expanded");
		await utils.createSubTeam("L3", "L2");
		// After save, L3 should be visible immediately (save handler used overrideExpansionDepth)
		await expect(commands.getRow("L3")).toBeVisible();

		// L3 has no children yet, so no expander
		await expect(commands.getRow("L3")).not.toHaveAttribute("aria-expanded");
		await utils.createSubTeam("L4", "L3");
		// After save, L4 should appear immediately
		await expect(commands.getRow("L4")).toBeVisible();
		await expect(commands.getRow("L4")).not.toHaveAttribute("aria-expanded");

		// Create L5 under L4 (depth 5 = far beyond maxDepth + 1)
		await utils.createSubTeam("L5", "L4");
		// L5 should appear immediately after save
		await expect(commands.getRow("L5")).toBeVisible();
	});
});
