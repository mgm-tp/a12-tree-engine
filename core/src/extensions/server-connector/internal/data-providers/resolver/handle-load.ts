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

import { type SagaGenerator, call, select } from "typed-redux-saga";

import { TreeEngineError } from "../../../../../core/error/index.js";
import { ModelSelector, UIStateSelector } from "../../../../../core/store/index.js";
import { TreeEngineDataHolder, TreeEngineSelectors, maybeAsyncFnWrapper } from "../../../../client/index.js";
import { DataOperation } from "../../data-loaders/data-loader.js";
import { TreeModel } from "../../../../../core/models/index.js";

import { calculateCurrentExpansionDepths } from "../load/utils.js";
import { type BasePayload, getDocumentProcessors } from "../utils.js";

import { handleThumbnailUrlResult } from "./attachment-utils.js";
import { createListQueries, type CreateQueriesResult, createTreeQueries } from "./create-queries.js";
import { PaginationUtils } from "./pagination-utils.js";
import { groupDataHoldersBySource, resolveQueryResults } from "./queries-to-data-holders/index.js";

/** @internal */
export function* handleLoad(
	params: {
		dataHolders: TreeEngineDataHolder[];
		activityId: string;
		reload?: boolean;
		createQueriesResult?: CreateQueriesResult;
		appended?: boolean;
		ignorePagination?: boolean;
		preloadChildNodes?: boolean;
		overrideTreeExpansionDepths?: TreeModel.ExpansionStrategy.Tree.ExpansionDepth[];
	} & BasePayload
): SagaGenerator<TreeEngineDataHolder[]> {
	const {
		activityId,
		dataHolders,
		dataLoader,
		reload,
		appended,
		ignorePagination,
		createQueriesResult,
		preloadChildNodes,
		overrideTreeExpansionDepths
	} = params;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}

	const uiModel = ModelSelector.uiModel()(engineState);
	const { expansionStrategy } = uiModel.content.configuration;

	let queries: DataOperation.Query[];
	let skippedQueries: DataOperation.Query[] = [];

	const containParentNodesQuery = dataHolders.some((dh) =>
		TreeEngineDataHolder.Descriptor.ParentNodes.isAssignableFrom(dh.descriptor)
	);

	if (createQueriesResult) {
		queries = createQueriesResult.queries;
		skippedQueries = createQueriesResult.skippedQueries;
	} else if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy) && !containParentNodesQuery) {
		const overrideExpansionDepths =
			overrideTreeExpansionDepths ?? (reload ? calculateCurrentExpansionDepths(dataHolders, engineState) : undefined);

		const createQueriesResult: CreateQueriesResult = createTreeQueries(dataHolders, engineState, {
			overrideExpansionDepths,
			preloadChildNodes: preloadChildNodes ?? UIStateSelector.preloadChildNodes()(engineState)
		});

		queries = createQueriesResult.queries;
		skippedQueries = createQueriesResult.skippedQueries;
	} else {
		let nextDataHolders: TreeEngineDataHolder[];
		const defaultPageSize = TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy)
			? expansionStrategy.pageSize
			: undefined;
		if (reload) {
			const { childNodesDataHoldersBySources, rootNodesDataHolders, parentNodesDataHolders } = groupDataHoldersBySource(
				dataHolders,
				defaultPageSize
			);
			nextDataHolders = childNodesDataHoldersBySources.reduce(
				(result, { dataHolders, currentSize }) => {
					const updatedDataHolders = dataHolders.map((dataHolder) => {
						if (defaultPageSize && !ignorePagination) {
							const { expectedSize } = PaginationUtils.getSize(dataHolder);
							return PaginationUtils.setSize(dataHolder, {
								// For reloading, "zero" value will always result in defaultPageSize to be used
								expectedSize: (expectedSize ?? currentSize) || defaultPageSize
							});
						}
						return PaginationUtils.setSize(dataHolder, { expectedSize: Infinity });
					});
					result.push(...updatedDataHolders);
					return result;
				},
				[...rootNodesDataHolders, ...parentNodesDataHolders]
			);
		} else {
			nextDataHolders = dataHolders.map((dataHolder) => {
				const { currentSize, expectedSize } = PaginationUtils.getSize(dataHolder);
				if (defaultPageSize && !ignorePagination) {
					return PaginationUtils.setSize(dataHolder, { expectedSize: expectedSize ?? currentSize ?? defaultPageSize });
				}
				return PaginationUtils.setSize(dataHolder, { expectedSize: Infinity });
			});
		}
		const createQueriesResult = createListQueries(nextDataHolders, engineState, reload);
		queries = createQueriesResult.queries;
		skippedQueries = createQueriesResult.skippedQueries;
	}

	if (queries.filter((q) => !DataOperation.Query.LoadThumbnailUrls.Query.isAssignableFrom(q)).length === 0) {
		return [];
	}

	const documentProcessors = getDocumentProcessors(engineState);
	const resultSet = yield* call(maybeAsyncFnWrapper(dataLoader.provideData), {
		activityId,
		queries,
		documentProcessors
	});

	const queryResults = yield* call(handleThumbnailUrlResult, resultSet.queryResults, activityId);

	return resolveQueryResults({
		queries: queries.filter((q) => !DataOperation.Query.LoadThumbnailUrls.Query.isAssignableFrom(q)),
		skippedQueries,
		results: queryResults,
		dataHolders,
		models: engineState,
		dataLoader,
		documentProcessors,
		appended,
		ignorePagination,
		reload,
		preloadChildNodes
	});
}
