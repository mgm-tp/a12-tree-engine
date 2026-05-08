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

import { put, select } from "typed-redux-saga";

import { TreeEngineError } from "../../../../../../core/error/index.js";
import { type Identifier, ModelSelector } from "../../../../../../core/store/index.js";
import { PaginationUtils } from "../../../../../server-connector/internal/shared.js";
import { TreeEngineActions } from "../../../actions.js";
import { TreeEngineSelectors } from "../../../selectors.js";
import { TreeModel } from "../../../../../../core/models/index.js";

/** @internal */
export function* createUpdatePageSizeActionForAddedNode(
	activityId: string,
	parentNodeIdentifier: Identifier,
	relationshipModelRef: string
) {
	const nodesDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	const models = yield* select(TreeEngineSelectors.modelsState(activityId));

	if (!nodesDataHolders || !models) {
		throw TreeEngineError.NotFoundError("Activity", { activityId });
	}

	const expansionStrategy = ModelSelector.uiModel()(models).content.configuration.expansionStrategy;
	if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		return;
	}
	if (expansionStrategy.pageSize) {
		const result = PaginationUtils.updateExpectedSizeForAddedNode(
			nodesDataHolders.filter((dh) => dh.descriptor.source === parentNodeIdentifier.id),
			relationshipModelRef,
			expansionStrategy.pageSize
		);

		yield* put(
			TreeEngineActions.setPageSizes({
				activityId: activityId,
				pageSizes: result.map((dataHolder) => {
					const { expectedSize = 0, fullSize } = PaginationUtils.getSize(dataHolder);
					const { descriptor } = dataHolder;
					return { descriptor, expectedSize, fullSize };
				})
			})
		);
	}
}
