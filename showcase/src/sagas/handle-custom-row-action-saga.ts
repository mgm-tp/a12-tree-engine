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

import { type SagaGenerator, takeEvery, put } from "typed-redux-saga";
import { isAction } from "redux";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { Events, TreeEngineActions } from "@com.mgmtp.a12.treeengine/treeengine-core";
import { NotificationActions } from "@com.mgmtp.a12.client/client-core";

import { SHOWCASE_RESOURCE_KEYS } from "../config/resources.js";

// tag::handleCustomRowActionSaga[]
export function* handleCustomRowActionSaga(): SagaGenerator<void> {
	yield* takeEvery(
		(action: unknown) =>
			isAction(action) &&
			TreeEngineActions.event.match(action) &&
			Events.onRowClicked.match(action.payload.engineAction),
		handle
	);
}

function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.RowClickedPayload>>>
): SagaGenerator<void> {
	const { engineAction, activityId } = action.payload;
	if (engineAction.payload.event === "selectPerson") {
		const notificationAction = NotificationActions.add({
			activityId,
			severity: "info",
			title: { key: SHOWCASE_RESOURCE_KEYS.showcase.a12Teams.customRowAction.selectPerson.title },
			message: { key: SHOWCASE_RESOURCE_KEYS.showcase.a12Teams.customRowAction.selectPerson.message }
		});
		yield* put(notificationAction);
	}
}
// end::handleCustomRowActionSaga[]
