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

import { DataServicesSelectors } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { TreeModel } from "../../../../core/models/tree-model.js";
import { ModelSelector } from "../../../../core/store/selectors/models.js";
import type { ModelsState, TreeEngineState } from "../../../../core/store/store.js";
import { A12QueryAPIUtils } from "../../data-loaders/queries/utils.js";

/**
 * Merge node paths into per-relationship expansion depth overrides: for every
 * relationship model appearing in a path, the override is the longest path prefix
 * ending in that relationship — the same depth approximation the expand-to-node
 * operation applies to a single path.
 *
 * @internal
 */
export function mergeExpansionDepthsFromNodePaths(
	nodePaths: TreeEngineState.NodePath[],
	modelsState: ModelsState
): TreeModel.ExpansionStrategy.Tree.ExpansionDepth[] {
	const expansionDepthsMap = new Map<string, TreeModel.ExpansionStrategy.Tree.ExpansionDepth>();

	for (const nodePath of nodePaths) {
		const currentPath: TreeEngineState.NodePath = [];
		for (const linkIdentifier of nodePath) {
			currentPath.push(linkIdentifier);

			if (!ModelSelector.relationshipModelByName(linkIdentifier.type)(modelsState)) {
				continue;
			}
			const currentExpansionDepth = expansionDepthsMap.get(linkIdentifier.type);
			if (!currentExpansionDepth || currentPath.length > currentExpansionDepth.maxDepth) {
				expansionDepthsMap.set(linkIdentifier.type, {
					relationshipModel: linkIdentifier.type,
					maxDepth: currentPath.length
				});
			}
		}
	}

	return Array.from(expansionDepthsMap.values());
}

/**
 * The search load's expansion depth for every relationship the model declares.
 *
 * @internal
 */
export function* searchLoadExpansionDepths(params: {
	models: ModelsState;
	chainPaths: TreeEngineState.NodePath[];
	expandedNodePaths: TreeEngineState.NodePath[];
	preloadChildNodes: boolean;
}): SagaGenerator<TreeModel.ExpansionStrategy.Tree.ExpansionDepth[]> {
	const { models, chainPaths, expandedNodePaths, preloadChildNodes } = params;

	const measuredDepths = new Map<string, number>();
	for (const measured of mergeExpansionDepthsFromNodePaths([...chainPaths, ...expandedNodePaths], models)) {
		measuredDepths.set(measured.relationshipModel, measured.maxDepth);
	}

	const maxQueryDepth = yield* call(selectMaxQueryDepth);
	const preloadedLevels = preloadChildNodes ? 1 : 0;

	return getModelExpansionDepths(models).map((expansionDepth) => {
		const measuredDepth = measuredDepths.get(expansionDepth.relationshipModel) ?? 0;
		const modeledDepth = expansionDepth.maxDepth;

		return {
			...expansionDepth,
			maxDepth: Math.min(Math.max(measuredDepth, modeledDepth) + preloadedLevels, maxQueryDepth)
		};
	});
}

/** The Data Services query-depth ceiling; the default stands in when it is not published. @internal */
export function* selectMaxQueryDepth(): SagaGenerator<number> {
	const configuredValue = yield* select(
		DataServicesSelectors.configurationByKey("mgmtp.a12.dataservices.query.maxQueryDepth")
	);
	const configuredDepth = Number(configuredValue);
	return Number.isFinite(configuredDepth) && configuredDepth > 0
		? configuredDepth
		: A12QueryAPIUtils.DEFAULT_MAX_QUERY_DEPTH_HARD_LIMIT;
}

/** The model's configured per-relationship expansion depths (empty for a non-tree strategy). */
function getModelExpansionDepths(models: ModelsState): TreeModel.ExpansionStrategy.Tree.ExpansionDepth[] {
	const { expansionStrategy } = ModelSelector.uiModel()(models).content.configuration;
	return TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy) ? expansionStrategy.expansionDepths : [];
}
