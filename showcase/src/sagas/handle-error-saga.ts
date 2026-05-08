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
import { type SagaGenerator, takeEvery, put, all } from "typed-redux-saga";
import { type Action } from "typescript-fsa";

import { JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { TreeEngineError } from "@com.mgmtp.a12.treeengine/treeengine-core";
import { ActivityActions, NotificationActions } from "@com.mgmtp.a12.client/client-core";

import { toCapitalize } from "../utils.js";
import { SHOWCASE_RESOURCE_KEYS } from "../config/resources.js";

// tag::handleErrorSaga[]
export function* handleErrorSaga(): SagaGenerator<void> {
	yield* takeEvery((anyAction: AnyAction) => ActivityActions.error.match(anyAction), handle);
}

function* handle(action: Action<ActivityActions.ErrorPayload>): SagaGenerator<void> {
	const { activityId, error } = action.payload;
	const addNotificationEffects = [];

	if (TreeEngineError.ServerError.isInstance(error)) {
		const errors = error.errors.slice(0, 1);
		errors.forEach((error) => {
			const exception = JsonRpc2Response.Exception.isInstance(error.data) ? error.data : undefined;
			const notificationAction = NotificationActions.add({
				activityId,
				severity: "error",
				title: {
					key: exception?.description.default ?? SHOWCASE_RESOURCE_KEYS.showcase.error.server.title,
					defaults: { en: exception?.title.default }
				},
				message: {
					key: exception?.description.default ?? SHOWCASE_RESOURCE_KEYS.showcase.error.server.message,
					defaults: { en: exception?.description.default }
				}
			});
			addNotificationEffects.push(put(notificationAction));
		});
	} else if (TreeEngineError.isInstance(error)) {
		const notificationAction = NotificationActions.add({
			activityId,
			severity: "error",
			title: {
				key: `tree.engine.showcase.error.${error.errorCode}.title`,
				defaults: { en: error.errorCode.split("_").map(toCapitalize).join(" ") }
			},
			message: {
				key: `tree.engine.showcase.error.${error.errorCode}.message`,
				defaults: { en: error.message }
			}
		});
		addNotificationEffects.push(put(notificationAction));
	}

	yield* all(addNotificationEffects);
}

// end::handleErrorSaga[]
