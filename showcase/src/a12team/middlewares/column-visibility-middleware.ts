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

import { isEqual } from "lodash-es";
import { isAction, type Middleware } from "redux";

import { type Activity, ActivityActions } from "@com.mgmtp.a12.client/client-core";
import { TreeEngineActions } from "@com.mgmtp.a12.treeengine/treeengine-core";

import { readPersistedColumnVisibility } from "../column-visibility-storage.js";
import { A12_TEAMS_CUSTOM_VIEW_DESCRIPTOR } from "../descriptors.js";

// tag::columnVisibilityRestore[]
/**
 * Restores the stored column visibility before the activity exists, so the tree renders the
 * user's selection on its first paint instead of showing the modelled default and correcting
 * itself afterwards.
 */
export const columnVisibilityMiddleware: Middleware = () => (next) => (action) => {
	if (!isAction(action) || !ActivityActions.push.match(action)) {
		return next(action);
	}

	const { activity } = action.payload;
	const columnVisibility = readPersistedColumnVisibility();

	if (!isTargetActivity(activity) || !isSliceEmpty(activity) || Object.keys(columnVisibility).length === 0) {
		return next(action);
	}

	return next(
		TreeEngineActions.createActivity(
			{ activityId: activity.id, activityDescriptor: activity.descriptor },
			{ columnVisibility }
		)
	);
};

function isTargetActivity(activity: Activity): boolean {
	return isEqual(activity.descriptor, A12_TEAMS_CUSTOM_VIEW_DESCRIPTOR);
}

/** Another middleware may already have seeded the slices — leave that activity alone. */
function isSliceEmpty(activity: Activity): boolean {
	return Object.keys(activity.dataHolders?.[0]?.slices ?? {}).length === 0;
}
// end::columnVisibilityRestore[]
