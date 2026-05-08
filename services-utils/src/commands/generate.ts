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

import { inspect } from "node:util";

import { type JsonRpc2Request, JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { rpcRequest, addCategory, addProduct, linkCategoryToCategory, linkProductToCategory } from "../utils/index.js";

import { main as runWaitOn } from "./wait-on.js";

export interface GenerateParams {
	waitOn?: boolean;
	categories: number[];
	products?: number;
}

function createSuffixFactory(parentSuffix: string) {
	const [suffix, parentLevel = -1] = parentSuffix.split("Level");
	const level = +parentLevel + 1;

	// Add node level to avoid a node name is suffix of another one
	// So in E2E, we can select a unique node exactly by its name
	const subcategorySuffix = (index: number) => `${suffix}C${index}Level${level}`;
	const productSuffix = (index: number) => `${suffix}P${index}Level${level}`.replace("Cat", "Prod");
	const linkCatCatSuffix = (index: number) => `${parentSuffix}-${subcategorySuffix(index)}`;
	const linkCatProdSuffix = (index: number) => `${parentSuffix}-${productSuffix(index)}`;

	return {
		subcategorySuffix,
		productSuffix,
		linkCatCatSuffix,
		linkCatProdSuffix
	};
}

function createRequests(
	parent: JsonRpc2Request | undefined,
	parentSuffix: string,
	params: GenerateParams
): JsonRpc2Request[] {
	const { subcategorySuffix, productSuffix, linkCatProdSuffix, linkCatCatSuffix } = createSuffixFactory(parentSuffix);
	const { categories = [], products = 0 } = params;

	const result: JsonRpc2Request[] = [];
	const addSubcategoryRequests = Array.from({ length: categories[0] ?? [] }, (_, index) =>
		addCategory(subcategorySuffix(index))
	);
	let addProductRequests: JsonRpc2Request[] = [];

	if (parent) {
		addSubcategoryRequests.forEach((child, index) => {
			result.push(linkCategoryToCategory(linkCatCatSuffix(index), parent, child));
		});

		addProductRequests = Array.from({ length: products }, (_, index) => addProduct(productSuffix(index)));
		addProductRequests.forEach((child, index) => {
			result.push(linkProductToCategory(linkCatProdSuffix(index), parent, child));
		});
	}

	result.unshift(...addSubcategoryRequests, ...addProductRequests);

	if (categories.length > 0) {
		addSubcategoryRequests.forEach((child, index) =>
			result.push(...createRequests(child, subcategorySuffix(index), { ...params, categories: categories.slice(1) }))
		);
	}

	return result;
}

export async function main(params: GenerateParams) {
	if (params.waitOn) {
		await runWaitOn({});
	}

	const requests = createRequests(undefined, "Cat", params);

	const responses = await rpcRequest(requests);
	if (JsonRpc2Response.hasErrors(responses)) {
		console.error(inspect(responses, { depth: 10 }));
		process.exit(1);
	}
}
