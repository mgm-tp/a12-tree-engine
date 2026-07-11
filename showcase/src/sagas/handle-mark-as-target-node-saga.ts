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

import { type SagaGenerator, select, takeLatest } from "typed-redux-saga";
import { isAction } from "redux";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import {
	TreeEngineActions,
	TreeEngineSelectors,
	Events,
	DataSelector
} from "@com.mgmtp.a12.treeengine/treeengine-core";
import { ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { setNodesFromNodePath, setTargetNodePath } from "../utils.js";
import { assert, MARK_AS_TARGET_NODE_EVENT } from "../helpers.js";

export function* handleMarkAsTargetNodeSaga(): SagaGenerator<void> {
	yield* takeLatest((action: unknown) => {
		return (
			isAction(action) &&
			TreeEngineActions.event.match(action) &&
			Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.engineAction.payload.button.event === MARK_AS_TARGET_NODE_EVENT
		);
	}, handle);
}

function* handle(action: Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>) {
	const {
		payload: {
			activityId,
			engineAction: {
				payload: { nodePath }
			}
		}
	} = action;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	assert(engineState, `Invalid engine state in activity ${activityId}`);

	const nodesFromNodePath = DataSelector.nodesFromNodePath(nodePath)(engineState);

	const activity = yield* select(ActivitySelectors.activityById(activityId));
	assert(activity && activity.descriptor.model && activity.dataHolders);

	const { model } = activity.descriptor;
	setTargetNodePath(model, nodePath);
	setNodesFromNodePath(model, nodesFromNodePath);
}
