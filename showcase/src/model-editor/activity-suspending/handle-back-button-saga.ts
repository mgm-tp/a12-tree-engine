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

import { put, type SagaGenerator, select, takeLatest } from "typed-redux-saga";
import { isAction } from "redux";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { ActivityActions } from "@com.mgmtp.a12.client/client-core";
import { Events, TreeEngineActions } from "@com.mgmtp.a12.treeengine/treeengine-core";

import { BACK_ENGINE_EVENT } from "../../helpers.js";

import { restoreActivityAction } from "./actions.js";

// tag::handleBackButtonSaga[]
export function* handleBackButtonSaga(): SagaGenerator<void> {
	yield* takeLatest((action: unknown) => {
		return (
			isAction(action) &&
			TreeEngineActions.event.match(action) &&
			Events.onEventButtonClicked.match(action.payload.engineAction) &&
			[BACK_ENGINE_EVENT].includes(action.payload.engineAction.payload.button.event)
		);
	}, handle);
}

function* handle(action: Action<ActivityActions.ActivityActionPayload>) {
	const { activityId } = action.payload;
	const suspendingActivity = yield* select((state) => state.suspendingActivity);

	if (suspendingActivity) {
		yield* put(restoreActivityAction({ activity: suspendingActivity }));
	} else {
		yield* put(ActivityActions.cancel({ activityId }));
	}
}
// end::handleBackButtonSaga[]
