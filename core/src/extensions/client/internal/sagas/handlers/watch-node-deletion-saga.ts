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

import { TreeEngineError } from "../../../../../core/error/index.js";
import { DataSelector, Events } from "../../../../../core/store/index.js";
import { TreeEngineActions } from "../../actions.js";
import { type TreeEngineOperation } from "../../operation.js";
import { TreeEngineSelectors } from "../../selectors.js";
import { logger } from "../../utils.js";

import { SagaUtils } from "../saga-utils.js";

import { NodeDeletionUtils } from "./shared.js";

/** @internal */
export function* watchNodeDeletionSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: AnyAction) => {
			return (
				TreeEngineActions.event.match(action) &&
				Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
				action.payload.activityId === activityId &&
				action.payload.engineAction.payload.button.event === "event_delete_node"
			);
		},
		SagaUtils.withErrorHandling(handle, { activityId, error: TreeEngineError.DeleteNodeError() })
	);
}

function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { engineAction, activityId } = action.payload;
	const { nodePath, nodeIdentifier } = engineAction.payload;

	logger.log("Delete node", nodePath);

	const nodesDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	const dataState = yield* select(TreeEngineSelectors.dataState(activityId));
	if (!nodesDataHolders || !dataState) {
		throw TreeEngineError.NotFoundError("TreeEngine.DataHolder", { activityId });
	}
	const parent = DataSelector.parent({ nodeIdentifier, nodePath })(dataState);
	const operation: TreeEngineOperation = {
		type: "DELETE_NODE",
		payload: {
			nodeIdentifier,
			nodePath,
			parentIdentifier: parent?.nodeIdentifier,
			outdatedDataHolderDescriptors: NodeDeletionUtils.getTobeLoadedDataHolders(
				nodesDataHolders,
				nodeIdentifier,
				parent?.nodeIdentifier
			),
			removedDataHolderDescriptors: NodeDeletionUtils.getToBeRemovedDataHolders(nodesDataHolders, nodeIdentifier)
		}
	};
	let lockId: string | undefined;
	try {
		lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "TreeEngine", {});
		yield* call(SagaUtils.saveActivity, activityId, { operations: [operation] });

		const engineAction = Events.revalidateClipboard({ removedNodes: [nodeIdentifier] });
		yield* put(TreeEngineActions.event({ activityId, engineAction }));

		if (parent) {
			yield* call(SagaUtils.preloadChildNodes, activityId, parent.nodeIdentifier.id);
		}
	} finally {
		if (lockId) {
			yield* put(ActivityActions.unlock({ activityId, lockId }));
		}
	}
}
