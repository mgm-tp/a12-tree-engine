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

import { type SagaGenerator, put, takeEvery } from "typed-redux-saga";
import { isAction } from "redux";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { TreeEngineActions, Events } from "@com.mgmtp.a12.treeengine/treeengine-core";

import { RELOAD_LEVEL_0, RELOAD_LEVEL_1, RELOAD_LEVEL_2, RELOAD_NODE_EVENT } from "../helpers.js";

export function* handleReloadNodeSaga(): SagaGenerator<void> {
	yield* takeEvery(
		(action: unknown) =>
			isAction(action) &&
			TreeEngineActions.event.match(action) &&
			Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.engineAction.payload.button.event === RELOAD_NODE_EVENT,
		createHandler()
	);
	yield* takeEvery(
		(action: unknown) =>
			TreeEngineActions.event.match(action) &&
			Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.engineAction.payload.button.event === RELOAD_LEVEL_0,
		createHandler(0)
	);
	yield* takeEvery(
		(action: unknown) =>
			TreeEngineActions.event.match(action) &&
			Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.engineAction.payload.button.event === RELOAD_LEVEL_1,
		createHandler(1)
	);
	yield* takeEvery(
		(action: unknown) =>
			TreeEngineActions.event.match(action) &&
			Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.engineAction.payload.button.event === RELOAD_LEVEL_2,
		createHandler(2)
	);
}

function createHandler(level?: number) {
	return function* handle(
		action: Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>
	): SagaGenerator<void> {
		const { activityId, engineAction } = action.payload;
		const {
			payload: { nodeIdentifier }
		} = engineAction;

		yield* put(
			TreeEngineActions.event({
				activityId,
				engineAction: Events.reload({ sources: [nodeIdentifier], level })
			})
		);
	};
}
