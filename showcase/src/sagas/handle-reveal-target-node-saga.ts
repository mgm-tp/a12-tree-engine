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

import { type SagaGenerator, put, select, takeEvery } from "typed-redux-saga";
import { type AnyAction } from "redux";
import { type Action } from "typescript-fsa";

import { TreeEngineActions, Events } from "@com.mgmtp.a12.treeengine/treeengine-core";
import { ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { getNodesFromNodePath, getTargetNodePath } from "../utils.js";
import { assert, REVEAL_TARGET_NODE_EVENT, REVEAL_TARGET_NODE_EVENT_NO_AUTOFOCUS } from "../helpers.js";

export function* handleRevealTargetNodeSaga(): SagaGenerator<void> {
	yield* takeEvery(
		(anyAction: AnyAction) =>
			TreeEngineActions.event.match(anyAction) &&
			Events.onEventButtonClicked.match(anyAction.payload.engineAction) &&
			[REVEAL_TARGET_NODE_EVENT, REVEAL_TARGET_NODE_EVENT_NO_AUTOFOCUS].includes(
				anyAction.payload.engineAction.payload.button.event
			),
		handle
	);
}

export function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.EventButtonClickedPayload>>>
): SagaGenerator<void> {
	const {
		payload: { activityId, engineAction }
	} = action;
	const activity = yield* select(ActivitySelectors.activityById(activityId));
	assert(activity && activity.descriptor.model);

	const { model } = activity.descriptor;
	const targetNodePath = getTargetNodePath(model);
	const nodesFromNodePath = getNodesFromNodePath(model);

	if (!targetNodePath) {
		return;
	}

	const autoFocus = engineAction.payload.button.event === REVEAL_TARGET_NODE_EVENT ? true : false;

	yield* put(
		TreeEngineActions.event({
			activityId,
			engineAction: Events.scrollToNode({ nodePath: targetNodePath, nodesFromNodePath, autoFocus })
		})
	);
}
