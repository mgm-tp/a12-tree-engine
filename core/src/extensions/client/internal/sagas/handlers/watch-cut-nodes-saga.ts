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

import { type SagaGenerator, put, select, takeLatest } from "typed-redux-saga";
import { type Action, type AnyAction } from "typescript-fsa";

import { type TreeEngineState } from "../../../../../core/store/index.js";
import { Commands, DataSelector, Events, UIStateSelector } from "../../../../../core/store/index.js";
import { TreeEngineActions } from "../../actions.js";
import { TreeEngineSelectors } from "../../selectors.js";
import { TreeEngineError } from "../../../../../core/error/index.js";

import { SagaUtils } from "../saga-utils.js";

import { collectSubtreeNodes } from "./watch-copy-node-saga.js";

/** @internal */
export function* watchCutNodesSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: AnyAction) => {
			return (
				TreeEngineActions.event.match(action) &&
				action.payload.activityId === activityId &&
				Events.onMultiSelectionEventButtonClicked.match(action.payload.engineAction) &&
				action.payload.engineAction.payload.button.event === "event_cut_nodes"
			);
		},
		SagaUtils.withErrorHandling(handleEventButton, { activityId, error: TreeEngineError.CutNodeError() })
	);
}

function* handleEventButton(action: Action<TreeEngineActions.EventPayload>) {
	const { activityId } = action.payload;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("Activity", { activityId });
	}

	const cutNodes = UIStateSelector.orderedTopLevelMultiSelectedNodes()(engineState);

	const cutNodesWithSubLevels = cutNodes.map<TreeEngineState.Clipboard.Node>((node) => {
		const nodeIdentifier = DataSelector.nodeIdentifierFromNodePath(node.nodePath)(engineState);
		if (!nodeIdentifier) {
			throw TreeEngineError.NotFoundError("TreeEngine.Node");
		}
		return {
			...node,
			nodeIdentifier,
			children: collectSubtreeNodes(node.nodePath, nodeIdentifier, engineState)
		};
	}, []);

	if (cutNodes.length > 0) {
		const setCutNodesAction = Commands.setCutNodes({ cutNodes: cutNodesWithSubLevels });
		yield* put(TreeEngineActions.command({ activityId, engineAction: setCutNodesAction }));
	}
}
