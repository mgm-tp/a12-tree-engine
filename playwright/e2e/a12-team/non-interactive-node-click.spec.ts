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

import { cleanDocumentsData, seedData } from "../../../services-utils/src/api.js";

import { Selector } from "../selectors.js";

import { A12TeamUtils } from "./utils.js";

test.describe("rowStyleGetter", () => {
	test.beforeAll(async () => {
		await cleanDocumentsData({ showcases: "a12-teams" });
		await seedData({ preset: "a12-teams" });
	});

	test("remove onClick event from non-interactive row", async ({ page }) => {
		const commands = new PlaywrightCommands(page);
		const utils = new A12TeamUtils(page);
		await utils.visitA12Team({ custom: true });

		await commands.expandNode("A12");
		await commands.expandNode("Engines");

		const interactiveRowNames = ["Allan", "Leonard", "Jane", "Frankie"];
		const nonInteractiveRowNames = ["Nicolas", "Levi"];

		// Assert clicking interactive rows
		for (const name of interactiveRowNames) {
			await expect(commands.getRow(name)).toBeVisible();
			await expect(commands.getRow(name)).not.toBeDisabled();
			await commands.getRow(name).click();
			await expect(page.locator(Selector.TOAST).getByText("You've just select a Person")).toBeVisible();
			await page.locator(Selector.TOAST).getByRole("button", { name: "Close" }).click();
			// Wait for toast to disappear before next iteration
			await expect(page.locator(Selector.TOAST)).toHaveCount(0, { timeout: 5000 });
		}

		// Assert clicking non-interactive rows
		for (const name of nonInteractiveRowNames) {
			await expect(commands.getRow(name)).toBeVisible();
			await expect(commands.getRow(name)).not.toBeDisabled();
			await commands.getRow(name).click();
			await expect(page.locator(Selector.TOAST)).toHaveCount(0);
		}
	});
});
