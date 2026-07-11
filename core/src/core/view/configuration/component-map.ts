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

import type * as React from "react";

import { MultiSelectionPanel } from "../components/content-box/sub-components/multi-selection/multi-selection-panel.js";
import { MultiSelectionButton } from "../components/content-box/sub-components/multi-selection/multi-selection-button.js";
import { MultiSelectionCounter } from "../components/content-box/sub-components/multi-selection/multi-selection-counter.js";
import { MultiSelectionActions } from "../components/content-box/sub-components/multi-selection/multi-selection-actions.js";
import { FooterBox } from "../components/content-box/sub-components/footer-box.js";
import { SubActionBar } from "../components/content-box/sub-components/sub-action-bar.js";
import { ExpandAllPopUp } from "../components/content-box/sub-components/expand-all-pop-up.js";
import { DialogsRenderer } from "../components/dialogs/dialog-renderer.js";
import { ConfirmationDialog } from "../components/dialogs/sub-components/confirmation-dialog.js";
import { InsertChildNodeDialog } from "../components/dialogs/sub-components/insert-child-node-dialog.js";
import { InsertSiblingNodeDialog } from "../components/dialogs/sub-components/insert-sibling-node-dialog.js";
import { InsertRootNodeDialog } from "../components/dialogs/sub-components/insert-root-node-dialog.js";
import { AttachmentCell } from "../components/tree-engine/sub-components/attachment-cell.js";
import {
	BodyCell,
	BodyCellUIValue,
	DocumentBodyCell,
	LinkDocumentBodyCell
} from "../components/tree-engine/sub-components/body-cell.js";
import { ContextMenu } from "../components/tree-engine/sub-components/context-menu.js";
import { DragSource } from "../components/tree-engine/sub-components/drag-source.js";
import { MultiSelectCell } from "../components/tree-engine/sub-components/multi-select-cell.js";
import { MultiSelectionDragPreview } from "../components/tree-engine/sub-components/multi-selection-drag-preview.js";
import { RowAction } from "../components/tree-engine/sub-components/row-action.js";
import { BodyRow } from "../components/tree-engine/sub-components/body-row/body-row.js";
import { DndBodyRow } from "../components/tree-engine/sub-components/body-row/dnd-body-row.js";
import { RowActionsGroup } from "../components/tree-engine/sub-components/row-actions-group.js";
import { RowProgressIndicator } from "../components/tree-engine/sub-components/row-progress-indicator.js";
import { Heading } from "../components/content-box/sub-components/heading.js";
import { CustomFieldTypeCell } from "../components/tree-engine/sub-components/custom-field-type-cell.js";
import { OverallCheckbox } from "../components/tree-engine/sub-components/overall-checkbox.js";
import { RowCheckbox } from "../components/tree-engine/sub-components/row-checkbox.js";
import { Body, InitialViewBody } from "../components/tree-engine/sub-components/body.js";
import { VirtualRootBodyCell } from "../components/tree-engine/sub-components/virtual-root-body-cell.js";
import { VirtualRootRowActionsGroup } from "../components/tree-engine/sub-components/virtual-root-row-actions-group.js";
import { VirtualRootRow } from "../components/tree-engine/sub-components/virtual-root-row.js";
import { VirtualizedBody } from "../components/tree-engine/sub-components/virtualized-body.js";
import { RightClickContextMenu } from "../components/tree-engine/sub-components/right-click-context-menu.js";
import { Button } from "../components/content-box/sub-components/buttons.js";

export interface ComponentMap {
	Body: React.ComponentType<Body.Props>;
	VirtualizedBody: React.ComponentType<VirtualizedBody.Props>;
	InitialViewBody: React.ComponentType<InitialViewBody.Props>;

	BodyCell: React.ComponentType<BodyCell.Props>;
	VirtualRootBodyCell: React.ComponentType<VirtualRootBodyCell.Props>;
	AttachmentCell: React.ComponentType<AttachmentCell.Props>;
	MultiSelectCell: React.ComponentType<MultiSelectCell.Props>;
	CustomFieldTypeCell: React.ComponentType<CustomFieldTypeCell.Props>;
	DocumentBodyCell: React.ComponentType<BodyCell.Props>;
	LinkDocumentBodyCell: React.ComponentType<BodyCell.Props>;
	BodyCellUIValue: React.ComponentType<BodyCellUIValue.Props>;
	DndBodyRow: React.ComponentType<DndBodyRow.Props>;
	BodyRow: React.ComponentType<BodyRow.Props>;
	VirtualRootRow: React.ComponentType<VirtualRootRow.Props>;

