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

import { test } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { cleanDocumentsData, seedData } from "../../../../services-utils/src/index.js";
import { Selector } from "../../selectors.js";

import { ModelEditorUtils } from "../utils.js";

test.describe("select range of nodes concerning behaviors consistence with OE", () => {
	let commands: PlaywrightCommands;
	let utils: ModelEditorUtils;

	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new ModelEditorUtils(page);

		await cleanDocumentsData({ showcases: ["model-editor"] });
		await seedData({ preset: "model-editor" });
		await utils.navigateToFileExplorer();
	});

	test.describe("select forward and backward", () => {
		test("should work", async ({ page }) => {
			// Shift-select forward
			await commands.clickCheckbox(undefined, "java.exe");
			await commands.clickCheckbox(undefined, "DomainPerson.json", true);

			await commands.assertMultiSelectionState(page, {
				counter: 7,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["java.exe", "D:", "autostart.bat", "E:", "DomainTeam.json", "Person.json", "DomainPerson.json"],
					partlySelected: ["My Computer", "C:", "Program Files", "Java"],
					deselected: [/.*/]
				}
			});

			// Shift-select backward sibling nodes of same parent
			await commands.clickCheckbox(undefined, "Person.json", true);
			await commands.assertMultiSelectionState(page, {
				counter: 7,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["java.exe", "D:", "autostart.bat", "E:", "DomainTeam.json", "Person.json", "DomainPerson.json"],
					partlySelected: ["My Computer", "C:", "Program Files", "Java"],
					deselected: [/.*/]
				}
			});

			// Shift-select backward but same direction
			await commands.clickCheckbox(undefined, "autostart.bat", true);
			await commands.assertMultiSelectionState(page, {
				counter: 3,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["java.exe", "D:", "autostart.bat"],
					partlySelected: ["My Computer", "C:", "Program Files", "Java"],
					deselected: [/.*/]
				}
			});

			// Shift-select backward but different direction
			await commands.clickCheckbox(undefined, "npm.cmd", true);
			await commands.assertMultiSelectionState(page, {
				counter: 5,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["npm.cmd", "node.exe", "Java", "javaws.exe", "java.exe"],
					partlySelected: ["My Computer", "C:", "Program Files", "Node"],
					deselected: [/.*/]
				}
			});

			// Shift-select backward but different direction again
			await commands.clickCheckbox(undefined, "DomainPerson.json", true);
			await commands.assertMultiSelectionState(page, {
				counter: 7,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["java.exe", "D:", "autostart.bat", "E:", "DomainTeam.json", "Person.json", "DomainPerson.json"],
					partlySelected: ["My Computer", "C:", "Program Files", "Java"],
					deselected: [/.*/]
				}
			});

			// Shift-select the initial node
			await commands.clickCheckbox(undefined, "java.exe", true);
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["java.exe"],
					partlySelected: ["My Computer", "C:", "Program Files", "Java"],
					deselected: [/.*/]
				}
			});

			// Shift-select initially
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await commands.waitUntilLoaded();
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await commands.waitUntilLoaded();

			await commands.clickCheckbox(undefined, "node.exe", true);
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["node.exe"],
					partlySelected: ["My Computer", "C:", "Program Files", "Node"],
					deselected: [/.*/]
				}
			});

			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await commands.waitUntilLoaded();
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await commands.waitUntilLoaded();
			await commands.clickCheckbox(undefined, "javaws.exe", true);
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["javaws.exe"],
					partlySelected: ["My Computer", "C:", "Program Files", "Java"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "autostart.bat", true);
			await commands.assertMultiSelectionState(page, {
				counter: 4,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["javaws.exe", "java.exe", "D:", "autostart.bat"],
					partlySelected: ["My Computer", "C:", "Program Files", "Java"],
					deselected: [/.*/]
				}
			});

			// Select a node, de-select and then shift-select
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await commands.waitUntilLoaded();
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await commands.waitUntilLoaded();

			await commands.clickCheckbox(undefined, "Node");
			await commands.assertMultiSelectionState(page, {
				counter: 3,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Node", "npm.cmd", "node.exe"],
					partlySelected: ["My Computer", "C:", "Program Files"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Node");
			await commands.assertMultiSelectionState(page, {
				counter: 0,
				overallState: "deselected",
				nodeStates: {
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "npm.cmd", true);
			await commands.assertMultiSelectionState(page, {
				counter: 1,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["npm.cmd"],
					partlySelected: ["My Computer", "C:", "Program Files", "Node"],
					deselected: [/.*/]
				}
			});

			// Shift-select multiple ranges
			await commands.clickCheckbox(undefined, "javaws.exe", true);
			await commands.assertMultiSelectionState(page, {
				counter: 5,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["npm.cmd", "node.exe", "Java", "javaws.exe", "java.exe"],
					partlySelected: ["My Computer", "C:", "Program Files", "Node"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Person.json");
			await commands.assertMultiSelectionState(page, {
				counter: 6,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["npm.cmd", "node.exe", "Java", "javaws.exe", "java.exe", "Person.json"],
					partlySelected: ["My Computer", "C:", "Program Files", "Node", "E:"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "DomainPerson.json", true);
			await commands.assertMultiSelectionState(page, {
				counter: 7,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["npm.cmd", "node.exe", "Java", "javaws.exe", "java.exe", "Person.json", "DomainPerson.json"],
					partlySelected: ["My Computer", "C:", "Program Files", "Node", "E:"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "DomainTeam.json", true);
			await commands.assertMultiSelectionState(page, {
				counter: 7,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["npm.cmd", "node.exe", "Java", "javaws.exe", "java.exe", "DomainTeam.json", "Person.json"],
					partlySelected: ["My Computer", "C:", "Program Files", "Node", "E:"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "autostart.bat", true);
			await commands.assertMultiSelectionState(page, {
				counter: 10,
				overallState: "partlySelected",
				nodeStates: {
					selected: [
						"npm.cmd",
						"node.exe",
						"Java",
						"javaws.exe",
						"java.exe",
						"autostart.bat",
						"E:",
						"DomainTeam.json",
						"Person.json",
						"DomainPerson.json"
					],
					partlySelected: ["My Computer", "C:", "Program Files", "Node", "D:"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "DomainPerson.json", true);
			await commands.assertMultiSelectionState(page, {
				counter: 7,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["npm.cmd", "node.exe", "Java", "javaws.exe", "java.exe", "Person.json", "DomainPerson.json"],
					partlySelected: ["My Computer", "C:", "Program Files", "Node", "E:"],
					deselected: [/.*/]
				}
			});

			// Reset latestMultiSelectionNode after
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await commands.waitUntilLoaded();
			await page.locator(Selector.MULTI_SELECTION_BUTTON).click();
			await commands.waitUntilLoaded();

			await commands.clickCheckbox(undefined, "Program Files");
			await commands.assertMultiSelectionState(page, {
				counter: 7,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["Program Files", "Node", "npm.cmd", "node.exe", "Java", "javaws.exe", "java.exe"],
					partlySelected: ["My Computer", "C:"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "autostart.bat", true);
			await commands.assertMultiSelectionState(page, {
				counter: 9,
				overallState: "partlySelected",
				nodeStates: {
					selected: [
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
					partlySelected: ["My Computer", "C:"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "Program Files");
			await commands.assertMultiSelectionState(page, {
				counter: 2,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["D:", "autostart.bat"],
					partlySelected: ["My Computer"],
					deselected: [/.*/]
				}
			});

			await commands.clickCheckbox(undefined, "npm.cmd");
			await commands.assertMultiSelectionState(page, {
				counter: 3,
				overallState: "partlySelected",
				nodeStates: {
					selected: ["D:", "autostart.bat", "npm.cmd"],
					partlySelected: ["My Computer", "C:", "Program Files", "Node"],
					deselected: [/.*/]
				}
			});
		});
	});
});
