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

import { type JsonRpc2Response, Relationship } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type SupportedRequest } from "@com.mgmtp.a12.dataservices/dataservices-access/lib/dispatch/ResponseTypings.js";

import { TreeEngineError } from "../../../../../core/error/index.js";
import { TreeModel } from "../../../../../core/models/index.js";
import { DocumentUtils } from "../../../../../core/models/internal/shared.js";
import { type TreeEngineOperation, TreeEngineSelectors } from "../../../../client/index.js";
import type { RequestSelectorMap } from "../../request-selector-map.js";
import { type DocumentProcessors } from "../../types.js";

import { type A12DataServicesSetting } from "../a12-data-services-setting.js";
import { JsonRpc } from "../json-rpc.js";
import { RequestId } from "../request-id.js";
import { getNewLinkPosition } from "../utils.js";

/** @internal */
export function* toRequest(params: {
	mutation: TreeEngineOperation.AddLink;
	activityId: string;
	dataServicesSetting: A12DataServicesSetting;
	documentProcessors: DocumentProcessors;
	requestSelectorMap: RequestSelectorMap;
}): SagaGenerator<SupportedRequest[]> {
	const { mutation, activityId, dataServicesSetting, documentProcessors, requestSelectorMap } = params;
	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}

	const { payload } = mutation;
	const { relationshipModel, parent, child, predecessorLinkRef, position: insertPosition } = payload;

	let linkDocument: ReturnType<DocumentProcessors["preSaveLinkDocument"]> | undefined;
	if (payload.linkDocument && DocumentUtils.isGroupInstance(payload.linkDocument)) {
		linkDocument = documentProcessors.preSaveLinkDocument(payload.linkDocument, relationshipModel);
	}

	let position: Relationship.LinkPosition | undefined = undefined;
	if (!predecessorLinkRef) {
		position = yield* call(getNewLinkPosition, { activityId, relationshipModel, dataServicesSetting });

		if (insertPosition === TreeModel.InsertPosition.ABOVE) {
			position = Relationship.LinkPosition.TOP;
		}
	}

	const request = yield* select(
		requestSelectorMap.addLink({
			activityId,
			id: RequestId.createForAddLink(relationshipModel),
			params: {
				linkDocument,
				linkDescriptor: { relationshipModel, entities: [parent, child], position, predecessorLinkRef }
			}
		})
	);
	return [request];
}

/** @internal */
export function fromResponse(params: {
	mutation: TreeEngineOperation.AddLink;
	requests: SupportedRequest[];
	responses: JsonRpc2Response[];
}): TreeEngineOperation.AddLinkDone {
	const { requests, responses, mutation } = params;
	if (requests.length !== 1) {
		throw TreeEngineError.TypeError("TreeEngine.Request", { expect: "ONE request", actual: requests });
	}

	if (!JsonRpc.Request.AddLink.isAssignableFrom(requests[0])) {
		throw TreeEngineError.TypeError("TreeEngine.Request", { expect: "AddLink request", actual: requests[0] });
	}
	const [request] = requests;

	const response = JsonRpc.Response.get(request, responses);

	const linkId = response.result.id;
	if (linkId === null || linkId === undefined) {
		throw TreeEngineError.TypeError("TreeEngine.LinkRef", { expect: "Defined link id", actual: linkId });
	}

	return {
		type: mutation.type,
		payload: {
			newLinkIdentifier: {
				type: response.result.linkDescriptor.relationshipModel,
				id: linkId
			}
		}
	};
}
