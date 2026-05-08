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

import { call, put, type SagaGenerator, select } from "typed-redux-saga";
import { type Action, type Success } from "typescript-fsa";

import { ActivityActions, ActivitySagas, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { Events, Identifier, type TreeEngineState, UIStateSelector } from "../../../../../../../core/store/index.js";
import { TreeEngineActions } from "../../../../actions.js";
import { TreeEngineSelectors } from "../../../../selectors.js";
import { createAddDirectChildDataHolders, expandNode } from "../../watch-node-expansion-saga.js";
import { type TreeEngineSaga } from "../../../saga-setting.js";
import { SagaUtils } from "../../../saga-utils.js";
import { maybeAsyncFnWrapper } from "../../../../utils.js";
import { TreeEngineError } from "../../../../../../../core/error/index.js";

import { createUpdatePageSizeActionForAddedNode } from "../create-update-page-size-action-for-added-node.js";
import { isLinkAddedByDetailActivity } from "../is-link-added-by-detail-activity.js";
import { linkCreatedDocument } from "../link-created-document.js";
import { handleCreateDetailActivitySaga } from "../handle-create-detail-activity-saga.js";

/** @internal */
interface Config {
	relationshipModelRef: string;
	childRole: string;
	parentNodeIdentifier: Identifier;
	parentNodePath: TreeEngineState.NodePath;
	linkCreationSetting?: TreeEngineSaga.LinkCreationSetting;
}

/** @internal */
export function* handleDetailActivitySaga(detailActivityId: string, config: Config): SagaGenerator<void> {
	yield* handleCreateDetailActivitySaga(detailActivityId, config, handleSaveStarted);
}

// return true if saving form has been done successfully, otherwise return false
function* handleSaveStarted(detailActivityId: string, config: Config): SagaGenerator<boolean> {
	const { relationshipModelRef, childRole, parentNodeIdentifier, parentNodePath } = config;

	const detailActivity = yield* select(ActivitySelectors.activityById(detailActivityId));
	if (!detailActivity || !detailActivity.initiatingActivityId) {
		throw TreeEngineError.NotFoundError("Activity", { activityId: detailActivityId });
	}

	const treeEngineActivityId = detailActivity.initiatingActivityId;
	let alreadyAddedLink: boolean | undefined = undefined;
	if (config.linkCreationSetting?.isLinkAddedByDetailActivity) {
		alreadyAddedLink = yield* call(maybeAsyncFnWrapper(config.linkCreationSetting?.isLinkAddedByDetailActivity), {
			activityId: treeEngineActivityId,
			detailActivityId,
			relationshipModelRef
		});
	}
	if (alreadyAddedLink === undefined) {
		alreadyAddedLink = yield* call(isLinkAddedByDetailActivity, {
			activityId: treeEngineActivityId,
			detailActivityId,
			relationshipModelRef,
			parentNodeIdentifier,
			childRole
		});
	}

	const lockId = yield* call(ActivitySagas.acquireActivityLock, treeEngineActivityId, "TreeEngine", [
		{ type: "ADD_LINK" }
	]);

	if (lockId === undefined) {
		throw TreeEngineError.NotFoundError("LockId", { activityId: treeEngineActivityId });
	}

	try {
		const { doneAction } = yield* call(SagaUtils.waitUntilActivitySavingStateIsDoneOrFailed, detailActivityId);
		if (!doneAction) {
			return false;
		}
		const childInstance = (doneAction as Action<Success<unknown, { instance?: string }>>).payload.result.instance;
		if (!childInstance) {
			throw TreeEngineError.CreatedInstanceIdNotFound(doneAction.type);
		}

		const newNodeIdentifier = Identifier.from(childInstance);
		let newLinkIdentifier: Identifier | undefined;
		if (!alreadyAddedLink) {
			const addLinkOperation = yield* call(
				linkCreatedDocument,
				treeEngineActivityId,
				relationshipModelRef,
				childInstance,
				childRole,
				parentNodeIdentifier
			);
			if (!addLinkOperation) {
				throw TreeEngineError.AddLinkError(doneAction.type);
			}
			const result = yield* call(SagaUtils.saveActivity, treeEngineActivityId, { operations: [addLinkOperation] });
			if (result?.[0].type === "ADD_LINK") {
				newLinkIdentifier = result[0].payload.newLinkIdentifier;
			}
		}

		yield* call(
			createUpdatePageSizeActionForAddedNode,
			treeEngineActivityId,
			parentNodeIdentifier,
			relationshipModelRef
		);

		const updatedDataHolders = [
			...(yield* call(createAddDirectChildDataHolders, {
				nodeIdentifier: parentNodeIdentifier,
				activityId: treeEngineActivityId
			})),
			...(yield* call(createAddDirectChildDataHolders, {
				nodeIdentifier: newNodeIdentifier,
				activityId: treeEngineActivityId
			}))
		];

		yield* put(TreeEngineActions.setDataHolders({ dataHolders: updatedDataHolders, activityId: treeEngineActivityId }));

		const uiState = yield* select(TreeEngineSelectors.uiState(treeEngineActivityId));
		const { expanded } = UIStateSelector.nodeState(parentNodeIdentifier, parentNodePath)(uiState);
		if (!expanded) {
			yield* call(expandNode, {
				activityId: treeEngineActivityId,
				nodeIdentifier: parentNodeIdentifier,
				nodePath: parentNodePath,
				withoutLoad: true
			});
		}

		const addedNodes: Events.RevalidateClipboardPayload.AddedNode[] = [];
		if (newLinkIdentifier) {
			addedNodes.push({ nodeIdentifier: newNodeIdentifier, nodePath: [...parentNodePath, newLinkIdentifier] });
		}
		const engineAction = Events.revalidateClipboard({
			addedNodes: addedNodes.length > 0 ? addedNodes : undefined
		});
		yield* put(TreeEngineActions.event({ activityId: treeEngineActivityId, engineAction }));

		return true;
	} finally {
		yield* put(ActivityActions.unlock({ activityId: treeEngineActivityId, lockId }));
	}
}
