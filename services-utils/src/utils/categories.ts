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

import { faker } from "@faker-js/faker";

import { type JsonRpc2Request, type DocumentJsonRpc2Request } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { linkEntities } from "./index.js";

export function addCategory(suffix: string, document?: object): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddCategory${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document: document ?? { Category: { Name: `${suffix}` } },
			documentModelName: "DomainCategory",
			locale: "en_US"
		}
	};
}

export function addBundle(
	suffix: string,
	document: { [key: string]: object }
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddBundle${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainBundle",
			locale: "en_US"
		}
	};
}

export function addProduct(suffix: string, document?: object): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddProduct${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document: document ?? { Properties: { Name: `${suffix}` } },
			documentModelName: "DomainProduct",
			locale: "en_US"
		}
	};
}

faker.seed(100);

export function generateCategory(name?: string): { [key: string]: object } {
	return {
		Category: {
			Name: name
		}
	};
}
export function generateProduct(): { [key: string]: object } {
	return {
		Properties: {
			Name: `${faker.commerce.productAdjective()} ${faker.commerce.productName()}`,
			Description: faker.commerce.productDescription(),
			Price: 100 + faker.number.int(5000)
		}
	};
}

export function linkCategoryToCategory(suffix: string, parent: JsonRpc2Request, child: JsonRpc2Request) {
	return linkEntities(suffix, "CategoryCategory", [
		{ role: "Parent", docRef: `#{#${parent.id}.metadata.docRef}` },
		{ role: "Child", docRef: `#{#${child.id}.metadata.docRef}` }
	]);
}

export function linkProductToCategory(suffix: string, category: JsonRpc2Request, product: JsonRpc2Request) {
	return linkEntities(
		suffix,
		"ProductCategory",
		[
			{ role: "Category", docRef: `#{#${category.id}.metadata.docRef}` },
			{ role: "Product", docRef: `#{#${product.id}.metadata.docRef}` }
		],
		{}
	);
}

export function linkProductToBundle(suffix: string, bundle: JsonRpc2Request, product: JsonRpc2Request) {
	return linkEntities(suffix, "BundleProduct", [
		{ role: "Bundle", docRef: `#{#${bundle.id}.metadata.docRef}` },
		{ role: "Product", docRef: `#{#${product.id}.metadata.docRef}` }
	]);
}
