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

import { all, call, type SagaGenerator, select } from "typed-redux-saga";

import {
	type JsonRpc2Response,
	Relationship,
	type RelationshipJsonRpc2response,
	type SupportedRequest
} from "@com.mgmtp.a12.dataservices/dataservices-access";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core";

import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { DocumentUtils } from "../../../../core/models/shared.js";
import { DataSelector } from "../../../../core/store/selectors/data.js";
import { TreeEngineState } from "../../../../core/store/store.js";
import { TreeEngineOperation } from "../../../client/operation.js";
import { TreeEngineSelectors } from "../../../client/selectors.js";
import type { RequestSelectorMap } from "../../request-selector-map.js";
import { type DocumentProcessors, JsonRpc } from "../../types.js";

import type { A12DataServicesSetting } from "../a12-data-services-setting.js";
import { RequestId } from "../request-id.js";
import { getNewLinkPosition } from "../utils.js";

import { type MutationAndRequestsTuple, SpELHelper } from "./utils.js";

/** @internal */
export function* toRequest(params: {
	mutation: TreeEngineOperation.MoveNode;
	prevMutationAndRequestTuple?: MutationAndRequestsTuple;
	activityId: string;
	dataServicesSetting: A12DataServicesSetting;
	documentProcessors: DocumentProcessors;
	requestSelectorMap: RequestSelectorMap;
}): SagaGenerator<SupportedRequest[]> {
	const {
		mutation,
		prevMutationAndRequestTuple,
		activityId,
		dataServicesSetting,
		documentProcessors,
		requestSelectorMap
	} = params;
	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
	}
	const payload = mutation.payload;
	const { targetRowParent, movedRowLink, relationshipModel, position, roles } = payload;
	let linkDocument: object | undefined = payload.linkDocument;

	if (linkDocument && DocumentUtils.isGroupInstance(linkDocument)) {
		linkDocument = documentProcessors.preSaveLinkDocument(linkDocument, payload.relationshipModel);
	}

	const updatedMutation: TreeEngineOperation.MoveNode = { type: "MOVE_NODE", payload: { ...payload, linkDocument } };

	let defaultLinkPosition: Relationship.LinkPosition | undefined;
	if (position === TreeTableNodeDropPosition.BOTTOM) {
		defaultLinkPosition = Relationship.LinkPosition.BOTTOM;
	} else if (position === TreeTableNodeDropPosition.TOP) {
		defaultLinkPosition = Relationship.LinkPosition.TOP;
	} else {
		defaultLinkPosition = yield* call(getNewLinkPosition, { activityId, relationshipModel, dataServicesSetting });
	}

	if (
		payload.type === TreeEngineOperation.MoveNode.Type.CHILD_NODE &&
		relationshipModel === movedRowLink?.identifier?.type
	) {
		const relinkRequest = yield* call(createRelinkDocumentRequest, {
			mutation: updatedMutation,
			prevMutationAndRequestTuple,
			activityId,
			defaultLinkPosition,
			requestSelectorMap
		});
		if (!relinkRequest) {
			throw TreeEngineError.TypeError("TreeEngine.Request", { expect: "Relink request should be created." });
		}

		return relinkRequest;
	}

	const deleteLinkRequests = yield* call(createDeleteLinkRequests, {
		mutation: updatedMutation,
		activityId,
		requestSelectorMap
	});

	// Only create ADD_LINK request when the parent of targetRow and roles are defined
	if (!targetRowParent || !roles) {
		return deleteLinkRequests;
	}

	const addLinkRequest = yield* call(createAddLinkRequest, {
		mutation: updatedMutation,
		prevMutationAndRequestTuple,
		activityId,
		defaultLinkPosition,
		requestSelectorMap
	});

	return [...deleteLinkRequests, addLinkRequest];
}

