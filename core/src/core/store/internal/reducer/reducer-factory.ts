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

import { type AnyAction } from "typescript-fsa";

import { Commands, Events } from "../actions.js";
import { type DataState, type UiState } from "../store.js";

import { handleResetClipboard } from "./handler/resetClipboard.js";
import { handleSetCopiedNodes } from "./handler/setCopiedNodes.js";
import { handleSetColumnWidths } from "./handler/setColumnWidths.js";
import { handleSetInsertDialogState } from "./handler/setDialogState.js";
import { handleSetExpandedNodes } from "./handler/setExpandedNodes.js";
import { handleSetSelectedNodes } from "./handler/setSelectedNodes.js";
import { handleSetMultiSelectionNodes } from "./handler/setMultiSelectionNodes.js";
import { handleSetExpandedMultiSelectionPanel } from "./handler/setExpandedMultiSelectionPanel.js";
import { handleSetScrollToNode } from "./handler/setScrollToNode.js";
import { handleSetCutNodes } from "./handler/setCutNodes.js";
import { handleSetPreloadChildNodes } from "./handler/setPreloadChildNodes.js";
import { handleSetDisabled } from "./handler/setDisabled.js";
import { handleMultiSelectionEvents } from "./handler/handleMultiSelectionEvents.js";
import { handleSetReadonly } from "./handler/setReadonly.js";

export function buildInitialDataState(): DataState {
	return {
		root: { children: [] },
		data: {}
	};
}

export function dataStateReducer(state: DataState | undefined, action: AnyAction): DataState {
	if (state === undefined) {
		return buildInitialDataState();
	}
	return state;
}

const initialUiState: UiState = {
	pageSizeMap: {},
	expandedNodes: {},
	matchedNodes: {},
	query: "",
	selectedNodes: {},
	dialog: null,
	expandedMultiSelectionPanel: false,
	multiSelectionNodes: {},
	multiSelectionActions: [],
	clipboard: null,
	disabled: undefined,
	readonly: undefined
};

export function buildInitialUiState(): UiState {
	return initialUiState;
}

export function uiStateReducer(state: UiState | undefined, action: AnyAction): UiState {
	if (state === undefined) {
		return buildInitialUiState();
	} else if (Commands.setExpandedNodes.match(action)) {
		return handleSetExpandedNodes(state, action);
	} else if (Commands.setSelectedNodes.match(action)) {
		return handleSetSelectedNodes(state, action);
	} else if (Commands.setDialogState.match(action)) {
		return handleSetInsertDialogState(state, action);
	} else if (Commands.setColumnWidths.match(action)) {
		return handleSetColumnWidths(state, action);
	} else if (Commands.setMultiSelectionNodes.match(action)) {
		return handleSetMultiSelectionNodes(state, action);
	} else if (Commands.setExpandedMultiSelectionPanel.match(action)) {
		return handleSetExpandedMultiSelectionPanel(state, action);
	} else if (Commands.setCopiedNodes.match(action)) {
		return handleSetCopiedNodes(state, action);
	} else if (Commands.setCutNodes.match(action)) {
		return handleSetCutNodes(state, action);
	} else if (Commands.setScrollToNode.match(action)) {
		return handleSetScrollToNode(state, action);
	} else if (Commands.setPreloadChildNodes.match(action)) {
		return handleSetPreloadChildNodes(state, action);
	} else if (Commands.setDisabled.match(action)) {
		return handleSetDisabled(state, action);
	} else if (Commands.setReadonly.match(action)) {
		return handleSetReadonly(state, action);
	} else if (Commands.resetClipboard.match(action)) {
		return handleResetClipboard(state, action);
	} else if (
		Events.onNodeMultiSelectionClicked.match(action) ||
		Events.onNodeRangeSelectionClicked.match(action) ||
		Events.onOverallMultiSelectionClicked.match(action)
	) {
		return handleMultiSelectionEvents(state, action);
	}
	return state;
}
