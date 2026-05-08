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

import { ActivitySelectors, LocaleSelectors } from "@com.mgmtp.a12.client/client-core";
import { type JsonRpc2Response, Relationship } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type SupportedRequest } from "@com.mgmtp.a12.dataservices/dataservices-access/lib/dispatch/ResponseTypings.js";
import { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";

import { TreeEngineError } from "../../../../../core/error/index.js";
import { RelationshipModelUtils } from "../../../../../core/models/index.js";
import {
	DataSelector,
	Identifier,
	ModelSelector,
	type ModelsState,
	TreeEngineState
} from "../../../../../core/store/index.js";
import { TreeEngineActivity, type TreeEngineOperation, TreeEngineSelectors } from "../../../../client/index.js";
import type { RequestSelectorMap } from "../../request-selector-map.js";
import { type DocumentProcessors, JsonRpc } from "../../types.js";

import { type A12DataServicesSetting } from "../a12-data-services-setting.js";
import { RequestId } from "../request-id.js";
import { getNewLinkPosition } from "../utils.js";

import { SpELHelper } from "./utils.js";
/** @internal */
export function* toRequest(params: {
	mutation: TreeEngineOperation.CopyNode;
	activityId: string;
	dataServicesSetting: A12DataServicesSetting;
	documentProcessors: DocumentProcessors;
	requestSelectorMap: RequestSelectorMap;
}): SagaGenerator<SupportedRequest[]> {
	const { mutation, dataServicesSetting, activityId, requestSelectorMap } = params;
	const activity = yield* select(ActivitySelectors.activityById(activityId));
	if (!activity) {
		throw TreeEngineError.NotFoundError("Activity", activityId);
	}

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	const dataState = yield* select(TreeEngineSelectors.dataState(activityId));
	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));

	if (!engineState || !dataState || !modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
	}
	const locale = yield* select(LocaleSelectors.locale());

	const { nodes } = mutation.payload;
	const requestParams = createRequestParams(mutation.payload, engineState, activityId);
	const { target, position } = requestParams;

	const requests: SupportedRequest[] = [];
	let predecessorLinkRef = requestParams.predecessorLinkRef;
	for (let index = 0; index < nodes.length; index++) {
		const result: MakeRequestsResult = yield* call(
			makeRequests,
			{ node: nodes[index], index, targetDocRef: target?.nodeIdentifier.id, predecessorLinkRef },
			{
				activityId,
				dataServicesSetting,
				activityDescriptor: activity.descriptor,
				locale,
				modelsState,
				position,
				requestSelectorMap
			}
		);
		requests.push(...result.requests);
		predecessorLinkRef = result.linkRef;
	}

	return requests;
}

interface MakeRequestsResult {
	requests: SupportedRequest[];
	linkRef?: Identifier;
}

interface MakeRequestParams {
	node: TreeEngineOperation.CopyNode.Node;
	targetDocRef?: string;
	parentNodeTypes?: string[];
	index: number;
	predecessorLinkRef?: Identifier;
}

interface MakeRequestDependencies {
	activityId: string;
	dataServicesSetting?: A12DataServicesSetting;
	activityDescriptor: TreeEngineActivity.Descriptor;
	modelsState: ModelsState;
	locale: Locale;
	position?: TreeTableNodeDropPosition;
	requestSelectorMap: RequestSelectorMap;
}

function createRequestParams(
	copyNodePayload: TreeEngineOperation.CopyNode.Payload,
	engineState: TreeEngineState,
	activityId: string | undefined
) {
	const { target, position } = copyNodePayload;

	if (!target || (position !== TreeTableNodeDropPosition.BOTTOM && position !== TreeTableNodeDropPosition.TOP)) {
		return { target };
	}

	const parent = DataSelector.parent(target)(engineState);
	if (!parent) {
		throw TreeEngineError.NotFoundError("TreeEngine.ParentNode", { activityId });
	}

	const childNodes = DataSelector.node(parent.nodeIdentifier)(engineState)?.children;
	if (!childNodes) {
		throw TreeEngineError.NotFoundError("TreeEngine.Node", { activityId });
	}

	const childNodeIdentifiers = childNodes.map((link) =>
		DataSelector.findNodeIdentifierFromOtherSide(link, parent.nodeIdentifier)(engineState)
	);

	const targetIndex = childNodeIdentifiers.findIndex((childrenNodeIdentifier) => {
		if (!childrenNodeIdentifier) {
			return false;
		}
		return Identifier.areEqual(childrenNodeIdentifier, target.nodeIdentifier);
	});

	let predecessorLinkRef: Identifier | undefined = undefined;

	if (position === TreeTableNodeDropPosition.TOP) {
		const targetAboveNodeIdentifier = childNodeIdentifiers[targetIndex - 1];
		if (targetAboveNodeIdentifier) {
			const predecessorNodePath = DataSelector.nodePath(targetAboveNodeIdentifier.id)(engineState);
			if (predecessorNodePath) {
				predecessorLinkRef = TreeEngineState.NodePath.toLinkIdentifier(predecessorNodePath);
			}
		}
	}

	if (position === TreeTableNodeDropPosition.BOTTOM) {
		predecessorLinkRef = TreeEngineState.NodePath.toLinkIdentifier(target.nodePath);
	}

	return { target: parent, predecessorLinkRef, position };
}

