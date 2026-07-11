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

import { isAction } from "redux";
import type { Task } from "redux-saga";
import { call, cancel, fork, takeEvery, type SagaGenerator, select } from "typed-redux-saga";

import { type Activity, ActivityActions, StoreSagas, ModelSelectors } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineError } from "../../../core/error/index.js";

import type { TreeEngineSaga } from "./saga-setting.js";
import { createDefaultSagasMap, toTreeEngineSagasMap } from "./saga-registration.js";
import { SagaUtils } from "./saga-utils.js";
import { watchEditLinkDocumentActionSaga } from "./watch-edit-link-document-action-saga.js";

/** @internal */
export function createTreeEngineSagas(setting: TreeEngineSaga.Setting): (() => SagaGenerator<void>)[] {
	return [makeSagasToRunForEachActivity(setting), watchEditLinkDocumentActionSaga];
}

/**
 * Make each Tree Engine activity independent by running a set of sagas for each of them
 * This will allow possibility to use {@link takeLatest} effects while having multiple tree engine's activities
 */
function makeSagasToRunForEachActivity(setting: TreeEngineSaga.Setting): () => SagaGenerator<void> {
	const matchers = [
		ActivityActions.push,
		ActivityActions.cancel,
		ActivityActions.commit.done,
		...(setting.sagaInitializationMatchers ?? [])
	];

	return function* (): SagaGenerator<void> {
		yield* takeEvery(
			(action: unknown) => {
				if (!isAction(action)) {
					return false;
				}
				if (matchers.every((matcher) => !matcher.match(action))) {
					return false;
				}

				return !!getActivity(action, setting);
			},
			function* (action: unknown): SagaGenerator<void> {
				const activityId = getActivity(action, setting)?.id;
				if (!activityId) {
					throw TreeEngineError.NotFoundError("Activity");
				}

				const models = yield* select(ModelSelectors.modelDescriptorsByActivityId(activityId));
				if (!models.some(({ modelType }) => modelType === "tree")) {
					return;
				}

				const { sagaRegistrations } = setting;
				const defaultSagasMap = createDefaultSagasMap(setting);
				const engineSagas = yield* call(toTreeEngineSagasMap, activityId, defaultSagasMap, sagaRegistrations ?? {});
				const sagas = Object.values(engineSagas);

				const watcherTasks: Task[] = [];
				for (const saga of sagas) {
					watcherTasks.push(yield* fork(saga, activityId));
				}

				yield* call(StoreSagas.waitForStateChange, SagaUtils.activityDismissed(activityId));
				yield* cancel(watcherTasks);
			}
		);
	};
}

function getActivity(action: unknown, setting?: TreeEngineSaga.Setting): Activity | undefined {
	if (!isAction(action)) {
		return undefined;
	}

	if (ActivityActions.push.match(action)) {
		return action.payload.activity;
	}

	if (ActivityActions.cancel.match(action)) {
		return action.payload.replacementActivity;
	}

	if (ActivityActions.commit.done.match(action)) {
		return action.payload.params.replacementActivity;
	}

	for (const matcher of setting?.sagaInitializationMatchers ?? []) {
		if (matcher.match(action)) {
			return action.payload.activity;
		}
	}

	return undefined;
}
