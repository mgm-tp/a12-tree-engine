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

import { call, type SagaGenerator, select } from "typed-redux-saga";

import { TreeEngineError } from "../../../../../core/error/index.js";
import { Identifier, TreeDataUtils } from "../../../../../core/store/index.js";
import {
	maybeAsyncFnWrapper,
	TreeEngineDataHolder,
	type TreeEngineOperation,
	TreeEngineSelectors
} from "../../../../client/index.js";
import { DataOperation } from "../../data-loaders/data-loader.js";

import { handleThumbnailUrlResult, hasAttachment } from "../resolver/attachment-utils.js";
import { getDocumentProcessors, type LoadPayload } from "../utils.js";

/** @internal */
export function* handleReloadNodes({
	config,
	operation,
	dataLoader
}: LoadPayload & { operation: TreeEngineOperation.ReloadNodes }): SagaGenerator<TreeEngineDataHolder[]> {
	const { activityId, dataHolders } = config;

	const models = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!models) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const documentProcessors = getDocumentProcessors(models);

	const { nodes } = operation.payload;

	const queries = nodes.map((node) => createQuery(node.id, node.type));

	const resultQueries = hasAttachment({ models })
		? [...queries, DataOperation.Query.LoadThumbnailUrls.create()]
		: [...queries];

	const resultSet = yield* call(maybeAsyncFnWrapper(dataLoader.provideData), {
		activityId,
		queries: resultQueries,
		documentProcessors
	});

	const queryResults = yield* call(handleThumbnailUrlResult, resultSet.queryResults, activityId);
	const getDocumentQueryResults = queryResults.filter(DataOperation.Query.GetDocument.Result.isAssignableFrom);

	return mapQueryResultsToDataHolders(
		dataHolders.filter(TreeEngineDataHolder.isAssignableFrom),
		getDocumentQueryResults
	);
}

function createQuery(docRef: string, docModel: string): DataOperation.Query.GetDocument.Query {
	return {
		source: docRef,
		targetDocumentModel: docModel,
		type: "GET_DOCUMENT",
		id: `GET_DOCUMENT/${docRef}`
	};
}

function mapQueryResultsToDataHolders(
	dataHolders: TreeEngineDataHolder[],
	queryResults: DataOperation.Query.GetDocument.Result[]
): TreeEngineDataHolder[] {
	return dataHolders.map((dataHolder) => {
		let data = dataHolder.data;
		if (!data) {
			return dataHolder;
		}

		for (const { docRef, document } of queryResults) {
			const node = TreeDataUtils.readNodeData(data, Identifier.from(docRef));
			if (!node) {
				continue;
			}
			data = TreeDataUtils.updateNodeData(data, { ...node, document });
		}

		return { ...dataHolder, data, loadingState: "loaded", busy: false };
	});
}
