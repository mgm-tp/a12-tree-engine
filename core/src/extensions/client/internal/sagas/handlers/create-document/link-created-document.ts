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

import { call, type SagaGenerator, select } from "typed-redux-saga";

import { TreeEngineError } from "../../../../../../core/error/index.js";
import { RelationshipModelUtils, type TreeModel } from "../../../../../../core/models/index.js";
import { type Identifier, ModelSelector } from "../../../../../../core/store/index.js";
import { type TreeEngineOperation } from "../../../operation.js";
import { TreeEngineSelectors } from "../../../selectors.js";
import { SagaUtils } from "../../saga-utils.js";

/** @internal */
export function* linkCreatedDocument(
	activityId: string,
	relationshipModelRef: string,
	childInstance: string,
	childRole: string,
	parentIdentifier: Identifier,
	predecessorLinkRef?: string,
	position?: TreeModel.InsertPosition
): SagaGenerator<TreeEngineOperation.AddLink | undefined> {
	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}

	const relationshipModel = ModelSelector.relationshipModelByName(relationshipModelRef)(modelsState);
	if (!relationshipModel) {
		throw TreeEngineError.NotFoundError("RelationshipModel", { id: relationshipModelRef, activityId });
	}

	const parentRole = RelationshipModelUtils.getEntityCharacteristicByReversedRole(relationshipModel, childRole)?.role;
	if (!parentRole) {
		throw TreeEngineError.NotFoundError("RelationshipModel.RelationshipRole", {
			id: relationshipModel.header.id,
			activityId
		});
	}

	let linkDocument: object | undefined;
	if (relationshipModel.content.linkDocumentModel) {
		const result = yield* call(SagaUtils.editLinkDocument, activityId, relationshipModel.content.linkDocumentModel);
		if (!result.document) {
			return undefined;
		}
		linkDocument = { ...result.document, modelId: undefined };
	}

	return {
		type: "ADD_LINK",
		payload: {
			relationshipModel: relationshipModelRef,
			parent: { role: parentRole, docRef: parentIdentifier.id },
			child: { role: childRole, docRef: childInstance },
			linkDocument,
			predecessorLinkRef,
			position
		}
	} as TreeEngineOperation.AddLink;
}
