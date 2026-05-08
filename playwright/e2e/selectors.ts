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

export namespace Selector {
	export const LAYOUT_PANE = `.masterDetailLayoutPane`;

	export const SUB_HEADER = `[data-role="contentbox-subheading"]`;
	export const SUB_HEADER_BUTTONS = `${SUB_HEADER} [data-role^="contentbox-action-bar-group-area"] > [data-role="button-group"] > button`;

	export const FOOTER = `[data-role="contentbox-footer"]`;

	export const NODE = ".tree-table__node";
	export const VIRTUAL_ROOT = ".tree-table__node--level--1";

	export const TABLE_BODY = `[data-role="table-body"]`;
	export const HEADER_ROW = '[data-role="table-header-row"]';
	export const HEADER_CELL = '[data-role="table-header-cell"]';
	export const BODY_ROW = `[data-role="table-body-row"]`;
	export const DND_BODY_ROW = ".table__contentDnD";
	export const TREE_NODE_NAME = `[data-role="tree-node-name"]`;
	export const TREE_NODE = `[data-role="tree-node"]`;
	export const BODY_ROW_SCROLL = `[data-role="table-body-row--scroll"]`;
	export const PAGINATED_BODY_ROW = `[data-role='paginated-table-body-row']`;
	export const BODY_CELL = `[data-role="table-body-cell"]`;
	export const ROW_BUTTONS = `[data-role="table-body-row"] [data-role="button-group"] button`;
	export const TABLE_FOOTER = `[data-role="table-footer"]`;

	export const DIALOG = `[data-role="modal-overlay"]`;
	export const DIALOG_CONTENT = `[data-role="modal-overlay-content"]`;
	export const DIALOG_MESSAGE = `[data-role="modal-overlay"] [data-role="contentbox-content"]`;
	export const DIALOG_NODE_TITLE = `[data-role="tree-node-title"]`;

	export const ATTACHED_PORTAL = `[data-role="attached-portal"]`;

	export const POPUP = '[data-role="popup"]';
	export const POPUP_MENU = '[data-role="popup-menu"]';
	export const POPUP_ITEM = '[data-role="popup-item"]';
	export const APPLICATION_HEADER_POPUP = 'button[aria-label*="Open menu"]';

	export const MENU_ITEM = '[data-role="menu-item"]';
	export const LIST_ITEM = '[data-role="list-item"]';
	export const LIST_ITEM_TEXT = '[data-role="list-item-text"]';

	export const MULTI_SELECTION_BUTTON = `button[aria-label*="bulk operation"]`;
	export const MULTI_SELECTION_BUTTONS = `[data-role="contentbox-action-bar-group"] [data-role="button-group"] button`;
	export const COUNTER = '[data-role="counter"]';
	export const CHECKBOX = `[data-role="checkbox"]`;
	export const CHECKBOX_INPUT = `[data-role="checkbox-input"]`;
	export const BUTTON = `button[data-role="button"]`;
	export const BUTTON_LABEL = `[data-role="button-label"]`;

	export const FORM_ENGINE = `[data-role="contentbox"][role="form"]`;
	export const CONTENT_BOX_HEADER = "[data-role=contentbox-header]";
	export const CONTENT_BOX_HEADING = "[data-role=contentbox-heading]";
	export const CONTENT_BOX_TITLE = "[data-role=contentbox-title]";
	export const CONTENT_BOX = "[data-role=contentbox]";
	export const TOAST = `[data-role="toast-container"]`;

	export const PROGRESS_INDICATOR = `[data-role=progress-indicator-outer-overlay]`;

	export const MESSAGE = `[data-role=message]`;

	export const MASTER_DETAIL_LAYOUT_PANE = `[data-role=master-detail-layout-pane]`;
	export const CONTEXT_MENU_ITEM = `${Selector.ATTACHED_PORTAL} ${Selector.LIST_ITEM}, ${Selector.ATTACHED_PORTAL} [data-role="list-sub-header"]`;

	export const TWIN_DATA_MODELER_TREE_CONTAINER = '[id="Twin-data-modeler-tree-GM-container"]';
}
