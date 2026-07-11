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

import { isAction, type Middleware } from "redux";

import { Activity, ActivityActions } from "@com.mgmtp.a12.client/client-core";
import { buildInitialUiState } from "@com.mgmtp.a12.treeengine/treeengine-core";

import { getShowcaseDisabled, getTargetNodePath } from "../../utils.js";

export const extendedPushMiddleware: Middleware = () => (next) => (action) => {
	if (isAction(action) && ActivityActions.push.match(action)) {
		const disabled = getShowcaseDisabled();

		let uiState = buildInitialUiState();

		const { descriptor } = action.payload.activity;
		if (descriptor.model === "categories" && descriptor.feature !== "virtual-scroll") {
			const targetNodePath = getTargetNodePath("categories");
			if (targetNodePath) {
				uiState = { ...uiState, scrollToNode: { nodePath: targetNodePath } };
			}
		}

		if (disabled) {
			uiState = { ...uiState, disabled: true };
		}

		if (!uiState.scrollToNode && !uiState.disabled) {
			return next(action);
		}

		const defaultDataHolder: Activity.DataHolder | undefined = Activity.findDefaultDataHolder(action.payload.activity);
		if (!action.payload.activity.dataHolders || !defaultDataHolder) {
			throw new Error("The default data holder is missing!");
		}
		const remainingDataHolders = action.payload.activity.dataHolders.filter((dh) => dh !== defaultDataHolder);

		const extendedPayload: ActivityActions.PushPayload = {
			...action.payload,
			activity: {
				...action.payload.activity,
				dataHolders: [
					{
						...defaultDataHolder,
						slices: {
							...defaultDataHolder.slices,
							...uiState
						} as unknown as Activity.DataHolder["slices"]
					},
					...remainingDataHolders
				]
			}
		};
		return next(ActivityActions.push(extendedPayload));
	} else {
		return next(action);
	}
};
