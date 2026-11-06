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

import { Events } from "../../../../../../core/store/actions.js";
import type { TreeEngineState } from "../../../../../../core/store/store.js";
import { TreeEngineActions } from "../../../../../../extensions/client/actions.js";
import { refreshActiveSearch } from "../../../../../../extensions/client/sagas/handlers/create-document/refresh-active-search.js";
import { defaultEngineState } from "../../../../../setup/basic.spec.js";

describe("@com.mgmtp.a12.tree-engine.extensions.client.sagas.create-document.refresh-active-search", () => {
	const activityId = "activity-1";

	function uiStateWithSearchString(searchString: string): TreeEngineState {
		return { ...defaultEngineState, searchString };
	}

	it("re-dispatches the search event with the active search string so the new node is re-evaluated", () => {
		const generator = refreshActiveSearch(activityId);

		const selectEffect = generator.next().value;
		expect(selectEffect).toHaveProperty("type", "SELECT");

		const putEffect = generator.next(uiStateWithSearchString("chi")).value;
		expect(putEffect).toHaveProperty("type", "PUT");
		expect((putEffect as { payload: { action: unknown } }).payload.action).toEqual(
			TreeEngineActions.event({
				activityId,
				// Marked as a refresh: the user did not submit this term, so the result view they are
				// reading and the selection they built up have to survive the re-run.
				engineAction: Events.onSearchQueryChanged({ searchTerm: "chi", trigger: "engine" })
			})
		);

		expect(generator.next().done).toBe(true);
	});

	it("is a no-op when no search is active", () => {
		const generator = refreshActiveSearch(activityId);
		generator.next();

		const result = generator.next(uiStateWithSearchString(""));
		expect(result.done).toBe(true);
		expect(result.value).toBeUndefined();
	});

	it("is a no-op when the search string is only whitespace", () => {
		const generator = refreshActiveSearch(activityId);
		generator.next();

		const result = generator.next(uiStateWithSearchString("   "));
		expect(result.done).toBe(true);
		expect(result.value).toBeUndefined();
	});
});
