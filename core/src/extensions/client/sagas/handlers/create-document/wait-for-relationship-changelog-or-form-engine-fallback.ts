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
import { type SagaGenerator, call, race, take } from "typed-redux-saga";

import { Activity, ActivityActions, ActivitySelectors, StoreSagas } from "@com.mgmtp.a12.client/client-core";

/**
 * Races between a Relationship Engine changelog appearing on the detail activity and a
 * form-engine or non populated linkAdded relationship engine fallback.
 * The return of this indicate the whether Tree Engine should continue intercept the save behavior
 * to trigger a separate ADD_LINK operation.
 *
 * @internal
 */
export function* waitForRelationshipChangelogOrFormEngineFallback(detailActivityId: string): SagaGenerator<boolean> {
	const { formEngineFallback } = yield* race({
		changelogDetected: call(StoreSagas.waitForStateChange, (state: object) => {
			const activity = ActivitySelectors.activityById(detailActivityId)(state);
			if (!activity) {
				return { stateChanged: true, returnValue: undefined };
			}
			if (hasChangelogDataHolder(activity) && hasPopulatedChangelogDataHolder(activity)) {
				return { stateChanged: true, returnValue: "changelog" as const };
			}
			return { stateChanged: false, returnValue: undefined };
		}),
		formEngineFallback: call(StoreSagas.waitForStateChange, (state: object) => {
			const activity = ActivitySelectors.activityById(detailActivityId)(state);
			if (!activity) {
				return { stateChanged: false, returnValue: undefined };
			}
			if (hasChangelogDataHolder(activity)) {
				if (!hasPopulatedChangelogDataHolder(activity)) {
					return { stateChanged: true, returnValue: "formEngine" as const };
				}
				// let changelogDetected win
				return { stateChanged: false, returnValue: undefined };
			}
			const defaultDH = Activity.findDefaultDataHolder(activity);
			if (defaultDH?.data !== undefined && Activity.Data.Document.isInstance(defaultDH.data)) {
				return { stateChanged: true, returnValue: "formEngine" as const };
			}
			return { stateChanged: false, returnValue: undefined };
		}),
		cancelled: take(
			(action: unknown) =>
				isAction(action) && ActivityActions.cancel.match(action) && action.payload.activityId === detailActivityId
		)
	});

	return formEngineFallback !== undefined;
}

/*
 * Temporary workaround until RE deliver a public/stable API surface for detecting the presence of changelog data on the detail activity.
 */
function hasChangelogDataHolder(activity: Activity): boolean {
	return activity.dataHolders.some(isChangelogDataHolder);
}

function hasPopulatedChangelogDataHolder(activity: Activity): boolean {
	return activity.dataHolders.some((dh) => isChangelogDataHolder(dh) && hasNonEmptyChanges(dh.data));
}

function isChangelogDataHolder(dataHolder: Activity.DataHolder): boolean {
	return dataHolder.descriptor.feature === "relationship" && dataHolder.descriptor.type === "changelog";
}

function hasNonEmptyChanges(data: Activity.DataHolder["data"]): boolean {
	return (
		typeof data === "object" &&
		data !== null &&
		"changes" in data &&
		Array.isArray(data.changes) &&
		data.changes.length > 0
	);
}
