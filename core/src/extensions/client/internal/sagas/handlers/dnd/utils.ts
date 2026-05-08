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

import { call, put, type SagaGenerator, select } from "typed-redux-saga";

import { TreeEngineError } from "../../../../../../core/error/index.js";
import {
	DataSelector,
	Events,
	type Identifier,
	TreeEngineState,
	UIStateSelector
} from "../../../../../../core/store/index.js";
import { TreeEngineActions } from "../../../actions.js";
import { TreeEngineOperation } from "../../../operation.js";
import { TreeEngineSelectors } from "../../../selectors.js";
import { SagaUtils } from "../../saga-utils.js";

import { expandNode } from "../watch-node-expansion-saga.js";

/** @internal */
export namespace DndSagaUtils {
	export function* expandRowIfNotExpanded(params: {
		row: TreeEngineOperation.MoveNode.Row;
		activityId: string;
	}): SagaGenerator<void> {
		const { row, activityId } = params;

		const nodesDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
		if (!nodesDataHolders) {
			throw TreeEngineError.NotFoundError("TreeEngine.DataHolder", { activityId });
		}
		const uiState = yield* select(TreeEngineSelectors.uiState(activityId));

		const { nodeIdentifier, nodePath, isRoot } = row;
		const { expanded } = UIStateSelector.nodeState(nodeIdentifier, nodePath)(uiState);
		if (!isRoot && !expanded) {
			yield* call(expandNode, { nodeIdentifier, nodePath, activityId });
		}
	}

	export function* getExpandedChildNodePaths(params: {
		operation: TreeEngineOperation.MoveNode;
		activityId: string;
	}): SagaGenerator<TreeEngineState.NodePath[]> {
		const { operation, activityId } = params;
		const { movedRow } = operation.payload;
		const uiState = yield* select(TreeEngineSelectors.uiState(activityId));

		const expandedNodePaths: TreeEngineState.NodePath[] = [];

		const expandedNodes = UIStateSelector.expandedNodes()(uiState);

		Object.keys(expandedNodes).forEach((stringifyNodePath) => {
			const candidateNodePath = TreeEngineState.NodePath.fromString(stringifyNodePath);
			const isChildNodePath = movedRow.nodePath.every((path, index) => {
				return path.type === candidateNodePath[index]?.type && path.id === candidateNodePath[index]?.id;
			});
			if (isChildNodePath) {
				expandedNodePaths.push(candidateNodePath);
			}
		});

		return expandedNodePaths;
	}

	export function buildNewHierarchicalStateFromDraggedRowToDroppedRow(params: {
		expandedNodeMap: TreeEngineState.ExpandedNodes;
		operation: TreeEngineOperation.MoveNode;
		draggedRowExpandedChildNodePaths: TreeEngineState.NodePath[];
		result: TreeEngineOperation.MoveNodeDone;
		activityId: string;
	}): TreeEngineState.ExpandedNodes {
		const { operation, draggedRowExpandedChildNodePaths, activityId, result, expandedNodeMap } = params;
		const { movedRow, targetRowParent, type } = operation.payload;

		const newLinkIdentifier = result.payload.newLinkIdentifier;

		const trimmedChildNodePaths = draggedRowExpandedChildNodePaths.map((childNodePath) => {
			const newChildNodePath: TreeEngineState.NodePath = [];
			childNodePath.forEach((subPath, index) => {
				if (subPath.type !== movedRow.nodePath[index]?.type || subPath.id !== movedRow.nodePath[index]?.id) {
					newChildNodePath.push(subPath);
				}
			});
			return newChildNodePath;
		});

		const newNodePaths = trimmedChildNodePaths.map((childNodePath) => {
			if (type === TreeEngineOperation.MoveNode.Type.CHILD_NODE) {
				if (!newLinkIdentifier) {
					throw TreeEngineError.NotFoundError("TreeEngine.Identifier", { id: "newLinkIdentifier", activityId });
				}
				return [...operation.payload.targetRowParent.nodePath, newLinkIdentifier, ...childNodePath];
			}

			if (type === TreeEngineOperation.MoveNode.Type.ROOT_NODE) {
				if (!targetRowParent || !newLinkIdentifier) {
					return [movedRow.nodeIdentifier, ...childNodePath];
				} else {
					return [targetRowParent.nodeIdentifier, newLinkIdentifier, ...childNodePath];
				}
			}
			throw TreeEngineError.TypeError("TreeEngine.Operation", { expect: "Root or child target", actual: type });
		});

		const newExpandedNodeMap = { ...expandedNodeMap };
		draggedRowExpandedChildNodePaths.forEach((nodePath) => {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete newExpandedNodeMap[TreeEngineState.NodePath.toString(nodePath)];
		});
		newNodePaths.forEach((nodePath) => {
			newExpandedNodeMap[TreeEngineState.NodePath.toString(nodePath)] = {};
		});
		return newExpandedNodeMap;
	}

	export function* revalidateClipboard(
		operations: TreeEngineOperation.MoveNode[],
		results: TreeEngineOperation.Done[],
		activityId: string
	) {
		const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
		if (!engineState) {
			throw TreeEngineError.NotFoundError("Activity", { activityId });
		}

		const addedNodes: Events.RevalidateClipboardPayload.AddedNode[] = [];
		const removedNodes: Identifier[] = [];

		for (let index = 0; index < operations.length; index++) {
			const operation = operations[index];
			const result = results[index];

			if (!operation.payload.targetRowParent || result.type !== "MOVE_NODE" || !result.payload.newLinkIdentifier) {
				break;
			}

			const newNodePath = [...operation.payload.targetRowParent.nodePath, result.payload.newLinkIdentifier];
			const newNodeIdentifier = DataSelector.nodeIdentifierFromNodePath(newNodePath)(engineState);
			if (newNodeIdentifier) {
				addedNodes.push({ nodePath: newNodePath, nodeIdentifier: newNodeIdentifier });
			}
			removedNodes.push(operation.payload.movedRow.nodeIdentifier);
		}

		const parentNodePaths: TreeEngineState.NodePath[] = [];
		for (const operation of operations) {
			if (operation.payload.targetRowParent) {
				parentNodePaths.push(operation.payload.targetRowParent.nodePath);
			}
		}

		if (yield* call(SagaUtils.areNodePathsExistedInClipboard, parentNodePaths, activityId)) {
			const loadAllOperation: TreeEngineOperation = {
				type: "LOAD_ALL_CHILD_NODES",
				payload: { nodes: addedNodes, ignorePagination: true }
			};
			yield* call(SagaUtils.loadActivityData, activityId, { operations: [loadAllOperation] });
		}

		const engineAction = Events.revalidateClipboard({
			removedNodes: removedNodes.length > 0 ? removedNodes : undefined,
			addedNodes: addedNodes.length > 0 ? addedNodes : undefined
		});
		yield* put(TreeEngineActions.event({ activityId, engineAction }));
	}

	export function* scrollToDroppedNodes(params: {
		activityId: string;
		newLinkIdentifiers: Identifier[];
		targetRowParent: TreeEngineOperation.MoveNode.Row;
	}): SagaGenerator<void> {
		const { activityId, newLinkIdentifiers, targetRowParent } = params;

		if (!targetRowParent.isRoot) {
			yield* call(SagaUtils.scrollToNewChildNode, {
				activityId,
				target: targetRowParent,
				newLinkIdentifiers
			});
		} else {
			yield* call(SagaUtils.scrollToNewRootNode, {
				activityId,
				newLinkIdentifiers
			});
		}
	}
}
