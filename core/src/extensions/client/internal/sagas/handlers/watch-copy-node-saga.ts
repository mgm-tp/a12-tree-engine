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
import { type Action, type AnyAction } from "typescript-fsa";

import { ActivityActions, ActivitySagas } from "@com.mgmtp.a12.client/client-core";

import {
	Commands,
	DataSelector,
	type DataState,
	Events,
	type Identifier,
	type TreeEngineState
} from "../../../../../core/store/index.js";
import { type BaseNode } from "../../../../server-connector/internal/shared.js";
import { TreeEngineActions } from "../../actions.js";
import { type TreeEngineOperation } from "../../operation.js";
import { TreeEngineError } from "../../../../../core/error/index.js";
import { TreeEngineSelectors } from "../../selectors.js";

import { SagaUtils } from "../saga-utils.js";

/** @internal */
export function* watchCopyNodeSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: AnyAction) => {
			const events = ["event_copy_node", "event_copy_node_and_children"];
			return (
				TreeEngineActions.event.match(action) &&
				action.payload.activityId === activityId &&
				Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
				events.includes(action.payload.engineAction.payload.button.event)
			);
		},
		SagaUtils.withErrorHandling(handleNodeEventButton, { activityId, error: TreeEngineError.CopyNodeError() })
	);
}

function* handleNodeEventButton(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>
) {
	const { engineAction, activityId } = action.payload;
	const { nodePath, nodeIdentifier, button } = engineAction.payload;
	const includeChildren = button.event === "event_copy_node_and_children";

	if (!includeChildren) {
		const setCopiedNodesAction = Commands.setCopiedNodes({
			copiedNodes: [{ nodeIdentifier, nodePath, includeChildren }]
		});
		yield* put(TreeEngineActions.command({ activityId, engineAction: setCopiedNodesAction }));
		return;
	}

	let lockId: string | undefined;
	try {
		const nodes: BaseNode[] = [{ nodePath, nodeIdentifier }];
		const operation: TreeEngineOperation.LoadAllChildNodes = {
			type: "LOAD_ALL_CHILD_NODES",
			payload: { nodes, ignorePagination: true }
		};
		lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "TreeEngine", {});

		yield* call(SagaUtils.loadActivityData, activityId, { operations: [operation] });
	} finally {
		if (lockId) {
			yield* put(ActivityActions.unlock({ activityId, lockId }));
		}
	}

	const dataState = yield* select(TreeEngineSelectors.dataState(activityId));
	if (!dataState) {
		throw TreeEngineError.NotFoundError("TreeEngine.DataState");
	}

	const copiedNodes: TreeEngineState.Clipboard.Node[] = [
		{
			nodeIdentifier,
			nodePath,
			includeChildren: true,
			children: collectSubtreeNodes(nodePath, nodeIdentifier, dataState)
		}
	];
	const setCopiedNodesAction = Commands.setCopiedNodes({ copiedNodes });
	yield* put(TreeEngineActions.command({ activityId, engineAction: setCopiedNodesAction }));
}

/** @internal */
export function collectSubtreeNodes(
	nodePath: TreeEngineState.NodePath,
	nodeIdentifier: Identifier,
	dataState: DataState
): TreeEngineState.SubLevelMultiSelectedNode[] | undefined {
	if (DataSelector.isCircularPath(nodePath)(dataState)) {
		return undefined;
	}
	const childNodes = DataSelector.childNodes({ nodeIdentifier, nodePath })(dataState);
	return childNodes.map((childNode) => {
		return {
			nodeIdentifier: childNode.nodeIdentifier,
			nodePath: childNode.nodePath,
			children: collectSubtreeNodes(childNode.nodePath, childNode.nodeIdentifier, dataState)
		};
	});
}
