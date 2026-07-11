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

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import type { Relationship, ModelGraph } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";

import { TreeEngineError } from "../error/tree-engine-error.js";
import type { RuntimeTreeModel, TreeModel } from "../models/tree-model.js";

import type { Events } from "./actions.js";

export interface TreeEngineState extends DataState, UiState, ModelsState {}

export interface ModelsState {
	/**
	 * Model files
	 */
	readonly models: Models;
}

export interface DataState {
	/**
	 * Root of the tree
	 */
	readonly root: TreeEngineState.Root;

	/**
	 * Tree-structured document data
	 */
	readonly data: TreeEngineState.Data;
}

/**
 * UI State
 */
export interface UiState {
	readonly pageSizeMap: TreeEngineState.PageSizeMap;

	readonly selectedNodes: TreeEngineState.SelectedNodes;

	readonly expandedNodes: TreeEngineState.ExpandedNodes;

	readonly query: string;

	readonly matchedNodes: TreeEngineState.MatchedNodes;

	readonly busyNodes?: TreeEngineState.BusyNodes;

	readonly dialog: TreeEngineState.Dialog;

	readonly columnWidths?: TreeEngineState.ColumnWidths;

	readonly expandedMultiSelectionPanel: boolean;

	readonly multiSelectionNodes: TreeEngineState.MultiSelectionNodes;

	readonly multiSelectionActions: Action<
		| Events.NodeMultiSelectionClickedPayload
		| Events.NodeRangeSelectionClickedPayload
		| Events.OverallMultiSelectionClickedPayload
	>[];

	readonly clipboard: TreeEngineState.Clipboard | null;

	readonly scrollToNode?: TreeEngineState.ScrollToNode;

	readonly busy?: boolean;

	readonly preloadChildNodes?: boolean;

	readonly disabled?: boolean;
	readonly readonly?: boolean;

	readonly initialExpansion?: TreeModel.ExpansionStrategy.LevelByLevel.InitialExpansion | false;
}

export namespace TreeEngineState {
	/**
	 *
	 */
	export interface Root {
		/** Only available when the root node is a document */
		readonly identifier?: Identifier;
		readonly children: Identifier[];
		readonly fullSize?: number;
	}

	/**
	 *
	 */
	export interface Data {
		readonly [type: string]: NodeMap<Entity> | undefined;
	}

	export interface Entity {
		readonly identifier: Identifier;
	}

	/**
	 *
	 */
	export interface Link extends Entity {
		readonly linkRef: LinkRef;
		readonly linkDocument?: object;
	}
	export type LinkRef = Omit<Relationship.LinkRefResponse, "id"> & { id: string };

	export namespace Link {
		export function isAssignableFrom(o: object): o is Link {
			return "linkRef" in o;
		}
	}

	/**
	 *
	 */
	export interface Node extends Entity {
		readonly document: object;
		readonly children: Identifier[];
	}
	export namespace Node {
		export function isAssignableFrom(o: object): o is Node {
			return "document" in o && "children" in o;
		}
	}

	/**
	 * Contains pagination related meta information, mostly used when pagination feature is enabled
	 */
	export interface Paging {
		/**
		 * @internal
		 * The size where the child of certain relationship is expected to be loaded.
		 */
		expectedSize?: number;
		/**
		 * The total amount of children of the current node
		 */
		fullSize?: number;
	}

	/**
	 * Include a map of paging size of each node by relationship
	 * E.g.:
	 * 	* pageSizeMap["DomainTeam"]["DomainTeam/1"]["TeamTeam"]
	 * 	* pageSizeMap["DomainTeam"]["DomainTeam/2"]["TeamPerson"]
	 */
	export type PageSizeMap = NodeMap<NodeMap<NodeMap<Paging>>>;

	/**
	 * Util functions that allow you to quickly access the pagination meta from {@link Paging} from {@link PageSizeMap}
	 */
	export namespace PageSizeMap {
		export function getFullSize(pageSizeMap: PageSizeMap, identifier: Identifier, relationshipName: string) {
			return pageSizeMap[identifier.type]?.[identifier.id]?.[relationshipName]?.fullSize ?? 0;
		}

