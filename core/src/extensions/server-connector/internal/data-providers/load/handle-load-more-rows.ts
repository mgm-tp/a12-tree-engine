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
import { ModelSelector } from "../../../../../core/store/index.js";
import { TreeEngineDataHolder, type TreeEngineOperation, TreeEngineSelectors } from "../../../../client/index.js";
import { TreeModel } from "../../../../../core/models/index.js";

import { createListQueries } from "../resolver/create-queries.js";
import { handleLoad } from "../resolver/handle-load.js";
import { PaginationUtils } from "../resolver/pagination-utils.js";
import { type LoadPayload } from "../utils.js";

/** @internal */
export function* handleLoadMoreRows({
	config,
	operation,
	dataLoader
}: LoadPayload & { operation: TreeEngineOperation.LoadMoreNodes }): SagaGenerator<TreeEngineDataHolder[]> {
	const { activityId } = config;

	const models = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!models) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}

	const dataHolders = config.dataHolders.filter(TreeEngineDataHolder.isAssignableFrom);
	const expansionStrategy = ModelSelector.uiModel()(models).content.configuration.expansionStrategy;

	if (!TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy)) {
		throw TreeEngineError.TypeError("TreeEngine.Model.ExpansionStrategy", {
			actual: expansionStrategy,
			expect: "level_by_level"
		});
	}

	const defaultPageSize = expansionStrategy.pageSize;
	const result = PaginationUtils.increaseExpectedSize(dataHolders, defaultPageSize);
	const createQueriesResult = createListQueries(result, models);

	return yield* call(handleLoad, { dataHolders, createQueriesResult, dataLoader, activityId, appended: true });
}
