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

import { type SagaGenerator, call, put, select, takeLatest } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import type { Activity } from "@com.mgmtp.a12.client/client-core";

import { Commands, Events } from "../../../../core/store/actions.js";
import { type Identifier, TreeEngineState } from "../../../../core/store/store.js";
import { UIStateSelector } from "../../../../core/store/selectors/ui-state.js";
import { TreeEngineActions } from "../../actions.js";
import { TreeEngineSelectors } from "../../selectors.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";

import { SagaUtils } from "../saga-utils.js";

import {
	createAddDirectChildDataHolders,
	createAddGrandChildDataHolders,
	getLoadedNodeIds
} from "./child-data-holders.js";

/** @internal */
export function* watchNodeExpansionSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: unknown) => {
			return (
				TreeEngineActions.event.match(action) &&
				Events.onNodeExpansionChanged.match(action.payload.engineAction) &&
				action.payload.activityId === activityId
			);
		},
		SagaUtils.withErrorHandling(handleNodeExpansion, {
			activityId,
			error: TreeEngineError.ExpandNodeError()
		})
	);
}

function* handleNodeExpansion(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeExpansionChangedPayload>>>
) {
	const activityId = action.payload.activityId;
	const nodeExpandedAction = action.payload.engineAction;
	const { nodeIdentifier, nodePath } = nodeExpandedAction.payload;
	yield* call(expandNode, { nodeIdentifier, nodePath, activityId });
}

/** @internal */
export function* expandNode(params: {
	activityId: string;
	nodeIdentifier: Identifier;
	nodePath: TreeEngineState.NodePath;
	withoutLoad?: boolean;
}): SagaGenerator<void> {
	const { activityId, nodeIdentifier, nodePath, withoutLoad } = params;

	const pathString = TreeEngineState.NodePath.toString(nodePath);
	let uiState = yield* select(TreeEngineSelectors.uiState(activityId));
	const expandedNodes = UIStateSelector.expandedNodes()(uiState);

	if (!expandedNodes[pathString]) {
		const nodes = { ...expandedNodes, [pathString]: {} };
		yield* put(TreeEngineActions.command({ activityId, engineAction: Commands.setExpandedNodes({ nodes }) }));
	} else {
		const nodes = { ...expandedNodes };
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete nodes[pathString];
		yield* put(TreeEngineActions.command({ activityId, engineAction: Commands.setExpandedNodes({ nodes }) }));
	}

	uiState = yield* select(TreeEngineSelectors.uiState(activityId));
	const currentState = UIStateSelector.nodeState(nodeIdentifier, nodePath)(uiState);
	if (!currentState.expanded) {
		return;
	}

	const loadedNodeIds = yield* call(getLoadedNodeIds, { activityId });

	let updatedDataHolders = [
		...(yield* call(createAddDirectChildDataHolders, { nodeIdentifier, activityId, loadedNodeIds }))
	];

	const preloadChildNodes = UIStateSelector.preloadChildNodes()(uiState);
	if (preloadChildNodes) {
		updatedDataHolders = [
			...updatedDataHolders,
			...(yield* call(createAddGrandChildDataHolders, {
				activityId,
				loadedNodeIds,
				descriptorPredicate: ({ source }: Activity.DataHolderDescriptor) => source === nodeIdentifier.id
			}))
		];
	}

	if (updatedDataHolders.length === 0) {
		return;
	}

	yield* put(TreeEngineActions.setDataHolders({ dataHolders: updatedDataHolders, activityId }));
	if (!withoutLoad) {
		yield* call(SagaUtils.loadActivityData, activityId, { missingOnly: true, dataHolderDescriptors: [] });
	}
}

export { createAddGrandChildDataHolders, createAddDirectChildDataHolders, getLoadedNodeIds };
