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

import type { Activity } from "@com.mgmtp.a12.client/client-core";

import { TreeModel } from "../../../../core/models/tree-model.js";
import { type Identifier, type ModelsState, TreeEngineState } from "../../../../core/store/store.js";
import { ModelSelector } from "../../../../core/store/selectors/models.js";
import { TreeEngineSelectors } from "../../selectors.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import type { TreeEngineDataHolder } from "../../data-holder.js";

/** @internal */
export function* createAddGrandChildDataHolders(params: {
	activityId: string;
	descriptorPredicate: (descriptor: Activity.DataHolderDescriptor) => boolean;
	loadedNodeIds?: Set<string>;
}): SagaGenerator<TreeEngineDataHolder[]> {
	const { activityId } = params;

	const models = yield* select(TreeEngineSelectors.modelsState(activityId));

	const loadedNodeIds = yield* call(getLoadedNodeIds, params);
	const dataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));

	const result: TreeEngineDataHolder[][] = [];

	for (const dataHolder of dataHolders ?? []) {
		if (!params.descriptorPredicate(dataHolder.descriptor)) {
			continue;
		}

		for (const entities of Object.values(dataHolder.data || {})) {
			for (const entity of Object.values(entities ?? {})) {
				if (entity && TreeEngineState.Node.isAssignableFrom(entity)) {
					const nodeIdentifier = entity.identifier;
					result.push(
						yield* call(createAddDirectChildDataHolders, { activityId, models, nodeIdentifier, loadedNodeIds })
					);
				}
			}
		}
	}
	return result.flat();
}

/** @internal */
export function* createAddDirectChildDataHolders(params: {
	nodeIdentifier: Identifier;
	activityId: string;
	modelsState?: ModelsState;
	loadedNodeIds?: Set<string>;
}): SagaGenerator<TreeEngineDataHolder[]> {
	const { activityId, nodeIdentifier } = params;
	const loadedNodeIds = yield* call(getLoadedNodeIds, params);

	if (loadedNodeIds.has(nodeIdentifier.id)) {
		return [];
	}

	const modelsState = yield* select(
		(state) => params.modelsState ?? TreeEngineSelectors.modelsState(activityId)(state)
	);
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}

	const nodeModel = ModelSelector.nodeModel(nodeIdentifier.type)(modelsState);

	if (!nodeModel || nodeModel.childRelationshipConfigurations.length === 0) {
		return [];
	}

	const expansionStrategy = ModelSelector.uiModel()(modelsState).content.configuration.expansionStrategy;
	if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		return [
			{
				descriptor: {
					type: "CHILD_NODES",
					source: nodeIdentifier.id
				},
				savingState: "not_saved",
				loadingState: "missing",
				dirty: false,
				data: {},
				slices: {}
			}
		];
	}

	return nodeModel.childRelationshipConfigurations.map((configuration) => {
		const { relationshipModelRef, parentRole } = configuration;
		return {
			descriptor: {
				type: "CHILD_NODES",
				source: nodeIdentifier.id,
				relationshipModel: relationshipModelRef,
				relationshipRole: parentRole
			},
			savingState: "not_saved",
			loadingState: "missing",
			dirty: false,
			data: {},
			slices: {}
		};
	});
}

/** @internal */
export function* getLoadedNodeIds(params: {
	loadedNodeIds?: Set<string>;
	activityId: string;
}): SagaGenerator<Set<string>> {
	const { loadedNodeIds, activityId } = params;
	if (loadedNodeIds) {
		return loadedNodeIds;
	}

	const dataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	const sources = dataHolders?.map((dataHolder) => dataHolder.descriptor.source);

	return new Set(sources?.filter((id): id is string => id !== undefined));
}
