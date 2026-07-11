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

import { all, call, put, type SagaGenerator, select, takeLatest } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import {
	type Activity,
	ActivityActions,
	ActivitySelectors,
	NEW_INSTANCE_IDENTIFIER
} from "@com.mgmtp.a12.client/client-core";

import { RelationshipModelUtils } from "../../../../../../core/models/utils/relationship-utils.js";
import { Events } from "../../../../../../core/store/actions.js";
import { Identifier, type ModelsState } from "../../../../../../core/store/store.js";
import { ModelSelector } from "../../../../../../core/store/selectors/models.js";
import { TreeEngineActions } from "../../../../actions.js";
import { TreeEngineActivity } from "../../../../data-holder.js";
import { TreeEngineSelectors } from "../../../../selectors.js";
import type { TreeEngineSaga } from "../../../saga-setting.js";
import { SagaUtils } from "../../../saga-utils.js";
import { TreeEngineError } from "../../../../../../core/error/tree-engine-error.js";
import { logger } from "../../../../utils.js";

import { type Config, handleDetailActivitySaga } from "./handle-detail-activity-saga.js";

/** @internal */
export function* watchRootNodeCreationSaga(
	activityId: string,
	linkCreationSetting?: TreeEngineSaga.LinkCreationSetting
): SagaGenerator<void> {
	yield* takeLatest(
		(action: unknown) => {
			return (
				TreeEngineActions.event.match(action) &&
				action.payload.activityId === activityId &&
				Events.onInsertRootNodeRequest.done.match(action.payload.engineAction)
			);
		},
		SagaUtils.withErrorHandling(handle, {
			activityId,
			error: TreeEngineError.CreateNodeError("root")
		}),
		linkCreationSetting
	);
}

function* handle(
	linkCreationSetting: TreeEngineSaga.LinkCreationSetting | undefined,
	action: Action<TreeEngineActions.EventPayload<ReturnType<typeof Events.onInsertRootNodeRequest.done>>>
) {
	const { activityId } = action.payload;
	const cancelled = yield* call(SagaUtils.cancelChildActivitiesIfPresent, activityId);
	if (!cancelled) {
		return;
	}

	logger.log("create new root  document");

	const { activity, modelsState } = yield* all({
		activity: select(ActivitySelectors.activityById(activityId)),
		modelsState: select(TreeEngineSelectors.modelsState(activityId))
	});

	if (!activity || !modelsState) {
		throw TreeEngineError.NotFoundError("Activity", activityId);
	}

	let config: Config | undefined;
	if (TreeEngineActivity.Descriptor.HiddenRootInstance.isAssignableFrom(activity.descriptor)) {
		const childRole = getHiddenRootChildRole(activity, modelsState);
		const { rootInstance, rootRelationshipName } = activity.descriptor;
		config = {
			rootNodeIdentifier: Identifier.from(rootInstance),
			relationshipModelRef: rootRelationshipName,
			childRole,
			linkCreationSetting
		};
	}

	const rootDocumentModel = action.payload.engineAction.payload.result.documentModelId;
	const pushAction = ActivityActions.create({
		activityDescriptor: {
			...activity.descriptor,
			model: rootDocumentModel,
			instance: NEW_INSTANCE_IDENTIFIER
		},
		initiatingActivityId: activityId
	});
	yield* put(pushAction);
	yield* call(handleDetailActivitySaga, pushAction.payload.activity.id, config);
}

/** @internal */
export function getHiddenRootChildRole(activity: Activity, modelsState: ModelsState): string {
	if (!TreeEngineActivity.Descriptor.HiddenRootInstance.isAssignableFrom(activity.descriptor)) {
		return "";
	}
	const { rootRelationshipName, rootRelationshipRole } = activity.descriptor;
	const activityId = activity.id;
	const relationshipModel = ModelSelector.relationshipModelByName(rootRelationshipName)(modelsState);
	if (!relationshipModel) {
		throw TreeEngineError.NotFoundError("RelationshipModel", { id: rootRelationshipName, activityId });
	}
	const childRole = RelationshipModelUtils.getEntityCharacteristicByReversedRole(
		relationshipModel,
		rootRelationshipRole
	)?.role;
	if (!childRole) {
		throw TreeEngineError.NotFoundError("RelationshipModel.RelationshipRole", { id: rootRelationshipName, activityId });
	}

	return childRole;
}
