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

import { ModelSelector } from "../../../index.js";
import { TreeEngineError } from "../../../../error/index.js";
import { Commands, Events } from "../../actions.js";
import { TreeEngineState } from "../../store.js";

/**
 * @internal
 */
export const onInsertRootNodeRequestMiddleware: Middleware = (api) => (next) => (action) => {
	const result = next(action);
	if (Events.onInsertRootNodeRequest.started.match(action)) {
		const { button, documentModelId } = action.payload;
		if (documentModelId) {
			api.dispatch(Events.onInsertRootNodeRequest.done({ params: action.payload, result: { documentModelId } }));
			return result;
		}

		const uiModel = ModelSelector.uiModel()(api.getState());
		const rootDocumentModelName = uiModel.content.configuration.root.documentModelRef;
		const modelGraph = ModelSelector.modelGraph()(api.getState());

		const rootDocumentModel = modelGraph.documentModels.find(({ modelId }) => modelId === rootDocumentModelName);
		if (!rootDocumentModel) {
			throw TreeEngineError.NotFoundError("DocumentModel", rootDocumentModelName);
		}

		if (rootDocumentModel.subTypes && rootDocumentModel.subTypes.length > 0) {
			const dialogState: TreeEngineState.Dialog.InsertRootNode.State = {
				type: TreeEngineState.Dialog.Type.INSERT_ROOT_NODE,
				button
			};
			api.dispatch(Commands.setDialogState({ state: dialogState }));
		} else {
			const eventAction = Events.onInsertRootNodeRequest.done({
				params: action.payload,
				result: { documentModelId: rootDocumentModelName }
			});
			api.dispatch(eventAction);
		}
	}

	return result;
};
