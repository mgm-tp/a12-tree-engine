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

import { type SagaGenerator, put, select } from "typed-redux-saga";

import { Events } from "../../../../../core/store/actions.js";
import { UIStateSelector } from "../../../../../core/store/selectors/ui-state.js";
import { TreeEngineActions } from "../../../actions.js";
import { TreeEngineSelectors } from "../../../selectors.js";

/**
 * Re-run the active search as a refresh, so the created node is matched like any other row.
 *
 * @internal
 */
export function* refreshActiveSearch(activityId: string): SagaGenerator<void> {
	const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
	const searchString = UIStateSelector.searchString()(uiState);
	if (!searchString) {
		return;
	}

	yield* put(
		TreeEngineActions.event({
			activityId,
			engineAction: Events.onSearchQueryChanged({ searchTerm: searchString, trigger: "engine" })
		})
	);
}
