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
import { Selector } from "../../selectors";

import { CategoriesUtils } from "../utils";

test.describe("nested pagination block", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);

		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await generateNodes({ categories: [1, 6, 6], products: 6 });

		await page.goto("");
		await utils.navigate("Pagination");
	});

	test("should render only ONE for each paginate-able row", async ({ page }) => {
		// Check initial pagination rows
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0Level0" })).toHaveCount(1);
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1Level1" })).toHaveCount(1);

		// CatC0C1C1Level2 should not have pagination row initially
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1C1Level2" })).toHaveCount(0);
		await commands.expandNode("CatC0C1C1Level2");
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1C1Level2" })).toHaveCount(1);

		// Load more rows for CatC0C1Level1
		await commands.loadMoreRows(undefined, "CatC0C1Level1");
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0Level0" })).toHaveCount(1);
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1Level1" })).toHaveCount(1);
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1C1Level2" })).toHaveCount(1);

		// CatC0C1C5Level2 should not have pagination row initially
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1C5Level2" })).toHaveCount(0);
		await commands.expandNode("CatC0C1C5Level2");
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1C5Level2" })).toHaveCount(1);

		// Load more rows for CatC0C1C5Level2 - pagination row should disappear
		await commands.loadMoreRows(undefined, "CatC0C1C5Level2");
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1C5Level2" })).toHaveCount(0);
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0Level0" })).toHaveCount(1);
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1Level1" })).toHaveCount(1);
		await expect(page.locator(Selector.PAGINATED_BODY_ROW).filter({ hasText: "CatC0C1C1Level2" })).toHaveCount(1);
	});
});
