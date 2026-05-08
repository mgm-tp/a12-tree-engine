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

import {
	DefaultRequestSelectorMap,
	TreeEngineServerConnectorFactories,
	type RequestSelectorMap
} from "@com.mgmtp.a12.treeengine/treeengine-core";
import { type Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type DataProvider } from "@com.mgmtp.a12.client/client-core";

// tag::requestSelectorMap[]
export const customRequestSelectorMap: RequestSelectorMap = {
	...DefaultRequestSelectorMap,
	// Example: add a custom constraint to child listing using the spread operator.
	// This merges an extra EXACT_MATCH constraint with whatever the default builder produces.
	loadListChildNodes: (config: Parameters<RequestSelectorMap["loadListChildNodes"]>[0]) => (state) => {
		const baseRequest = DefaultRequestSelectorMap.loadListChildNodes(config)(state);

		const extraConstraint: Query.Operator = {
			operator: "exact_match",
			field: "/category/status",
			value: "Active"
		};

		const mergedConstraint: Query.Operator = baseRequest.params.query.constraint
			? {
					operator: "and",
					operands: [baseRequest.params.query.constraint, extraConstraint]
				}
			: extraConstraint;

		// Narrow the type to the request's expected constraint

		return {
			...baseRequest,
			params: {
				...baseRequest.params,
				query: {
					...baseRequest.params.query,
					constraint: mergedConstraint
				}
			}
		};
	}
};
// end::requestSelectorMap[]

// tag::injectTreeEngine[]
export const provider: DataProvider = TreeEngineServerConnectorFactories.createDataProvider({
	requestSelectorMap: customRequestSelectorMap
});
// end::injectTreeEngine[]
