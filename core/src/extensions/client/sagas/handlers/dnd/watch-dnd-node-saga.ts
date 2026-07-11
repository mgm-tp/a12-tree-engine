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

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { ActivityActions, ActivitySagas } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineError } from "../../../../../core/error/tree-engine-error.js";
import { Commands, Events } from "../../../../../core/store/actions.js";
import { TreeEngineActions } from "../../../actions.js";
import { TreeEngineSelectors } from "../../../selectors.js";
import { SagaUtils } from "../../saga-utils.js";

import { MoveNodeOperation } from "../create-move-node-operation.js";

import { DndSagaUtils } from "./utils.js";

/** @internal */
export function* watchDndNodeSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: unknown) => {
			return (
				TreeEngineActions.event.match(action) &&
				Events.onDndDone.match(action.payload.engineAction) &&
				action.payload.activityId === activityId
			);
		},
		SagaUtils.withErrorHandling(handle, { activityId, error: TreeEngineError.DragAndDropNodeError() })
	);
}

function* handle(action: Action<TreeEngineActions.EventPayload<Action<Events.DndDonePayload>>>): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;

	const { draggedRow, droppedRow } = engineAction.payload;
	const operation = yield* call(MoveNodeOperation.create, {
		activityId,
		movedRow: draggedRow,
		targetRow: droppedRow,
		position: droppedRow?.position
	});
	if (!operation) {
		return;
	}

	const draggedRowExpandedChildNodePaths = yield* call(DndSagaUtils.getExpandedChildNodePaths, {
		operation,
		activityId
	});

	let lockId: string | undefined;
	try {
		lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "TreeEngine", {});
		const results = yield* call(SagaUtils.saveActivity, activityId, { operations: [operation] });
		const result = results?.length === 1 && results[0].type === "MOVE_NODE" ? results[0] : undefined;
		if (!result) {
			return;
		}
		const { targetRowParent } = operation.payload;
		if (targetRowParent) {
			yield* call(DndSagaUtils.expandRowIfNotExpanded, { row: targetRowParent, activityId });
		}

		const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
		const newExpandedNodeMap = DndSagaUtils.buildNewHierarchicalStateFromDraggedRowToDroppedRow({
			expandedNodeMap: uiState.expandedNodes,
			activityId,
			operation,
			result,
			draggedRowExpandedChildNodePaths
		});

		const updateExpandedNodes = Commands.setExpandedNodes({ nodes: newExpandedNodeMap });
		yield* put(TreeEngineActions.command({ activityId, engineAction: updateExpandedNodes }));

		yield* call(DndSagaUtils.revalidateClipboard, [operation], [result], activityId);

		const newLinkIdentifiers = result.payload.newLinkIdentifier ? [result.payload.newLinkIdentifier] : undefined;
		if (targetRowParent && newLinkIdentifiers?.length) {
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
