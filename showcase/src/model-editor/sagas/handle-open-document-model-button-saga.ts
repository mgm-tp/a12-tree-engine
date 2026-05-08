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

import { call, put, type SagaGenerator, select, takeLatest } from "typed-redux-saga";
import { type Action, type AnyAction } from "typescript-fsa";

import { ActivityActions } from "@com.mgmtp.a12.client/client-core";
import {
	DataSelector,
	Events,
	TreeEngineActions,
	type TreeEngineActivity,
	TreeEngineSelectors
} from "@com.mgmtp.a12.treeengine/treeengine-core";

import { getNodesFromNodePath, getTargetNodePath } from "../../utils.js";
import {
	OPEN_DM_NODE_EVENT,
	OPEN_DM_NODE_EVENT_TWIN,
	OPEN_DM_NODE_MULTI_LEVEL_EVENT,
	OPEN_DM_NODE_NON_VIRTUAL_ROOT_EVENT,
	OPEN_DM_NODE_SELECT_PARENT,
	OPEN_DM_PAGINATED_NODE_EVENT,
	OPEN_DM_WITH_REPLACEMENT_NODE_EVENT
} from "../../helpers.js";

import { File } from "../document.js";

import { cancelChildActivities, getInitialExpansionConfig } from "./utils.js";

export function* handleOpenDocumentModelButtonSaga(): SagaGenerator<void> {
	yield* takeLatest((action: AnyAction) => {
		return (
			TreeEngineActions.event.match(action) &&
			Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
			[
				OPEN_DM_NODE_EVENT,
				OPEN_DM_PAGINATED_NODE_EVENT,
				OPEN_DM_NODE_EVENT_TWIN,
				OPEN_DM_WITH_REPLACEMENT_NODE_EVENT,
				OPEN_DM_NODE_NON_VIRTUAL_ROOT_EVENT,
				OPEN_DM_NODE_SELECT_PARENT,
				OPEN_DM_NODE_MULTI_LEVEL_EVENT
			].includes(action.payload.engineAction.payload.button.event)
		);
	}, handle);
}

