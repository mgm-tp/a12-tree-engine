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

import { TreeEngineError } from "../../../../../../core/error/index.js";
import { type ModelsState } from "../../../../../../core/store/index.js";
import { type TreeEngineDataHolder } from "../../../../../client/index.js";
import { DataOperation } from "../../../data-loaders/data-loader.js";
import { type DocumentProcessors } from "../../../types.js";
import { type BasePayload } from "../../utils.js";

import { resolveListQueryResults } from "./list-queries-to-data-holders.js";
import { resolveTreeQueryResults } from "./tree-queries-to-data-holders.js";

/** @internal */
export function resolveQueryResults(
	params: {
		queries: DataOperation.Query[];
		skippedQueries: DataOperation.Query[];
		results: DataOperation.QueryResult[];
		dataHolders: TreeEngineDataHolder[];
		models: ModelsState;
		documentProcessors: DocumentProcessors;
		reload?: boolean;
		appended?: boolean;
		ignorePagination?: boolean;
		preloadChildNodes?: boolean;
	} & BasePayload
): TreeEngineDataHolder[] {
	const { queries, skippedQueries, results, models, dataHolders, preloadChildNodes } = params;

	if (
		queries.every(DataOperation.ListQuery.isAssignableFrom) &&
		skippedQueries.every(DataOperation.ListQuery.isAssignableFrom) &&
		results.every(DataOperation.ListQueryResult.isAssignableFrom)
	) {
		return resolveListQueryResults({ ...params, queries, skippedQueries, results });
	}

	if (
		queries.every(DataOperation.Query.TreeNodes.Query.isAssignableFrom) &&
		results.every(DataOperation.Query.TreeNodes.Result.isAssignableFrom)
	) {
		return resolveTreeQueryResults({ queries: queries, queryResults: results, models, dataHolders, preloadChildNodes });
	}

	throw TreeEngineError.TypeError("TreeEngine.Query", { actual: JSON.stringify(queries) });
}

export {
	resolveListQueryResults,
	groupDataHoldersBySource,
	DataHolderBySource
} from "./list-queries-to-data-holders.js";
export { resolveTreeQueryResults } from "./tree-queries-to-data-holders.js";
