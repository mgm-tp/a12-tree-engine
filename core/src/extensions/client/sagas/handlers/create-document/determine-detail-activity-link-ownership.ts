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

import { type SagaGenerator, call, race, select, take } from "typed-redux-saga";

import { Activity, ActivitySelectors, StoreSagas } from "@com.mgmtp.a12.client/client-core";

import { logger } from "../../../utils.js";

import { createCancelledPredicate, createSaveStartedPredicate } from "./handle-create-detail-activity-saga.js";

/** @internal */
export type DetailActivityOwnership =
	| "relationship-engine"
	| "tree-engine"
	| "tree-engine-save-in-progress"
	| "cancelled";

/** @internal */
export function* determineDetailActivityLinkOwnership(
	detailActivityId: string
): SagaGenerator<DetailActivityOwnership> {
	const { formEngineFallback, saveStarted, cancelled } = yield* race({
		changelogDetected: call(StoreSagas.waitForStateChange, (state: object) => {
			const activity = ActivitySelectors.activityById(detailActivityId)(state);
			if (!activity) {
				return { stateChanged: true, returnValue: undefined };
			}
			if (classifyRelationshipChangelog(activity.dataHolders) === "populated") {
				return { stateChanged: true, returnValue: "changelog" as const };
			}
			return { stateChanged: false, returnValue: undefined };
		}),
		formEngineFallback: call(StoreSagas.waitForStateChange, (state: object) => {
			const activity = ActivitySelectors.activityById(detailActivityId)(state);
			if (!activity) {
				return { stateChanged: false, returnValue: undefined };
			}
			const changelog = classifyRelationshipChangelog(activity.dataHolders);
			const isFormEngineFallback =
				changelog === "empty" || (changelog === "absent" && hasFormEngineDocumentDataHolder(activity));
			if (isFormEngineFallback) {
				return { stateChanged: true, returnValue: "formEngine" as const };
			}
			return { stateChanged: false, returnValue: undefined };
		}),
		saveStarted: take(createSaveStartedPredicate(detailActivityId)),
		cancelled: take(createCancelledPredicate(detailActivityId))
	});

	if (cancelled) {
		return "cancelled";
	}

	if (saveStarted) {
		// RE seeds the changelog at activity load time and never populates it later, so one re-check here is final.
		const activity = yield* select(ActivitySelectors.activityById(detailActivityId));
		const changelog = activity ? classifyRelationshipChangelog(activity.dataHolders) : "absent";
		if (changelog === "populated") {
			return "relationship-engine";
		}
		logger.log("Tree Engine taking over link creation");
		return "tree-engine-save-in-progress";
	}

	return formEngineFallback !== undefined ? "tree-engine" : "relationship-engine";
}

function classifyRelationshipChangelog(dataHolders: readonly Activity.DataHolder[]): "populated" | "empty" | "absent" {
	const changelogDataHolders = dataHolders.filter(isChangelogDataHolder);
	if (changelogDataHolders.length === 0) {
		return "absent";
	}
	return changelogDataHolders.some((dh) => hasNonEmptyChanges(dh.data)) ? "populated" : "empty";
}

function hasFormEngineDocumentDataHolder(activity: Activity): boolean {
	const defaultDH = Activity.findDefaultDataHolder(activity);
	return defaultDH?.data !== undefined && Activity.Data.Document.isInstance(defaultDH.data);
}

/*
 * Temporary workaround until RE deliver a public/stable API surface for detecting the presence of changelog data on the detail activity.
 */
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
