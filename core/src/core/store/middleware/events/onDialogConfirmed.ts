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

import type { Middleware } from "redux";

import { Commands, Events } from "../../actions.js";
import { UIStateSelector } from "../../selectors/ui-state.js";
import { TreeEngineState } from "../../store.js";

/**
 * @internal
 */
export const onDialogConfirmedMiddleware: Middleware = (api) => (next) => (action) => {
	const result = next(action);
	if (Events.onDialogConfirmed.match(action)) {
		const dialogState = UIStateSelector.dialogState()(api.getState());
		if (!dialogState) {
			return result;
		}
		api.dispatch(Commands.setDialogState({ state: null }));
		if (
			TreeEngineState.Dialog.InsertChildNode.isAssignableFrom(dialogState) &&
			Events.DialogConfirmedPayload.InsertChildNode.isAssignableFrom(action.payload)
		) {
			const { insertPosition, childRelationshipConfiguration, documentModelId, button } = action.payload;
			api.dispatch(
				Events.onInsertChildNodeRequest.done({
					params: { insertPosition, button },
					result: { childRelationshipConfiguration, documentModelId }
				})
			);
		} else if (
			TreeEngineState.Dialog.InsertSiblingNode.isAssignableFrom(dialogState) &&
			Events.DialogConfirmedPayload.InsertSiblingNode.isAssignableFrom(action.payload)
		) {
			const { insertPosition, childRelationshipConfiguration, documentModelId, button } = action.payload;
			api.dispatch(
				Events.onInsertSiblingNodeRequest.done({
					params: { insertPosition, button },
					result: { childRelationshipConfiguration, documentModelId }
				})
			);
		} else if (
			TreeEngineState.Dialog.InsertRootNode.isAssignableFrom(dialogState) &&
			Events.DialogConfirmedPayload.InsertRootNode.isAssignableFrom(action.payload)
		) {
			const { button } = dialogState;
			const { documentModelId } = action.payload;
			api.dispatch(
				Events.onInsertRootNodeRequest.done({
					params: { button },
					result: { documentModelId }
				})
			);
		} else if (TreeEngineState.Dialog.Confirmation.EventButton.isAssignableFrom(dialogState)) {
			const { button } = dialogState;
			api.dispatch(Events.onEventButtonClicked({ button }));
		} else if (TreeEngineState.Dialog.Confirmation.NodeEventButton.isAssignableFrom(dialogState)) {
			const { nodeIdentifier, nodePath, button } = dialogState;
			api.dispatch(Events.onNodeEventButtonClicked({ nodeIdentifier, nodePath, button }));
		} else if (TreeEngineState.Dialog.Confirmation.MakeRootNode.isAssignableFrom(dialogState)) {
			const { nodeIdentifier, parentLinks } = dialogState;
			api.dispatch(Events.onMakeRootNodeRequest.done({ params: { nodeIdentifier, parentLinks }, result: {} }));
		} else if (TreeEngineState.Dialog.Confirmation.CollapseMultiSelectionPanel.isAssignableFrom(dialogState)) {
			api.dispatch(Commands.setExpandedMultiSelectionPanel({ expanded: false }));
		} else if (TreeEngineState.Dialog.Confirmation.MultiSelectionEventButton.isAssignableFrom(dialogState)) {
			api.dispatch(Events.onMultiSelectionEventButtonClicked({ button: dialogState.button }));
		}
		// More confirmation type dispatcher should be placed here
	}
	return result;
};
