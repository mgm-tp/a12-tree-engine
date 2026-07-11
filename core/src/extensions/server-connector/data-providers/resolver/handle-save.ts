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

import { type SagaGenerator, call, select } from "typed-redux-saga";

import { Activity } from "@com.mgmtp.a12.client/client-core";

import { ModelSelector } from "../../../../core/store/selectors/models.js";
import { UIStateSelector } from "../../../../core/store/selectors/ui-state.js";
import { maybeAsyncFnWrapper } from "../../../client/utils.js";
import { TreeEngineDataHolder } from "../../../client/data-holder.js";
import type { TreeEngineOperation } from "../../../client/operation.js";
import { TreeEngineSelectors } from "../../../client/selectors.js";
import { DataOperation } from "../../data-loaders/data-loader.js";
import { getTobeLoadedNodesDataHolders } from "../../utils.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { TreeModel } from "../../../../core/models/tree-model.js";

import { calculateCurrentExpansionDepths } from "../load/utils.js";
import { getDocumentProcessors, mergeDataHolders, type SavePayload } from "../utils.js";

import { handleThumbnailUrlResult } from "./attachment-utils.js";
import { createListQueries, createTreeQueries } from "./create-queries.js";
import { PaginationUtils } from "./pagination-utils.js";
import { resolveQueryResults } from "./queries-to-data-holders/index.js";

/** @internal */
export type SaveHandlerReturnType = {
	result?: (TreeEngineOperation.Done | TreeEngineOperation.Failed)[];
	dataHolders: TreeEngineDataHolder[];
	removedDataHolderDescriptors?: Activity.Descriptor[];
};

/** @internal */
export function* handleSave(
	params: SavePayload & { mutations: TreeEngineOperation.Mutation[] }
): SagaGenerator<SaveHandlerReturnType> {
	const { mutations, config, dataLoader } = params;
	const { activityId } = config;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}

	const documentProcessors = getDocumentProcessors(engineState);
	const outDatedDataHolderDescriptors = mutations
		.map(({ payload }) => payload.outdatedDataHolderDescriptors ?? [])
		.flat();
	const removedDataHolderDescriptors = mutations
		.map(({ payload }) => payload.removedDataHolderDescriptors ?? [])
		.flat();

	const uiModel = ModelSelector.uiModel()(engineState);

	let queries: DataOperation.Query[];
	let skippedQueries: DataOperation.Query[];
	let updatedDataHolders: TreeEngineDataHolder[];

	const nodesDataHolders = config.dataHolders.filter(TreeEngineDataHolder.isAssignableFrom);
	if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(uiModel.content.configuration.expansionStrategy)) {
		const allDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
		if (!allDataHolders) {
			throw TreeEngineError.NotFoundError("TreeEngine.DataHolder", { activityId });
		}
		const createQueriesResult = createTreeQueries([], engineState, {
			overrideExpansionDepths: calculateCurrentExpansionDepths(allDataHolders, engineState),
			preloadChildNodes: UIStateSelector.preloadChildNodes()(engineState)
		});

		updatedDataHolders = getTobeLoadedNodesDataHolders(
			nodesDataHolders,
			outDatedDataHolderDescriptors,
			removedDataHolderDescriptors
		).map(toEmptyDataHolder);

		queries = createQueriesResult.queries;
		skippedQueries = createQueriesResult.skippedQueries;
	} else {
		updatedDataHolders = getTobeLoadedNodesDataHolders(
			nodesDataHolders,
			outDatedDataHolderDescriptors,
			removedDataHolderDescriptors
		);

		const defaultPageSize = uiModel.content.configuration.expansionStrategy.pageSize;
		if (defaultPageSize) {
			updatedDataHolders = mutations.reduce(
				(dataHolders, mutation) => handleMutation(dataHolders, mutation, defaultPageSize),
				updatedDataHolders
			);
		}

		const rootNodeDataHolder = extractRootNodesDataHolder(nodesDataHolders, outDatedDataHolderDescriptors);
		if (rootNodeDataHolder) {
			updatedDataHolders = mergeDataHolders(updatedDataHolders, [rootNodeDataHolder]);
		}

		const result = createListQueries(updatedDataHolders, engineState, true);
		queries = result.queries;
		skippedQueries = result.skippedQueries;
	}

	const resultSet = yield* call(maybeAsyncFnWrapper(dataLoader.provideData), {
		activityId,
		mutations,
		queries,
		documentProcessors
	});

	if (!resultSet.mutationResults) {
		throw TreeEngineError.TypeError("TreeEngine.Type", { expect: "Contains mutation result", actual: resultSet });
	}

	const queryResults = yield* call(handleThumbnailUrlResult, resultSet.queryResults, activityId);

	updatedDataHolders = resolveQueryResults({
		queries: queries.filter((q) => !DataOperation.Query.LoadThumbnailUrls.Query.isAssignableFrom(q)),
		skippedQueries,
		results: queryResults,
		dataHolders: updatedDataHolders,
		models: engineState,
		dataLoader,
		documentProcessors,
		appended: false,
		preloadChildNodes: UIStateSelector.preloadChildNodes()(engineState)
	});

	return {
		result: resultSet.mutationResults,
		dataHolders: updatedDataHolders,
		removedDataHolderDescriptors
	};
}

