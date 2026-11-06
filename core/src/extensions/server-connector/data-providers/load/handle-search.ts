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

import { type SagaGenerator, call, put, select } from "typed-redux-saga";

import { Activity, ActivitySelectors, NotificationActions } from "@com.mgmtp.a12.client/client-core";
import { DataServicesSelectors } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { TreeModelUtils } from "../../../../core/models/utils/tree-model-utils.js";
import { LocalizableFactory, RESOURCE_KEYS } from "../../../../core/services/localization/index.js";
import { collectMatchedDocRefs } from "../../../../core/services/search/matched-nodes.js";
import {
	DS_MIN_SEARCH_TOKEN_SIZE_KEY,
	isBelowMinTokenSize
} from "../../../../core/services/search/search-token-validation.js";
import { Commands, type Events } from "../../../../core/store/actions.js";
import { ModelSelector } from "../../../../core/store/selectors/models.js";
import { Identifier, type ModelsState, TreeEngineState } from "../../../../core/store/store.js";
import { TreeEngineActions } from "../../../client/actions.js";
import { TreeEngineDataHolder } from "../../../client/data-holder.js";
import type { TreeEngineOperation } from "../../../client/operation.js";
import { TreeEngineSelectors } from "../../../client/selectors.js";
import { maybeAsyncFnWrapper } from "../../../client/utils.js";
import { DataOperation } from "../../data-loaders/data-loader.js";
import { findRootNodeDataHolder } from "../../shared.js";
import { createSearchQueries } from "../resolver/create-search-queries.js";
import { handleLoad } from "../resolver/handle-load.js";
import { type LoadPayload, getDocumentProcessors } from "../utils.js";

import { searchLoadExpansionDepths, selectMaxQueryDepth } from "./expansion-depths.js";
import { type SearchParentLinks, collectChainLinkPaths, locateMatchedNodes } from "./locate-matches.js";
import { calculateCurrentExpansionDepths, createRootNodeDataHolder } from "./utils.js";

/**
 * Handle the SEARCH_NODES operation: search RPC, then load the real tree deep enough for every match
 * to be in it, highlight the matches and open the paths leading to them.
 *
 * Both result views are rendered from these holders — the reduced view hides the rows that are
 * neither a match nor on the way to one, so switching views needs no request at all.
 *
 * @internal
 */
export function* handleSearchNodes(
	params: LoadPayload & { operation: TreeEngineOperation.SearchNodes }
): SagaGenerator<TreeEngineDataHolder[] | undefined> {
	const { config, operation } = params;
	const { activityId } = config;
	const { searchTerm, trigger } = operation.payload;

	const outcome = yield* call(executeSearchQueries, { ...params, searchTerm });
	if (!outcome) {
		return undefined;
	}
	const { matchedNodes, parentLinks } = outcome;

	const models = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!models) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const activity = yield* select(ActivitySelectors.activityById(activityId));
	if (!activity) {
		throw TreeEngineError.NotFoundError("Activity", { activityId });
	}

	const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
	const preloadChildNodes = params.preloadChildNodes ?? uiState.preloadChildNodes ?? false;

	// Load deep enough for the matches and for whatever the user already had open. The roots come
	// with the tree load below, so the complete view needs no separate query to fetch them.
	const matchedDocRefs = collectMatchedDocRefs(matchedNodes);
	const chainPaths = collectChainLinkPaths(matchedDocRefs, parentLinks);
	const expandedNodePaths = Object.keys(uiState.expandedNodes ?? {}).map(TreeEngineState.NodePath.fromString);

	const overrideTreeExpansionDepths = yield* call(searchLoadExpansionDepths, {
		models,
		chainPaths,
		expandedNodePaths,
		preloadChildNodes
	});

	const currentDataHolders = (yield* select(TreeEngineSelectors.nodesDataHolders(activityId))) ?? [];
	const dataHolders = yield* call(handleLoad, {
		...params,
		activityId,
		dataHolders: [createRootNodeDataHolder(activity, ModelSelector.uiModel()(models))],
		overrideTreeExpansionDepths
	});

	const matchedBaseNodes = locateMatchedNodes({
		dataHolders,
		activityDescriptor: activity.descriptor,
		matchedDocRefs
	});

	yield* call(dispatchSearchResult, {
		activityId,
		searchTerm,
		trigger,
		matchedNodes,
		matchedNodePaths: matchedBaseNodes.map((node) => node.nodePath),
		models
	});

	return settleReplacedDataHolders(dataHolders, currentDataHolders);
}

/**
 * Handle the CLEAR_SEARCH operation: reload the tree from the root down to the depth the store is
 * currently loaded to, capped at the DS query-depth ceiling. Expansion state itself is kept.
 *
 * @internal
 */