type EventAction = Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>;
// tag::HiddenRootNode[]
function* handle(action: EventAction): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const { nodeIdentifier } = engineAction.payload;
	// end::HiddenRootNode[]

	const cancelled = yield* call(cancelChildActivities, activityId);
	if (!cancelled) {
		return;
	}
	// tag::HiddenRootNode[]
	const activityDescriptor = createActivityDescriptor(nodeIdentifier.id);

	// end::HiddenRootNode[]

	let targetNodePath = getTargetNodePath("data-modeler-tree");
	let nodesFromNodePath = getNodesFromNodePath("data-modeler-tree");

	// tag::CustomInitialExpansion[]
	const data = yield* select(TreeEngineSelectors.dataState(activityId));
	const node = data && DataSelector.node(nodeIdentifier)(data);
	const initialExpansion = node && File.isInstance(node.document) && getInitialExpansionConfig(node.document);
	// end::CustomInitialExpansion[]

	// tag::HiddenRootNode[]
	if (action.payload.engineAction.payload.button.event === OPEN_DM_NODE_EVENT) {
		yield* put(
			TreeEngineActions.createActivity(
				{ activityDescriptor, initiatingActivityId: activityId },
				// end::HiddenRootNode[]
				{
					scrollToNode: targetNodePath ? { nodePath: targetNodePath, nodesFromNodePath } : undefined,
					initialExpansion
				}
				// tag::HiddenRootNode[]
			)
		);
	}
	// end::HiddenRootNode[]
	else if (action.payload.engineAction.payload.button.event === OPEN_DM_PAGINATED_NODE_EVENT) {
		targetNodePath = getTargetNodePath("paginated-data-modeler-tree");
		nodesFromNodePath = getNodesFromNodePath("paginated-data-modeler-tree");
		yield* put(
			TreeEngineActions.createActivity(
				{
					activityDescriptor: { ...activityDescriptor, model: "paginated-data-modeler-tree" },
					initiatingActivityId: activityId
				},
				{
					scrollToNode: targetNodePath ? { nodePath: targetNodePath, nodesFromNodePath } : undefined,
					initialExpansion
				}
			)
		);
	} else if (action.payload.engineAction.payload.button.event === OPEN_DM_NODE_EVENT_TWIN) {
		yield* put(
			TreeEngineActions.createActivity(
				{
					activityDescriptor: {
						engine: "tree",
						model: "groups-tree-twin"
					},
					initiatingActivityId: activityId
				},
				{
					scrollToNode: targetNodePath ? { nodePath: targetNodePath } : undefined,
					initialExpansion: { type: "all_levels" }
				}
			)
		);
	} else if (action.payload.engineAction.payload.button.event === OPEN_DM_NODE_NON_VIRTUAL_ROOT_EVENT) {
		targetNodePath = getTargetNodePath("non-virtual-root-data-modeler-tree");
		yield* put(
			TreeEngineActions.createActivity(
				{
					activityDescriptor: {
						...createActivityDescriptor(nodeIdentifier.id),
						model: "non-virtual-root-data-modeler-tree"
					},
					initiatingActivityId: activityId
				},
				{
					scrollToNode: targetNodePath ? { nodePath: targetNodePath, nodesFromNodePath } : undefined,
					initialExpansion
				}
			)
		);
	} else if (action.payload.engineAction.payload.button.event === OPEN_DM_NODE_SELECT_PARENT) {
		targetNodePath = getTargetNodePath("data-modeler-select-parent-tree");
		yield* put(
			TreeEngineActions.createActivity(
				{
					activityDescriptor: {
						...createActivityDescriptor(nodeIdentifier.id),
						model: "data-modeler-select-parent-tree"
					},
					initiatingActivityId: activityId
				},
				{
					scrollToNode: targetNodePath ? { nodePath: targetNodePath, nodesFromNodePath } : undefined,
					initialExpansion
				}
			)
		);
	} else if (action.payload.engineAction.payload.button.event === OPEN_DM_NODE_MULTI_LEVEL_EVENT) {
		targetNodePath = getTargetNodePath("data-modeler-tree-multi-level");
		nodesFromNodePath = getNodesFromNodePath("data-modeler-tree-multi-level");
		yield* put(
			TreeEngineActions.createActivity(
				{
					activityDescriptor: {
						...createActivityDescriptor(nodeIdentifier.id),
						model: "data-modeler-tree-multi-level"
					},
					initiatingActivityId: activityId
				},
				{
					scrollToNode: targetNodePath ? { nodePath: targetNodePath, nodesFromNodePath } : undefined,
					initialExpansion
				}
			)
		);
	} else {
		const pushAction = TreeEngineActions.createActivity(
			{ activityDescriptor },
			{
				scrollToNode: targetNodePath ? { nodePath: targetNodePath } : undefined,
				initialExpansion
			}
		);
		yield* put(
			ActivityActions.cancel({
				activityId,
				replacementActivity: pushAction.payload.activity
			})
		);
	}
	// tag::HiddenRootNode[]
}
// end::HiddenRootNode[]

// tag::HiddenRootNode[]
function createActivityDescriptor(instance: string): TreeEngineActivity.Descriptor.HiddenRootInstance {
	return {
		/**
		 * User-defined descriptors
		 */
		model: "data-modeler-tree",
		engine: "tree", // Since 9.0.0, "engine" is no longer a mandatory descriptor for a Tree Engine activity
		/**
		 * Mandatory descriptors to enable hidden root node on the tree
		 */
		rootInstance: instance,
		rootRelationshipName: "DocumentModelFileGroup",
		rootRelationshipRole: "File"
	};
}

// end::HiddenRootNode[]
