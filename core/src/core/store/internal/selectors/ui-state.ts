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

import { type Action } from "typescript-fsa";

import { type DataState, type Identifier, TreeEngineState, type UiState } from "../store.js";
import { Events } from "../actions.js";

import { DataSelector } from "./data.js";
import { type Selector, createSelector } from "./selector.js";

/**
 * These selectors provide access to the ui state in the store
 */
export namespace UIStateSelector {
	type SelectedNodesInput = Pick<UiState, "selectedNodes">;
	export function selectedNodes(): Selector<TreeEngineState.SelectedNodes, SelectedNodesInput> {
		return (state) => state.selectedNodes;
	}

	type ExpandedNodesInput = Pick<UiState, "expandedNodes">;
	export function expandedNodes(): Selector<TreeEngineState.ExpandedNodes, ExpandedNodesInput> {
		return (state) => state.expandedNodes;
	}

	type QueryInput = Pick<UiState, "query">;
	export function query(): Selector<string, QueryInput> {
		return (state) => state.query;
	}

	type MatchedNodesInput = Pick<UiState, "matchedNodes">;
	export function matchedNodes(): Selector<TreeEngineState.MatchedNodes, MatchedNodesInput> {
		return (state) => state.matchedNodes;
	}

	type BusyNodesInput = Pick<UiState, "busyNodes">;
	export function busyNodes(): Selector<TreeEngineState.BusyNodes | undefined, BusyNodesInput> {
		return (state) => state.busyNodes;
	}

	type ScrollToNodeInput = Pick<UiState, "scrollToNode">;
	export function scrollToNode(): Selector<TreeEngineState.ScrollToNode | undefined, ScrollToNodeInput> {
		return (state) => state.scrollToNode;
	}

	type ExpandedMultiSelectionPanelInput = Pick<UiState, "expandedMultiSelectionPanel">;
	export function expandedMultiSelectionPanel(): Selector<boolean, ExpandedMultiSelectionPanelInput> {
		return (state) => state.expandedMultiSelectionPanel;
	}

	type MultiSelectionNodesInput = Pick<UiState, "multiSelectionNodes">;
	export function multiSelectionNodes(): Selector<TreeEngineState.MultiSelectionNodes, MultiSelectionNodesInput> {
		return (state) => state.multiSelectionNodes;
	}

	type MultiSelectionActionsInput = Pick<UiState, "multiSelectionActions">;

	export function previousMultiSelectionActions(): Selector<
		Action<
			| Events.NodeMultiSelectionClickedPayload
			| Events.NodeRangeSelectionClickedPayload
			| Events.OverallMultiSelectionClickedPayload
		>[],
		MultiSelectionActionsInput
	> {
		return (state) => previousMultiSelectionActionsReselect(state);
	}
	const previousMultiSelectionActionsReselect = createSelector(
		[(state) => state.multiSelectionActions],
		(multiSelectionActions) => {
			return multiSelectionActions?.slice(0, -1);
		}
	);

	export function lastMultiSelectionAction(): Selector<
		Action<Events.NodeMultiSelectionClickedPayload> | undefined,
		MultiSelectionActionsInput
	> {
		return (state) => lastMultiSelectionActionReselect(state);
	}
	const lastMultiSelectionActionReselect = createSelector(
		[previousMultiSelectionActions()],
		(multiSelectionActions) => {
			return multiSelectionActions.slice().reverse().find(Events.onNodeMultiSelectionClicked.match);
		}
	);

	export function lastRangeMultiSelectionAction(): Selector<
		Action<Events.NodeRangeSelectionClickedPayload> | undefined,
		MultiSelectionActionsInput
	> {
		return (state) => lastRangeMultiSelectionActionReselect(state);
	}
	const lastRangeMultiSelectionActionReselect = createSelector(
		[previousMultiSelectionActions()],
		(multiSelectionActions) => {
			return multiSelectionActions.slice().reverse().find(Events.onNodeRangeSelectionClicked.match);
		}
	);