export function* handleClearSearch(params: LoadPayload): SagaGenerator<TreeEngineDataHolder[] | undefined> {
	const { activityId } = params.config;

	const dataHolders = (yield* select(TreeEngineSelectors.nodesDataHolders(activityId))) ?? [];
	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	const activity = yield* select(ActivitySelectors.activityById(activityId));

	let reloadedDataHolders: TreeEngineDataHolder[] | undefined;
	if (modelsState && activity && dataHolders.length > 0) {
		const rootDataHolder = findRootNodeDataHolder(dataHolders);
		// Reload at the depth the store is loaded to — the same measure every other reload uses.
		// Capped here only: the search may have loaded nodes deeper than one maxDepth value may
		// legally ask back, and the other callers never load past the ceiling.
		const maxQueryDepth = yield* call(selectMaxQueryDepth);
		const overrideTreeExpansionDepths = calculateCurrentExpansionDepths(dataHolders, modelsState).map(
			(expansionDepth) => ({ ...expansionDepth, maxDepth: Math.min(expansionDepth.maxDepth, maxQueryDepth) })
		);
		reloadedDataHolders = yield* call(handleLoad, {
			...params,
			activityId,
			dataHolders: [rootDataHolder],
			overrideTreeExpansionDepths,
			reload: true
		});
		reloadedDataHolders = settleReplacedDataHolders(reloadedDataHolders, dataHolders);
	}

	yield* put(
		TreeEngineActions.command({
			activityId,
			engineAction: Commands.setSearchResult({ searchString: "", matchedNodes: {} })
		})
	);
	yield* call(clearSelection, activityId);
	if (modelsState) {
		yield* call(resetSearchResultView, activityId, modelsState);
	}

	return reloadedDataHolders;
}

/**
 * Search and clear both replace the whole tree, so a child-node holder the load did not fill has
 * nothing left to fill it — a node created during the search, whose children were never fetched, is
 * the usual one. Settling those keeps their row from showing a progress indicator for ever.
 */
function settleReplacedDataHolders(
	loadedDataHolders: TreeEngineDataHolder[],
	previousDataHolders: TreeEngineDataHolder[]
): TreeEngineDataHolder[] {
	const unfilledDataHolders = previousDataHolders.filter(
		(dataHolder) =>
			TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(dataHolder.descriptor) &&
			dataHolder.loadingState !== "loaded" &&
			!loadedDataHolders.some(Activity.DataHolder.hasDescriptor(dataHolder.descriptor))
	);

	return [
		...loadedDataHolders,
		...unfilledDataHolders.map((dataHolder) => ({ ...dataHolder, loadingState: "loaded" as const, busy: false }))
	];
}

/** What the search RPC found: the matches, and the shape of the links above them. */
interface SearchQueryOutcome {
	matchedNodes: TreeEngineState.MatchedNodes;
	/** The matches' ancestor chains — only their shape is used, to work out how deep to load. */
	parentLinks: SearchParentLinks;
}

/**
 * Run the search queries and digest the response into the matched nodes and their parent links.
 * Returns undefined without a request when the term is below the DS minimum token size, or with a
 * warning toast when the tree has no searchable document model.
 */
function* executeSearchQueries(
	params: LoadPayload & { searchTerm: string }
): SagaGenerator<SearchQueryOutcome | undefined> {
	const { config, dataLoader, searchTerm } = params;
	const { activityId } = config;

	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}

	// Guard: DS rejects tokens shorter than the configured minimum. Skip the RPC entirely.
	const minTokenSizeRaw = yield* select(DataServicesSelectors.configurationByKey(DS_MIN_SEARCH_TOKEN_SIZE_KEY));
	const minTokenSize = Number.isFinite(Number(minTokenSizeRaw)) ? Number(minTokenSizeRaw) : undefined;
	if (minTokenSize !== undefined && isBelowMinTokenSize(searchTerm, minTokenSize)) {
		return undefined;
	}

	// The DS depth limit caps every requested depth: the reversed self-referencing hops ask for it.
	const maxQueryDepth = yield* call(selectMaxQueryDepth);

	const queries = createSearchQueries(searchTerm, modelsState, maxQueryDepth);
	if (queries.length === 0) {
		yield* put(
			NotificationActions.add({
				activityId,
				severity: "warning",
				title: LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.treeEngine.error.searchNotAvailable.title),
				message: LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.treeEngine.error.searchNotAvailable.message)
			})
		);
		return undefined;
	}

	const documentProcessors = getDocumentProcessors(modelsState);

	const resultSet: DataOperation.ResultSet = yield* call(maybeAsyncFnWrapper(dataLoader.provideData), {
		activityId,
		queries,
		documentProcessors
	});

	return resolveSearchResults(resultSet.queryResults, modelsState);
}

