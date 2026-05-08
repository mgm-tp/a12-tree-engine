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

import { type Activity, ActivityActions, ActivitySagas } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineError } from "../../../../../core/error/index.js";
import { Commands, DataSelector, Events, TreeEngineState, UIStateSelector } from "../../../../../core/store/index.js";
import { TreeEngineActions } from "../../actions.js";
import { TreeEngineDataHolder } from "../../data-holder.js";
import { type TreeEngineOperation } from "../../operation.js";
import { TreeEngineSelectors } from "../../selectors.js";

import { SagaUtils } from "../saga-utils.js";

import { NodeDeletionUtils } from "./shared.js";

/** @internal */
export function* watchNodesDeletionSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: AnyAction) => {
			return (
				TreeEngineActions.event.match(action) &&
				Events.onMultiSelectionEventButtonClicked.match(action.payload.engineAction) &&
				action.payload.activityId === activityId &&
				action.payload.engineAction.payload.button.event === "event_delete_nodes"
			);
		},
		SagaUtils.withErrorHandling(handle, { activityId, error: TreeEngineError.DeleteNodeError() })
	);
}

function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.MultiSelectionEventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { activityId } = action.payload;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
	}

	const nodesDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	if (!nodesDataHolders) {
		throw TreeEngineError.NotFoundError("TreeEngine.DataHolder", { activityId });
	}

	const multiSelectionNodes = UIStateSelector.multiSelectionNodes()(engineState);

	const parentIds = new Set<string>();
	const operations: TreeEngineOperation.DeleteNode[] = [];
	for (const [nodePathString, status] of Object.entries(multiSelectionNodes)) {
		if (status === TreeEngineState.MultiSelectionState.SELECTED) {
			const nodePath = TreeEngineState.NodePath.fromString(nodePathString);
			const nodeIdentifier = DataSelector.nodeIdentifierFromNodePath(nodePath)(engineState);
			if (!nodeIdentifier) {
				throw TreeEngineError.NotFoundError("TreeEngine.Identifier");
			}
			const parent = DataSelector.parent({ nodeIdentifier, nodePath })(engineState);
			operations.push({
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
			});
			if (parent) {
				parentIds.add(parent.nodeIdentifier.id);
			}
		}
	}

	let lockId: string | undefined;
	try {
		lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "TreeEngine", {});
		const result = yield* call(SagaUtils.saveActivity, activityId, { operations });
		if (result) {
			const engineAction = Commands.setMultiSelectionNodes({ multiSelectionNodes: {} });
			yield* put(TreeEngineActions.command({ activityId, engineAction }));
		}

		const engineAction = Events.revalidateClipboard({ removedNodes: operations.map((o) => o.payload.nodeIdentifier) });
		yield* put(TreeEngineActions.event({ activityId, engineAction }));

		yield* call(SagaUtils.preloadChildNodes, activityId, (descriptor: Activity.DataHolderDescriptor) => {
			if (
				!TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(descriptor) &&
				!TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor)
			) {
				return false;
			}
			return parentIds.has(descriptor.source);
		});
	} finally {
		if (lockId) {
			yield* put(ActivityActions.unlock({ activityId, lockId }));
		}
	}
}