	/**
	 * @internal
	 * Calculate the old behavior of the latestMultiSelectionNode property, mainly used for range selection.
	 */
	export function latestMultiSelectionNode(): Selector<TreeEngineState.NodePath | undefined, UiState> {
		return (state) => {
			const lastAction = lastMultiSelectionAction()(state) ?? lastRangeMultiSelectionAction()(state);
			if (!lastAction?.payload.nodePath) {
				return undefined;
			}

			const nodePath = lastAction.payload.nodePath;
			const stringifyNodePath = TreeEngineState.NodePath.toString(nodePath);
			return UIStateSelector.multiSelectionNodes()(state)[stringifyNodePath] === "selected" ? nodePath : undefined;
		};
	}

	export function totalMultiSelectionNodeCount(): Selector<number, MultiSelectionNodesInput> {
		return (state) => totalMultiSelectionNodeCountReselect(state);
	}
	const totalMultiSelectionNodeCountReselect = createSelector([multiSelectionNodes()], (multiSelectionNodes) => {
		return Object.values(multiSelectionNodes).filter(
			(nodeState) => nodeState === TreeEngineState.MultiSelectionState.SELECTED
		).length;
	});

	export function overallMultiSelection(): Selector<TreeEngineState.MultiSelectionState, TreeEngineState> {
		return (state) => overallMultiSelectionReselect(state);
	}
	const overallMultiSelectionReselect = createSelector(
		[multiSelectionNodes(), DataSelector.root()],
		(multiSelectionNodesState, root) => {
			const rootStates = root.children.map((child) => {
				const childNodePath = TreeEngineState.NodePath.toString(root.identifier ? [root.identifier, child] : [child]);
				return multiSelectionNodesState[childNodePath] ?? TreeEngineState.MultiSelectionState.DESELECTED;
			});

			if (rootStates.every((rootState) => rootState === TreeEngineState.MultiSelectionState.DESELECTED)) {
				return TreeEngineState.MultiSelectionState.DESELECTED;
			}

			if (rootStates.every((rootState) => rootState === TreeEngineState.MultiSelectionState.SELECTED)) {
				return TreeEngineState.MultiSelectionState.SELECTED;
			}

			return TreeEngineState.MultiSelectionState.PARTLY_SELECTED;
		}
	);

	type NodeStateInput = SelectedNodesInput &
		ExpandedNodesInput &
		BusyNodesInput &
		MatchedNodesInput &
		MultiSelectionNodesInput;

	export interface NodeState {
		readonly selected: boolean;
		readonly expanded: boolean;
		readonly matchedCount: number | null;
		readonly busy: boolean;
		readonly multiSelection?: TreeEngineState.MultiSelectionState;
	}
	/**
	 * Select all necessary UI state that requires to render a node
	 */
	export const nodeState = (
		{ id, type }: Identifier,
		nodePath: TreeEngineState.NodePath
	): Selector<NodeState, NodeStateInput> => {
		return (state) => nodeStateReselect(state, type, id, TreeEngineState.NodePath.toString(nodePath));
	};
	const nodeStateReselect = createSelector(
		[
			(state, nodeType: string, nodeId: string) => !!busyNodes()(state)?.[nodeType]?.[nodeId],
			(state, nodeType: string, nodeId: string) => matchedNodes()(state)[nodeType]?.[nodeId]?.matchCount ?? null,
			(state, _, __, pathToNode: string) => !!selectedNodes()(state)[pathToNode],
			(state, _, __, pathToNode: string) => !!expandedNodes()(state)[pathToNode],
			(state, _, __, pathToNode: string) => multiSelectionNodes()(state)[pathToNode]
		],
		(busy, matchedCount, selected, expanded, multiSelection) => ({
			selected,
			expanded,
			busy,
			matchedCount,
			multiSelection
		})
	);

	type DialogInput = Pick<UiState, "dialog">;
	export function dialogState(): Selector<TreeEngineState.Dialog, DialogInput> {
		return (state) => state.dialog;
	}

	type ColumnWidthsInput = Pick<UiState, "columnWidths">;
	export function columnWidths(): Selector<TreeEngineState.ColumnWidths | undefined, ColumnWidthsInput> {
		return (state) => state.columnWidths;
	}

