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


import { test, expect, type Locator, type Page } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { cleanDocumentsData, seedData } from "../../../../services-utils/src";
import { Selector } from "../../selectors";

import { ModelEditorUtils } from "../utils";

type MultiSelectionState = "selected" | "partlySelected" | "deselected";

/**
 * Helper class for testing multi-selection states
 */
class MultiSelectionTestHelper {
	constructor(
		private commands: PlaywrightCommands,
		private page: Page
	) {}

	/**
	 * Check the aria-checked state of a checkbox
	 */
	private async getCheckboxState(locator: Locator): Promise<"true" | "false" | "mixed"> {
		const checkbox = locator.locator(Selector.CHECKBOX_INPUT);
		const ariaChecked = await checkbox.getAttribute("aria-checked");
		return ariaChecked as "true" | "false" | "mixed";
	}

	/**
	 * Assert that a node has a specific multi-selection state
	 */
	private async assertNodeState(locator: Locator, expectedState: MultiSelectionState): Promise<void> {
		const state = await this.getCheckboxState(locator);

		switch (expectedState) {
			case "selected":
				expect(state).toBe("true");
				break;
			case "partlySelected":
				expect(state).toBe("mixed");
				break;
			case "deselected":
				expect(state).toBe("false");
				break;
		}
	}

	/**
	 * Test multi-selection states
	 */
	async test(params: {
		counter?: number;
		overallState: MultiSelectionState;
		nodeStates: Partial<Record<MultiSelectionState, (string | RegExp)[]>>;
	}): Promise<void> {
		// Check counter
		if (params.counter !== undefined) {
			const counter = this.page.locator(Selector.COUNTER);
			await expect(counter).toContainText(String(params.counter));
		}

		// Check overall state
		const overallCheckbox = this.page.locator('[data-role="table-header"]').locator('[data-role="checkbox"]');
		await this.assertNodeState(overallCheckbox, params.overallState);

		// Build expected states map
		const expectedStates: Record<string, MultiSelectionState> = {};
		const nodes = this.page.locator(Selector.NODE).filter({ hasNot: this.page.locator(Selector.VIRTUAL_ROOT) });
		const nodeCount = await nodes.count();

		for (let i = 0; i < nodeCount; i++) {
			const node = nodes.nth(i);
			const nameElement = node.locator('[data-role="tree-node-name"]');
			const nodeName = await nameElement.textContent();

			if (!nodeName) {
				continue;
			}

			const expectedState = (Object.keys(params.nodeStates) as MultiSelectionState[]).find((state) => {
				const matchers = params.nodeStates[state] ?? [];
				return matchers.some((matcher) =>
					typeof matcher === "string" ? matcher === nodeName : matcher.test(nodeName)
				);
			});

			if (!expectedState) {
				throw new Error(`Cannot deduce the expected state for node ${nodeName}`);
			}

			expectedStates[nodeName] = expectedState;
		}

		// Check each node state
		for (let i = 0; i < nodeCount; i++) {
			const node = nodes.nth(i);
			const nameElement = node.locator('[data-role="tree-node-name"]');
			const nodeName = await nameElement.textContent();

			if (!nodeName) {
				continue;
			}

			const row = this.commands.getRow(nodeName);
			await this.assertNodeState(row, expectedStates[nodeName]);
		}
	}
}