	DialogsRenderer: React.ComponentType<DialogsRenderer.Props>;
	ConfirmationDialog: React.ComponentType<ConfirmationDialog.Props>;
	InsertChildNodeDialog: React.ComponentType<InsertChildNodeDialog.Props>;
	InsertSiblingNodeDialog: React.ComponentType<InsertSiblingNodeDialog.Props>;
	InsertRootNodeDialog: React.ComponentType<InsertRootNodeDialog.Props>;

	Heading: React.ComponentType<Heading.Props>;
	SubActionBar: React.ComponentType<SubActionBar.Props>;
	FooterBox: React.ComponentType<FooterBox.Props>;
	ExpandAllPopUp: React.ComponentType<ExpandAllPopUp.Props>;

	DragSource: React.ComponentType<DragSource.Props>;

	RowActionsGroup: React.ComponentType<RowActionsGroup.Props>;
	VirtualRootRowActionsGroup: React.ComponentType<VirtualRootRowActionsGroup.Props>;
	ContextMenu: React.ComponentType<ContextMenu.Props>;
	RightClickContextMenu: React.ComponentType<RightClickContextMenu.Props>;
	RowAction: React.ComponentType<RowAction.Props>;
	RowProgressIndicator: React.ComponentType<RowProgressIndicator.Props>;

	MultiSelectionPanel: React.ComponentType<MultiSelectionPanel.Props>;
	MultiSelectionButton: React.ComponentType<MultiSelectionButton.Props>;
	MultiSelectionCounter: React.ComponentType<MultiSelectionCounter.Props>;
	MultiSelectionActions: React.ComponentType<MultiSelectionActions.Props>;
	OverallCheckbox: React.ComponentType<OverallCheckbox.Props>;
	RowCheckbox: React.ComponentType<RowCheckbox.Props>;
	MultiSelectionDragPreview: React.ComponentType<MultiSelectionDragPreview.Props>;
	Button: React.ComponentType<Button.Props>;
}

export const DefaultComponentMap: ComponentMap = {
	Body: Body,
	VirtualizedBody: VirtualizedBody,
	InitialViewBody: InitialViewBody,

	BodyCell: BodyCell,
	VirtualRootBodyCell: VirtualRootBodyCell,
	AttachmentCell: AttachmentCell,
	MultiSelectCell: MultiSelectCell,
	CustomFieldTypeCell: CustomFieldTypeCell,
	DocumentBodyCell: DocumentBodyCell,
	LinkDocumentBodyCell: LinkDocumentBodyCell,
	BodyCellUIValue: BodyCellUIValue,
	DndBodyRow: DndBodyRow,
	BodyRow: BodyRow,
	VirtualRootRow: VirtualRootRow,

	DialogsRenderer: DialogsRenderer,
	ConfirmationDialog: ConfirmationDialog,
	InsertChildNodeDialog: InsertChildNodeDialog,
	InsertSiblingNodeDialog: InsertSiblingNodeDialog,
	InsertRootNodeDialog: InsertRootNodeDialog,

	Heading: Heading,
	SubActionBar: SubActionBar,
	FooterBox: FooterBox,
	ExpandAllPopUp: ExpandAllPopUp,

	DragSource: DragSource,

	RowActionsGroup: RowActionsGroup,
	VirtualRootRowActionsGroup: VirtualRootRowActionsGroup,
	ContextMenu: ContextMenu,
	RightClickContextMenu: RightClickContextMenu,
	RowAction: RowAction,
	RowProgressIndicator: RowProgressIndicator,

	MultiSelectionPanel: MultiSelectionPanel,
	MultiSelectionButton: MultiSelectionButton,
	MultiSelectionCounter: MultiSelectionCounter,
	MultiSelectionActions: MultiSelectionActions,
	OverallCheckbox: OverallCheckbox,
	RowCheckbox: RowCheckbox,
	MultiSelectionDragPreview: MultiSelectionDragPreview,
	Button: Button
};
