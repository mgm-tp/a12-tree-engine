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

import { type SagaGenerator, takeEvery, select, all, put } from "typed-redux-saga";
import { isAction } from "redux";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import {
	Commands,
	Events,
	UIStateSelector,
	TreeEngineActions,
	TreeEngineSelectors
} from "@com.mgmtp.a12.treeengine/treeengine-core";
import { NotificationActions } from "@com.mgmtp.a12.client/client-core";

import { assert, RELOAD_NODES_ENGINE_EVENT } from "../helpers.js";
import { SHOWCASE_RESOURCE_KEYS } from "../config/resources.js";

export function* handleMultiSelectionEventButtonSaga(): SagaGenerator<void> {
	yield* takeEvery((action: unknown) => {
		return (
			isAction(action) &&
			TreeEngineActions.event.match(action) &&
			Events.onMultiSelectionEventButtonClicked.match(action.payload.engineAction) &&
			!["event_delete_nodes", "event_copy_nodes", "event_cut_nodes", RELOAD_NODES_ENGINE_EVENT].includes(
				action.payload.engineAction.payload.button.event
			)
		);
	}, handle);
}

function* handle(
	action: Action<TreeEngineActions.EventPayload<Action<Events.MultiSelectionEventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { engineAction, activityId } = action.payload;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	assert(engineState, `Invalid engine state in activity ${activityId}`);

	const eventName = formatEventName(engineAction.payload.button.event);
	const totalMultiSelectionNodeCount = UIStateSelector.totalMultiSelectionNodeCount()(engineState);

	const addNotificationEffect = put(
		NotificationActions.add({
			activityId,
			severity: "info",
			duration: 5000,
			title: {
				key: SHOWCASE_RESOURCE_KEYS.showcase.multiSelection.buttonEvent.title,
				args: { eventName: { type: "plain", value: eventName } }
			},
			message: {
				key: SHOWCASE_RESOURCE_KEYS.showcase.multiSelection.buttonEvent.message,
				args: {
					eventName: { type: "plain", value: eventName },
					numberOfNodes: { type: "plain", value: String(totalMultiSelectionNodeCount) }
				}
			}
		})
	);

	const clearMultiSelectionNodesEffect = put(
		TreeEngineActions.command({
			activityId,
			engineAction: Commands.setMultiSelectionNodes({ multiSelectionNodes: {} })
		})
	);

	yield* all([addNotificationEffect, clearMultiSelectionNodesEffect]);
}

function formatEventName(eventName: string): string {
	return eventName
		.split("_")
		.slice(1)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}
