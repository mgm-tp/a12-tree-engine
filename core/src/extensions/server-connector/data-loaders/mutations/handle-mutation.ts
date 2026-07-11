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

import { type SagaGenerator, call } from "typed-redux-saga";

import type { JsonRpc2Response, SupportedRequest } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import type { TreeEngineOperation } from "../../../client/operation.js";
import type { RequestSelectorMap } from "../../request-selector-map.js";
import type { DocumentProcessors } from "../../types.js";

import type { A12DataServicesSetting } from "../a12-data-services-setting.js";

import * as AddLink from "./add-link.js";
import * as CopyNode from "./copy-node.js";
import * as DeleteLink from "./delete-link.js";
import * as DeleteNode from "./delete-node.js";
import * as MoveNode from "./move-node.js";
import type { MutationAndRequestsTuple } from "./utils.js";

/** @internal */
export function* transformMutation(params: {
	mutation: TreeEngineOperation.Mutation;
	prevMutationAndRequestTuple?: MutationAndRequestsTuple;
	activityId: string;
	dataServicesSetting: A12DataServicesSetting;
	documentProcessors: DocumentProcessors;
	requestSelectorMap: RequestSelectorMap;
}): SagaGenerator<MutationAndRequestsTuple> {
	const {
		mutation,
		prevMutationAndRequestTuple,
		activityId,
		dataServicesSetting,
		documentProcessors,
		requestSelectorMap
	} = params;
	let requests: SupportedRequest[] | undefined;
	if (mutation.type === "DELETE_NODE") {
		requests = yield* call(DeleteNode.toRequest, { mutation, activityId, requestSelectorMap });
	} else if (mutation.type === "DELETE_LINK") {
		requests = yield* call(DeleteLink.toRequest, { mutation, activityId, requestSelectorMap });
	} else if (mutation.type === "ADD_LINK") {
		requests = yield* call(AddLink.toRequest, {
			mutation,
			activityId,
			dataServicesSetting,
			documentProcessors,
			requestSelectorMap
		});
	} else if (mutation.type === "MOVE_NODE") {
		requests = yield* call(MoveNode.toRequest, {
			mutation,
			prevMutationAndRequestTuple,
			activityId,
			dataServicesSetting,
			documentProcessors,
			requestSelectorMap
		});
	} else if (mutation.type === "COPY_NODE") {
		requests = yield* call(CopyNode.toRequest, {
			mutation,
			activityId,
			dataServicesSetting,
			documentProcessors,
			requestSelectorMap
		});
	}

	if (!requests) {
		throw TreeEngineError.TypeError("TreeEngine.Operation", { expect: "Support operation", actual: mutation });
	}
	return [mutation, requests] as MutationAndRequestsTuple;
}

/** @internal */
export function transformMutationResponse(
	[mutation, requests]: MutationAndRequestsTuple,
	responses: JsonRpc2Response[]
): TreeEngineOperation.Done {
	if (mutation.type === "DELETE_NODE") {
		return DeleteNode.fromResponse({ mutation, requests, responses });
	} else if (mutation.type === "DELETE_LINK") {
		return DeleteLink.fromResponse({ mutation, requests, responses });
	} else if (mutation.type === "ADD_LINK") {
		return AddLink.fromResponse({ mutation, requests, responses });
	} else if (mutation.type === "MOVE_NODE") {
		return MoveNode.fromResponse({ mutation, requests, responses });
	} else if (mutation.type === "COPY_NODE") {
		return CopyNode.fromResponse({ mutation, requests, responses });
	}
	throw TreeEngineError.TypeError("TreeEngine.Operation", { expect: "Support mutation", actual: mutation });
}
