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

import {
	rpcRequest,
	addBundle,
	addProduct,
	addCategory,
	generateProduct,
	generateCategory,
	linkProductToCategory,
	linkCategoryToCategory,
	linkProductToBundle
} from "../../../utils/index.js";

import cat1Json from "../documents/categories/DomainCategory-1.json" with { type: "json" };
import cat2Json from "../documents/categories/DomainCategory-2.json" with { type: "json" };
import cat3Json from "../documents/categories/DomainCategory-3.json" with { type: "json" };
import cat4Json from "../documents/categories/DomainCategory-4.json" with { type: "json" };
import cat5Json from "../documents/categories/DomainCategory-5.json" with { type: "json" };
import cat6Json from "../documents/categories/DomainCategory-6.json" with { type: "json" };
import bundle1Json from "../documents/categories/DomainBundle-1.json" with { type: "json" };
import bundle2Json from "../documents/categories/DomainBundle-2.json" with { type: "json" };
import product1Json from "../documents/categories/DomainProduct-1.json" with { type: "json" };
import product2Json from "../documents/categories/DomainProduct-2.json" with { type: "json" };
import product3Json from "../documents/categories/DomainProduct-3.json" with { type: "json" };
import product4Json from "../documents/categories/DomainProduct-4.json" with { type: "json" };
import product5Json from "../documents/categories/DomainProduct-5.json" with { type: "json" };

interface Params {
	slim?: boolean;
}

export async function main(params?: Params) {
	const cat1 = addCategory("Cat1", cat1Json);
	const cat2 = addCategory("Cat2", cat2Json);
	const cat3 = addCategory("Cat3", cat3Json);
	const cat4 = addCategory("Cat4", cat4Json);
	const cat5 = addCategory("Cat5", cat5Json);
	const cat6 = addCategory("Cat6", cat6Json);
	const cat7 = addCategory("Cat7", generateCategory("Random Inc"));

	const bundle1 = addBundle("Bundle1", bundle1Json);
	const bundle2 = addBundle("Bundle2", bundle2Json);

	const product1 = addProduct("Product1", product1Json);
	const product2 = addProduct("Product2", product2Json);
	const product3 = addProduct("Product3", product3Json);
	const product4 = addProduct("Product4", product4Json);
	const product5 = addProduct("Product5", product5Json);

	const NEXT_PRODUCT_INDEX = 6;

	const requests: JsonRpc2Request[] = [
		cat1,
		cat2,
		cat3,
		cat4,
		cat5,
		cat6,
		bundle1,
		bundle2,
		product1,
		product2,
		product3,
		product4,
		product5,
		linkCategoryToCategory("Cat1Cat3", cat1, cat3),
		linkCategoryToCategory("Cat1Cat4", cat1, cat4),
		linkCategoryToCategory("Cat5Cat6", cat5, cat6),
		linkProductToCategory("Cat1Bundle1", cat1, bundle1),
		linkProductToCategory("Cat5Bundle2", cat5, bundle2),
		linkProductToCategory("Cat3Product1", cat3, product1),
		linkProductToCategory("Cat1Product2", cat1, product2),
		linkProductToCategory("Cat6Product3", cat6, product3),
		linkProductToCategory("Cat2Product4", cat2, product4),
		linkProductToCategory("Cat2Product5", cat2, product5),
		linkProductToBundle("Bundle1Product1", bundle1, product1)
	];

	if (!params?.slim) {
		const generatedProducts = Array.from({ length: 50 }).map((_, index) => {
			return addProduct("Product" + String(NEXT_PRODUCT_INDEX + index), generateProduct());
		});

		const generatedProductsToCategoryLinks = generatedProducts.map((product, index) => {
			return linkProductToCategory("Cat7Product" + String(NEXT_PRODUCT_INDEX + index), cat7, product);
		});
		requests.push(cat7, ...generatedProducts, ...generatedProductsToCategoryLinks);
	}

	const responses = await rpcRequest(requests);
	if (JsonRpc2Response.hasErrors(responses)) {
		console.error(
			inspect(
				responses.filter((res) => !!res.error),
				{ depth: 10 }
			)
		);
		process.exit(1);
	}
}