function* makeRequests(
	params: MakeRequestParams,
	dependencies: MakeRequestDependencies
): SagaGenerator<MakeRequestsResult> {
	const { node, targetDocRef, parentNodeTypes, predecessorLinkRef } = params;
	const {
		activityId,
		activityDescriptor,
		modelsState,
		locale,
		position: pastePosition,
		requestSelectorMap,
		dataServicesSetting
	} = dependencies;

	const requests: SupportedRequest[] = [];

	const copyDocumentRequest = yield* select(
		requestSelectorMap.copyDocument({
			activityId,
			id: RequestId.createForCopyDocument(node.docRef),
			params: { docRef: node.docRef, locale: Locale.toString(locale) }
		})
	);
	requests.push(copyDocumentRequest);

	const childDocRef = SpELHelper.toDocRef(copyDocumentRequest);

	let relationshipModel: string | undefined;
	if (!targetDocRef || !node.relationshipModel || !node.roles) {
		relationshipModel = activityDescriptor.rootRelationshipName;
	} else {
		relationshipModel = node.relationshipModel;
	}

	let position: Relationship.LinkPosition | undefined;
	if (!predecessorLinkRef && relationshipModel) {
		position = yield* call(getNewLinkPosition, { activityId, relationshipModel, dataServicesSetting });
	}
	if (!predecessorLinkRef && pastePosition === TreeTableNodeDropPosition.TOP) {
		position = Relationship.LinkPosition.TOP;
	}

	const state = yield* select();
	let addLinkRequest = createAddLinkOperation(
		state,
		activityId,
		requestSelectorMap,
		node,
		targetDocRef,
		childDocRef,
		predecessorLinkRef,
		position
	);

	if (!addLinkRequest && TreeEngineActivity.Descriptor.HiddenRootInstance.isAssignableFrom(activityDescriptor)) {
		const { rootInstance, rootRelationshipName, rootRelationshipRole } = activityDescriptor;
		const relationshipModel = ModelSelector.relationshipModelByName(rootRelationshipName)(modelsState);
		if (!relationshipModel) {
			throw TreeEngineError.NotFoundError("RelationshipModel", { id: rootRelationshipName, activityId });
		}
		const childRole = RelationshipModelUtils.getEntityCharacteristicByReversedRole(
			relationshipModel,
			rootRelationshipRole
		)?.role;
		if (!childRole) {
			throw TreeEngineError.NotFoundError("RelationshipModel.RelationshipRole", {
				id: rootRelationshipName,
				activityId
			});
		}
		const rootNode: TreeEngineOperation.CopyNode.Node = {
			...node,
			relationshipModel: rootRelationshipName,
			roles: { parent: rootRelationshipRole, child: childRole }
		};

		addLinkRequest = createAddLinkOperation(
			state,
			activityId,
			requestSelectorMap,
			rootNode,
			rootInstance,
			childDocRef,
			predecessorLinkRef,
			position
		);
	}

	let linkRef: Identifier | undefined;
	if (addLinkRequest) {
		requests.push(addLinkRequest);
		const addLinkId = SpELHelper.toLinkRef(addLinkRequest);
		linkRef = { id: addLinkId, type: addLinkRequest.params.linkDescriptor.relationshipModel };
	}

	const children = node.children ?? [];
	let previousLinkRef: Identifier | undefined = undefined;
	for (let index = 0; index < children.length; index++) {
		const params: MakeRequestParams = {
			parentNodeTypes: [...(parentNodeTypes ?? []), children[index].nodeType],
			node: children[index],
			targetDocRef: childDocRef,
			predecessorLinkRef: previousLinkRef,
			index
		};
		const result = yield* call(makeRequests, params, dependencies);
		requests.push(...result.requests);
		previousLinkRef = result.linkRef;
	}

	return { requests, linkRef };
}

function createAddLinkOperation(
	state: object,
	activityId: string,
	requestSelectorMap: RequestSelectorMap,
	node: TreeEngineOperation.CopyNode.Node,
	targetDocRef: string | undefined,
	childDocRef: string,
	predecessorLinkRef: Identifier | undefined,
	position: Relationship.LinkPosition | undefined
): JsonRpc.Request.AddLink | undefined {
	if (!targetDocRef || !node.relationshipModel || !node.roles) {
		return undefined;
	}

	return requestSelectorMap.addLink({
		activityId,
		id: RequestId.createForAddLink(node.relationshipModel, node.docRef),
		params: {
			linkDescriptor: {
				relationshipModel: node.relationshipModel,
				entities: [
					{ role: node.roles.parent, docRef: targetDocRef },
					{ role: node.roles.child, docRef: childDocRef }
				],
				position,
				predecessorLinkRef: predecessorLinkRef?.type === node.relationshipModel ? predecessorLinkRef.id : null
			}
		}
	})(state);
}

/** @internal */
export function fromResponse(params: {
	mutation: TreeEngineOperation.CopyNode;
	requests: SupportedRequest[];
	responses: JsonRpc2Response[];
}): TreeEngineOperation.CopyNodeDone {
	const { mutation, requests, responses } = params;
	const newLinkIdentifiers: Identifier[] = [];
	for (const request of requests) {
		if (JsonRpc.Request.AddLink.isAssignableFrom(request)) {
			const response = JsonRpc.Response.get(request, responses);
			const linkRef = response.result;
			if (linkRef.id === null || linkRef.id === undefined) {
				throw TreeEngineError.TypeError("TreeEngine.LinkRef", { expect: "Defined link id", actual: linkRef.id });
			}
			newLinkIdentifiers.push({ type: linkRef.linkDescriptor.relationshipModel, id: linkRef.id });
		}
	}
	return { type: mutation.type, payload: { newLinkIdentifiers } };
}
