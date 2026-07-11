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

import type { Action, Success } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { ActivityActions, ActivitySelectors, NEW_INSTANCE_IDENTIFIER } from "@com.mgmtp.a12.client/client-core";

import { Events } from "../../../../../../core/store/actions.js";
import { ModelSelector } from "../../../../../../core/store/selectors/models.js";
import { RelationshipModelUtils } from "../../../../../../core/models/utils/relationship-utils.js";
import { TreeEngineActions } from "../../../../actions.js";
import { TreeEngineSelectors } from "../../../../selectors.js";
import { logger } from "../../../../utils.js";
import type { TreeEngineSaga } from "../../../saga-setting.js";
import { SagaUtils } from "../../../saga-utils.js";
import { TreeEngineError } from "../../../../../../core/error/tree-engine-error.js";

import { waitForRelationshipChangelogOrFormEngineFallback } from "../wait-for-relationship-changelog-or-form-engine-fallback.js";

import { handleDetailActivitySaga } from "./handle-detail-activity-saga.js";

/** @internal */
export function* watchChildNodeCreationSaga(
	activityId: string,
	linkCreationSetting?: TreeEngineSaga.LinkCreationSetting,
	newRelationshipEngine?: boolean
): SagaGenerator<void> {
	const pattern = (action: unknown) =>
		TreeEngineActions.event.match(action) &&
		Events.onInsertChildNodeRequest.done.match(action.payload.engineAction) &&
		action.payload.activityId === activityId;

	if (newRelationshipEngine) {
		yield* takeLatest(
			pattern,
			SagaUtils.withErrorHandling(createNewChildDocumentWithNewRelationshipEngine, {
				activityId,
				error: TreeEngineError.CreateNodeError("child")
			}),
			linkCreationSetting
		);
	} else {
		yield* takeLatest(
			pattern,
			SagaUtils.withErrorHandling(createNewChildDocument, {
				activityId,
				error: TreeEngineError.CreateNodeError("child")
			}),
			linkCreationSetting
		);
	}
}

function* createNewChildDocument(
	linkCreationSetting: TreeEngineSaga.LinkCreationSetting | undefined,
	action: Action<
		TreeEngineActions.EventPayload<
			Action<Success<Events.InsertChildNodeRequestPayload.Param, Events.InsertChildNodeRequestPayload.Result>>
		>
	>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const {
		params: { insertPosition },
		result: { childRelationshipConfiguration, documentModelId }
	} = engineAction.payload;

	const cancelled = yield* call(SagaUtils.cancelChildActivitiesIfPresent, activityId);
	if (!cancelled) {
		return;
	}

	logger.log("create new child document");

	const activityDescriptor = yield* select(ActivitySelectors.activityPropById(activityId, (a) => a.descriptor));
	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState || !activityDescriptor) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const { relationshipModelRef } = childRelationshipConfiguration;

	const childEntityCharacteristic =
		ModelSelector.childEntityCharacteristic(childRelationshipConfiguration)(modelsState);
	if (!childEntityCharacteristic) {
		throw TreeEngineError.NotFoundError("RelationshipModel.EntityCharacteristic", {
			id: relationshipModelRef,
			activityId
		});
	}

	const createFormActivityAction = ActivityActions.create({
		activityDescriptor: { ...activityDescriptor, model: documentModelId, instance: NEW_INSTANCE_IDENTIFIER },
		initiatingActivityId: activityId
	});
	yield* put(createFormActivityAction);
	yield* call(handleDetailActivitySaga, createFormActivityAction.payload.activity.id, {
		relationshipModelRef,
		childRole: childEntityCharacteristic.role,
		parentNodeIdentifier: insertPosition.target.nodeIdentifier,
		parentNodePath: insertPosition.target.nodePath,
		linkCreationSetting
	});
}

function* createNewChildDocumentWithNewRelationshipEngine(
	linkCreationSetting: TreeEngineSaga.LinkCreationSetting | undefined,
	action: Action<
		TreeEngineActions.EventPayload<
			Action<Success<Events.InsertChildNodeRequestPayload.Param, Events.InsertChildNodeRequestPayload.Result>>
		>
	>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const {
		params: { insertPosition },
		result: { childRelationshipConfiguration, documentModelId }
	} = engineAction.payload;

	const cancelled = yield* call(SagaUtils.cancelChildActivitiesIfPresent, activityId);
	if (!cancelled) {
		return;
	}

	logger.log("create new child document (RE mode)");

	const activityDescriptor = yield* select(ActivitySelectors.activityPropById(activityId, (a) => a.descriptor));
	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState || !activityDescriptor) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const { relationshipModelRef } = childRelationshipConfiguration;

	const childEntityCharacteristic =
		ModelSelector.childEntityCharacteristic(childRelationshipConfiguration)(modelsState);
	if (!childEntityCharacteristic) {
		throw TreeEngineError.NotFoundError("RelationshipModel.EntityCharacteristic", {
			id: relationshipModelRef,
			activityId
		});
	}

	const relationshipModel = ModelSelector.relationshipModelByName(relationshipModelRef)(modelsState);
	if (!relationshipModel) {
		throw TreeEngineError.NotFoundError("RelationshipModel", { id: relationshipModelRef, activityId });
	}
	const parentRole = RelationshipModelUtils.getEntityCharacteristicByReversedRole(
		relationshipModel,
		childEntityCharacteristic.role
	)?.role;
	if (!parentRole) {
		throw TreeEngineError.NotFoundError("RelationshipModel.RelationshipRole", {
			id: relationshipModelRef,
			activityId
		});
	}

	const createDetailActivityAction = ActivityActions.create({
		activityDescriptor: {
			...activityDescriptor,
			model: documentModelId,
			instance: NEW_INSTANCE_IDENTIFIER,
			parentInstance: insertPosition.target.nodeIdentifier.id,
			parentRelationshipName: relationshipModelRef,
			parentRelationshipRole: parentRole
		},
		initiatingActivityId: activityId
	});
	yield* put(createDetailActivityAction);

	const detailActivityId = createDetailActivityAction.payload.activity.id;

	const useFallback = yield* call(waitForRelationshipChangelogOrFormEngineFallback, detailActivityId);

	if (useFallback) {
		yield* call(handleDetailActivitySaga, detailActivityId, {
			relationshipModelRef,
			childRole: childEntityCharacteristic.role,
			parentNodeIdentifier: insertPosition.target.nodeIdentifier,
			parentNodePath: insertPosition.target.nodePath,
			linkCreationSetting
		});
	}
}
