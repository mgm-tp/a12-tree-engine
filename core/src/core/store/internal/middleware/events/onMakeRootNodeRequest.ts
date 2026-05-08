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

import { TreeEngineError } from "../../../../error/index.js";
import { DocumentModelUtils, DocumentUtils } from "../../../../models/internal/shared.js";
import { Commands, Events } from "../../actions.js";
import { DataSelector } from "../../selectors/data.js";
import { ModelSelector } from "../../selectors/models.js";
import { type Identifier, TreeEngineState } from "../../store.js";

/**
 * @internal
 */
export const onMakeRootNodeRequestMiddleware: Middleware = (api) => (next) => (action) => {
	const result = next(action);
	if (Events.onMakeRootNodeRequest.started.match(action)) {
		const { parentLinks, nodeIdentifier } = action.payload;
		const nodeDisplayName = getNodeDisplayName(api.getState(), nodeIdentifier);

		const dialogState: TreeEngineState.Dialog.Confirmation.MakeRootNode = {
			type: TreeEngineState.Dialog.Type.CONFIRMATION,
			confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.MAKE_ROOT_NODE,
			nodeIdentifier,
			nodeDisplayName,
			parentLinks
		};

		api.dispatch(Commands.setDialogState({ state: dialogState }));
	}

	return result;
};

function getNodeDisplayName(state: TreeEngineState, nodeIdentifier: Identifier): string {
	const document = DataSelector.node(nodeIdentifier)(state)?.document;
	if (!document || !DocumentUtils.isGroupInstance(document)) {
		throw TreeEngineError.TypeError("GroupInstance", { actual: document });
	}

	const nodeModel = ModelSelector.nodeModel(nodeIdentifier.type)(state);
	const { hierarchicalColumnRef } = ModelSelector.uiModel()(state).content.configuration;
	const hierarchicalColumn = nodeModel?.columns.find((column) => column.columnRef === hierarchicalColumnRef);
	if (!nodeModel || !hierarchicalColumn) {
		throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", nodeIdentifier.type);
	}

	const documentModel = ModelSelector.documentModelByName(nodeModel.documentModelRef)(state);
	if (!documentModel) {
		throw TreeEngineError.NotFoundError("DocumentModel", nodeIdentifier.type);
	}

	return String(
		DocumentUtils.getValue(document, DocumentModelUtils.toEntityInstancePath(hierarchicalColumn.elementPath))
	);
}
