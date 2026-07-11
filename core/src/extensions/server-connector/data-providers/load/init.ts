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

import { type SagaGenerator, call, put, select, all } from "typed-redux-saga";
import type { UnknownAction } from "redux";

import {
	ActivitySelectors,
	ActivityActions,
	type Activity,
	type Selector,
	StoreSagas,
	Model
} from "@com.mgmtp.a12.client/client-core";

import { type RuntimeTreeModel, TreeModel } from "../../../../core/models/tree-model.js";
import { TreeEngineActions } from "../../../client/actions.js";
import { TreeEngineDataHolder } from "../../../client/data-holder.js";
import { TreeEngineSelectors } from "../../../client/selectors.js";
import { Commands } from "../../../../core/store/actions.js";
import { ModelSelector } from "../../../../core/store/selectors/models.js";
import type { Identifier, ModelsState, UiState } from "../../../../core/store/store.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { getRootNodesFromDataHolder } from "../../shared.js";
import type { TreeEngineDataLoader } from "../../data-loaders/data-loader.js";

import type { LoadPayload } from "../utils.js";
import { handleLoad } from "../resolver/handle-load.js";
import { createTreeQueries } from "../resolver/create-queries.js";

import { ExpansionType, handleExpansions } from "./handle-expansions.js";
import { createRootNodeDataHolder } from "./utils.js";
import { expandToNode } from "./handle-expand-to-node.js";

/** @internal */
export interface InitParam {
	readonly loadPayload: LoadPayload;
	readonly preloadChildNodes: boolean;
	readonly isScrollToNode: boolean;
}

/** @internal */
export function* init(params: InitParam): SagaGenerator<TreeEngineDataHolder[]> {
	const { loadPayload, preloadChildNodes, isScrollToNode } = params;
	const { config, dataLoader } = loadPayload;
	const { activityId } = config;

	const activity = yield* select(ActivitySelectors.activityById(activityId));
	if (!activity) {
		throw TreeEngineError.NotFoundError("Activity", activityId);
	}

	const modelsSelector: Selector<{ stateChanged: boolean; returnValue: ModelsState | null }> = (state) => {
		const models = TreeEngineSelectors.modelsStateOrError(activityId)(state);
		if (!models || Model.Error.isInstance(models)) {
			return { stateChanged: models !== undefined, returnValue: null };
		}
		return { stateChanged: true, returnValue: models };
	};
	const models = yield* call(() => StoreSagas.waitForStateChange(modelsSelector));
	if (!models) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", activityId);
	}

	const uiModel = ModelSelector.uiModel()(models);
	const { expansionStrategy } = uiModel.content.configuration;
	const initialUiState = yield* select(TreeEngineSelectors.uiState(activityId));

	let nodesFromNodePath: Identifier[] | undefined = undefined;
	if (isScrollToNode && initialUiState.scrollToNode) {
		nodesFromNodePath = initialUiState.scrollToNode.nodesFromNodePath;
	}

	let dataHolders: TreeEngineDataHolder[];
	const rootNodeDataHolder = createRootNodeDataHolder(activity, uiModel);

	if (nodesFromNodePath) {
		const { descriptor } = rootNodeDataHolder;
		const hiddenRootNode = TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor);
		const nodesFromNodePathExcludeHiddenRoot = hiddenRootNode ? nodesFromNodePath.slice(1) : nodesFromNodePath;

		const nodeModels: Array<RuntimeTreeModel.TreeNode> = [];
		for (const nodePath of nodesFromNodePathExcludeHiddenRoot) {
			const nodeType = nodePath.type;
			const nodeModel = ModelSelector.nodeModel(nodeType)(models);
			if (!nodeModel) {
				throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", nodeType);
			}
			nodeModels.push(nodeModel);
		}

		const childNodeDataHolders = createScrollToNodeDataHolders(nodeModels, nodesFromNodePathExcludeHiddenRoot);

		const scrollToNodeDataHolder = [rootNodeDataHolder, ...childNodeDataHolders];

		dataHolders = yield* call(handleLoad, {
			dataHolders: scrollToNodeDataHolder,
			activityId,
			dataLoader
		});
	} else if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		const createQueriesResult = createTreeQueries([rootNodeDataHolder], models, { preloadChildNodes });
		dataHolders = yield* call(handleLoad, {
			dataHolders: [rootNodeDataHolder],
			activityId,
			dataLoader,
			createQueriesResult
		});
	} else {
		dataHolders = yield* call(handleLoad, {
			dataHolders: [rootNodeDataHolder],
			activityId: activity.id,
			dataLoader
		});
	}

	dataHolders = yield* call(
		initExpandedNodesDataHolder,
		preloadChildNodes,
		uiModel,
		initialUiState,
		activityId,
		dataHolders,
		dataLoader,
		activity.descriptor
	);
	if (initialUiState.scrollToNode) {
		try {
			dataHolders = yield* call(expandToNode, {
				activityId,
				dataHolders,
				nodePath: initialUiState.scrollToNode.nodePath,
				nodesFromNodePath: initialUiState.scrollToNode.nodesFromNodePath,
				dataLoader,
				preloadChildNodes
			});
		} catch (error) {
			yield* put(TreeEngineActions.command({ activityId, engineAction: Commands.setScrollToNode(undefined) }));
			yield* put(
				ActivityActions.error({
					activityId,
					error: TreeEngineError.ScrollToNodeError(),
					operationType: "loading"
				})
			);
		}
	}

	return dataHolders;
}

