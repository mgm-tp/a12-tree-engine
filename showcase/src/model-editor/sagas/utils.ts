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

import { type SagaGenerator, call, put, select } from "typed-redux-saga";

import { ActivityActions, ActivityMap, ActivitySagas, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";
import type { TreeEngineState } from "@com.mgmtp.a12.treeengine/treeengine-core";

import type { File } from "../document.js";

export function* cancelChildActivities(activityId: string): SagaGenerator<boolean> {
	const activities = ActivityMap.toList(yield* select(ActivitySelectors.activities()));
	const childActivities = activities.filter(({ initiatingActivityId }) => initiatingActivityId === activityId);
	if (childActivities) {
		yield* put(ActivityActions.cancelRequested({ activityIds: childActivities.map(({ id }) => id) }));
		const cancelled = yield* call(ActivitySagas.waitForResponseCancelRequested);
		if (!cancelled) {
			return false;
		}
	}
	return true;
}

// tag::CustomInitialExpansion[]
export function getInitialExpansionConfig(doc: File) {
	let initialExpansion: TreeEngineState["initialExpansion"] = undefined;
	if (doc.File.Size <= 5000) {
		initialExpansion = { type: "all_levels" };
	} else if (doc.File.Size > 5000 && doc.File.Size < 10000) {
		initialExpansion = { type: "level_limit", level: 2, affectedNodeRefs: ["node-54bbd"] };
	} else if (doc.File.Size >= 10000) {
		initialExpansion = false;
	}
	return initialExpansion;
}
// end::CustomInitialExpansion[]