	type ClipboardInput = Pick<UiState, "clipboard">;
	export function clipboard(): Selector<TreeEngineState.Clipboard | null, ClipboardInput> {
		return (state) => state.clipboard;
	}

	type PreloadChildNodesInput = Pick<UiState, "preloadChildNodes">;
	export function preloadChildNodes(): Selector<boolean, PreloadChildNodesInput> {
		return (state) => !!state.preloadChildNodes;
	}

	type DisabledInput = Pick<UiState, "disabled">;
	export function disabled(): Selector<boolean | undefined, DisabledInput> {
		return (state) => state.disabled;
	}

	type ReadonlyInput = Pick<UiState, "readonly">;
	export function readonly(): Selector<boolean | undefined, ReadonlyInput> {
		return (state) => state.readonly;
	}

	export interface TopLevelNode {
		nodePath: TreeEngineState.NodePath;
		includeChildren?: boolean;
	}

	export function topLevelMultiSelectedNodes(): Selector<TopLevelNode[], MultiSelectionNodesInput> {
		return (state) => topLevelMultiSelectedNodesReselect(state);
	}
	const topLevelMultiSelectedNodesReselect = createSelector(
		[multiSelectionNodes()],
		(multiSelectionNodes: TreeEngineState.MultiSelectionNodes) => {
			const copiedNodesMap: { [path: string]: boolean | undefined } = {};

			for (const path of Object.keys(multiSelectionNodes)) {
				const nodePath = TreeEngineState.NodePath.fromString(path);
				const commonParentNodePath = findHighestMultiSelectedParent(nodePath, multiSelectionNodes);
				if (!commonParentNodePath) {
					continue;
				}

				const includeChildren = !TreeEngineState.NodePath.areEqual(commonParentNodePath, nodePath);
				const commonParentPath = TreeEngineState.NodePath.toString(commonParentNodePath);

				copiedNodesMap[commonParentPath] = includeChildren ? true : (copiedNodesMap[commonParentPath] ?? false);
			}

			return Object.keys(copiedNodesMap).map((path) => {
				return { nodePath: TreeEngineState.NodePath.fromString(path), includeChildren: copiedNodesMap[path] };
			});
		}
	);

	function findHighestMultiSelectedParent(
		child: TreeEngineState.NodePath,
		multiSelectionNodes: TreeEngineState.MultiSelectionNodes
	): TreeEngineState.NodePath | undefined {
		const currentPath = TreeEngineState.NodePath.toString(child);
		if (multiSelectionNodes[currentPath] !== TreeEngineState.MultiSelectionState.SELECTED) {
			return undefined;
		}

		let iterator = [...child];

		while (iterator.length > 1) {
			const parent = iterator.slice(0, -1);
			const path = TreeEngineState.NodePath.toString(parent);
			if (multiSelectionNodes[path] === TreeEngineState.MultiSelectionState.PARTLY_SELECTED) {
				return iterator;
			} else {
				iterator = parent;
			}
		}

		const path = TreeEngineState.NodePath.toString(iterator);
		if (multiSelectionNodes[path] === TreeEngineState.MultiSelectionState.SELECTED) {
			return iterator;
		}

		return undefined;
	}

	export function orderedTopLevelMultiSelectedNodes(): Selector<TopLevelNode[], UiState & DataState> {
		return (state) => orderedTopLevelMultiSelectedNodesReselect(state);
	}
	const orderedTopLevelMultiSelectedNodesReselect = createSelector(
		[topLevelMultiSelectedNodes(), DataSelector.flattenNodes()],
		(topLevelNodes, flattenNodes) => {
			const result: TopLevelNode[] = [];
			for (const flattenNode of flattenNodes) {
				for (const topLevelNode of topLevelNodes) {
					if (TreeEngineState.NodePath.areEqual(flattenNode.nodePath, topLevelNode.nodePath)) {
						result.push(topLevelNode);
					}
				}
			}
			return result;
		}
	);

	type PageSizeMapInput = Pick<UiState, "pageSizeMap">;
	export function pageSizeMap(): Selector<TreeEngineState.PageSizeMap, PageSizeMapInput> {
		return (state) => state.pageSizeMap;
	}
}
