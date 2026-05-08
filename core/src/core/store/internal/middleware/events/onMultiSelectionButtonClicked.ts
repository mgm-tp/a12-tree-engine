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

import { type Middleware } from "redux";

import { Commands, Events } from "../../actions.js";
import { UIStateSelector } from "../../selectors/ui-state.js";
import { ModelSelector } from "../../selectors/models.js";
import { TreeEngineState } from "../../store.js";

/**
 * @internal
 */
export const onMultiSelectionButtonClickedMiddleware: Middleware = (api) => (next) => (action) => {
	const result = next(action);

	if (Events.onMultiSelectionButtonClicked.match(action)) {
		const expandedMultiSelectionPanel = UIStateSelector.expandedMultiSelectionPanel()(api.getState());

		if (!expandedMultiSelectionPanel) {
			api.dispatch(Commands.setExpandedMultiSelectionPanel({ expanded: true }));
			return result;
		}

		const overallMultiSelection = UIStateSelector.overallMultiSelection()(api.getState());
		const uiModel = ModelSelector.uiModel()(api.getState());
		const shouldShowDialog =
			overallMultiSelection !== TreeEngineState.MultiSelectionState.DESELECTED &&
			uiModel.content.configuration.multiSelection?.clearConfirmation?.enabled;

		if (shouldShowDialog) {
			const dialogState: TreeEngineState.Dialog.Confirmation.CollapseMultiSelectionPanel = {
				type: TreeEngineState.Dialog.Type.CONFIRMATION,
				confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.COLLAPSE_MULTI_SELECTION_PANEL
			};
			api.dispatch(Commands.setDialogState({ state: dialogState }));
			return result;
		}

		api.dispatch(Commands.setExpandedMultiSelectionPanel({ expanded: false }));
	}

	return result;
};
