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

import type { Relationship, SupportedRequest } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import type { ModelsState } from "../../../../core/store/store.js";
import { TreeEngineSelectors } from "../../../client/selectors.js";
import type { RequestSelectorMap } from "../../request-selector-map.js";
import { type DocumentProcessors, JsonRpc } from "../../types.js";

import type { A12DataServicesSetting } from "../a12-data-services-setting.js";
import { DataOperation } from "../data-loader.js";
import { RequestValidator } from "../request-validator.js";

import { A12QueryAPIUtils } from "./utils.js";

/** @internal */
export function* transformQuery(
	query: DataOperation.Query,
	modelsState: ModelsState,
	dataServicesSetting: A12DataServicesSetting,
	activityId: string,
	requestSelectorMap: RequestSelectorMap
): SagaGenerator<SupportedRequest> {
	if (DataOperation.Query.LoadThumbnailUrls.Query.isAssignableFrom(query)) {
		return JsonRpc.Request.builder.loadThumbnailUrls({ id: query.id, params: {} });
	}

	if (DataOperation.ListQuery.isAssignableFrom(query)) {
		const paging = A12QueryAPIUtils.Paging.transformPaging(query.paging, dataServicesSetting.maximumPageSize);
		if (DataOperation.Query.ListRootNodes.Query.isAssignableFrom(query)) {
			return yield* select(requestSelectorMap.loadListRootNodes({ activityId, query, paging }));
		}
		return yield* select(requestSelectorMap.loadListChildNodes({ activityId, query, paging }));
	}

	if (DataOperation.Query.GetDocument.Query.isAssignableFrom(query)) {
		return yield* select(requestSelectorMap.loadDocument({ activityId, query }));
	}

	// Hidden root nodes request.
	if (DataOperation.Query.TreeNodes.Query.isAssignableFrom(query)) {
		const pageSize = dataServicesSetting.maximumPageSize ?? A12QueryAPIUtils.DEFAULT_PAGE_SIZE;
		return yield* select(requestSelectorMap.loadTreeNodes({ activityId, query, pageSize }));
	}

	throw TreeEngineError.TypeError("TreeEngine.Query", {
		actual: query.type,
		expect: "LIST_ROOT_NODES | LIST_CHILD_NODES | GET_DOCUMENT | TREE_NODES | LOAD_THUMBNAIL_URLS_INTERNAL"
	});
}

export type QueryAndRequestTuple = [DataOperation.Query, SupportedRequest];

/** @internal */
export function* transformQueryResponse(params: {
	queryAndRequest: QueryAndRequestTuple;
	responses: JsonRpc2Response[];
	activityId: string;
	documentProcessors: DocumentProcessors;
	dataServicesSetting: A12DataServicesSetting;
}): SagaGenerator<DataOperation.QueryResult> {
	const { queryAndRequest, responses, activityId, documentProcessors, dataServicesSetting } = params;
	const pageSize = dataServicesSetting.maximumPageSize ?? A12QueryAPIUtils.DEFAULT_PAGE_SIZE;
	const [query, request] = queryAndRequest;
	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}

	if (DataOperation.Query.LoadThumbnailUrls.Query.isAssignableFrom(query)) {
		const { result } = JsonRpc.Response.get(request, responses);

		return { id: query.id, result };
	}

	if (DataOperation.ListQuery.isAssignableFrom(query) && JsonRpc.Request.Query.isAssignableFrom(request)) {
		const entries: Relationship.LinkWithDocument[] = [];
		const response = JsonRpc.Response.find(request, responses);
		if (!response) {
			throw TreeEngineError.NotFoundError("TreeEngine.Response", { id: JSON.stringify(request.id) });
		}

		const processor = new A12QueryAPIUtils.ListNodesProcessor(query, documentProcessors);

		if (DataOperation.Query.ListRootNodes.Query.isOrphanedRootNode(query)) {
			const usedEntries = A12QueryAPIUtils.Paging.removedUnusedResults(
				response.result.entries,
				request.params.query.paging,
				query.paging
			);

			entries.push(...processor.fromEntriesAndLinks(usedEntries, response.result.links));
		} else {
			const usedLinks = A12QueryAPIUtils.Paging.removedUnusedResults(
				response.result.links,
				request.params.query.paging,
				query.paging
			);

			entries.push(...processor.fromLinks(usedLinks));
		}

		const listResult = {
			id: query.id,
			entries,
			fullSize: response.result.fullSize
		} satisfies DataOperation.ListQueryResult;
		RequestValidator.assertRootNodesWithinPageSize(query, listResult, pageSize);
		return listResult;
	}

	if (
		DataOperation.Query.GetDocument.Query.isAssignableFrom(query) &&
		JsonRpc.Request.Query.isAssignableFrom(request)
	) {
		const { result } = JsonRpc.Response.get(request, responses);

		if (result.entries.length !== 1 || result.fullSize !== 1) {
			throw TreeEngineError.NotFoundError("TreeEngine.Response");
		}

		const entry = result.entries[0];

		const document = documentProcessors.postLoadDocument(entry.document, entry.documentModelName);

		return { id: query.id, ...entry, document } satisfies DataOperation.Query.GetDocument.Result;
	}

	if (DataOperation.Query.TreeNodes.Query.isAssignableFrom(query) && JsonRpc.Request.Query.isAssignableFrom(request)) {
		const response = JsonRpc.Response.get(request, responses);

		const treeResult = {
			id: query.id,
			fullSize: response.result.fullSize,
			entries: response.result.entries.map((entry) => {
				return { ...entry, document: documentProcessors.postLoadDocument(entry.document, entry.documentModelName) };
			}),
			links: response.result.links.map((entry) => {
				let document = entry.document;
				if (!document) {
					return entry;
				}
				if (entry.type === "CHILD") {
					document = documentProcessors.postLoadDocument(entry.document, entry.documentModelName);
				} else if (entry.type === "LINK") {
					document = documentProcessors.postLoadLinkDocument(entry.document, entry.relationshipModel);
				}

				return { ...entry, document };
			})
		} satisfies DataOperation.Query.TreeNodes.Result;
		RequestValidator.assertRootNodesWithinPageSize(query, treeResult, pageSize);
		return treeResult;
	}

	throw TreeEngineError.TypeError("TreeEngine.Query", { actual: query, expect: "ListQuery | GetDocument | TreeNodes" });
}
