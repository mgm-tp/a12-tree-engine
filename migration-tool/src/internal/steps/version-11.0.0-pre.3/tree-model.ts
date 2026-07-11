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

import type { LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";
import type {
	Annotation as BaseAnnotation,
	Header as BaseHeader,
	ModelReference as BaseModelReference
} from "@com.mgmtp.a12.base/base-model-api";

export interface TreeModel {
	readonly header: TreeModel.Header;
	readonly content: TreeModel.Content;
}

export namespace TreeModel {
	export interface Content {
		readonly subHeaderBox: TreeModel.SubHeaderType;
		readonly footerBox: TreeModel.FooterType;
		readonly configuration: TreeModel.Configuration;
		readonly columns: TreeModel.Column[];
		readonly nodes: TreeModel.TreeNode[];
		readonly styles?: Styles;
	}

	export interface Header extends BaseHeader {
		readonly modelType: "tree";
		readonly modelReferences: ModelReference[];
	}

	export interface SubHeaderType {
		readonly leftSlot: ReadonlyArray<Element>;
		readonly rightSlot: ReadonlyArray<Element>;
	}

	export interface FooterType {
		readonly leftSlot: ReadonlyArray<ButtonElement>;
		readonly rightSlot: ReadonlyArray<ButtonElement>;
	}

	export type Element = ButtonElement | MultiSelectionElement | ExpandAllPopUpElement;

	export interface BaseElement {
		readonly type: ElementType;
	}
	namespace BaseElement {
		export function isAssignableFrom(element: unknown): element is BaseElement {
			return typeof element === "object" && element !== null && "type" in element;
		}
	}

	export interface ButtonElement extends BaseElement, ButtonType {
		readonly type: ElementType.BUTTON;
	}
	export namespace ButtonElement {
		export function isAssignableFrom(element: unknown): element is ButtonElement {
			return BaseElement.isAssignableFrom(element) && element.type === ElementType.BUTTON;
		}
	}

	export interface MultiSelectionElement extends BaseElement {
		readonly type: ElementType.MULTI_SELECTION;
	}
	export namespace MultiSelectionElement {
		export function isAssignableFrom(element: unknown): element is MultiSelectionElement {
			return BaseElement.isAssignableFrom(element) && element.type === ElementType.MULTI_SELECTION;
		}
	}

	export interface ExpandAllPopUpElement extends BaseElement {
		readonly type: ElementType.EXPAND_ALL_POPUP;
	}
	export namespace ExpandAllPopUpElement {
		export function isAssignableFrom(element: unknown): element is ExpandAllPopUpElement {
			return BaseElement.isAssignableFrom(element) && element.type === ElementType.EXPAND_ALL_POPUP;
		}
	}

	export enum ElementType {
		BUTTON = "button",
		MULTI_SELECTION = "multi_selection",
		EXPAND_ALL_POPUP = "expand_all_popup"
	}

	export interface Column {
		readonly id: string;
		readonly name: string;
		readonly label: LocalizedModelText;
		readonly icon?: Icon;
		readonly labelHidden?: true;

		readonly pinDirection?: PinDirection;
		readonly width: Width;
		readonly fixedWidth: boolean;
		readonly alignment?: ColumnAlignment;
		readonly styles?: ColumnStyles;
	}

	export interface TreeNode {
		readonly id: string;
		/**
		 * A reference to a Document Model by name
		 */
		readonly documentModelRef: string;
		/**
		 * For binding the value of a document's field to present in the table's column
		 */
		readonly columns: TreeNodeColumn[];
		/**
		 * A list of relationship binding configuration that is used for fetching & updating data of the node
		 */
		readonly childRelationshipConfigurations: ChildRelationshipConfiguration[];
		/**
		 * Icon of a node, this icon is only displayed on the hierarchical column
		 */
		readonly icon?: Icon;
		/**
		 * List of available actions for a node type
		 */
		readonly actions: TreeNodeActionButton[];

		/**
		 * Context menu for a node type
		 */
		readonly contextMenu?: TreeNodeContextMenu;

		/**
		 * Row activation behavior on row click
		 */
		readonly rowActivation?: RowActivation;
		/**
		 * Title for interactive row
		 */
		readonly rowTitle?: LocalizedModelText;
		/**
		 * Configuration
		 */
		readonly configuration: TreeNodeConfiguration;

		/**
		 * Css classes to put into the table row
		 */
		readonly styles?: Styles;
	}

	export interface TreeNodeConfiguration {
		readonly dnd: boolean;
		readonly inherit?: {
			readonly icon?: true;
			readonly styles?: true;
			readonly columns?: true;
			readonly actions?: true;
			readonly contextMenu?: true;
			readonly rowActivation?: true;
			readonly rowTitle?: true;
			readonly childRelationshipConfigurations?: true;
		};
	}

	/**
	 * A map that is used to refer the value of a document's field to a Column in the table
	 */
	export interface TreeNodeColumn {
		/**
		 * A reference to a predefined {@link Column}'s ID in {@link TreeModel}
		 */
		readonly columnRef: string;
		/**
		 * A reference to a DocumentModel.Field's ID
		 */
		readonly elementRef: string;
		/**
		 * Column configuration by node
		 */
		readonly configuration?: TreeNodeColumnConfiguration;
	}

	export interface TreeNodeColumnConfiguration {
		readonly attachmentDisplayMode?: AttachmentDisplayMode;
		readonly multiSelectDisplayMode?: MultiSelectDisplayMode;
	}

	export enum AttachmentDisplayMode {
		PREVIEW = "preview",
		ICON = "icon",
		FILE_NAME = "file_name",
		ICON_WITH_FILE_NAME = "icon_with_file_name"
	}

	export interface ChildRelationshipConfiguration {
		readonly id: string;

		readonly relationshipModelRef: string;

		// tag::TreeModelParentRoleSpecification[]
		/**
		 * The parent role of the relationship model's entity characteristics
		 * For example:
		 * 	"1 Category can have many Products"
		 * 	Therefore, we want to mark "Category" as the parent and "Product" as the child.
		 * 	In this case, {@link parentRole} should point to the category's role.
		 */
		// end::TreeModelParentRoleSpecification[]
		readonly parentRole: string;

		readonly columns?: TreeNodeColumn[];
	}

	export interface ConfirmationText {
		readonly title?: LocalizedModelText;
		readonly message?: LocalizedModelText;
	}

	export interface BaseTreeNodeEventActionButton {
		readonly type: "event";
		readonly event: string;
		readonly confirmation?: ConfirmationText;
	}

	export interface TreeNodeEventActionButton extends BaseButton, BaseTreeNodeEventActionButton {}

	export interface TreeNodeEventActionContextMenu extends Triggerable, BaseTreeNodeEventActionButton {}

	export namespace TreeNodeEventActionButton {
		export function isAssignableFrom(o: object): o is TreeNodeEventActionButton {
			return (o as TreeNodeEventActionButton).type === "event";
		}
	}

	export enum InsertPosition {
		AS_CHILD = "as_child",
		ABOVE = "above",
		BELOW = "below"
	}

	export interface BaseTreeNodeInsertActionButton {
		readonly type: "insert";
		readonly position?: InsertPosition;
		readonly documentModelRef?: string;
		readonly useGlobalIcon?: boolean;
		readonly useLabelFromDocumentModel?: boolean;
		readonly useTitleFromDocumentModel?: boolean;
	}

	export interface TreeNodeInsertActionButton extends BaseButton, BaseTreeNodeInsertActionButton {}

	export interface TreeNodeInsertActionContextMenu extends Triggerable, BaseTreeNodeInsertActionButton {}

	export namespace TreeNodeInsertActionButton {
		export function isAssignableFrom(o: object): o is TreeNodeInsertActionButton {
			return (o as TreeNodeInsertActionButton).type === "insert";
		}

		export function isInsertSiblingAction(o: object): o is TreeNodeInsertActionButton {
			return isAssignableFrom(o) && (o.position === InsertPosition.BELOW || o.position === InsertPosition.ABOVE);
		}
	}

	export type TreeNodeActionButton = TreeNodeEventActionButton | TreeNodeInsertActionButton;
	export type TreeNodeContextActionButton = TreeNodeEventActionContextMenu | TreeNodeInsertActionContextMenu;

	export interface TreeNodeContextMenu {
		readonly groups: (TreeNodeActionGroup | TreeNodeAddGroup)[];
	}

	export interface TreeNodeActionGroup {
		readonly name: string;
		readonly title?: LocalizedModelText;
		readonly actions: TreeNodeContextActionButton[];
	}

	export interface TreeNodeAddGroup extends TreeNodeActionGroup {
		readonly type: "add";
		readonly actions: TreeNodeInsertActionContextMenu[];
	}

	export namespace TreeNodeAddGroup {
		export function isAssignableFrom(o: object): o is TreeNodeAddGroup {
			return (o as TreeNodeAddGroup).type === "add";
		}
	}

	export const BUILT_IN_ROW_EVENT_NAMES = [
		"event_add_link",
		"event_delete_node",
		"event_delete_link",
		"event_expand_sub_tree",
		"event_collapse_sub_tree",
		"event_copy_node",
		"event_copy_node_and_children",
		"event_cut_node",
		"event_paste",
		"event_paste_above",
		"event_paste_below",
		"event_open_node",
		"event_toggle_expansion"
	] as const;

	export interface EventRowActivation {
		readonly type: "event";
		readonly event: (typeof BUILT_IN_ROW_EVENT_NAMES)[number] | (string & {});
	}
	export namespace EventRowActivation {
		export function isAssignableFrom(activation: object): activation is EventRowActivation {
			return "type" in activation && (activation as EventRowActivation).type === "event";
		}
	}

	export interface InsertRowActivation {
		readonly type: "insert";
		readonly position?: InsertPosition;
		readonly documentModelRef?: string;
	}
	export namespace InsertRowActivation {
		export function isAssignableFrom(activation: object): activation is InsertRowActivation {
			return "type" in activation && (activation as InsertRowActivation).type === "insert";
		}
	}

	export interface NonInteractiveRowActivation {
		readonly type: "non_interactive";
	}
	export namespace NonInteractiveRowActivation {
		export function isAssignableFrom(activation: object): activation is NonInteractiveRowActivation {
			return "type" in activation && (activation as NonInteractiveRowActivation).type === "non_interactive";
		}
	}

	export type RowActivation = EventRowActivation | InsertRowActivation | NonInteractiveRowActivation;

	export interface Configuration {
		readonly rootRef: string;
		readonly hierarchicalColumnRef: string;
		readonly labelHidden?: true;
		readonly wholeTreeExpansion?: true;
		readonly enableColumnsResize?: true;
		readonly dnd?: DndConfiguration;
		readonly multiSelection?: MultiSelectionConfiguration;
		readonly virtualRoot?: VirtualRootConfiguration;
		readonly enableVirtualScroll?: true;
		readonly rowHeight?: number;
		readonly actionColumnWidth?: Width;
		readonly subtitle?: LocalizedModelText;
		/**
		 * Optional reference to a Column ID whose cell content will be connected to row action buttons
		 * and checkboxes via aria-labelledby, improving screen reader accessibility.
		 * When not set, falls back to hierarchicalColumnRef.
		 */
		readonly screenReaderColumnRef?: string;
		readonly expansionStrategy: ExpansionStrategy;
	}

	export type ExpansionStrategy = ExpansionStrategy.Tree | ExpansionStrategy.LevelByLevel;
	export namespace ExpansionStrategy {
		export interface LevelByLevel {
			readonly type: "level_by_level";
			readonly initialExpansion?: LevelByLevel.InitialExpansion;
			readonly pageSize?: number;
		}
		export namespace LevelByLevel {
			export function isAssignableFrom(obj?: unknown): obj is LevelByLevel {
				return !!obj && typeof obj === "object" && (obj as LevelByLevel).type === "level_by_level";
			}

			export type InitialExpansion = InitialExpansion.LevelLimit | InitialExpansion.AllLevels;

			export namespace InitialExpansion {
				export interface Base {
					readonly type?: string;
				}

				export interface LevelLimit extends InitialExpansion.Base {
					readonly type: "level_limit";
					readonly level: number;
					readonly affectedNodeRefs?: string[];
				}

				export namespace LevelLimit {
					export function isAssignableFrom(obj: object): obj is InitialExpansion.LevelLimit {
						return (obj as Base).type === "level_limit";
					}
				}

				export interface AllLevels extends InitialExpansion.Base {
					readonly type: "all_levels";
					readonly affectedNodeRefs?: string[];
				}

				export namespace AllLevels {
					export function isAssignableFrom(obj: object): obj is InitialExpansion.AllLevels {
						return (obj as Base).type === "all_levels";
					}
				}
			}
		}

		export interface Tree {
			readonly type: "tree";
			readonly expansionDepths: Tree.ExpansionDepth[];
		}
		export namespace Tree {
			export function isAssignableFrom(obj?: unknown): obj is Tree {
				return !!obj && typeof obj === "object" && (obj as Tree).type === "tree";
			}

			export interface ExpansionDepth {
				relationshipModel: string;
				maxDepth: number;
			}
		}
	}

	export interface DndConfiguration {
		/**
		 * Configure the behavior of the dragging node
		 */
		readonly onDrag: {
			/**
			 * This flag indicates the engine to automatically expand a node when a dragging node is hovering on it
			 */
			readonly expandHoveredNode: boolean;
		};
	}

	export interface Triggerable extends Annotated {
		readonly label?: LocalizedModelText;
		readonly description?: LocalizedModelText;
		readonly icon?: Icon;
		readonly styles?: Styles;
	}

	export interface BaseButton extends Triggerable {
		readonly primary?: boolean;
		readonly destructive?: boolean;
		readonly labelHidden?: true;
	}

	export interface ButtonType extends BaseButton {
		readonly id: string;
		readonly event: string;
		readonly confirmation?: ConfirmationText;
	}

	export type Styles = ReadonlyArray<string>;

	export interface Annotated {
		readonly annotations?: ReadonlyArray<BaseAnnotation>;
	}

	/** @deprecated use {@link BaseAnnotation} instead */
	export interface Annotation {
		readonly name: string;
		readonly value?: string;
	}

	export interface Icon {
		readonly name: string;
		readonly theme?: IconTheme;
	}

	export interface ColumnAlignment {
		readonly header?: Alignment;
		readonly content?: Alignment;
	}

	export interface Alignment {
		readonly horizontal?: HorizontalAlignment;
		readonly vertical?: VerticalAlignment;
	}

	export interface ColumnStyles {
		readonly header?: Styles;
		readonly content?: Styles;
	}

	export type ModelReference =
		| ModelReference.DocumentModelForTree
		| ModelReference.RelationshipModelForTree
		| ModelReference.DocumentModelForRelationship;

	export namespace ModelReference {
		export interface DocumentModelForTree extends BaseModelReference {
			readonly purpose: "document-model-for-tree";
			readonly modelType: "document";
		}
		export interface RelationshipModelForTree extends BaseModelReference {
			readonly purpose: "relationship-model-for-tree";
			readonly modelType: "relationship";
		}
		export interface DocumentModelForRelationship extends BaseModelReference {
			readonly purpose: "document-model-for-relationship";
			readonly modelType: "document";
		}
	}

	export interface LocaleText {
		readonly locale: string;
		readonly value?: string;
	}

	export enum PinDirection {
		RIGHT = "right",
		LEFT = "left"
	}

	export type Width = number;

	export enum HorizontalAlignment {
		LEFT = "left",
		CENTER = "center",
		RIGHT = "right"
	}

	export enum VerticalAlignment {
		TOP = "top",
		MIDDLE = "middle",
		BOTTOM = "bottom"
	}

	export interface MultiSelectionConfiguration {
		readonly collapseOption: MultiSelectionConfiguration.CollapseOption;
		readonly counterOption: MultiSelectionConfiguration.CounterOption;
		readonly selectionArea?: MultiSelectionConfiguration.SelectionArea;
		readonly buttons?: ButtonType[];

		readonly clearConfirmation?: {
			readonly enabled: true;
			readonly confirmation?: ConfirmationText;
		};

		readonly selectParent?: boolean;
	}

	export namespace MultiSelectionConfiguration {
		export enum CounterOption {
			SIMPLE = "simple",
			NONE = "none"
		}
		export enum CollapseOption {
			COLLAPSIBLE_COLLAPSED = "collapsible_collapsed",
			COLLAPSIBLE_EXPANDED = "collapsible_expanded",
			NON_COLLAPSIBLE = "non_collapsible"
		}
		export enum SelectionArea {
			CHECKBOX = "checkbox",
			CHECKBOX_AND_ROW = "checkbox_and_row"
		}
	}

	export interface VirtualRootConfiguration {
		readonly label: LocalizedModelText;
		readonly actions?: TreeModel.TreeNodeActionButton[];
		readonly contextMenu?: TreeModel.TreeNodeContextMenu;
	}

	export enum MultiSelectDisplayMode {
		COMMA_SEPARATED = "comma_separated",
		DEFAULT = "default"
	}
}

type IconTheme = "filled" | "outlined" | "rounded" | "custom";