function* initExpandedNodesDataHolder(
	preloadChildNodes: boolean,
	uiModel: RuntimeTreeModel,
	initialUiState: UiState,
	activityId: string,
	dataHolders: TreeEngineDataHolder[],
	dataLoader: TreeEngineDataLoader,
	activityDescriptor: Activity.DataHolderDescriptor
): SagaGenerator<TreeEngineDataHolder[]> {
	const { multiSelection } = uiModel.content.configuration;

	const engineActions: UnknownAction[] = [];
	if (
		multiSelection?.collapseOption === TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED ||
		multiSelection?.collapseOption === TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE
	) {
		engineActions.push(Commands.setExpandedMultiSelectionPanel({ expanded: true }));
	}

	if (preloadChildNodes) {
		engineActions.push(Commands.setPreloadChildNodes({ preloadChildNodes }));
	}

	if (engineActions.length > 0) {
		yield* all(engineActions.map((engineAction) => put(TreeEngineActions.command({ activityId, engineAction }))));
	}

	let expansionStrategy = uiModel.content.configuration.expansionStrategy;
	if (
		initialUiState.initialExpansion !== undefined &&
		TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy)
	) {
		const initialExpansion = initialUiState.initialExpansion || undefined; // Converting `false` to `undefined`
		expansionStrategy = { ...expansionStrategy, initialExpansion };
	}

	return yield* call(handleExpansions, {
		activityId,
		dataHolders,
		nodes: getRootNodesFromDataHolder(dataHolders, activityDescriptor),
		expansionStrategy,
		expansionType: ExpansionType.INIT,
		dataLoader,
		preloadChildNodes
	});
}

/** @internal */
export function createScrollToNodeDataHolders(
	nodeModels: Array<RuntimeTreeModel.TreeNode>,
	nodesFromNodePath: Identifier[]
): TreeEngineDataHolder[] {
	const dataHolders = nodeModels.map((nodeModel, index) => {
		const nodeIdentifier = nodesFromNodePath[index];
		const { childRelationshipConfigurations } = nodeModel;

		const childNodeDataHolders: TreeEngineDataHolder[] = childRelationshipConfigurations.map((configuration) => {
			const { relationshipModelRef, parentRole } = configuration;
			return {
				descriptor: {
					type: "CHILD_NODES",
					source: nodeIdentifier.id,
					relationshipModel: relationshipModelRef,
					relationshipRole: parentRole
				},
				savingState: "not_saved",
				loadingState: "loaded",
				dirty: false,
				data: {},
				slices: {}
			};
		});

		return childNodeDataHolders;
	});

	return dataHolders.flat();
}