		export function setSize(
			pageSizeMap: PageSizeMap,
			identifier: Identifier,
			relationshipName: string,
			paging: Paging,
			mutationType: MutationType = MutationType.IMMUTABLE
		): PageSizeMap {
			const { fullSize, expectedSize } = paging;
			if (mutationType === MutationType.IMMUTABLE) {
				return {
					...pageSizeMap,
					[identifier.type]: {
						...pageSizeMap[identifier.type],
						[identifier.id]: {
							...pageSizeMap[identifier.type]?.[identifier.id],
							[relationshipName]: {
								...pageSizeMap[identifier.type]?.[identifier.id]?.[relationshipName],
								fullSize,
								expectedSize
							}
						}
					}
				};
			}

			pageSizeMap[identifier.type] ??= {};

			const pageSizeMapByType = pageSizeMap[identifier.type];
			if (!pageSizeMapByType) {
				throw TreeEngineError.NotFoundError("TreeEngine.PageSizeMap");
			}
			pageSizeMapByType[identifier.id] ??= {};

			const pageSizeMapById = pageSizeMapByType[identifier.id];
			if (!pageSizeMapById) {
				throw TreeEngineError.NotFoundError("TreeEngine.PageSizeMap");
			}

			pageSizeMapById[relationshipName] = { fullSize, expectedSize };

			return pageSizeMap;
		}

		export enum MutationType {
			MUTABLE,
			IMMUTABLE
		}
	}

	/**
	 *
	 */
	export interface ExpandedNodes {
		readonly [type: string]: Record<string, unknown>;
	}

	/**
	 *
	 */
	export interface SelectedNodes {
		readonly [type: string]: Record<string, unknown>;
	}

	export interface MultiSelectionNodes {
		readonly [nodePath: string]: MultiSelectionState | undefined;
	}

	export enum MultiSelectionState {
		DESELECTED = "deselected",
		PARTLY_SELECTED = "partlySelected",
		SELECTED = "selected"
	}

	export interface TopLevelMultiSelectedNode {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
		includeChildren?: boolean;
		children?: SubLevelMultiSelectedNode[];
	}

	export interface SubLevelMultiSelectedNode {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
		children?: SubLevelMultiSelectedNode[];
	}

	/**
	 *
	 */
	export interface MatchedNodes {
		readonly [type: string]: NodeMap<MatchedNode>;
	}
	/**
	 *
	 */
	export interface MatchedNode {
		matchCount: number;
	}

	/**
	 *
	 */
	export interface BusyNodes {
		readonly [type: string]: NodeMap<BusyNode>;
	}
	/**
	 *
	 */
	export interface BusyNode {}

	/**
	 *
	 */
	export interface ColumnWidths {
		readonly [columnId: string]: TreeModel.Width | undefined;
	}

	/**
	 *
	 */
	export interface Clipboard {
		action: Clipboard.Action;
		nodes: Clipboard.Node[];
	}
	export namespace Clipboard {
		export enum Action {
			COPY = "copy",
			CUT = "cut"
		}

		export type Node = TopLevelMultiSelectedNode;
	}

	/**
	 *
	 */
	export interface ScrollToNode {
		nodePath: NodePath;
		nodesFromNodePath?: Identifier[];
		/** @default true */
		autoFocus?: boolean;
	}

	/**
	 *
	 */
	export type Dialog =
		| Dialog.Confirmation
		| Dialog.InsertChildNode
		| Dialog.InsertSiblingNode
		| Dialog.InsertRootNode
		| unknown
		| null;

	export namespace Dialog {
		export enum Type {
			CONFIRMATION = "confirmation",
			INSERT_ROOT_NODE = "insertRootNode",
			INSERT_CHILD_NODE = "insertChildNode",
			INSERT_SIBLING_NODE = "insertSiblingNode"
		}

		export interface BaseDialog {
			readonly type: Type;
		}
		export namespace BaseDialog {
			export function isAssignableFrom(o: unknown): o is BaseDialog {
				return typeof o === "object";
			}
		}

		export interface Option {
			readonly childRelationshipConfiguration: RuntimeTreeModel.ChildRelationshipConfiguration;
			readonly documentModelId: string;
		}