function resolveSearchResults(queryResults: DataOperation.QueryResult[], models: ModelsState): SearchQueryOutcome {
	const matchedNodes: Record<string, Record<string, TreeEngineState.MatchedNode>> = {};
	const parentLinks: SearchParentLinks = new Map();

	for (const queryResult of queryResults) {
		if (!DataOperation.Query.SearchNodes.Result.isAssignableFrom(queryResult)) {
			continue;
		}

		for (const entry of queryResult.entries) {
			const identifier = Identifier.from(entry.docRef);
			matchedNodes[identifier.type] ??= {};
			matchedNodes[identifier.type][identifier.id] = { matchCount: 1 };
		}

		for (const link of queryResult.links) {
			// A link-document entry carries no parent, so it contributes nothing to the chains.
			if (!link.linkId || isLinkDocument(link, models)) {
				continue;
			}
			// The traversal is reversed, so `source` is the child and `target` the parent.
			const existing = parentLinks.get(link.sourceDocRef) ?? [];
			if (!existing.some((parentLink) => parentLink.linkId === link.linkId)) {
				existing.push({
					parentDocRef: link.targetDocRef,
					linkId: link.linkId,
					relationshipModel: link.relationshipModel,
					parentRole: link.targetRole,
					childRole: link.sourceRole
				});
			}
			parentLinks.set(link.sourceDocRef, existing);
		}
	}

	return { matchedNodes, parentLinks };
}

function isLinkDocument(link: DataOperation.Query.TreeNodes.Link, models: ModelsState): boolean {
	const relationshipModel = ModelSelector.relationshipModelByName(link.relationshipModel)(models);
	return relationshipModel?.content.linkDocumentModel === link.documentModelName;
}

/**
 * Commit a search result to the store: the term, the matches, and the expansion of every match's
 * ancestors — the match itself stays collapsed, and pre-search expansions survive the merge.
 */
function* dispatchSearchResult(params: {
	activityId: string;
	searchTerm: string;
	/** An `"engine"` re-run leaves the result view and the selection alone. */
	trigger: Events.SearchTrigger;
	matchedNodes: TreeEngineState.MatchedNodes;
	matchedNodePaths: TreeEngineState.NodePath[];
	models: ModelsState;
}): SagaGenerator<void> {
	const { activityId, searchTerm, trigger, matchedNodes, matchedNodePaths, models } = params;

	const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
	const expandedNodes: Record<string, Record<string, unknown>> = { ...uiState?.expandedNodes };
	// Expand the ancestors of every match; the match itself stays collapsed. A container hit with a
	// matching descendant is such an ancestor, so it gets expanded here. Pre-search expansions
	// survive via the merge above.
	for (const matchedPath of matchedNodePaths) {
		for (let length = 1; length < matchedPath.length; length++) {
			expandedNodes[TreeEngineState.NodePath.toString(matchedPath.slice(0, length))] = {};
		}
	}

	yield* put(
		TreeEngineActions.command({
			activityId,
			engineAction: Commands.setSearchResult({ searchString: searchTerm, matchedNodes })
		})
	);
	yield* put(
		TreeEngineActions.command({ activityId, engineAction: Commands.setExpandedNodes({ nodes: expandedNodes }) })
	);
	// Only a term the user submitted starts fresh. An engine re-run repeats the term already in the
	// input after an edit, so it keeps the view the user is reading and the selection they built up —
	// which is how an edit behaves when no search is active.
	if (trigger === "user") {
		yield* call(resetSearchResultView, activityId, models);
		yield* call(clearSelection, activityId);
	}
}

/** Drop the row selection and the multi-selection — on a submitted search term and on a cleared search. */
function* clearSelection(activityId: string): SagaGenerator<void> {
	yield* put(TreeEngineActions.command({ activityId, engineAction: Commands.setSelectedNodes({ nodes: {} }) }));
	yield* put(
		TreeEngineActions.command({
			activityId,
			engineAction: Commands.setMultiSelectionNodes({ multiSelectionNodes: {} })
		})
	);
}

/**
 * Put the result view back to the one a search opens in — reduced whenever the model offers it.
 *
 * Both starting and clearing a search do this, so a view the user picked never carries into a result
 * they did not pick it for.
 */
function* resetSearchResultView(activityId: string, models: ModelsState): SagaGenerator<void> {
	const { configuration } = ModelSelector.uiModel()(models).content;
	const view = TreeModelUtils.resolveSearchResultView(configuration, undefined);

	yield* put(TreeEngineActions.command({ activityId, engineAction: Commands.setSearchResultView({ view }) }));
}
