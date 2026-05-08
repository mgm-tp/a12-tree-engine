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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { call } from "typed-redux-saga";

import {
	maybeAsyncFnWrapper,
	createA12DataServiceDataLoader,
	type TreeEngineDataLoader,
	DataOperation,
	TreeEngineServerConnectorFactories
} from "@com.mgmtp.a12.treeengine/treeengine-core";
import { ModuleRegistryProvider } from "@com.mgmtp.a12.client/client-core";

const defaultDataLoader: TreeEngineDataLoader = createA12DataServiceDataLoader({});

// tag::CustomDataLoaderFieldsProjection[]
/**
 * Custom data loader for TreeEngine that modifies the behavior of the default data loader.
 * This loader adds an extra field to the queries when a move operation is performed.
 * It is used to ensure that the extra data is loaded when moving nodes in the tree engine.
 */
export const CustomDataLoaderFieldsProjection: TreeEngineDataLoader = {
	*provideData(params) {
		const { queries, mutations } = params;

		const isMoveNodeOperation = mutations?.some((mutation) => mutation.type === "MOVE_NODE");

		const newQueries = queries.map((query) => {
			if (
				DataOperation.Query.ListChildNodes.Query.isAssignableFrom(query) &&
				query.targetDocumentModel === "DomainProduct" &&
				isMoveNodeOperation // This flag indicate whether a custom query logic shall be applied
			) {
				return {
					...query,
					// Extends the default fields to include the ProductType.
					// Can be undefined, which shall make the Query request to return every field available.
					fields: query.fields && [...query.fields, "/Product/ProductType"],
					linkDocumentFields: query.linkDocumentFields && [...query.linkDocumentFields, "/AdditionalDetails/Quantity"]
				};
			}
			return query;
		});

		return yield* call(maybeAsyncFnWrapper(defaultDataLoader.provideData), {
			...params,
			queries: newQueries
		});
	}
};

// end::CustomDataLoaderFieldsProjection[]

// tag::CustomDataLoader[]
function setup() {
	const settings: TreeEngineServerConnectorFactories.ModuleSettings = {
		dataLoader: CustomDataLoaderFieldsProjection
	};

	ModuleRegistryProvider.getInstance().addModule(TreeEngineServerConnectorFactories.createModule(settings));
}

const defaultTreeEngineDataLoader = createA12DataServiceDataLoader({});
const customTreeEngineDataLoader: TreeEngineDataLoader = {
	*provideData(params) {
		const { queries, mutations, activityId, documentProcessors } = params;
		//
		// Customization go here
		//
		return yield* call(maybeAsyncFnWrapper(defaultTreeEngineDataLoader.provideData), params);
	}
};
// end::CustomDataLoader[]