		export type InsertChildNode = InsertChildNode.State;
		export namespace InsertChildNode {
			export interface State extends BaseDialog {
				readonly type: Type.INSERT_CHILD_NODE;
				readonly options: Option[];
				readonly insertPosition: InsertPosition;
				readonly message?: LocalizedModelText;
				readonly button: TreeModel.TreeNodeInsertActionButton;
			}
			export function isAssignableFrom(o: unknown): o is InsertChildNode {
				return BaseDialog.isAssignableFrom(o) && o.type === Type.INSERT_CHILD_NODE;
			}
		}

		export type InsertSiblingNode = InsertSiblingNode.State;
		export namespace InsertSiblingNode {
			export interface State extends BaseDialog {
				readonly type: Type.INSERT_SIBLING_NODE;
				readonly insertPosition: InsertPosition;
				readonly button: TreeModel.TreeNodeInsertActionButton;
				readonly options: Option[];
				readonly message?: LocalizedModelText;
			}
			export function isAssignableFrom(o: unknown): o is InsertSiblingNode {
				return BaseDialog.isAssignableFrom(o) && o.type === Type.INSERT_SIBLING_NODE;
			}
		}

		export type InsertRootNode = InsertRootNode.State;
		export namespace InsertRootNode {
			export interface State extends BaseDialog {
				readonly type: Type.INSERT_ROOT_NODE;
				readonly button: TreeModel.ButtonType | TreeModel.TreeNodeInsertActionButton;
			}

			export function isAssignableFrom(o: unknown): o is InsertRootNode {
				return BaseDialog.isAssignableFrom(o) && o.type === Type.INSERT_ROOT_NODE;
			}
		}

		export type Confirmation =
			| Confirmation.EventButton
			| Confirmation.NodeEventButton
			| Confirmation.MakeRootNode
			| Confirmation.MultiSelectionEventButton
			| Confirmation.CollapseMultiSelectionPanel;

		export namespace Confirmation {
			export enum ConfirmationType {
				EVENT_BUTTON = "eventButton",
				NODE_EVENT_BUTTON = "nodeEventButton",
				MAKE_ROOT_NODE = "makeRootNode",
				COLLAPSE_MULTI_SELECTION_PANEL = "collapseMultiSelectionPanel",
				MULTI_SELECTION_EVENT_BUTTON = "multiSelectionEventButton"
			}

			interface BaseState extends BaseDialog {
				readonly type: Type.CONFIRMATION;
				readonly confirmationType: ConfirmationType;
				readonly confirmation?: TreeModel.ConfirmationText;
			}
			export function isAssignableFrom(o: unknown): o is Confirmation {
				return BaseDialog.isAssignableFrom(o) && o.type === Type.CONFIRMATION;
			}

			export interface EventButton extends BaseState {
				readonly confirmationType: ConfirmationType.EVENT_BUTTON;
				readonly button: TreeModel.ButtonType;
			}

			export namespace EventButton {
				export function isAssignableFrom(o: unknown): o is EventButton {
					return Confirmation.isAssignableFrom(o) && o.confirmationType === ConfirmationType.EVENT_BUTTON;
				}
			}

			export interface MultiSelectionEventButton extends BaseState {
				readonly confirmationType: ConfirmationType.MULTI_SELECTION_EVENT_BUTTON;
				readonly button: TreeModel.ButtonType;
			}

			export namespace MultiSelectionEventButton {
				export function isAssignableFrom(o: unknown): o is MultiSelectionEventButton {
					return (
						Confirmation.isAssignableFrom(o) && o.confirmationType === ConfirmationType.MULTI_SELECTION_EVENT_BUTTON
					);
				}
			}

			export interface CollapseMultiSelectionPanel extends BaseState {
				readonly confirmationType: ConfirmationType.COLLAPSE_MULTI_SELECTION_PANEL;
			}

			export namespace CollapseMultiSelectionPanel {
				export function isAssignableFrom(o: unknown): o is CollapseMultiSelectionPanel {
					return (
						Confirmation.isAssignableFrom(o) && o.confirmationType === ConfirmationType.COLLAPSE_MULTI_SELECTION_PANEL
					);
				}
			}

			export interface NodeEventButton extends BaseState {
				readonly confirmationType: ConfirmationType.NODE_EVENT_BUTTON;
				readonly nodeIdentifier: Identifier;
				readonly nodePath: TreeEngineState.NodePath;
				readonly button: TreeModel.TreeNodeEventActionButton;
			}

