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

import { type SagaGenerator, put, select, takeEvery } from "typed-redux-saga";
import { type AnyAction } from "redux";
import { type Action } from "typescript-fsa";

import {
	TreeEngineActions,
	TreeEngineSelectors,
	Commands,
	DataSelector,
	Events,
	type Identifier,
	TreeEngineState,
	UIStateSelector
} from "@com.mgmtp.a12.treeengine/treeengine-core";

import { assert, RELOAD_NODES_ENGINE_EVENT, RELOAD_WHOLE_TREE } from "../helpers.js";

export function* handleReloadNodesSaga(): SagaGenerator<void> {
	yield* takeEvery(
		(action: AnyAction) =>
			TreeEngineActions.event.match(action) &&
			Events.onMultiSelectionEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.engineAction.payload.button.event === RELOAD_NODES_ENGINE_EVENT,
		handleReloadNodes
	);
	yield* takeEvery(
		(action: AnyAction) =>
			TreeEngineActions.event.match(action) &&
			Events.onEventButtonClicked.match(action.payload.engineAction) &&
			action.payload.engineAction.payload.button.event === RELOAD_WHOLE_TREE,
		handleReloadWholeTree
	);
}

function* handleReloadNodes(
	action: Action<TreeEngineActions.EventPayload<Action<Events.MultiSelectionEventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { activityId } = action.payload;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	assert(engineState, `Could not find engine state for activity ${activityId}`);

	const selectedNodes = UIStateSelector.multiSelectionNodes()(engineState);

	const sources: Identifier[] = [];
	for (const [nodePath, selectedState] of Object.entries(selectedNodes)) {
		if (selectedState === TreeEngineState.MultiSelectionState.SELECTED) {
			const source = DataSelector.nodeIdentifierFromNodePath(TreeEngineState.NodePath.fromString(nodePath))(
				engineState
			);
			assert(source);
			sources.push(source);
		}
	}
	yield* put(TreeEngineActions.event({ activityId, engineAction: Events.reload({ sources }) }));
	yield* put(
		TreeEngineActions.command({
			activityId,
			engineAction: Commands.setMultiSelectionNodes({ multiSelectionNodes: {} })
		})
	);
}

function* handleReloadWholeTree(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>
): SagaGenerator<void> {
	const { activityId } = action.payload;

	yield* put(TreeEngineActions.event({ activityId, engineAction: Events.reloadAll({}) }));
}
