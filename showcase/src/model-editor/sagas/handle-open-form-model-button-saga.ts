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

// tag::CustomTreeInitialization[]

import { call, put, type SagaGenerator, select, takeLatest } from "typed-redux-saga";
import { isAction } from "redux";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import {
	DataSelector,
	Events,
	TreeEngineActions,
	type TreeEngineActivity,
	TreeEngineSelectors
} from "@com.mgmtp.a12.treeengine/treeengine-core";

import { getTargetNodePath } from "../../utils.js";
import { OPEN_FM_NODE_EVENT } from "../../helpers.js";

import { File } from "../document.js";

import { cancelChildActivities, getInitialExpansionConfig } from "./utils.js";

export function* handleOpenFormModelButtonSaga(): SagaGenerator<void> {
	yield* takeLatest((action: unknown) => {
		return (
			isAction(action) &&
			TreeEngineActions.event.match(action) &&
			Events.onNodeEventButtonClicked.match(action.payload.engineAction) &&
			OPEN_FM_NODE_EVENT === action.payload.engineAction.payload.button.event
		);
	}, handle);
}

type EventAction = Action<TreeEngineActions.EventPayload<Action<Events.NodeEventButtonClickedPayload>>>;
function* handle(action: EventAction): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const { nodeIdentifier } = engineAction.payload;

	const cancelled = yield* call(cancelChildActivities, activityId);
	if (!cancelled) {
		return;
	}
	const activityDescriptor = createActivityDescriptor(nodeIdentifier.id);
	const targetNodePath = getTargetNodePath("data-modeler-tree");

	const data = yield* select(TreeEngineSelectors.dataState(activityId));
	const node = data && DataSelector.node(nodeIdentifier)(data);
	const initialExpansion = node && File.isInstance(node.document) && getInitialExpansionConfig(node.document);

	yield* put(
		TreeEngineActions.createActivity(
			{ activityDescriptor, initiatingActivityId: activityId },
			{
				scrollToNode: targetNodePath ? { nodePath: targetNodePath } : undefined,
				initialExpansion
			}
		)
	);
}

function createActivityDescriptor(instance: string): TreeEngineActivity.Descriptor.HiddenRootInstance {
	return {
		// User-defined descriptors
		model: "form-modeler-tree",
		// Mandatory engine's descriptors
		engine: "tree",
		rootInstance: instance,
		rootRelationshipName: "FormModelFileScreen",
		rootRelationshipRole: "File"
	};
}

// end::CustomTreeInitialization[]
