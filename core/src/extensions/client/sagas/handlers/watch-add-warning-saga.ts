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

import { put, type SagaGenerator, takeLatest } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { NotificationActions } from "@com.mgmtp.a12.client/client-core";

import { Events } from "../../../../core/store/actions.js";
import { TreeEngineActions } from "../../actions.js";
import { LocalizableFactory } from "../../../../core/services/localization/localizable-factory.js";
import { RESOURCE_KEYS } from "../../../../core/services/localization/languages/keys.js";

/** @internal */
export function* watchAddWarningSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest((action: unknown) => {
		return (
			TreeEngineActions.event.match(action) &&
			Events.onAddWarning.match(action.payload.engineAction) &&
			action.payload.activityId === activityId
		);
	}, handle);
}

function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.AddWarningPayload>>>
): SagaGenerator<void> {
	const { engineAction, activityId } = action.payload;
	const { message } = engineAction.payload;

	yield* put(
		NotificationActions.add({
			activityId,
			severity: "warning",
			duration: 5000,
			title: LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.treeEngine.notification.title.warning),
			message
		})
	);
}
