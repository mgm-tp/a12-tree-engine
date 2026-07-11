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

import { call, select, type SagaGenerator } from "typed-redux-saga";

import { LocaleSelectors } from "@com.mgmtp.a12.client/client-core";
import { type SupportedRequest, DataServicesSelectors } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { TreeEngineError } from "../../../core/error/tree-engine-error.js";
import { TreeEngineSelectors } from "../../client/selectors.js";

import { DefaultRequestSelectorMap, type RequestSelectorMap } from "../request-selector-map.js";

import type { DataOperation, TreeEngineDataLoader } from "./data-loader.js";
import type { A12DataServicesSetting } from "./a12-data-services-setting.js";
import type { MutationAndRequestsTuple } from "./mutations/utils.js";
import { transformMutation, transformMutationResponse } from "./mutations/handle-mutation.js";
import { type QueryAndRequestTuple, transformQuery, transformQueryResponse } from "./queries/handle-queries.js";
import { JsonRpc } from "./json-rpc.js";
import { RequestValidator } from "./request-validator.js";

export function createA12DataServiceDataLoader(
	dataServicesSetting: A12DataServicesSetting,
	requestSelectorMap: RequestSelectorMap = DefaultRequestSelectorMap
): TreeEngineDataLoader {
	return {
		*provideData(params): SagaGenerator<DataOperation.ResultSet> {
			const { queries, mutations, activityId, documentProcessors } = params;

			// Build requests for queries
			const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
			if (!modelsState) {
				throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
			}

			const queryAndRequestTuples: QueryAndRequestTuple[] = [];
			for (const query of queries) {
				const request: SupportedRequest = yield* call(
					transformQuery,
					query,
					modelsState,
					dataServicesSetting,
					activityId,
					requestSelectorMap
				);
				queryAndRequestTuples.push([query, request]);
			}

			// Build requests for mutations
			const mutationAndRequests: MutationAndRequestsTuple[] = [];
			if (mutations && mutations.length > 0) {
				let prevMutationAndRequestTuple: MutationAndRequestsTuple | undefined;
				for (const mutation of mutations) {
					const mutationAndRequestTuple = yield* call(transformMutation, {
						mutation,
						prevMutationAndRequestTuple,
						activityId,
						dataServicesSetting,
						documentProcessors,
						requestSelectorMap
					});
					mutationAndRequests.push(mutationAndRequestTuple);
					prevMutationAndRequestTuple = mutationAndRequestTuple;
				}
			}

			const queryRequests = queryAndRequestTuples.map(([, request]) => request);
			const mutationRequests = mutationAndRequests.flatMap(([, requests]) => requests);
			const jsonRpcRequests: SupportedRequest[] = [...mutationRequests, ...queryRequests];
			const locale = yield* select(LocaleSelectors.locale());
			const maxRequests = yield* select(
				DataServicesSelectors.configurationByKey("mgmtp.a12.dataservices.jsonRpc.maxMethodCallsPerRequest")
			);

			if (maxRequests !== undefined) {
				RequestValidator.assertValidRequestCount(jsonRpcRequests, Number(maxRequests));
			}

			const responses = yield* call(() => JsonRpc.typedDispatch(locale.language, jsonRpcRequests));

			// Map responses back
			const queryResults: DataOperation.QueryResult[] = [];
			for (const tuple of queryAndRequestTuples) {
				const result = yield* call(transformQueryResponse, {
					queryAndRequest: tuple,
					responses,
					activityId,
					documentProcessors,
					dataServicesSetting
				});
				queryResults.push(result);
			}

			let mutationResults: DataOperation.ResultSet["mutationResults"];
			if (mutationAndRequests && mutationAndRequests.length > 0) {
				mutationResults = mutationAndRequests.map((tuple) => transformMutationResponse(tuple, responses));
			}

			return { queryResults, mutationResults };
		}
	};
}
