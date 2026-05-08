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

import { TreeEngineError } from "../../../../../core/error/index.js";
import { TreeModel } from "../../../../../core/models/index.js";
import { Identifier, ModelSelector, type ModelsState } from "../../../../../core/store/index.js";
import { type TreeEngineDataHolder } from "../../../../client/index.js";
import { type DataOperation } from "../../data-loaders/data-loader.js";

import { PaginationUtils } from "./pagination-utils.js";
import { type DataHolderBySource, groupDataHoldersBySource } from "./queries-to-data-holders/index.js";

interface QueryResultDataHolder {
	query?: DataOperation.ListQuery;
	result?: DataOperation.ListQueryResult;
	dataHolder: TreeEngineDataHolder;
	retrievedSize?: number;
}

/** @internal */
export function createQueryResultDataHolders(
	queries: DataOperation.ListQuery[],
	results: DataOperation.ListQueryResult[],
	dataHolders: TreeEngineDataHolder[],
	models: ModelsState,
	ignorePagination?: boolean,
	reload?: boolean
): QueryResultDataHolder[] {
	const queryAndResulSet = createQueryAndResultSet(queries, results);

	const queryResultDataHolders: QueryResultDataHolder[] = [];

	const expansionStrategy = ModelSelector.uiModel()(models).content.configuration.expansionStrategy;
	const defaultPageSize = TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy)
		? expansionStrategy.pageSize
		: undefined;

	const { childNodesDataHoldersBySources, rootNodesDataHolders, parentNodesDataHolders } = groupDataHoldersBySource(
		dataHolders,
		defaultPageSize
	);

	// Assign "totalCount" value to each group of data holders by source
	type DataHolderBySourceWithTotalCount = DataHolderBySource & { totalCount?: number };
	const dataHoldersBySourcesWithCount = childNodesDataHoldersBySources.map<DataHolderBySourceWithTotalCount>(
		(dataHoldersBySource) => {
			const { source, dataHolders } = dataHoldersBySource;
			const nodeModel = ModelSelector.nodeModel(Identifier.from(source).type)(models);
			const orderedDataHolders = sortDataHoldersByChildRelationshipConfiguration(dataHolders, nodeModel);

			if (ignorePagination) {
				return { ...dataHoldersBySource, dataHolders: orderedDataHolders, totalCount: Infinity };
			} else if (reload) {
				return {
					...dataHoldersBySource,
					dataHolders: orderedDataHolders,
					totalCount: dataHoldersBySource.expectedSize ?? (defaultPageSize ? dataHoldersBySource.currentSize : Infinity)
				};
			}
			return { ...dataHoldersBySource, dataHolders: orderedDataHolders, totalCount: defaultPageSize ?? Infinity };
		}
	);

	// Assign "retrievedSize" value to each data holder base on the amount of "totalCount"
	// The application of "retrievedSize" is only valid when the data holder is initialized or reload
	// Subsequent "load more" or "load all" will not have any affect to "retrievedSize"
	for (const dataHoldersBySource of dataHoldersBySourcesWithCount) {
		const { dataHolders } = dataHoldersBySource;
		for (let index = 0; index < dataHolders.length; index++) {
			const dataHolder = dataHolders[index];
			let found = false;
			for (const { query, result } of queryAndResulSet) {
				const { source, relationshipModel } = dataHolder.descriptor;
				if (source !== query.source || relationshipModel !== query.relationshipModel) {
					continue;
				}

				const queryResultDataHolder: QueryResultDataHolder = { query, result, dataHolder };
				const { fullSize } = PaginationUtils.getSize(dataHolder);
				if ((fullSize === undefined || reload) && dataHoldersBySource.totalCount !== undefined) {
					if (dataHoldersBySource.totalCount > 0) {
						const resultLength = result?.entries.length ?? 0;
						queryResultDataHolder.retrievedSize = Math.min(dataHoldersBySource.totalCount, resultLength);
						dataHoldersBySource.totalCount -= resultLength;
					} else {
						queryResultDataHolder.retrievedSize = 0;
					}
				}

				queryResultDataHolders.push(queryResultDataHolder);
				found = true;
			}
			// This will happen when the query for a data holder is skipped, hence no query result
			if (!found) {
				queryResultDataHolders.push({ dataHolder });
			}
		}
	}

	for (const dataHolder of [...rootNodesDataHolders, ...parentNodesDataHolders]) {
		let found = false;
		for (const { query, result } of queryAndResulSet) {
			const { source, relationshipModel } = dataHolder.descriptor;
			if (source === query.source && relationshipModel === query.relationshipModel) {
				queryResultDataHolders.push({ query, result, dataHolder });
				found = true;
			}
		}
		// This will happen when the query for a data holder is skipped, hence no query result
		if (!found) {
			queryResultDataHolders.push({ dataHolder });
		}
	}
	return queryResultDataHolders;
}

function sortDataHoldersByChildRelationshipConfiguration(
	dataHolders: TreeEngineDataHolder[],
	nodeModel?: TreeModel.TreeNode
) {
	if (!nodeModel) {
		throw TreeEngineError.NotFoundError("TreeEngine.NodeModel");
	}
	const orderedDataHolders: TreeEngineDataHolder[] = [];
	for (const crc of nodeModel?.childRelationshipConfigurations ?? []) {
		const matchedDataHolder = dataHolders.find((dh) => {
			return dh.descriptor.relationshipModel === crc.relationshipModelRef;
		});
		if (matchedDataHolder) {
			orderedDataHolders.push(matchedDataHolder);
		}
	}
	return orderedDataHolders;
}

interface QueryAndResultSet {
	query: DataOperation.ListQuery;
	result?: DataOperation.ListQueryResult;
}
/** @internal */
function createQueryAndResultSet(
	queries: DataOperation.ListQuery[],
	results: DataOperation.ListQueryResult[]
): QueryAndResultSet[] {
	const tuples: QueryAndResultSet[] = [];
	for (const query of queries) {
		let found = false;
		for (const result of results) {
			if (query.id === result.id) {
				tuples.push({ query, result });
				found = true;
			}
		}
		if (!found) {
			tuples.push({ query });
		}
	}
	return tuples;
}
