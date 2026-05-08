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
import { TreeEngineState } from "../../store.js";

/**
 * @internal
 */
export const onDialogClosedMiddleware: Middleware = (api) => (next) => (action) => {
	const result = next(action);
	if (Events.onDialogClosed.match(action)) {
		const dialogState = UIStateSelector.dialogState()(api.getState());
		if (!dialogState) {
			return result;
		}
		api.dispatch(Commands.setDialogState({ state: null }));
		if (TreeEngineState.Dialog.InsertChildNode.isAssignableFrom(dialogState)) {
			api.dispatch(
				Events.onInsertChildNodeRequest.failed({
					params: { insertPosition: dialogState.insertPosition, button: dialogState.button },
					error: {}
				})
			);
		} else if (TreeEngineState.Dialog.InsertSiblingNode.isAssignableFrom(dialogState)) {
			api.dispatch(
				Events.onInsertSiblingNodeRequest.failed({
					params: { insertPosition: dialogState.insertPosition, button: dialogState.button },
					error: {}
				})
			);
		} else if (TreeEngineState.Dialog.InsertRootNode.isAssignableFrom(dialogState)) {
			api.dispatch(Events.onInsertRootNodeRequest.failed({ params: { button: dialogState.button }, error: {} }));
		} else if (TreeEngineState.Dialog.Confirmation.MakeRootNode.isAssignableFrom(dialogState)) {
			api.dispatch(
				Events.onMakeRootNodeRequest.failed({
					params: { nodeIdentifier: dialogState.nodeIdentifier, parentLinks: dialogState.parentLinks },
					error: {}
				})
			);
		}
	}

	return result;
};
