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

import { type Dispatch } from "redux";

import { type TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";
import { type Localizable } from "@com.mgmtp.a12.utils/utils-localization";

import { type RuntimeTreeModel, TreeModel } from "../../../models/index.js";
import { Commands, Events, type Identifier, type TreeEngineState } from "../../../store/index.js";

import { type FlattenNodeRow, RootNodeRow } from "../components/tree-engine/sub-components/types.js";

export interface EventHandlersDispatchMap {
	onNodeExpansionChanged(params: { nodeIdentifier: Identifier; nodePath: TreeEngineState.NodePath }): void;
	onNodeSelectionChanged(params: { nodeIdentifier: Identifier; nodePath: TreeEngineState.NodePath }): void;
	onEventButtonClicked(params: { button: TreeModel.ButtonType }): void;
	onNodeEventButtonClicked(params: {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
		button: TreeModel.TreeNodeEventActionButton;
	}): void;
	onInsertChildNodeButtonClicked(params: {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
		button: TreeModel.TreeNodeInsertActionButton;
	}): void;
	onDialogClosed(): void;
	onDialogConfirmed(params: { payload: Events.DialogConfirmedPayload }): void;
	onColumnWidthsChanged(params: { changedColumnWidths: TreeEngineState.ColumnWidths }): void;
	onDndStarted(params: { draggingNodeRow: FlattenNodeRow }): void;
	onDndDone(params: {
		draggedNodeRow: FlattenNodeRow;
		droppedNodeRow?: FlattenNodeRow;
		position?: TreeTableNodeDropPosition;
	}): void;
	onBulkDndDone(params: {
		draggedNodeRows: FlattenNodeRow[];
		droppedNodeRow?: FlattenNodeRow;
		position?: TreeTableNodeDropPosition;
	}): void;
	onDndHover(params: {
		hoveredNodeRow: FlattenNodeRow;
		draggingNodeRow: FlattenNodeRow;
		canDrop: boolean;
		position: TreeTableNodeDropPosition;
	}): void;
	onRowClicked(params: {
		nodeModel: RuntimeTreeModel.TreeNode;
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	}): void;
	onMultiSelectionButtonClicked(): void;
	onMultiSelectionEventButtonClicked(params: { button: TreeModel.ButtonType }): void;
	onOverallMultiSelectionClicked(): void;
	onNodeMultiSelectionClicked(params: { nodeIdentifier: Identifier; nodePath: TreeEngineState.NodePath }): void;
	onNodeRangeSelectionClicked(params: { nodePath: TreeEngineState.NodePath }): void;
	onScrollToNodeDone(scrollToNode: TreeEngineState.ScrollToNode): void;
	onLoadMore(params: { nodeIdentifier: Identifier; nodePath: TreeEngineState.NodePath }): void;
	onLoadAll(params: { nodeIdentifier: Identifier; nodePath: TreeEngineState.NodePath }): void;
	/** @internal */
	onAddWarning?(params: { message: Localizable }): void;
}

export function defaultMapDispatchToEventHandlers(dispatch: Dispatch): EventHandlersDispatchMap {
	const onEventButtonClicked: EventHandlersDispatchMap["onEventButtonClicked"] = ({ button }) => {
		const { confirmation } = button;
		if (confirmation) {
			dispatch(Events.onEventButtonClickedRequest({ confirmation, button }));
		} else {
			dispatch(Events.onEventButtonClicked({ button }));
		}
	};

	return {
		onNodeExpansionChanged({ nodeIdentifier, nodePath }) {
			dispatch(Events.onNodeExpansionChanged({ nodeIdentifier, nodePath }));
		},
		onNodeSelectionChanged({ nodeIdentifier, nodePath }) {
			dispatch(Events.onNodeSelectionChanged({ nodeIdentifier, nodePath, selected: true }));
		},
		onEventButtonClicked,
		onNodeEventButtonClicked({ nodeIdentifier, nodePath, button }) {
			if (nodeIdentifier.id === "ROOT") {
				onEventButtonClicked({ button: { ...button, id: button.event } });
				return;
			}

			const { confirmation } = button;
			if (confirmation) {
				dispatch(Events.onNodeEventButtonClickedRequest({ nodeIdentifier, nodePath, confirmation, button }));
			} else {
				dispatch(Events.onNodeEventButtonClicked({ nodeIdentifier, nodePath, button }));
			}
		},
		onInsertChildNodeButtonClicked({ nodeIdentifier, nodePath, button }) {
			const basePayload = {
				documentModelId: button.documentModelRef,
				button
			};

			if (nodeIdentifier.id === RootNodeRow.create().data.nodeIdentifier.id) {
				dispatch(Events.onInsertRootNodeRequest.started(basePayload));
			} else {
				switch (button.position) {
					case TreeModel.InsertPosition.ABOVE:
					case TreeModel.InsertPosition.BELOW: {
						dispatch(
							Events.onInsertSiblingNodeRequest.started({
								...basePayload,
								insertPosition: {
									target: { nodeIdentifier, nodePath },
									position: button.position
								}
							})
						);
						break;
					}
					default: {
						dispatch(
							Events.onInsertChildNodeRequest.started({
								...basePayload,
								insertPosition: {
									target: { nodeIdentifier, nodePath },
									position: TreeModel.InsertPosition.AS_CHILD
								}
							})
						);
						break;
					}
				}
			}
		},
		onDialogClosed() {
			dispatch(Events.onDialogClosed({}));
		},
		onDialogConfirmed({ payload }) {
			dispatch(Events.onDialogConfirmed(payload));
		},
		onColumnWidthsChanged({ changedColumnWidths }) {
			dispatch(Events.onColumnWidthsChanged({ changedColumnWidths }));
		},
		onDndStarted({ draggingNodeRow }) {
			dispatch(
				Events.onDndStarted({
					nodeIdentifier: draggingNodeRow.data.nodeIdentifier,
					nodePath: draggingNodeRow.data.nodePath
				})
			);
		},
		onDndDone({ draggedNodeRow, droppedNodeRow, position }) {
			dispatch(
				Events.onDndDone({
					draggedRow: draggedNodeRow.data,
					droppedRow: droppedNodeRow && position && { ...droppedNodeRow.data, position }
				})
			);
		},
		onBulkDndDone({ draggedNodeRows, droppedNodeRow, position }) {
			dispatch(
				Events.onBulkDndDone({
					draggedRows: draggedNodeRows.map(({ data }) => data),
					droppedRow: droppedNodeRow && position && { ...droppedNodeRow.data, position }
				})
			);
		},
		onDndHover({ hoveredNodeRow, draggingNodeRow, canDrop, position }): void {
			dispatch(
				Events.onDndHover({
					draggingRow: draggingNodeRow.data,
					hoveredRow: { ...hoveredNodeRow.data, position },
					canDrop
				})
			);
		},
		onRowClicked({ nodeModel, nodeIdentifier, nodePath }) {
			if (nodeModel.defaultRowAction) {
				const { event } = nodeModel.defaultRowAction;
				dispatch(Events.onRowClicked({ nodeIdentifier, nodePath, event }));
			} else {
				dispatch(Events.onNodeSelectionChanged({ nodeIdentifier, nodePath, selected: true }));
			}
		},
		onMultiSelectionButtonClicked() {
			dispatch(Events.onMultiSelectionButtonClicked({}));
		},
		onMultiSelectionEventButtonClicked({ button }) {
			const { confirmation } = button;
			if (confirmation) {
				dispatch(Events.onMultiSelectionEventButtonClickedRequest({ confirmation, button }));
			} else {
				dispatch(Events.onMultiSelectionEventButtonClicked({ button }));
			}
		},
		onOverallMultiSelectionClicked() {
			dispatch(Events.onOverallMultiSelectionClicked({}));
		},
		onNodeMultiSelectionClicked({ nodeIdentifier, nodePath }) {
			dispatch(Events.onNodeMultiSelectionClicked({ nodeIdentifier, nodePath }));
		},
		onNodeRangeSelectionClicked({ nodePath }) {
			dispatch(Events.onNodeRangeSelectionClicked({ nodePath }));
		},
		onScrollToNodeDone() {
			dispatch(Commands.setScrollToNode(undefined));
		},
		onLoadMore(params) {
			dispatch(Events.onLoadMore(params));
		},
		onLoadAll(params) {
			dispatch(Events.onLoadAll(params));
		},
		onAddWarning(params) {
			dispatch(Events.onAddWarning(params));
		}
	};
}
