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
import { ActivityActions, ActivitySelectors, StoreSagas } from "@com.mgmtp.a12.client/client-core";

import { Commands, Events } from "../../../../core/store/actions.js";
import { TreeEngineState } from "../../../../core/store/store.js";
import { UIStateSelector } from "../../../../core/store/selectors/ui-state.js";
import { TreeEngineActions } from "../../actions.js";
import { TreeEngineSelectors } from "../../selectors.js";
import { logger } from "../../utils.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";

import { SagaUtils } from "../saga-utils.js";

/** @internal */
export function* watchNodeRowSelectionSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: unknown) =>
			TreeEngineActions.event.match(action) &&
			Events.onNodeSelectionChanged.match(action.payload.engineAction) &&
			action.payload.activityId === activityId,
		SagaUtils.withErrorHandling(handle, {
			activityId,
			error: TreeEngineError.SelectNodeError(),
			operationType: "loading"
		})
	);
}

function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeSelectionChangedPayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const { nodePath, nodeIdentifier, selected } = engineAction.payload;

	logger.log("select row", nodeIdentifier, selected);

	if (selected) {
		const cancelled = yield* call(SagaUtils.cancelChildActivitiesIfPresent, activityId);
		if (!cancelled) {
			return;
		}
		const nodes = { [TreeEngineState.NodePath.toString(nodePath)]: {} };
		yield* put(TreeEngineActions.command({ activityId, engineAction: Commands.setSelectedNodes({ nodes }) }));

		const activityDescriptor = yield* select(ActivitySelectors.activityPropById(activityId, (a) => a.descriptor));

		const createDetailActivityAction = ActivityActions.create({
			activityDescriptor: { ...activityDescriptor, model: nodeIdentifier.type, instance: nodeIdentifier.id },
			initiatingActivityId: activityId
		});
		yield* put(createDetailActivityAction);

		yield* call(StoreSagas.waitForStateChange, (state: object) => {
			const detailActivity = ActivitySelectors.activityById(createDetailActivityAction.payload.activity.id)(state);
			const isDetailActivityGone = !detailActivity;
			return { returnValue: null, stateChanged: isDetailActivityGone };
		});
		const eventAction = Events.onNodeSelectionChanged({ nodeIdentifier, nodePath, selected: false });
		yield* put(TreeEngineActions.event({ activityId, engineAction: eventAction }));
	} else {
		const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
		const nodes = { ...UIStateSelector.selectedNodes()(uiState) };
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete nodes[TreeEngineState.NodePath.toString(nodePath)];
		yield* put(TreeEngineActions.command({ activityId, engineAction: Commands.setSelectedNodes({ nodes }) }));
	}
}
