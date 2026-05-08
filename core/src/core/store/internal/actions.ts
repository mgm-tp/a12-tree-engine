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

import { actionCreatorFactory as actionCreatorFactory } from "typescript-fsa";

import { type Localizable } from "@com.mgmtp.a12.utils/utils-localization";
import { type TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";

import { type TreeModel, type RuntimeTreeModel } from "../../models/index.js";

import { type Identifier, TreeEngineState } from "./store.js";

/**
 * Actions which get triggered by an UI Event.
 */
export namespace Events {
	export const factory = actionCreatorFactory("EVENT");

	/**
	 *
	 */
	export const onNodeExpansionChanged = factory<NodeExpansionChangedPayload>("onNodeExpansionStateChanged");
	export interface NodeExpansionChangedPayload {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	}

	/**
	 *
	 */
	export const onNodeSelectionChanged = factory<NodeSelectionChangedPayload>("onNodeSelectionStateChanged");
	export interface NodeSelectionChangedPayload {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
		selected: boolean;
	}

	/**
	 *
	 */
	export const onInsertChildNodeRequest = factory.async<
		InsertChildNodeRequestPayload.Param,
		InsertChildNodeRequestPayload.Result
	>("onInsertChildNodeRequest");
	export namespace InsertChildNodeRequestPayload {
		export interface Param {
			insertPosition: TreeEngineState.InsertPosition;
			button: TreeModel.TreeNodeInsertActionButton;
			documentModelId?: string;
		}
		export interface Result {
			childRelationshipConfiguration: RuntimeTreeModel.ChildRelationshipConfiguration;
			documentModelId: string;
		}
	}

	/**
	 *
	 */
	export const onInsertSiblingNodeRequest = factory.async<
		InsertSiblingNodeRequestPayload.Param,
		InsertSiblingNodeRequestPayload.Result
	>("onInsertSiblingNodeRequest");
	export namespace InsertSiblingNodeRequestPayload {
		export interface Param {
			insertPosition: TreeEngineState.InsertPosition;
			button: TreeModel.TreeNodeInsertActionButton;
			documentModelId?: string;
		}
		export interface Result {
			childRelationshipConfiguration: RuntimeTreeModel.ChildRelationshipConfiguration;
			documentModelId: string;
		}
	}

	/**
	 *
	 */
	export const onInsertRootNodeRequest = factory.async<
		InsertRootNodeRequestPayload.Param,
		InsertRootNodeRequestPayload.Result
	>("onInsertRootNodeRequest");
	export namespace InsertRootNodeRequestPayload {
		export interface Param {
			button: TreeModel.ButtonType | TreeModel.TreeNodeInsertActionButton;
			documentModelId?: string;
		}
		export interface Result {
			documentModelId: string;
		}
	}

	/**
	 *
	 */
	export const onMakeRootNodeRequest = factory.async<MakeRootRequestPayload.Params, MakeRootRequestPayload.Result>(
		"onMakeRootRequest"
	);
	export namespace MakeRootRequestPayload {
		export interface Params {
			nodeIdentifier: Identifier;
			parentLinks: TreeEngineState.Link[];
		}
		export interface Result {}
	}

	/**
	 *
	 */
	export const onEventButtonClicked = factory<EventButtonClickedPayload>("onEventButtonClicked");
	export interface EventButtonClickedPayload {
		button: TreeModel.ButtonType;
	}
	export const onEventButtonClickedRequest = factory<EventButtonClickedRequestPayload>("onEventButtonClickedRequest");
	export interface EventButtonClickedRequestPayload extends EventButtonClickedPayload {
		confirmation: TreeModel.ConfirmationText;
	}

	/**
	 *
	 */
	export const onMultiSelectionButtonClicked = factory<MultiSelectionButtonClickedPayload>(
		"onMultiSelectionButtonClicked"
	);
	export interface MultiSelectionButtonClickedPayload {}

	export const onMultiSelectionEventButtonClicked = factory<MultiSelectionEventButtonClickedPayload>(
		"onMultiSelectionEventButtonClicked"
	);
	export interface MultiSelectionEventButtonClickedPayload {
		button: TreeModel.ButtonType;
	}

	export const onMultiSelectionEventButtonClickedRequest = factory<MultiSelectionEventButtonClickedRequestPayload>(
		"onMultiSelectionEventButtonClickedRequest"
	);
	export interface MultiSelectionEventButtonClickedRequestPayload extends MultiSelectionEventButtonClickedPayload {
		confirmation: TreeModel.ConfirmationText;
	}

	export const onOverallMultiSelectionClicked = factory<OverallMultiSelectionClickedPayload>(
		"onOverallMultiSelectionClicked"
	);
	export interface OverallMultiSelectionClickedPayload {}

	export const onNodeMultiSelectionClicked = factory<NodeMultiSelectionClickedPayload>("onNodeMultiSelectionClicked");
	export interface NodeMultiSelectionClickedPayload {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	}

	export const onNodeRangeSelectionClicked = factory<NodeRangeSelectionClickedPayload>("onNodeRangeSelectionClicked");
	export interface NodeRangeSelectionClickedPayload {
		nodePath: TreeEngineState.NodePath;
	}

	/**
	 *
	 */
	export const onNodeEventButtonClicked = factory<NodeEventButtonClickedPayload>("onNodeEventButtonClicked");
	export interface NodeEventButtonClickedPayload {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
		button: TreeModel.TreeNodeEventActionButton;
	}
	export const onNodeEventButtonClickedRequest = factory<NodeEventButtonClickedRequestPayload>(
		"onNodeEventButtonClickedRequest"
	);
	export interface NodeEventButtonClickedRequestPayload extends NodeEventButtonClickedPayload {
		confirmation: TreeModel.ConfirmationText;
	}

	/**
	 *
	 */
	export const onDialogClosed = factory<DialogClosedPayload>("onDialogClosed");
	export interface DialogClosedPayload {}

	/**
	 *
	 */
	export const onDialogConfirmed = factory<DialogConfirmedPayload>("onDialogConfirmed");
	export type DialogConfirmedPayload =
		| DialogConfirmedPayload.InsertChildNode
		| DialogConfirmedPayload.InsertSiblingNode
		| DialogConfirmedPayload.InsertRootNode
		| DialogConfirmedPayload.Confirmation;
	export namespace DialogConfirmedPayload {
		export interface Base {
			type: TreeEngineState.Dialog.Type;
		}

		export interface InsertChildNode extends Base {
			type: TreeEngineState.Dialog.Type.INSERT_CHILD_NODE;
			childRelationshipConfiguration: RuntimeTreeModel.ChildRelationshipConfiguration;
			documentModelId: string;
			insertPosition: TreeEngineState.InsertPosition;
			button: TreeModel.TreeNodeInsertActionButton;
		}
		export namespace InsertChildNode {
			export function isAssignableFrom(o: object): o is InsertChildNode {
				return (o as Base).type === TreeEngineState.Dialog.Type.INSERT_CHILD_NODE;
			}
		}

		export interface InsertSiblingNode extends Base {
			type: TreeEngineState.Dialog.Type.INSERT_SIBLING_NODE;
			childRelationshipConfiguration: RuntimeTreeModel.ChildRelationshipConfiguration;
			documentModelId: string;
			insertPosition: TreeEngineState.InsertPosition;
			button: TreeModel.TreeNodeInsertActionButton;
		}
		export namespace InsertSiblingNode {
			export function isAssignableFrom(o: object): o is InsertSiblingNode {
				return (o as Base).type === TreeEngineState.Dialog.Type.INSERT_SIBLING_NODE;
			}
		}

		export interface InsertRootNode extends Base {
			type: TreeEngineState.Dialog.Type.INSERT_ROOT_NODE;
			documentModelId: string;
		}
		export namespace InsertRootNode {
			export function isAssignableFrom(o: object): o is InsertRootNode {
				return (o as Base).type === TreeEngineState.Dialog.Type.INSERT_ROOT_NODE;
			}
		}

		// Remove property "message" from TreeEngineState.Dialog.Confirmation interface
		type ConfirmationDialogStateWithoutMessage = Omit<TreeEngineState.Dialog.Confirmation, "confirmation">;
		export interface Confirmation extends Base, ConfirmationDialogStateWithoutMessage {
			type: TreeEngineState.Dialog.Type.CONFIRMATION;
		}
		export namespace Confirmation {
			export function isAssignableFrom(o: object): o is Confirmation {
				return (o as Base).type === TreeEngineState.Dialog.Type.CONFIRMATION;
			}
		}
	}

	/**
	 *
	 */
	export const onDndStarted = factory<DndStartedPayload>("onDndStarted");
	export interface DndStartedPayload {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	}

	export const onDndDone = factory<DndDonePayload>("onDndDone");
	export interface DndDonePayload {
		draggedRow: {
			nodeIdentifier: Identifier;
			nodePath: TreeEngineState.NodePath;
		};
		droppedRow?: {
			nodeIdentifier: Identifier;
			nodePath: TreeEngineState.NodePath;
			position: TreeTableNodeDropPosition;
		};
	}

	export const onBulkDndDone = factory<BulkDndDonePayload>("onBulkDndDone");
	export interface BulkDndDonePayload {
		draggedRows: {
			nodeIdentifier: Identifier;
			nodePath: TreeEngineState.NodePath;
		}[];
		droppedRow?: {
			nodeIdentifier: Identifier;
			nodePath: TreeEngineState.NodePath;
			position: TreeTableNodeDropPosition;
		};
	}

	export const onDndHover = factory<DndHoverPayload>("onDndHover");
	export interface DndHoverPayload {
		draggingRow: {
			nodeIdentifier: Identifier;
			nodePath: TreeEngineState.NodePath;
		};
		hoveredRow: {
			nodeIdentifier: Identifier;
			nodePath: TreeEngineState.NodePath;
			position: TreeTableNodeDropPosition;
		};
		canDrop: boolean;
	}

	/**
	 *
	 */
	export const onRowClicked = factory<RowClickedPayload>("onRowClicked");
	export interface RowClickedPayload {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
		event: string;
	}

	/**
	 *
	 */
	export const onColumnWidthsChanged = factory<ColumnWidthsChangedPayload>("onColumnWidthsChanged");
	export interface ColumnWidthsChangedPayload {
		changedColumnWidths: TreeEngineState.ColumnWidths;
	}

	/**
	 * Action to scroll to a node by its node path
	 */
	export const scrollToNode = factory<ScrollToNodePayload>("scrollToNode");
	export interface ScrollToNodePayload {
		nodePath: TreeEngineState.NodePath;
		nodesFromNodePath?: Identifier[];
		/** @default true */
		autoFocus?: boolean;
	}

	/**
	 * Action to reload subtrees from provided source nodes
	 */
	export const reload = factory<ReloadPayload>("reload");
	export interface ReloadPayload {
		/**
		 * Identifiers of source nodes whose subtree to be reloaded
		 */
		sources: Identifier[];

		/**
		 * Define a limit on how many levels to be reloaded, by default, the engine will travel until reaching the leaf nodes
		 * @default Infinity
		 */
		level?: number;
	}

	/**
	 * Action to reload subtrees from provided source nodes
	 */
	export const reloadAll = factory<ReloadAllPayload>("reloadAll");
	export interface ReloadAllPayload {
		/**
		 * Define a limit on how many levels to be reloaded, by default, the engine will travel until reaching the leaf nodes
		 * @default Infinity
		 */
		level?: number;
	}

	/** @internal */
	export const onAddWarning = factory<AddWarningPayload>("onAddWarning");
	/** @internal */
	export interface AddWarningPayload {
		message: Localizable;
	}

	/**
	 *
	 */
	export const onLoadMore = factory<OnLoadMorePayload>("onLoadMore");
	export interface OnLoadMorePayload {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	}

	/**
	 *
	 */
	export const onLoadAll = factory<OnLoadAllPayload>("onLoadAll");
	export interface OnLoadAllPayload {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	}

	/**
	 *
	 */
	export const revalidateClipboard = factory<RevalidateClipboardPayload>("revalidateClipboard");
	export interface RevalidateClipboardPayload {
		removedNodes?: Identifier[];
		addedNodes?: RevalidateClipboardPayload.AddedNode[];
	}
	export namespace RevalidateClipboardPayload {
		export interface AddedNode {
			nodeIdentifier: Identifier;
			nodePath: TreeEngineState.NodePath;
		}
	}
}

/**
 * Actions which lead to a state change.
 */
export namespace Commands {
	export const factory = actionCreatorFactory("COMMAND");

	/**
	 *
	 */
	export const setSelectedNodes = factory<SetSelectedNodesPayload>("setSelectedNodes");
	export interface SetSelectedNodesPayload {
		nodes: TreeEngineState.SelectedNodes;
	}

	/**
	 *
	 */
	export const setExpandedMultiSelectionPanel = factory<SetExpandedMultiSelectionPanelPayload>(
		"setExpandedMultiSelectionPanel"
	);
	export interface SetExpandedMultiSelectionPanelPayload {
		expanded: boolean;
	}

	/**
	 *
	 */
	export const setMultiSelectionNodes = factory<SetMultiSelectionNodesPayload>("setMultiSelectionNodes");
	export interface SetMultiSelectionNodesPayload {
		multiSelectionNodes: TreeEngineState.MultiSelectionNodes;
	}

	/**
	 *
	 */
	export const setExpandedNodes = factory<SetExpandedNodesPayload>("setExpandedNodes");
	export interface SetExpandedNodesPayload {
		nodes: TreeEngineState.ExpandedNodes;
	}

	export const setScrollToNode = factory<SetScrollToNodePayload>("setScrollToNode");
	export type SetScrollToNodePayload = TreeEngineState.ScrollToNode | undefined;

	/**
	 *
	 *
	 */
	export const setDialogState = factory<SetDialogStatePayload>("setDialogState");
	export interface SetDialogStatePayload {
		state: TreeEngineState.Dialog | null;
	}

	/**
	 *
	 *
	 */
	export const setColumnWidths = factory<SetColumnWidthsPayload>("setColumnWidths");
	export interface SetColumnWidthsPayload {
		columnWidths: TreeEngineState.ColumnWidths;
	}

	/**
	 *
	 *
	 */
	export const setCopiedNodes = factory<SetCopiedNodesPayload>("setCopiedNodes");
	export interface SetCopiedNodesPayload {
		copiedNodes: TreeEngineState.Clipboard.Node[] | null;
	}

	/**
	 *
	 *
	 */
	export const setCutNodes = factory<SetCutNodesPayload>("setCutNodes");
	export interface SetCutNodesPayload {
		cutNodes: TreeEngineState.Clipboard.Node[] | null;
	}

	/**
	 *
	 *
	 */
	export const resetClipboard = factory<ResetClipboardPayload>("resetClipboard");
	export interface ResetClipboardPayload {}

	/**
	 *
	 *
	 */
	export const setPreloadChildNodes = factory<SetPreloadChildNodesPayload>("setPreloadChildNodes");
	export interface SetPreloadChildNodesPayload {
		preloadChildNodes: boolean;
	}

	/**
	 *
	 *
	 */
	export const setDisabled = factory<SetDisabledPayload>("setDisabled");
	export interface SetDisabledPayload {
		disabled: boolean | undefined;
	}

	/**
	 *
	 *
	 */
	export const setReadonly = factory<SetReadonlyPayload>("setReadonly");
	export interface SetReadonlyPayload {
		readonly: boolean | undefined;
	}
}
