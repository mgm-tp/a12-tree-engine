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

export namespace TreeModelKeys {
	export const TREE_MODEL = "treeModel";
	export const HEADER = "header";
	export const SUB_HEADER_BOX = "subHeaderBox";
	export const MULTI_SELECTION = "multiSelection";
	export const FOOTER_BOX = "footerBox";
	export const COLUMNS = "columns";
	export const ROWS = "rows";
	export const NODE = "nodes";
	export const VIRTUAL_ROOT = "virtualRoot";
	export const BUTTONS = "buttons";
	export const LABELS = "labels";
	export const SUBTITLE = "subtitle";
	export const LABEL = "label";
	export const TITLE = "title";
	export const ACTIONS = "actions";
	export const CONTEXT_MENU = "contextMenu";
	export const ACTION_GROUPS = "groups";
	export const CONFIRMATION = "confirmation";
	export const CLEAR_CONFIRMATION = "clearConfirmation";
	export const ACTION_INSERT = "insert";
	export const ACTION_EVENT = "event";

	export function getHeaderLabelsKey() {
		return [HEADER, LABELS];
	}

	export function getHeaderSubtitleKey() {
		return [HEADER, SUBTITLE];
	}

	export function getSubHeaderBoxButtonsKey() {
		return [SUB_HEADER_BOX, BUTTONS];
	}

	export function getMultiSelectionActionsKey() {
		return [MULTI_SELECTION, ACTIONS];
	}

	export function getMultiSelectionClearConfirmationKey() {
		return [MULTI_SELECTION, CLEAR_CONFIRMATION];
	}

	export function getFooterBoxButtonsKey(): string[] {
		return [FOOTER_BOX, BUTTONS];
	}

	export function getColumnsKey() {
		return COLUMNS;
	}

	export function getNodesKey() {
		return NODE;
	}

	export function getVirtualRootKey() {
		return VIRTUAL_ROOT;
	}

	export function getActionKey() {
		return ACTIONS;
	}

	export function getActionGroupKey() {
		return ACTION_GROUPS;
	}

	export function getContextMenuKey() {
		return CONTEXT_MENU;
	}

	export function getActionsEventConfirmationKey() {
		return [NODE, ACTIONS, ACTION_EVENT, CONFIRMATION];
	}

	export function getPrefixes(treeModelName: string): string[] {
		return ["uiModel", treeModelName];
	}
}
