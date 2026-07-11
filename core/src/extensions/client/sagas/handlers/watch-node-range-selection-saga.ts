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

import { call, type SagaGenerator, select, takeLatest } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";

import { TreeEngineActions } from "../../actions.js";
import { DataSelector } from "../../../../core/store/selectors/data.js";
import { Events } from "../../../../core/store/actions.js";
import { TreeEngineState } from "../../../../core/store/store.js";
import { UIStateSelector } from "../../../../core/store/selectors/ui-state.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { TreeEngineSelectors } from "../../selectors.js";
import type { BaseNode } from "../../../server-connector/shared.js";

import { SagaUtils } from "../saga-utils.js";

import { getNextMultiSelectionNodesValues, handleMultiSelection } from "./watch-node-multi-selection-saga.js";

/** @internal */
export function* watchRangeSelectionSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: unknown) => {
			return (
				TreeEngineActions.event.match(action) &&
				action.payload.activityId === activityId &&
				Events.onNodeRangeSelectionClicked.match(action.payload.engineAction)
			);
		},
		SagaUtils.withErrorHandling(handleRangeSelection, {
			activityId,
			error: TreeEngineError.MultiSelectNodeError(),
			operationType: "loading"
		})
	);
}

function* handleRangeSelection(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeRangeSelectionClickedPayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const { nodePath } = engineAction.payload;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
	}

	const flattenRows = DataSelector.flattenNodes()(engineState);

	let multiSelectionNodes = UIStateSelector.multiSelectionNodes()(engineState);
	const listMultiSelectionActions = UIStateSelector.previousMultiSelectionActions()(engineState);
	const lastRangeMultiSelectionAction = UIStateSelector.lastRangeMultiSelectionAction()(engineState);
	const latestMultiSelectionNode = UIStateSelector.latestMultiSelectionNode()(engineState);

	const nodeIdentifier = DataSelector.nodeIdentifierFromNodePath(nodePath)(engineState);
	if (!nodeIdentifier) {
		throw TreeEngineError.NotFoundError("TreeEngine.Identifier", {
			activityId,
			id: TreeEngineState.NodePath.toString(nodePath)
		});
	}

	const isLastActionOverallMultiSelection =
		listMultiSelectionActions.length > 0
			? Events.onOverallMultiSelectionClicked.match(listMultiSelectionActions[listMultiSelectionActions.length - 1])
			: false;

	if (!latestMultiSelectionNode || isLastActionOverallMultiSelection) {
		yield* call(handleMultiSelection, activityId, [{ nodeIdentifier, nodePath }]);
		return;
	}

	const sameLastMultiSelectionAction = !!Events.onNodeRangeSelectionClicked.match(
		listMultiSelectionActions[listMultiSelectionActions.length - 1]
	);

	if (sameLastMultiSelectionAction && lastRangeMultiSelectionAction) {
		const previousMultiSelectedNodes = createSelectedNodes({
			multiSelectionNodes,
			flattenRows,
			latestMultiSelectionNode,
			nodePath: lastRangeMultiSelectionAction.payload.nodePath,
			previous: true
		});

		multiSelectionNodes = yield* call(getNextMultiSelectionNodesValues, {
			activityId,
			nodes: previousMultiSelectedNodes,
			nextMultiSelectionState: TreeEngineState.MultiSelectionState.DESELECTED
		});
	}

	const selectedNodes = createSelectedNodes({
		latestMultiSelectionNode,
		nodePath,
		flattenRows,
		multiSelectionNodes
	});

	yield* call(handleMultiSelection, activityId, selectedNodes, multiSelectionNodes);
}

function createSelectedNodes(params: {
	latestMultiSelectionNode: TreeEngineState.NodePath | null;
	flattenRows: DataSelector.FlattenNode[];
	nodePath: TreeEngineState.NodePath;
	multiSelectionNodes: TreeEngineState.MultiSelectionNodes;
	previous?: boolean;
}): BaseNode[] {
	const { latestMultiSelectionNode, flattenRows, nodePath, multiSelectionNodes, previous } = params;
	let selectedRange: DataSelector.FlattenNode[] = [];
	if (latestMultiSelectionNode) {
		const latestSelectedIndex = flattenRows.findIndex((flattenRow) =>
			TreeEngineState.NodePath.areEqual(flattenRow.nodePath, latestMultiSelectionNode)
		);
		const secondSelectedIndex = flattenRows.findIndex((flattenRow) =>
			TreeEngineState.NodePath.areEqual(flattenRow.nodePath, nodePath)
		);

		selectedRange = flattenRows.slice(
			Math.min(latestSelectedIndex, secondSelectedIndex),
			Math.max(latestSelectedIndex, secondSelectedIndex) + 1
		);
	}

	const selectedNodes: BaseNode[] = [];
	selectedRange.forEach((concernedNode) => {
		const parentNodePath = TreeEngineState.NodePath.getParentNodePath(concernedNode.nodePath);
		if (!parentNodePath) {
			selectedNodes.push({ ...concernedNode, nodeIdentifier: concernedNode.identifier });
			return;
		}

		const foundParent = selectedRange.some((node) => TreeEngineState.NodePath.areEqual(parentNodePath, node.nodePath));
		if (
			!foundParent &&
			(multiSelectionNodes[TreeEngineState.NodePath.toString(concernedNode.nodePath)] !==
				TreeEngineState.MultiSelectionState.SELECTED ||
				previous)
		) {
			selectedNodes.push({ ...concernedNode, nodeIdentifier: concernedNode.identifier });
		}
	});

	return selectedNodes;
}
