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

import { call, put, type SagaGenerator, select, takeLatest } from "typed-redux-saga";
import { type Action, type AnyAction } from "typescript-fsa";

import { ActivityActions, ActivitySagas } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineError } from "../../../../../../core/error/index.js";
import {
	Commands,
	DataSelector,
	Events,
	type Identifier,
	TreeEngineState,
	UIStateSelector
} from "../../../../../../core/store/index.js";
import { TreeEngineActions } from "../../../actions.js";
import { type TreeEngineOperation } from "../../../operation.js";
import { TreeEngineSelectors } from "../../../selectors.js";
import { SagaUtils } from "../../saga-utils.js";

import { MoveNodeOperation } from "../create-move-node-operation.js";

import { DndSagaUtils } from "./utils.js";

/** @internal */
export function* watchDndNodesSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: AnyAction) => {
			return (
				TreeEngineActions.event.match(action) &&
				Events.onBulkDndDone.match(action.payload.engineAction) &&
				action.payload.activityId === activityId
			);
		},
		SagaUtils.withErrorHandling(handle, { activityId, error: TreeEngineError.DragAndDropNodeError() })
	);
}

interface OperationWithChildExpandedNodePaths {
	operation: TreeEngineOperation.MoveNode;
	childExpandedNodePaths: TreeEngineState.NodePath[];
}

function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.BulkDndDonePayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;

	const { droppedRow } = engineAction.payload;
	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("Activity", { activityId });
	}

	const topLevelMultiSelectedNodes = UIStateSelector.orderedTopLevelMultiSelectedNodes()(engineState);

	const operationsWithChildNodePaths: OperationWithChildExpandedNodePaths[] = [];
	for (const node of topLevelMultiSelectedNodes) {
		const { nodePath } = node;
		const nodeIdentifier = DataSelector.nodeIdentifierFromNodePath(nodePath)(engineState);
		if (!nodeIdentifier) {
			throw TreeEngineError.NotFoundError("TreeEngine.NodePath", {
				activityId,
				id: TreeEngineState.NodePath.toString(nodePath)
			});
		}
		const operation = yield* call(MoveNodeOperation.create, {
			activityId,
			movedRow: { nodePath: node.nodePath, nodeIdentifier },
			targetRow: droppedRow,
			position: droppedRow?.position
		});
		if (operation) {
			const childExpandedNodePaths = yield* call(DndSagaUtils.getExpandedChildNodePaths, { operation, activityId });
			operationsWithChildNodePaths.push({ operation, childExpandedNodePaths });
		}
	}
	if (!operationsWithChildNodePaths) {
		return;
	}
	let lockId: string | undefined;
	try {
		lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "TreeEngine", {});
		const operations = operationsWithChildNodePaths.map(({ operation }) => operation);
		const results = yield* call(SagaUtils.saveActivity, activityId, { operations });
		if (!results) {
			return;
		}

		yield* call(expandParentNode, { operationsWithChildNodePaths, activityId });

		const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
		let expandedNodeMap = { ...uiState.expandedNodes };
		const newLinkIdentifiers: Identifier[] = [];
		const { targetRowParent } = operationsWithChildNodePaths[0].operation.payload;

		for (let index = 0; index < operationsWithChildNodePaths.length; index++) {
			const operation = operationsWithChildNodePaths[index].operation;
			const draggedRowExpandedChildNodePaths = operationsWithChildNodePaths[index].childExpandedNodePaths;
			const result = results[index];
			if (result.type !== "MOVE_NODE") {
				throw TreeEngineError.TypeError("TreeEngine.Type", { expect: "MOVE_NODE", actual: result.type });
			}
			if (result.payload.newLinkIdentifier) {
				newLinkIdentifiers.push(result.payload.newLinkIdentifier);
			}

			expandedNodeMap = DndSagaUtils.buildNewHierarchicalStateFromDraggedRowToDroppedRow({
				expandedNodeMap,
				activityId,
				operation,
				result,
				draggedRowExpandedChildNodePaths
			});
		}

		const updateExpandedNodes = Commands.setExpandedNodes({ nodes: expandedNodeMap });
		yield* put(TreeEngineActions.command({ activityId, engineAction: updateExpandedNodes }));
		const clearMultiSelectionAction = Commands.setMultiSelectionNodes({ multiSelectionNodes: {} });
		yield* put(TreeEngineActions.command({ activityId, engineAction: clearMultiSelectionAction }));

		yield* call(DndSagaUtils.revalidateClipboard, operations, results, activityId);

		if (targetRowParent && newLinkIdentifiers.length) {
			yield* call(DndSagaUtils.scrollToDroppedNodes, {
				activityId,
				newLinkIdentifiers,
				targetRowParent
			});
		}
	} finally {
		if (lockId) {
			yield* put(ActivityActions.unlock({ activityId, lockId }));
		}
	}
}

function* expandParentNode(params: {
	operationsWithChildNodePaths: OperationWithChildExpandedNodePaths[];
	activityId: string;
}): SagaGenerator<void> {
	const { operationsWithChildNodePaths, activityId } = params;
	// Only need to retrieve the parent from an operation because others operation also share the same target's parent
	const { targetRowParent } = operationsWithChildNodePaths[0].operation.payload;
	if (!targetRowParent) {
		return;
	}
	yield* call(DndSagaUtils.expandRowIfNotExpanded, { row: targetRowParent, activityId });
}
