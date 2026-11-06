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

import type { TreeModel } from "../../models/tree-model.js";
import { LinkDescriptorUtils } from "../../models/utils/relationship-utils.js";
import { TreeModelUtils } from "../../models/utils/tree-model-utils.js";
import { collectMatchedDocRefs } from "../../services/search/matched-nodes.js";
import type { DataState, Identifier, ModelsState, TreeEngineState, UiState } from "../store.js";

import { DataSelector } from "./data.js";
import { ModelSelector } from "./models.js";
import { type Selector, createSelector } from "./selector.js";
import { UIStateSelector } from "./ui-state.js";

/** These selectors provide access to what a running search shows. */
export namespace SearchSelector {
	type ResultViewInput = ModelsState & Pick<UiState, "searchResultView">;
	/**
	 * The result view in effect: the one the user picked, or the one the tree model falls back to.
	 *
	 * @internal
	 */
	export function resultView(): Selector<TreeModel.SearchResultView, ResultViewInput> {
		return (state) =>
			TreeModelUtils.resolveSearchResultView(
				ModelSelector.uiModel()(state).content.configuration,
				UIStateSelector.searchResultView()(state)
			);
	}

	type ReducedViewInput = ModelsState & Pick<UiState, "searchString" | "searchResultView">;
	/**
	 * Whether the reduced result view is active: a search is running and the view in effect is the
	 * reduced one, so only matches and the rows leading to them are shown.
	 *
	 * @internal
	 */
	export function isReducedView(): Selector<boolean, ReducedViewInput> {
		return (state) => !!UIStateSelector.searchString()(state) && SearchSelector.resultView()(state) === "reduced";
	}

	/**
	 * The nodes the reduced search result view shows: every match, and every node with a match below
	 * it. `undefined` means no filter — no search, or the complete view; an empty set keeps nothing.
	 *
	 * Rendering only: the store keeps the whole tree, so everything that walks it on the user's
	 * behalf must honour this set as well, or a bulk action reaches a row the user cannot see.
	 *
	 * @internal
	 */
	export function reducedViewNodes(): Selector<Set<string> | undefined, TreeEngineState> {
		return (state) => reducedViewNodesReselect(state);
	}
	const reducedViewNodesReselect = createSelector(
		[
			DataSelector.data(),
			DataSelector.root(),
			ModelSelector.models(),
			UIStateSelector.searchString(),
			UIStateSelector.searchResultView(),
			UIStateSelector.matchedNodes()
		],
		(data, root, models, searchString, searchResultView, matchedNodes) =>
			collectReducedViewNodes({ data, root, models, searchString, searchResultView, matchedNodes })
	);
}

/** The state the reduced-view filter is derived from. */
type SearchFilterState = DataState & ModelsState & Pick<UiState, "searchString" | "searchResultView" | "matchedNodes">;

/** Walks the loaded tree once, keeping a node when it matches or a node below it does. */
function collectReducedViewNodes(engineState: SearchFilterState): Set<string> | undefined {
	if (!SearchSelector.isReducedView()(engineState)) {
		return undefined;
	}

	const matchedDocRefs = collectMatchedDocRefs(engineState.matchedNodes);
	const keptDocRefs = new Set<string>();
	if (matchedDocRefs.size === 0) {
		return keptDocRefs;
	}

	// A node's answer depends on its own subtree, not on the path that reached it, so one that is
	// reachable several ways is decided once.
	const decided = new Map<string, boolean>();

	function keepNode(nodeIdentifier: Identifier, ancestors: Set<string>): boolean {
		const docRef = nodeIdentifier.id;
		const alreadyDecided = decided.get(docRef);
		if (alreadyDecided !== undefined) {
			return alreadyDecided;
		}
		// A back edge contributes no match, which keeps cyclic data from recursing forever.
		if (ancestors.has(docRef)) {
			return false;
		}

		const node = DataSelector.node(nodeIdentifier)(engineState);
		const childAncestors = new Set([...ancestors, docRef]);
		let keep = matchedDocRefs.has(docRef);

		for (const childLinkIdentifier of node?.children ?? []) {
			const childNodeIdentifier = DataSelector.findNodeIdentifierFromOtherSide(
				childLinkIdentifier,
				nodeIdentifier
			)(engineState);
			if (childNodeIdentifier && keepNode(childNodeIdentifier, childAncestors)) {
				keep = true;
			}
		}

		decided.set(docRef, keep);
		if (keep) {
			keptDocRefs.add(docRef);
		}
		return keep;
	}

	for (const rootNodeIdentifier of collectRootNodeIdentifiers(engineState)) {
		keepNode(rootNodeIdentifier, new Set());
	}

	return keptDocRefs;
}

/** The tree's root nodes, resolving the link entries a hidden root instance produces. */
function collectRootNodeIdentifiers(engineState: DataState): Identifier[] {
	const { identifier: rootIdentifier, children } = DataSelector.root()(engineState);

	return children.map((identifier) => {
		const link = DataSelector.link(identifier)(engineState);
		return link && rootIdentifier
			? LinkDescriptorUtils.getNodeIdentifierFromRootNode(link.linkRef.linkDescriptor, rootIdentifier)
			: identifier;
	});
}
