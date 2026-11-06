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

import { type SagaGenerator, call, put, takeLatest } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";

import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { Commands, Events } from "../../../../core/store/actions.js";
import { TreeEngineActions } from "../../actions.js";
import type { TreeEngineOperation } from "../../operation.js";
import { SagaUtils } from "../saga-utils.js";

/** @internal */
export function* watchSearchSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: unknown) =>
			TreeEngineActions.event.match(action) &&
			action.payload.activityId === activityId &&
			Events.onSearchQueryChanged.match(action.payload.engineAction),
		SagaUtils.withErrorHandling(handleSearchQueryChanged, {
			activityId,
			error: TreeEngineError.SearchError(),
			operationType: "loading"
		})
	);

	yield* takeLatest(
		(action: unknown) =>
			TreeEngineActions.event.match(action) &&
			action.payload.activityId === activityId &&
			Events.onMobileSearchBarToggle.match(action.payload.engineAction),
		handleMobileSearchBarToggle
	);

	yield* takeLatest(
		(action: unknown) =>
			TreeEngineActions.event.match(action) &&
			action.payload.activityId === activityId &&
			Events.onSearchResultViewChanged.match(action.payload.engineAction),
		SagaUtils.withErrorHandling(handleSearchResultViewChanged, {
			activityId,
			error: TreeEngineError.SearchError(),
			operationType: "loading"
		})
	);
}

function* handleSearchResultViewChanged(
	action: Action<TreeEngineActions.EventPayload<Action<Events.SearchResultViewChangedPayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;

	yield* put(
		TreeEngineActions.command({
			activityId,
			engineAction: Commands.setSearchResultView({ view: engineAction.payload.view })
		})
	);
}

function* handleMobileSearchBarToggle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.MobileSearchBarTogglePayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	yield* put(
		TreeEngineActions.command({
			activityId,
			engineAction: Commands.setShowMobileSearchBar({ visible: engineAction.payload.visible })
		})
	);
}

function* handleSearchQueryChanged(
	action: Action<TreeEngineActions.EventPayload<Action<Events.SearchQueryChangedPayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const { searchTerm, trigger } = engineAction.payload;
	const trimmed = searchTerm.trim();

	// An emptied term is a clear, not a search: the clear button and a submitted blank land here too.
	const operation: TreeEngineOperation.SearchNodes | TreeEngineOperation.ClearSearch = trimmed
		? { type: "SEARCH_NODES", payload: { searchTerm: trimmed, trigger } }
		: { type: "CLEAR_SEARCH", payload: {} };

	yield* call(SagaUtils.performLoadOperations, activityId, [operation]);
}
