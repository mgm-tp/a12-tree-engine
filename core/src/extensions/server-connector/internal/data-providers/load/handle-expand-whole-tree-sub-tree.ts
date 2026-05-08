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

import { ActivitySelectors } from "@com.mgmtp.a12.client/client-core";
import { DataServicesSelectors } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { ModelSelector, type ModelsState } from "../../../../../core/store/index.js";
import { type TreeEngineDataHolder, type TreeEngineOperation, TreeEngineSelectors } from "../../../../client/index.js";
import { getRootNodesFromDataHolder } from "../../shared.js";
import { TreeEngineError } from "../../../../../core/error/index.js";
import { TreeModel } from "../../../../../core/models/index.js";

import { type LoadPayload } from "../utils.js";
import { handleLoad } from "../resolver/handle-load.js";

import { ExpansionType, handleExpansions } from "./handle-expansions.js";
import { createRootNodeDataHolder } from "./utils.js";

/** @internal */
export function* handleExpandWholeTree({
	config,
	dataLoader,
	preloadChildNodes
}: LoadPayload): SagaGenerator<TreeEngineDataHolder[]> {
	const { activityId } = config;
	const activity = yield* select(ActivitySelectors.activityById(activityId));
	if (!activity) {
		throw TreeEngineError.NotFoundError("Activity", activityId);
	}

	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const uiModel = ModelSelector.uiModel()(modelsState);
	const overrideExpansionDepths = yield* call(createDefaultOverrideExpansionDepths, modelsState);

	const rootNodesDataHolder = createRootNodeDataHolder(activity, uiModel);

	const dataHolders = yield* call(handleLoad, {
		dataHolders: [rootNodesDataHolder],
		activityId: activity.id,
		dataLoader,
		overrideTreeExpansionDepths: overrideExpansionDepths
	});
	const roots = getRootNodesFromDataHolder(dataHolders, activity.descriptor);

	const { expansionStrategy } = ModelSelector.uiModel()(modelsState).content.configuration;
	return yield* call(handleExpansions, {
		activityId,
		dataHolders,
		nodes: roots,
		expansionStrategy,
		expansionType: ExpansionType.WHOLE_TREE,
		dataLoader,
		preloadChildNodes,
		ignorePagination: true,
		overrideTreeExpansionDepths: overrideExpansionDepths
	});
}

/** @internal */
export function* handleExpandSubTree({
	config,
	operation,
	preloadChildNodes,
	dataLoader
}: LoadPayload & { operation: TreeEngineOperation.ExpandSubTree }): SagaGenerator<TreeEngineDataHolder[]> {
	const { activityId } = config;

	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const { expansionStrategy } = ModelSelector.uiModel()(modelsState).content.configuration;
	const overrideExpansionDepths = yield* call(createDefaultOverrideExpansionDepths, modelsState);

	return yield* call(handleExpansions, {
		activityId,
		dataHolders: [],
		nodes: [operation.payload],
		expansionStrategy,
		expansionType: ExpansionType.SUB_TREE,
		dataLoader,
		preloadChildNodes,
		ignorePagination: true,
		overrideTreeExpansionDepths: overrideExpansionDepths
	});
}

function* createDefaultOverrideExpansionDepths(
	modelsState: ModelsState
): SagaGenerator<TreeModel.ExpansionStrategy.Tree.ExpansionDepth[] | undefined> {
	const maxDepthConfig = yield* select(
		DataServicesSelectors.configurationByKey("mgmtp.a12.dataservices.query.maxQueryDepth")
	);
	const parsedMaxDepth = Number(maxDepthConfig);
	if (!Number.isFinite(parsedMaxDepth)) {
		return undefined;
	}
	const uiModel = ModelSelector.uiModel()(modelsState);
	const { expansionStrategy } = uiModel.content.configuration;
	if (!TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		return undefined;
	}
	return expansionStrategy.expansionDepths.map(({ relationshipModel }) => ({
		relationshipModel,
		maxDepth: parsedMaxDepth
	}));
}