function* createDeleteLinkRequests(params: {
	mutation: TreeEngineOperation.MoveNode;
	activityId: string;
	requestSelectorMap: RequestSelectorMap;
}): SagaGenerator<SupportedRequest[]> {
	const { activityId, mutation, requestSelectorMap } = params;
	const { payload } = mutation;

	const deleteLinks: TreeEngineState.Link[] = [];
	if (payload.type === TreeEngineOperation.MoveNode.Type.CHILD_NODE) {
		if (payload.movedRowLink) {
			deleteLinks.push(payload.movedRowLink);
		}
	} else {
		deleteLinks.push(...payload.movedRowLinks);
	}

	return yield* all(
		deleteLinks.map(({ identifier, linkRef }) =>
			select(
				requestSelectorMap.deleteLink({
					activityId,
					id: RequestId.createForDeleteLink(identifier),
					params: { linkRef }
				})
			)
		)
	);
}

function* createAddLinkRequest(params: {
	mutation: TreeEngineOperation.MoveNode;
	prevMutationAndRequestTuple?: MutationAndRequestsTuple;
	activityId: string;
	defaultLinkPosition?: Relationship.LinkPosition;
	requestSelectorMap: RequestSelectorMap;
}): SagaGenerator<SupportedRequest> {
	const { mutation, prevMutationAndRequestTuple, activityId, defaultLinkPosition, requestSelectorMap } = params;
	const payload = mutation.payload;

	if (!payload.targetRowParent || !payload.roles) {
		throw new Error("Can not find the parent row of targetRow or roles");
	}

	const { movedRow, targetRowParent, relationshipModel, linkDocumentModel, roles, linkDocument, position } = payload;

	const predecessorLinkRef = yield* call(findPredecessorLinkRef, {
		mutation,
		prevMutationAndRequestTuple,
		activityId
	});

	const newLinkPosition = createNewLinkPosition({ position, predecessorLinkRef, defaultLinkPosition });

	const newLinkDescriptor: Relationship.LinkDescriptor = {
		relationshipModel,
		entities: [
			{ docRef: targetRowParent.nodeIdentifier.id, role: roles.parent },
			{ docRef: movedRow.nodeIdentifier.id, role: roles.child }
		],
		predecessorLinkRef,
		position: newLinkPosition
	};

	type LinkDocument = { [key: string]: object };
	let newLinkDocument: LinkDocument | undefined;
	if (linkDocumentModel) {
		newLinkDocument = (linkDocument ?? {}) as LinkDocument;
	}

	return yield* select(
		requestSelectorMap.addLink({
			activityId,
			id: RequestId.createForAddLink(
				relationshipModel,
				`${targetRowParent.nodeIdentifier.id}_${movedRow.nodeIdentifier.id}`
			),
			params: { linkDescriptor: newLinkDescriptor, linkDocument: newLinkDocument }
		})
	);
}

function* createRelinkDocumentRequest(params: {
	mutation: TreeEngineOperation.MoveNode;
	prevMutationAndRequestTuple?: MutationAndRequestsTuple;
	activityId: string;
	defaultLinkPosition?: Relationship.LinkPosition;
	requestSelectorMap: RequestSelectorMap;
}): SagaGenerator<SupportedRequest[] | undefined> {
	const { mutation, prevMutationAndRequestTuple, activityId, defaultLinkPosition, requestSelectorMap } = params;
	const payload = mutation.payload;
	if (payload.type === TreeEngineOperation.MoveNode.Type.ROOT_NODE) {
		throw TreeEngineError.TypeError("TreeEngine.Operation", { expect: "Root node target", actual: payload.type });
	}
	const {
		movedRow,
		movedRowLink,
		targetRowParent,
		relationshipModel,
		linkDocumentModel,
		linkDocument,
		roles,
		position
	} = payload;

	const requests: SupportedRequest[] = [];

	if (!movedRowLink || !roles) {
		throw TreeEngineError.TypeError("TreeEngine.Operation", {
			expect: `Contains "movedRowLink" and "roles" field`,
			actual: payload
		});
	}

	if (linkDocumentModel && linkDocument) {
		type LinkDocument = { [key: string]: object };
		requests.push(
			yield* select(
				requestSelectorMap.modifyLink({
					activityId,
					id: RequestId.createForModifyLink(movedRowLink.identifier),
					params: {
						linkDocument: linkDocument as LinkDocument,
						linkRef: movedRowLink?.linkRef
					}
				})
			)
		);
	}

	const predecessorLinkRef = yield* call(findPredecessorLinkRef, {
		mutation,
		prevMutationAndRequestTuple,
		activityId
	});

	const newLinkPosition = createNewLinkPosition({ position, predecessorLinkRef, defaultLinkPosition });

	const newLinkDescriptor: Relationship.LinkDescriptor = {
		relationshipModel,
		entities: [
			{ docRef: targetRowParent.nodeIdentifier.id, role: roles.parent },
			{ docRef: movedRow.nodeIdentifier.id, role: roles.child }
		],
		predecessorLinkRef,
		position: newLinkPosition
	};

	requests.push(
		yield* select(
			requestSelectorMap.relinkDocument({
				activityId,
				id: RequestId.createForRelinkLink(
					newLinkDescriptor.relationshipModel,
					targetRowParent.nodeIdentifier.id,
					movedRow.nodeIdentifier.id
				),
				params: {
					linkRef: movedRowLink.identifier.id,
					linkDescriptor: newLinkDescriptor
				}
			})
		)
	);

	return requests;
}

