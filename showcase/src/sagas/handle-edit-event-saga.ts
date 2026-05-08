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

import { type AnyAction } from "redux";
import { type SagaGenerator, takeEvery, put } from "typed-redux-saga";
import { type Action } from "typescript-fsa";

import { Events, TreeEngineActions } from "@com.mgmtp.a12.treeengine/treeengine-core";

import { EDIT_NODE_EVENT } from "../helpers.js";

// tag::handleEditEventSaga[]
export function* handleEditEventSaga(): SagaGenerator<void> {
	yield* takeEvery((action: AnyAction) => {
		return (
			TreeEngineActions.event.match(action) &&
			Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.engineAction.payload.button.event === EDIT_NODE_EVENT
		);
	}, handle);
}

function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { engineAction, activityId } = action.payload;
	const { nodeIdentifier, nodePath } = engineAction.payload;
	yield* put(
		TreeEngineActions.event({
			activityId,
			engineAction: Events.onNodeSelectionChanged({ nodeIdentifier, nodePath, selected: true })
		})
	);
}
// end::handleEditEventSaga[]
