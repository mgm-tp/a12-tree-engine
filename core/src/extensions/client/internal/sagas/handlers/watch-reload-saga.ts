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

import { type SagaGenerator, call, takeLatest, select } from "typed-redux-saga";
import { type Action, type AnyAction } from "typescript-fsa";

import { type Activity } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineActions } from "../../actions.js";
import { DataSelector, Events, TreeDataUtils } from "../../../../../core/store/index.js";
import { type TreeEngineOperation } from "../../operation.js";
import { TreeEngineError } from "../../../../../core/error/index.js";
import { TreeEngineSelectors } from "../../selectors.js";

import { SagaUtils } from "../saga-utils.js";

/** @internal */
export function* watchReloadSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: AnyAction) =>
			TreeEngineActions.event.match(action) &&
			action.payload.activityId === activityId &&
			Events.reload.match(action.payload.engineAction),
		SagaUtils.withErrorHandling(handleReload, {
			activityId,
			error: TreeEngineError.ReloadNodeError(),
			operationType: "loading"
		})
	);

	yield* takeLatest(
		(action: AnyAction) =>
			TreeEngineActions.event.match(action) &&
			action.payload.activityId === activityId &&
			Events.reloadAll.match(action.payload.engineAction),
		SagaUtils.withErrorHandling(handleReloadAll, {
			activityId,
			error: TreeEngineError.ReloadNodeError(),
			operationType: "loading"
		})
	);
}

function* handleReload(
	action: Action<TreeEngineActions.EventPayload<Action<Events.ReloadPayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const { sources, level } = engineAction.payload;

	if (sources.length === 0) {
		return;
	}
	let operation: TreeEngineOperation.LoadAllChildNodes | TreeEngineOperation.ReloadNodes;
	let dataHolderDescriptors: Activity.DataHolderDescriptor[] | undefined;
	if (level === 0) {
		const dataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
		if (!dataHolders) {
			throw TreeEngineError.NotFoundError("TreeEngine.DataHolder", { activityId });
		}

		const outdatedDataHolderDescriptors = dataHolders
			.filter(({ data }) => {
				return sources.some((source) => data && TreeDataUtils.readNodeData(data, source));
			})
			.map(({ descriptor }) => descriptor);
		dataHolderDescriptors = outdatedDataHolderDescriptors;
		operation = {
			type: "RELOAD_NODES",
			payload: { nodes: sources, outdatedDataHolderDescriptors }
		};
	} else {
		const dataState = yield* select(TreeEngineSelectors.dataState(activityId));
		if (!dataState) {
			throw TreeEngineError.NotFoundError("Activity", { activityId });
		}

		const sourceNodes = sources.map((source) => ({
			nodeIdentifier: source,
			nodePath: DataSelector.nodePath(source.id)(dataState) ?? [source]
		}));

		operation = {
			type: "LOAD_ALL_CHILD_NODES",
			payload: { nodes: sourceNodes, onlyLoadedNodes: true, level }
		};
	}

	yield* call(SagaUtils.performLoadOperations, activityId, [operation], dataHolderDescriptors);
}

function* handleReloadAll(
	action: Action<TreeEngineActions.EventPayload<Action<Events.ReloadAllPayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const { level } = engineAction.payload;

	const operation: TreeEngineOperation = {
		type: "LOAD_ALL_CHILD_NODES",
		payload: { onlyLoadedNodes: true, level }
	};
	yield* call(SagaUtils.performLoadOperations, activityId, [operation]);
}