function extractRootNodesDataHolder(
	dataHolders: TreeEngineDataHolder[],
	updatedDescriptors: Activity.DataHolderDescriptor[] = []
): TreeEngineDataHolder | undefined {
	return dataHolders.find((dh) => {
		if (TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(dh.descriptor)) {
			return updatedDescriptors.some((descriptor) => {
				return Activity.DataHolder.hasDescriptor(descriptor)(dh);
			});
		}
		return false;
	});
}

function handleMutation(
	dataHolders: TreeEngineDataHolder[],
	mutation: TreeEngineOperation.Mutation,
	defaultPageSize?: number
): TreeEngineDataHolder[] {
	let updatedDataHolders = dataHolders;

	const dataHoldersToReload = updatedDataHolders.filter((dataHolder) => {
		return mutation.payload.outdatedDataHolderDescriptors?.some((descriptor) =>
			Activity.DataHolder.hasDescriptor(descriptor)(dataHolder)
		);
	});

	switch (mutation.type) {
		case "ADD_LINK": {
			const result = PaginationUtils.updateExpectedSizeForAddedNode(
				dataHoldersToReload,
				mutation.payload.relationshipModel,
				defaultPageSize
			);
			updatedDataHolders = mergeDataHolders(updatedDataHolders, result);
			break;
		}

		case "DELETE_LINK":
		case "DELETE_NODE": {
			let dataHolders = dataHoldersToReload;
			const { parentIdentifier, nodeIdentifier } = mutation.payload;
			if (parentIdentifier) {
				dataHolders = dataHolders.filter(({ descriptor }) => descriptor.source === parentIdentifier.id);
			}
			const result = PaginationUtils.updateExpectedSizeForRemovedNode(dataHolders, nodeIdentifier, defaultPageSize);
			updatedDataHolders = mergeDataHolders(updatedDataHolders, result);
			break;
		}

		case "COPY_NODE": {
			let affectedDataHolders = dataHoldersToReload;
			for (const node of mutation.payload.nodes) {
				if (!node.relationshipModel) {
					continue;
				}
				const result = PaginationUtils.updateExpectedSizeForAddedNode(
					affectedDataHolders,
					node.relationshipModel,
					defaultPageSize
				);
				affectedDataHolders = mergeDataHolders(affectedDataHolders, result);
				updatedDataHolders = mergeDataHolders(updatedDataHolders, result);
			}
			break;
		}

		case "MOVE_NODE": {
			let affectedDataHolders = dataHoldersToReload;
			// Moving with-in the same parent shouldn't affect the page size
			if (mutation.payload.targetRowParent?.nodeIdentifier.id === mutation.payload.movedRowParent?.id) {
				updatedDataHolders = PaginationUtils.normalizeExpectedSize(updatedDataHolders, defaultPageSize);
				break;
			}

			if (mutation.payload.movedRowParent) {
				const parentId = mutation.payload.movedRowParent.id;
				const result = PaginationUtils.updateExpectedSizeForRemovedNode(
					affectedDataHolders.filter((dh) => dh.descriptor.source === parentId),
					mutation.payload.movedRow.nodeIdentifier,
					defaultPageSize
				);
				updatedDataHolders = mergeDataHolders(updatedDataHolders, result);
				affectedDataHolders = mergeDataHolders(affectedDataHolders, result);
			}

			if (mutation.payload.targetRowParent) {
				const parentId = mutation.payload.targetRowParent.nodeIdentifier.id;
				const result = PaginationUtils.updateExpectedSizeForAddedNode(
					affectedDataHolders.filter((dh) => dh.descriptor.source === parentId),
					mutation.payload.relationshipModel,
					defaultPageSize
				);
				updatedDataHolders = mergeDataHolders(updatedDataHolders, result);
			}
			break;
		}
	}

	return updatedDataHolders;
}

function toEmptyDataHolder(dataHolder: TreeEngineDataHolder): TreeEngineDataHolder {
	return { ...dataHolder, data: {}, slices: {}, loadingState: "loaded", busy: false };
}
