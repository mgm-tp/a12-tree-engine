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

import { cleanDocumentsData, seedData } from "../../../services-utils/src/api.js";

import { InsertSiblingPosition } from "../types.js";

import { A12TeamUtils } from "./utils.js";

test.describe("add siblings", () => {
	let utils: A12TeamUtils;
	let commands: PlaywrightCommands;
	test.beforeEach(async ({ page }) => {
		commands = new PlaywrightCommands(page);
		utils = new A12TeamUtils(page);
		// Clean and seed data using services-utils API
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });

		// Initialize utils and navigate to A12 team page
		await utils.visitA12Team();
	});

	test("add team below team root", async () => {
		await utils.createSiblingTeam("A12", "", InsertSiblingPosition.BELOW);
		await commands.assertRowsVisible(["A12", "UP", "Engines", "Team below A12"]);
	});

	test("add person below", async () => {
		await commands.deleteNode(undefined, "Engines");
		await commands.expandNode("UP");
		await utils.createSiblingPerson("Levi", InsertSiblingPosition.BELOW);
		await commands.assertRowsVisible(["UP", "Jane", "Levi", "Person below Levi", "Frankie"], 1);
	});

	test("add team below", async () => {
		await utils.createSiblingTeam("UP", "A12", InsertSiblingPosition.BELOW);
		await commands.assertRowsVisible(["UP", "Team below UP", "Engines"], 1);
	});
});
