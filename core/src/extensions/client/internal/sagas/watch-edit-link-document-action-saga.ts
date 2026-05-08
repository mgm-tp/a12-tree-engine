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

import { type SagaGenerator, put, race, select, take, takeEvery } from "typed-redux-saga";
import { type Action, type AnyAction, type Success } from "typescript-fsa";

import { ActivityActions, ActivitySelectors, NEW_INSTANCE_IDENTIFIER } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineError } from "../../../../core/error/index.js";

import { TreeEngineActions } from "../actions.js";

/** @internal */
export function* watchEditLinkDocumentActionSaga(): SagaGenerator<void> {
	yield* takeEvery(TreeEngineActions.editLinkDocument.started, handle);
}

function* handle(action: Action<TreeEngineActions.EditLinkDocumentPayload.Started>): SagaGenerator<void> {
	const isDocumentMissing = !!action.payload.instance;

	const { model, activityId, document = {}, instance = NEW_INSTANCE_IDENTIFIER } = action.payload;

	const activityDescriptor = yield* select(ActivitySelectors.activityPropById(activityId, (a) => a.descriptor));

	const createActivityAction = ActivityActions.create({
		activityDescriptor: { ...activityDescriptor, model, instance, linkForm: "true" },
		initiatingActivityId: activityId,
		data: { document },
		loadingState: isDocumentMissing ? "missing" : "loaded"
	});
	const formActivityId = createActivityAction.payload.activity.id;
	yield* put(createActivityAction);

	type SuccessPayload = { document?: object; dirty?: boolean };
	const { doneAction, cancelledAction } = yield* race({
		doneAction: take<Action<Success<unknown, SuccessPayload>>>(
			(anyAction: AnyAction) =>
				(ActivityActions.commit.done.match(anyAction) || ActivityActions.save.done.match(anyAction)) &&
				anyAction.payload.params.activityId === formActivityId
		),
		cancelledAction: take(
			(anyAction: AnyAction) =>
				ActivityActions.cancel.match(anyAction) && anyAction.payload.activityId === formActivityId
		)
	});

	if (doneAction) {
		const { result } = doneAction.payload;
		if (result.document === undefined || result.dirty === undefined) {
			throw TreeEngineError.TypeError("Document", {
				expect: `EditLinkDocument contains "document" and "dirty" field`,
				actual: result
			});
		}
		yield* put(
			TreeEngineActions.editLinkDocument.done({ model, activityId, document: result.document, dirty: result.dirty })
		);
	} else if (cancelledAction) {
		yield* put(TreeEngineActions.editLinkDocument.cancelled({ model, activityId }));
	}
}