test.describe("select parent node when all child nodes are shown and selected", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;
	let multiSelectHelper: MultiSelectionTestHelper;

	test.beforeAll(async () => {
		await cleanDocumentsData({
			showcases: ["model-editor"],
			variant: "pagination"
		});
		await seedData({
			preset: "model-editor",
			variant: "pagination",
			data: "simple"
		});
	});

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);
		multiSelectHelper = new MultiSelectionTestHelper(commands, page);

		await utils.navigateToFileExplorer("MultiSelect Parent");
		await commands.waitUntilLoaded();
	});

	test("should work properly when fullSize <= pageSize", async () => {
		await commands.clickCheckbox(commands.getRow("npm.cmd"));
		await multiSelectHelper.test({
			counter: 1,
			overallState: "partlySelected",
			nodeStates: {
				selected: ["npm.cmd"],
				partlySelected: ["My Computer", "C:", "Program Files", "Node"],
				deselected: [/.*/]
			}
		});

		await commands.clickCheckbox(commands.getRow("java.exe"), true);
		await multiSelectHelper.test({
			counter: 8,
			overallState: "partlySelected",
			nodeStates: {
				selected: ["C:", "Program Files", "Node", "npm.cmd", "node.exe", "Java", "javaws.exe", "java.exe"],
				partlySelected: ["My Computer"],
				deselected: [/.*/]
			}
		});

		await commands.clickCheckbox(commands.getRow("autostart.bat"));
		await multiSelectHelper.test({
			counter: 10,
			overallState: "partlySelected",
			nodeStates: {
				selected: [
					"C:",
					"Program Files",
					"Node",
					"npm.cmd",
					"node.exe",
					"Java",
					"javaws.exe",
					"java.exe",
					"D:",
					"autostart.bat"
				],
				partlySelected: ["My Computer"],
				deselected: [/.*/]
			}
		});

		await commands.clickCheckbox(commands.getRow("DomainTeam.json"));
		await multiSelectHelper.test({
			counter: 11,
			overallState: "partlySelected",
			nodeStates: {
				selected: [
					"C:",
					"Program Files",
					"Node",
					"npm.cmd",
					"node.exe",
					"Java",
					"javaws.exe",
					"java.exe",
					"D:",
					"autostart.bat",
					"DomainTeam.json"
				],
				partlySelected: ["My Computer", "E:"],
				deselected: [/.*/]
			}
		});

		await commands.clickCheckbox(commands.getRow("Person.json"));
		await multiSelectHelper.test({
			counter: 12,
			overallState: "partlySelected",
			nodeStates: {
				selected: [
					"C:",
					"Program Files",
					"Node",
					"npm.cmd",
					"node.exe",
					"Java",
					"javaws.exe",
					"java.exe",
					"D:",
					"autostart.bat",
					"DomainTeam.json",
					"Person.json"
				],
				partlySelected: ["My Computer", "E:"],
				deselected: [/.*/]
			}
		});

		await commands.clickCheckbox(commands.getRow("DomainPerson.json"));
		await multiSelectHelper.test({
			counter: 15,
			overallState: "selected",
			nodeStates: {
				selected: [/.*/]
			}
		});
	});

	// This test changes data, so it should be the last one
	test("should work properly when fullSize > pageSize", async ({ page }) => {
		await commands.dragDrop("DomainTeam.json", "Node", "asChild");
		await commands.waitUntilLoaded();

		await commands.dragDrop("autostart.bat", "Node", "asChild");
		await commands.waitUntilLoaded();

		await commands.dragDrop("java.exe", "Node", "asChild");
		await commands.waitUntilLoaded();

		await commands.dragDrop("javaws.exe", "Node", "asChild");
		await commands.waitUntilLoaded();

		await expect(page.getByText("Load all 6 nodes")).toBeVisible();

		await commands.clickCheckbox(commands.getRow("java.exe"));
		await commands.clickCheckbox(commands.getRow("javaws.exe"));
		await commands.clickCheckbox(commands.getRow("autostart.bat"));
		await commands.clickCheckbox(commands.getRow("DomainTeam.json"));
		await commands.clickCheckbox(commands.getRow("npm.cmd"));

		await multiSelectHelper.test({
			counter: 5,
			overallState: "partlySelected",
			nodeStates: {
				selected: ["java.exe", "javaws.exe", "autostart.bat", "DomainTeam.json", "npm.cmd"],
				partlySelected: ["My Computer", "C:", "Program Files", "Node"],
				deselected: [/.*/]
			}
		});

		await commands.loadAllRows(undefined, "Node");

		await commands.clickCheckbox(commands.getRow("node.exe"));

		await multiSelectHelper.test({
			counter: 7,
			overallState: "partlySelected",
			nodeStates: {
				selected: ["Node", "java.exe", "javaws.exe", "autostart.bat", "DomainTeam.json", "npm.cmd", "node.exe"],
				partlySelected: ["My Computer", "C:", "Program Files"],
				deselected: [/.*/]
			}
		});
	});
});
