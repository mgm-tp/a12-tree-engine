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

import { type SagaGenerator, call, put, select, takeLatest } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";

import { TreeEngineActions } from "../../actions.js";
import { Commands, Events } from "../../../../core/store/actions.js";
import { TreeEngineState } from "../../../../core/store/store.js";
import { UIStateSelector } from "../../../../core/store/selectors/ui-state.js";
import { TreeEngineSelectors } from "../../selectors.js";
import type { TreeEngineOperation } from "../../operation.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";

import { SagaUtils } from "../saga-utils.js";

/** @internal */
export function* watchExpandWholeTreeSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: unknown) => {
			return (
				TreeEngineActions.event.match(action) &&
				Events.onEventButtonClicked.match(action.payload.engineAction) &&
				action.payload.activityId === activityId &&
				action.payload.engineAction.payload.button.event === "event_expand_whole_tree"
			);
		},
		SagaUtils.withErrorHandling(handleExpandWholeTree, {
			activityId,
			error: TreeEngineError.ExpandWholeTreeError(),
			operationType: "loading"
		})
	);
}

/** @internal */
export function* watchCollapseWholeTreeSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest((action: unknown) => {
		return (
			TreeEngineActions.event.match(action) &&
			Events.onEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.activityId === activityId &&
			action.payload.engineAction.payload.button.event === "event_collapse_whole_tree"
		);
	}, handleCollapseWholeTree);
}

/** @internal */
export function* watchExpandSubTreeSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: unknown) => {
			return (
				TreeEngineActions.event.match(action) &&
				Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
				action.payload.activityId === activityId &&
				action.payload.engineAction.payload.button.event === "event_expand_sub_tree"
			);
		},
		SagaUtils.withErrorHandling(handleExpandSubTree, {
			activityId,
			error: TreeEngineError.ExpandSubTreeError(),
			operationType: "loading"
		})
	);
}

/** @internal */
export function* watchCollapseSubTreeSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest((action: unknown) => {
		return (
			TreeEngineActions.event.match(action) &&
			Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.activityId === activityId &&
			action.payload.engineAction.payload.button.event === "event_collapse_sub_tree"
		);
	}, handleCollapseSubTree);
}

function* handleExpandWholeTree(
	action: Action<TreeEngineActions.EventPayload<Action<Events.EventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { activityId } = action.payload;

	const operation: TreeEngineOperation = {
		type: "EXPAND_WHOLE_TREE",
		payload: {}
	};

	yield* call(SagaUtils.performLoadOperations, activityId, [operation]);
}

function* handleCollapseWholeTree(
	action: Action<TreeEngineActions.EventPayload<Action<Events.EventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { activityId } = action.payload;
	yield* put(TreeEngineActions.command({ activityId, engineAction: Commands.setExpandedNodes({ nodes: {} }) }));
}

function* handleExpandSubTree(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { activityId } = action.payload;

	const { nodeIdentifier, nodePath } = action.payload.engineAction.payload;

	const operation: TreeEngineOperation = {
		type: "EXPAND_SUB_TREE",
		payload: { nodeIdentifier, nodePath }
	};

	yield* call(SagaUtils.performLoadOperations, activityId, [operation]);
}

function* handleCollapseSubTree(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { activityId } = action.payload;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
	}

	const { nodePath } = action.payload.engineAction.payload;
	const parentPathString = TreeEngineState.NodePath.toString(nodePath);
	const expandedNodes = UIStateSelector.expandedNodes()(engineState);
	const newExpandedNodes = { ...expandedNodes };
	Object.keys(expandedNodes).forEach((pathString) => {
		if (pathString.startsWith(parentPathString)) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete newExpandedNodes[pathString];
		}
	});
	yield* put(
		TreeEngineActions.command({
			activityId,
			engineAction: Commands.setExpandedNodes({ nodes: newExpandedNodes })
		})
	);
}
