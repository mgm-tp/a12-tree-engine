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

import { cleanDocumentsData, generateNodes } from "../../../../services-utils/src";

import { CategoriesUtils } from "../utils";

test.describe("loading behavior", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);

		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await generateNodes({ categories: [1, 2, 6], products: 6 });

		await page.goto("");
		await utils.navigate("Pagination");
	});

	test("should load incrementally", async () => {
		// Check initial row count
		const rows = commands.getRows();
		await expect(rows).toHaveCount(16);

		// Load more rows for CatC0C1Level1
		await commands.loadMoreRows(undefined, "CatC0C1Level1");
		await expect(rows).toHaveCount(21);

		// Load more rows for CatC0Level0
		await commands.loadMoreRows(undefined, "CatC0Level0");
		await expect(rows).toHaveCount(24);

		// Expand node CatC0C1C5Level2
		await commands.expandNode("CatC0C1C5Level2");
		await expect(rows).toHaveCount(29);

		// Load more rows for CatC0C1C5Level2
		await commands.loadMoreRows(undefined, "CatC0C1C5Level2");
		await expect(rows).toHaveCount(30);
	});
});
