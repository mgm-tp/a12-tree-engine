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

import { type SagaGenerator, select } from "typed-redux-saga";

import { RelationshipSelectors, type Relationship } from "@com.mgmtp.a12.relationshipengine/relationshipengine-core";

import { RelationshipModelUtils } from "../../../../../../core/models/index.js";
import { type Identifier, ModelSelector } from "../../../../../../core/store/index.js";
import { TreeEngineSelectors } from "../../../selectors.js";
import { type TreeEngineSaga } from "../../saga-setting.js";
import { TreeEngineError } from "../../../../../../core/error/index.js";

/** @internal */
interface IsLinkAddedByDetailActivityParams extends TreeEngineSaga.IsLinkAddedByDetailActivityParams {
	parentNodeIdentifier: Identifier;
	childRole: string;
}

/** @internal */
export function* isLinkAddedByDetailActivity(params: IsLinkAddedByDetailActivityParams): SagaGenerator<boolean> {
	const { activityId, detailActivityId, relationshipModelRef, parentNodeIdentifier, childRole } = params;
	const mutations = yield* select(
		RelationshipSelectors.mutations({ activityId: detailActivityId, relationship: relationshipModelRef })
	);
	if (!mutations) {
		return false;
	}

	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}

	const relationshipModel = ModelSelector.relationshipModelByName(relationshipModelRef)(modelsState);
	if (!relationshipModel) {
		throw TreeEngineError.NotFoundError("RelationshipModel", { id: relationshipModelRef, activityId });
	}
	const parentEntityCharacteristic = RelationshipModelUtils.getEntityCharacteristicByReversedRole(
		relationshipModel,
		childRole
	);
	if (!parentEntityCharacteristic) {
		throw TreeEngineError.NotFoundError("RelationshipModel.RelationshipRole", { id: relationshipModelRef, activityId });
	}
	const parentRole = parentEntityCharacteristic.role;

	const existedMutation = mutations.find((mutation: Relationship.Mutation) => {
		if (mutation.mutationState !== "added") {
			return false;
		}

		const { entities } = mutation.link.linkRef.linkDescriptor;
		return (
			!!entities.find(({ role, docRef }) => role === parentRole && docRef === parentNodeIdentifier.id) &&
			!!entities.find(({ role, docRef }) => role === childRole && docRef === null)
		);
	});

	return !!existedMutation;
}