			export namespace NodeEventButton {
				export function isAssignableFrom(o: unknown): o is NodeEventButton {
					return Confirmation.isAssignableFrom(o) && o.confirmationType === ConfirmationType.NODE_EVENT_BUTTON;
				}
			}

			export interface MakeRootNode extends BaseState {
				readonly confirmationType: ConfirmationType.MAKE_ROOT_NODE;
				readonly nodeIdentifier: Identifier;
				readonly nodeDisplayName: string;
				readonly parentLinks: TreeEngineState.Link[];
			}

			export namespace MakeRootNode {
				export function isAssignableFrom(o: unknown): o is MakeRootNode {
					return Confirmation.isAssignableFrom(o) && o.confirmationType === ConfirmationType.MAKE_ROOT_NODE;
				}
			}
		}
	}

	/**
	 *
	 */
	export interface InsertPosition {
		readonly target: {
			nodeIdentifier: Identifier;
			nodePath: NodePath;
		};
		readonly position: TreeModel.InsertPosition;
	}

	/**
	 *
	 */
	export interface NodeMap<T> {
		[id: string]: T | undefined;
	}

	/**
	 *
	 */
	export type NodePath = Identifier[];

	export namespace NodePath {
		const SEPARATOR = "=>";
		export function areEqual(p1: NodePath, p2: NodePath): boolean {
			return Identifier.areListEqual(p1, p2);
		}

		export function fromString(str: string): NodePath {
			return str.length > 0
				? str.split(SEPARATOR).map((segment) => {
						const openBracketIdx = segment.indexOf("[");
						const type = segment.substring(0, openBracketIdx);
						const id = segment.substring(openBracketIdx + 1, segment.length - 1);
						return { id, type };
					})
				: [];
		}

		export function toString(path: NodePath): string {
			return path.map(Identifier.toString).join(SEPARATOR);
		}

		export function includes(parent: NodePath, child: NodePath): boolean {
			if (parent.length > child.length) {
				return false;
			}
			for (let index = 0; index < parent.length; index++) {
				if (!Identifier.areEqual(parent[index], child[index])) {
					return false;
				}
			}
			return true;
		}

		export function toLinkIdentifier(path: NodePath): Identifier | undefined {
			if (path.length === 0) {
				throw TreeEngineError.TypeError("TreeEngine.NodePath", {
					expect: "At least ONE element",
					actual: path
				});
			}
			if (path.length === 1) {
				return undefined;
			}
			return path[path.length - 1];
		}

		export function getParentNodePath(path: NodePath): NodePath | undefined {
			if (path.length <= 1) {
				return undefined;
			}
			return path.slice(0, -1);
		}
	}
}

/**
 *
 */
export interface Identifier {
	readonly id: string;
	readonly type: string;
}

/**
 *
 */
export namespace Identifier {
	/**
	 * @param instance is usually being under this format "<MODEL_NAME>/<ID>", e.g.: "DomainBusiness/1" or "DomainCategory/232"
	 * The instance should follow general docRef convention which is widely defined and used in A12's ecosystem
	 */
	export function from(instance: string): Identifier {
		const result = instance.split("/");
		if (result.length <= 1) {
			throw TreeEngineError.TypeError("TreeEngine.Identifier", {
				expect: "Valid identifier string",
				actual: instance
			});
		}
		const [documentModel] = result;
		return { id: instance, type: documentModel };
	}

	/** @internal */
	export function toString(identifier: Identifier): string {
		return `${identifier.type}[${identifier.id}]`;
	}

	export function areEqual(identifier1: Identifier, identifier2: Identifier) {
		return identifier1.type === identifier2.type && identifier1.id === identifier2.id;
	}

	export function areListEqual(identifiers1: Identifier[], identifiers2: Identifier[]) {
		return (
			identifiers1.length === identifiers2.length &&
			identifiers1.every((childA, index) => Identifier.areEqual(childA, identifiers2[index]))
		);
	}
}

export interface Models {
	readonly documentModels: DocumentModel[];
	readonly uiModel: RuntimeTreeModel;
	readonly modelGraph: ModelGraph;
}
