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

import { all, call, put, type SagaGenerator, select } from "typed-redux-saga";

import type { Action, Success } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { ActivityActions, ActivitySagas, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { Events } from "../../../../../../core/store/actions.js";
import { Identifier } from "../../../../../../core/store/store.js";
import type { TreeEngineOperation } from "../../../../operation.js";
import type { TreeEngineSaga } from "../../../saga-setting.js";
import { SagaUtils } from "../../../saga-utils.js";
import { maybeAsyncFnWrapper } from "../../../../utils.js";
import { createAddDirectChildDataHolders } from "../../watch-node-expansion-saga.js";
import { TreeEngineActions } from "../../../../actions.js";
import { TreeEngineError } from "../../../../../../core/error/tree-engine-error.js";

import { createUpdatePageSizeActionForAddedNode } from "../create-update-page-size-action-for-added-node.js";
import { handleCreateDetailActivitySaga } from "../handle-create-detail-activity-saga.js";
import { isLinkAddedByDetailActivity } from "../is-link-added-by-detail-activity.js";
import { linkCreatedDocument } from "../link-created-document.js";

/** @internal */
export interface Config {
	rootNodeIdentifier: Identifier;
	relationshipModelRef: string;
	childRole: string;
	linkCreationSetting?: TreeEngineSaga.LinkCreationSetting;
}

/** @internal */
export function* handleDetailActivitySaga(detailActivityId: string, config?: Config) {
	yield* handleCreateDetailActivitySaga(detailActivityId, config, handleSaveStarted);
}

// return true if saving form has been done successfully, otherwise return false
function* handleSaveStarted(detailActivityId: string, config?: Config): SagaGenerator<boolean> {
	const detailActivity = yield* select(ActivitySelectors.activityById(detailActivityId));
	if (!detailActivity || !detailActivity.initiatingActivityId) {
		throw TreeEngineError.NotFoundError("Activity", { activityId: detailActivityId });
	}

	const treeEngineActivityId = detailActivity.initiatingActivityId;
	let alreadyAddedLink: boolean | undefined = undefined;
	if (config) {
		const { relationshipModelRef, rootNodeIdentifier, childRole } = config;
		if (config.linkCreationSetting?.isLinkAddedByDetailActivity) {
			alreadyAddedLink = yield* call(maybeAsyncFnWrapper(config.linkCreationSetting.isLinkAddedByDetailActivity), {
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
				parentNodeIdentifier: rootNodeIdentifier,
				childRole
			});
		}
	}

	const lockId = yield* call(ActivitySagas.acquireActivityLock, treeEngineActivityId, "TreeEngine", [
		{ type: "ADD_ROOT" }
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
			throw TreeEngineError.AddLinkError(doneAction.type);
		}

		let addLinkOperation: TreeEngineOperation | undefined;

		if (!alreadyAddedLink && config) {
			const { relationshipModelRef, rootNodeIdentifier, childRole } = config;
			addLinkOperation = yield* call(
				linkCreatedDocument,
				treeEngineActivityId,
				relationshipModelRef,
				childInstance,
				childRole,
				rootNodeIdentifier
			);
		}

		if (config) {
			yield* call(
				createUpdatePageSizeActionForAddedNode,
				treeEngineActivityId,
				config.rootNodeIdentifier,
				config.relationshipModelRef
			);
		}

		const childIdentifier = Identifier.from(childInstance);
		const updatedDataHolders = yield* call(createAddDirectChildDataHolders, {
			nodeIdentifier: childIdentifier,
			activityId: treeEngineActivityId
		});

		const updateDataHoldersEffect = put(
			TreeEngineActions.setDataHolders({
				dataHolders: updatedDataHolders,
				activityId: treeEngineActivityId
			})
		);

		const expandAction = Events.onNodeExpansionChanged({
			nodeIdentifier: childIdentifier,
			nodePath: [childIdentifier]
		});

		const expandActionEffect = put(
			TreeEngineActions.event({ activityId: treeEngineActivityId, engineAction: expandAction })
		);

		yield* all([updateDataHoldersEffect, expandActionEffect]);

		if (addLinkOperation) {
			yield* call(SagaUtils.saveActivity, treeEngineActivityId, { operations: [addLinkOperation] });
		}

		return true;
	} finally {
		yield* put(ActivityActions.unlock({ activityId: treeEngineActivityId, lockId }));
	}
}
