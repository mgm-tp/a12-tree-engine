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

import { generateNodes } from "../../../../services-utils/src";

import { ExecutionType, type GroupTestConfig } from "../types";
import { PlaywrightUtils } from "../utils";

export const groupTestPreload: GroupTestConfig = {
	id: "group-test-preload",
	setup: async () => {
		await generateNodes({
			categories: [1, 1, 20, 20]
		});
	},
	singleTestConfigs: [
		{
			id: "lazy-load.init",
			setupEach: async (page: Page) => {
				await page.goto("");
			},
			actions: async (page: Page) => {
				await PlaywrightUtils.navigate(page);
			}
		},
		{
			id: "preload.init",
			setupEach: async (page: Page) => {
				await page.goto("");
			},
			actions: async (page: Page) => {
				await PlaywrightUtils.navigate(page, "Custom Categories");
			}
		},
		{
			id: "lazy-load.expand",
			executionType: ExecutionType.SKIP,
			setupEach: async (page: Page) => {
				await page.goto("");
				await PlaywrightUtils.navigate(page);
			},
			actions: async (page: Page) => {
				const commands = new PlaywrightCommands(page);
				await commands.expandNode("CatC0C0C19Level2");
				const rows = commands.getRows();
				await expect(rows).toHaveCount(42);
			}
		},
		{
			id: "preload.expand",
			setupEach: async (page: Page) => {
				await page.goto("");
				await PlaywrightUtils.navigate(page, "Custom Categories");
			},
			actions: async (page: Page) => {
				const commands = new PlaywrightCommands(page);
				await commands.expandNode("CatC0C0C19Level2");
				const rows = commands.getRows();
				await expect(rows).toHaveCount(42);
			}
		}
	]
};
