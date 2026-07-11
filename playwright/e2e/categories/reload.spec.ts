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

import { cleanDocumentsData, seedData } from "../../../services-utils/src/index.js";

import { Selector } from "../selectors.js";

import { CategoriesUtils } from "./utils.js";

test.describe("reload", () => {
	let utils: CategoriesUtils;
	let commands: PlaywrightCommands;

	test.beforeAll(async () => {
		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await seedData({
			preset: "categories"
		});
	});

	test.beforeEach(async ({ page }) => {
		utils = new CategoriesUtils(page);
		commands = new PlaywrightCommands(page);
		await page.goto("");
		await utils.navigate();
	});

	test("should reload properly while simulating the external change to the tree", async ({ page }) => {
		// Verify initial state
		await expect(commands.getRow("Samsung Galaxy A51")).toBeVisible();
		await expect(commands.getRow("Samsung high-end phones")).toBeVisible();

		// Delete Samsung Galaxy A51 document
		const galaxyDocuments = await requestDocuments(page, "DomainProduct", "Samsung Galaxy A51");
		await requestDeleteDocuments(page, galaxyDocuments);

		// Reload from Samsung node - should restore deleted product
		await commands.getRow("Samsung").first().click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Reload direct children" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("Samsung Galaxy A51")).toBeVisible();

		// Reload direct subtrees - should remove deleted product
		await commands.getRow("Samsung").first().click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Reload direct subtrees" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("Samsung high-end phones")).toBeVisible();
		await expect(commands.getRow("Samsung Galaxy A51")).toHaveCount(0);

		// Delete Samsung high-end phones category
		const categoryDocuments = await requestDocuments(page, "DomainCategory", "Samsung high-end phones");
		await requestDeleteDocuments(page, categoryDocuments);

		await commands.getRow("Samsung").first().click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Reload direct subtrees" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("Samsung high-end phones")).toHaveCount(0);

		// Delete Nokia collector edition bundle
		const bundleDocuments = await requestDocuments(page, "DomainBundle", "Nokia collector edition");
		await requestDeleteDocuments(page, bundleDocuments);

		await commands.getRow("Nokia").click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Reload direct children" }).click();
		await commands.waitUntilLoaded();
		await expect(commands.getRow("Nokia collector edition")).toHaveCount(0);

		// Modify Nokia high-end phones category name
		const nokiaDocuments = await requestDocuments(page, "DomainCategory", "Nokia high-end phones");
		await requestModifyDocuments(page, nokiaDocuments, () => ({
			Category: {
				Name: "Nokia luxury phones",
				Description: "Nokia phones that are over 200 USD"
			}
		}));

		await commands.getRow("Nokia high-end phones").click({ button: "right" });
		await page.locator(Selector.CONTEXT_MENU_ITEM).filter({ hasText: "Self reload" }).click();
		await expect(commands.getRow("Nokia high-end phones")).toHaveCount(0);
		await expect(commands.getRow("Nokia luxury phones")).toBeVisible();

		// Clean documents and reload whole tree
		await cleanDocumentsData({
			showcases: ["categories"]
		});
		await page.locator(`${Selector.SUB_HEADER} button[aria-label="Reload whole tree"]`).click();
		await commands.waitUntilLoaded();
		const rows = commands.getRows();
		await expect(rows).toHaveCount(0);
	});
});

// Helper functions for API requests
interface DocumentSpec {
	docRef: string;
	document: object;
}

async function requestDocuments(page: Page, documentName: string, text: string): Promise<DocumentSpec[]> {
	const baseUrl = new URL(page.url()).origin;

	const response = await page.request.post(`${baseUrl}/api/v2/rpc`, {
		data: [
			{
				jsonrpc: "2.0",
				id: "List",
				method: "QUERY",
				params: {
					query: {
						projectionName: "document",
						targetDocumentModel: documentName,
						paging: {
							pageNumber: 0,
							pageSize: 5
						},
						constraint: {
							operator: "simple_search",
							value: text
						}
					}
				}
			}
		]
	});

	const body = await response.json();
	const [result] = body;

	if (result && result.result && result.result.entries) {
		return result.result.entries;
	}

	return [];
}

async function requestDeleteDocuments(page: Page, documents: DocumentSpec[]): Promise<void> {
	const baseUrl = new URL(page.url()).origin;

	const deleteRequests = documents.map((doc, index) => ({
		jsonrpc: "2.0",
		id: `Delete-${index}`,
		method: "DELETE_DOCUMENT",
		params: { docRef: doc.docRef, locale: "en" }
	}));

	await page.request.post(`${baseUrl}/api/v2/rpc`, {
		data: deleteRequests
	});
}

async function requestModifyDocuments(
	page: Page,
	documents: DocumentSpec[],
	updater: (docRef: string, document: object) => object
): Promise<void> {
	const baseUrl = new URL(page.url()).origin;

	const modifyRequests = documents.map((doc, index) => ({
		jsonrpc: "2.0",
		id: `Modify-${index}`,
		method: "MODIFY_DOCUMENT",
		params: { docRef: doc.docRef, document: updater(doc.docRef, doc.document), locale: "en" }
	}));

	await page.request.post(`${baseUrl}/api/v2/rpc`, {
		data: modifyRequests
	});
}
