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

import { type SagaGenerator, call, put, select } from "typed-redux-saga";

import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { TreeModel } from "../../../../core/models/tree-model.js";
import { Commands } from "../../../../core/store/actions.js";
import { ModelSelector } from "../../../../core/store/selectors/models.js";
import { type ModelsState, TreeEngineState, type UiState } from "../../../../core/store/store.js";
import { TreeEngineActions } from "../../../client/actions.js";
import { TreeEngineSelectors } from "../../../client/selectors.js";
import type { TreeEngineDataHolder } from "../../../client/data-holder.js";
import { type Mutable, TreeTraverser } from "../../../client/shared.js";
import type { BaseNode } from "../../shared.js";

import type { BasePayload } from "../utils.js";

import { type BaseNodeWithParent, loadAllChildNodes } from "./handle-load-all-child-nodes.js";

export enum ExpansionType {
	INIT = "init",
	WHOLE_TREE = "whole_tree",
	SUB_TREE = "sub_tree",
	PER_LEVEL = "per_level" // Un-used
}

/** @internal */
export function* handleExpansions(
	params: {
		activityId: string;
		dataHolders: TreeEngineDataHolder[];
		nodes: BaseNode[];
		expansionStrategy: TreeModel.ExpansionStrategy;
		preloadChildNodes?: boolean;
		ignorePagination?: boolean;
		expansionType: ExpansionType;
		overrideTreeExpansionDepths?: TreeModel.ExpansionStrategy.Tree.ExpansionDepth[];
	} & BasePayload
): SagaGenerator<TreeEngineDataHolder[]> {
	const { activityId, expansionStrategy, expansionType } = params;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const expandedNodes: Mutable<TreeEngineState.ExpandedNodes> = { ...engineState.expandedNodes };

	let remainingLevel = getRemainingExpansionLevel(engineState, expansionStrategy, expansionType);

	const { updatedDataHolders, loadedNodes } = yield* call(loadAllChildNodes, {
		...params,
		getAffectedNodes: (nodes: BaseNodeWithParent[]) => getAffectedNodes(nodes, engineState, expansionType),
		shouldLoadNextLevel: () => {
			const result = remainingLevel > 0;
			remainingLevel -= 1;
			return result;
		}
	});

	// The in Tree strategy initialization mode, the whole tree has already preloaded so the loadedNodes have to be updated manually
	if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy) && expansionType === ExpansionType.INIT) {
		const traverser = new TreeTraverser(updatedDataHolders);
		params.nodes.forEach((node) => {
			traverser.traverse(node, (node) => loadedNodes.push(node));
		});
	}

	for (const loadedNode of loadedNodes) {
		if (shouldNodeBeExpanded(engineState, expansionType, loadedNode)) {
			expandedNodes[TreeEngineState.NodePath.toString(loadedNode.nodePath)] = {};
		}
	}

	const engineAction = Commands.setExpandedNodes({ nodes: expandedNodes });
	yield* put(TreeEngineActions.command({ activityId, engineAction }));

	return updatedDataHolders;
}

function getRemainingExpansionLevel(
	uiState: UiState,
	expansionStrategy: TreeModel.ExpansionStrategy,
	type: ExpansionType
): number {
	if (TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy)) {
		if (type === ExpansionType.SUB_TREE || type === ExpansionType.WHOLE_TREE) {
			return Infinity;
		}
		const initialExpansion = uiState.initialExpansion ?? expansionStrategy.initialExpansion;
		if (!initialExpansion) {
			return 0;
		}
		if (TreeModel.ExpansionStrategy.LevelByLevel.InitialExpansion.AllLevels.isAssignableFrom(initialExpansion)) {
			return Infinity;
		}
		return initialExpansion.level;
	}

	if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		if (type === ExpansionType.INIT) {
			// Don't try to expand further during initialization
			return 0;
		}
		return Infinity;
	}

	return 0;
}

function getAffectedNodes(
	nodes: BaseNode[],
	engineState: TreeEngineState,
	type: ExpansionType
): BaseNode[] | undefined {
	if (type === ExpansionType.WHOLE_TREE || type === ExpansionType.SUB_TREE) {
		// Always expand every provided nodes in expand whole/sub tree regardless the config
		return nodes;
	}
	const uiModel = ModelSelector.uiModel()(engineState);
	const { expansionStrategy } = uiModel.content.configuration;
	if (TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy)) {
		const initialExpansion = engineState.initialExpansion ?? expansionStrategy.initialExpansion;
		const affectedNodeRefs = initialExpansion ? initialExpansion?.affectedNodeRefs : undefined;

		if (affectedNodeRefs === undefined || affectedNodeRefs.length === 0) {
			return nodes;
		}

		return nodes.filter((node) => {
			const nodeModel = ModelSelector.nodeModel(node.nodeIdentifier.type)(engineState);
			return nodeModel?.id && affectedNodeRefs.some((ref) => ref === nodeModel.id);
		});
	} else if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		if (type === ExpansionType.INIT) {
			// Don't try to expand further during initialization
			return [];
		}
	}

	return undefined;
}

/**
 * Decide whether a node should be marked expanded in the UI based on the configured expansion strategy.
 *
 * - LevelByLevel: expand every loaded node (progressive breadth-wise expansion).
 * - Tree initialization: use expansionDepths to cap recursion per relationship model.
 *   + If the relationship model that led to this node has already reached its configured maxDepth
 *     and the node's relationship model is self-referential, do not expand the node. Otherwise, expand.
 *   + Root nodes (no inbound relationship model) always expand.
 * - Other tree expansion operations: the node whose children were loaded should always be considered expanded.
 *
 */
function shouldNodeBeExpanded(models: ModelsState, type: ExpansionType, node: BaseNode): boolean {
	const uiModel = ModelSelector.uiModel()(models);
	const { expansionStrategy } = uiModel.content.configuration;

	if (TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy)) {
		return true;
	}

	if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		// During initialization, base expansion strictly on configured expansion depths per
		// relationship model, and ignore the extra preloaded level for expansion state.
		if (type === ExpansionType.INIT) {
			const { expansionDepths } = expansionStrategy;
			const relationshipModel = TreeEngineState.NodePath.toLinkIdentifier(node.nodePath)?.type;
			// This is root node, and it should always be expanded
			if (!relationshipModel) {
				return true;
			}
			const currentDepth = node.nodePath.filter((p) => p.type === relationshipModel).length;
			const configuredMaxDepth = expansionDepths.find((d) => d.relationshipModel === relationshipModel)?.maxDepth;

			const nodeModel = ModelSelector.nodeModel(node.nodeIdentifier.type)(models);
			const childRelationshipModels = nodeModel?.childRelationshipConfigurations?.map((c) => c.relationshipModelRef);
			if (!childRelationshipModels || childRelationshipModels.length === 0) {
				return false;
			}

			// Stop if the relationship already reached its cap and this node is self-reference.
			if (
				configuredMaxDepth !== undefined &&
				currentDepth >= configuredMaxDepth &&
				childRelationshipModels.includes(relationshipModel)
			) {
				return false;
			}
		}
		// For other expansion types, the node whose children were loaded is considered expanded.
		return true;
	}
	return false;
}