function* findPredecessorLinkRef(params: {
	mutation: TreeEngineOperation.MoveNode;
	prevMutationAndRequestTuple?: MutationAndRequestsTuple;
	activityId: string;
}): SagaGenerator<string | undefined> {
	const { mutation, prevMutationAndRequestTuple } = params;
	const { payload } = mutation;
	if (payload.type === TreeEngineOperation.MoveNode.Type.ROOT_NODE) {
		return undefined;
	}

	if (prevMutationAndRequestTuple) {
		const [prevMutation, requests] = prevMutationAndRequestTuple;

		const request =
			requests.find(JsonRpc.Request.AddLink.isAssignableFrom) ??
			requests.find(JsonRpc.Request.RelinkDocument.isAssignableFrom);

		if (
			request &&
			prevMutation.type === "MOVE_NODE" &&
			prevMutation.payload.relationshipModel === mutation.payload.relationshipModel
		) {
			return SpELHelper.toLinkRef(request);
		}
	}

	const { position, targetRow, relationshipModel } = payload;
	const engineState = yield* select(TreeEngineSelectors.engineState(params.activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", params);
	}

	let predecessorLinkRef: string | undefined;
	if (position === TreeTableNodeDropPosition.BOTTOM) {
		const targetRowLinkIdentifier = TreeEngineState.NodePath.toLinkIdentifier(targetRow.nodePath);
		if (targetRowLinkIdentifier?.type === relationshipModel) {
			predecessorLinkRef = targetRowLinkIdentifier.id;
		}
	} else if (position === TreeTableNodeDropPosition.TOP) {
		const predecessor = DataSelector.predecessor(targetRow)(engineState);
		if (predecessor?.linkIdentifier.type === relationshipModel) {
			predecessorLinkRef = predecessor?.linkIdentifier.id;
		}
	}
	return predecessorLinkRef;
}

/** @internal */
export function fromResponse(params: {
	mutation: TreeEngineOperation.MoveNode;
	requests: SupportedRequest[];
	responses: JsonRpc2Response[];
}): TreeEngineOperation.MoveNodeDone {
	const { mutation, requests, responses } = params;

	let response: RelationshipJsonRpc2response.RelinkDocumentResult | undefined;
	for (const request of requests) {
		if (JsonRpc.Request.AddLink.isAssignableFrom(request) || JsonRpc.Request.RelinkDocument.isAssignableFrom(request)) {
			response = JsonRpc.Response.find(request, responses);
		}
	}

	if (!response) {
		return { type: mutation.type, payload: {} };
	}

	const linkRef = response.result;

	if (linkRef.id === null || linkRef.id === undefined) {
		throw TreeEngineError.TypeError("TreeEngine.LinkRef", { expect: "Defined link id", actual: linkRef?.id });
	}

	return {
		type: mutation.type,
		payload: { newLinkIdentifier: { type: linkRef.linkDescriptor.relationshipModel, id: linkRef.id } }
	};
}

function createNewLinkPosition(params: {
	position: TreeTableNodeDropPosition | undefined;
	predecessorLinkRef: string | undefined;
	defaultLinkPosition: Relationship.LinkPosition | undefined;
}): Relationship.LinkPosition | undefined {
	if (!params.position || params.position === TreeTableNodeDropPosition.AS_CHILD) {
		return params.predecessorLinkRef ? undefined : params.defaultLinkPosition;
	}
	return undefined;
}
