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

import { SearchSelector } from "../../../../store/selectors/search.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";

/** What the tree body renders. */
export type TreeBodyState =
	/** A message is due but the data is still moving, so render a placeholder rather than flicker. */
	| "pending"
	/** The reduced search view kept nothing. */
	| "empty-search-result"
	/** The tree is empty and the model offers a way to add the first node. */
	| "initial-view"
	/** The rows themselves. */
	| "tree";

/** @internal */
export interface TreeBodyStateInput {
	/** The rows the body renders, including the virtual root row when the model has one. */
	readonly rowCount: number;
	readonly busy: boolean;
	/** True only while a search is running — see {@link SearchSelector.isReducedView}. */
	readonly reducedSearchView: boolean;
	readonly hasVirtualRoot: boolean;
}

/** What the tree body should render for the current engine state — the decision a replaced `Body` slot needs. */
export function useTreeBodyState(rowCount: number): TreeBodyState {
	const busy = useTreeEngineContext((context) => !!context.busy);
	const hasVirtualRoot = useTreeEngineState((state) => !!state.models.uiModel.content.configuration.virtualRoot);
	const reducedSearchView = useTreeEngineState(SearchSelector.isReducedView());

	return resolveTreeBodyState({ rowCount, busy, reducedSearchView, hasVirtualRoot });
}

/**
 * Derives the state from the row count. With nothing on screen, a running reduced search gives
 * `empty-search-result` rather than `initial-view`: the tree has rows, the filter is hiding them.
 *
 * @internal
 */
export function resolveTreeBodyState(input: TreeBodyStateInput): TreeBodyState {
	const { rowCount, busy, reducedSearchView, hasVirtualRoot } = input;
	// A virtual root is a row of the body but not a node of the tree, so it never counts as content.
	const nothingOnScreen = (hasVirtualRoot ? rowCount - 1 : rowCount) <= 0;

	if (reducedSearchView && nothingOnScreen) {
		return busy ? "pending" : "empty-search-result";
	}

	if (hasVirtualRoot && nothingOnScreen) {
		return busy ? "pending" : "initial-view";
	}

	return "tree";
}
