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

import { type SagaGenerator, call, put, takeLatest, select } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { ActivityActions, ActivitySagas, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineActions } from "../../actions.js";
import { Commands, Events } from "../../../../core/store/actions.js";
import { TreeEngineState } from "../../../../core/store/store.js";
import type { TreeEngineOperation } from "../../operation.js";
import { findNextNode, getCurrentNode, SagaUtils } from "../../shared.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { TreeEngineSelectors } from "../../selectors.js";

/** @internal */
export function* watchScrollToNodeSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: unknown) => {
			return (
				TreeEngineActions.event.match(action) &&
				Events.scrollToNode.match(action.payload.engineAction) &&
				action.payload.activityId === activityId
			);
		},
		SagaUtils.withErrorHandling(handle, {
			activityId,
			error: TreeEngineError.ScrollToNodeError(),
			operationType: "loading"
		})
	);
}

function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.ScrollToNodePayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const { nodePath, nodesFromNodePath, autoFocus } = engineAction.payload;

	let lockId: string | undefined;

	try {
		lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "TreeEngine", {});
		const scrollAction = TreeEngineActions.command({
			activityId,
			engineAction: Commands.setScrollToNode({ nodePath, nodesFromNodePath, autoFocus })
		});

		if (yield* call(isExpandedNode, activityId, nodePath)) {
			yield* put(scrollAction);
			return;
		}

		const operation: TreeEngineOperation.ExpandToNode = {
			type: "EXPAND_TO_NODE",
			payload: { nodePath, nodesFromNodePath }
		};
		const { done, failed } = yield* call(SagaUtils.loadActivityData, activityId, { operations: [operation] });
		if (done) {
			yield* put(scrollAction);
			return;
		}
		if (failed) {
			throw TreeEngineError.ExpandNodeError();
		}
	} finally {
		if (lockId) {
			yield* put(ActivityActions.unlock({ activityId, lockId }));
		}
	}
}

function* isExpandedNode(activityId: string, nodePath: TreeEngineState.NodePath): SagaGenerator<boolean> {
	const activity = yield* select(ActivitySelectors.activityById(activityId));
	const dataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	if (!activity || !dataHolders) {
		throw TreeEngineError.NotFoundError("Activity", { activityId });
	}
	const uiState = yield* select(TreeEngineSelectors.uiState(activityId));

	let { currentNode, currentIndex } = getCurrentNode(nodePath, activity, dataHolders);

	while (currentIndex < nodePath.length - 1) {
		currentIndex += 1;
		const nextNode = findNextNode(currentNode, nodePath[currentIndex], dataHolders);
		if (!nextNode) {
			return false;
		}

		if (!Object.keys(uiState.expandedNodes).includes(TreeEngineState.NodePath.toString(currentNode.nodePath))) {
			return false;
		}
		currentNode = nextNode;
	}

	return true;
}
