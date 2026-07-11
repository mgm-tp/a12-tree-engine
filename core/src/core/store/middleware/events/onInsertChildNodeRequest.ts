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

import { TreeEngineError } from "../../../error/tree-engine-error.js";
import { Commands, Events } from "../../actions.js";
import { ModelSelector } from "../../selectors/models.js";
import { TreeEngineState } from "../../store.js";

/**
 * @internal
 */
export const onInsertChildNodeRequestMiddleware: Middleware = (api) => (next) => (action) => {
	const result = next(action);
	if (Events.onInsertChildNodeRequest.started.match(action)) {
		const state = api.getState();
		const { insertPosition, documentModelId } = action.payload;
		const { nodeIdentifier } = insertPosition.target;

		const nodeModel = ModelSelector.nodeModel(nodeIdentifier.type)(state);
		if (!nodeModel) {
			throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", nodeIdentifier.type);
		}

		if (documentModelId) {
			const childRelationshipConfiguration = ModelSelector.childRelationshipConfiguration(
				nodeModel,
				documentModelId
			)(state);
			if (!childRelationshipConfiguration) {
				throw TreeEngineError.NotFoundError("TreeEngine.ChildRelationshipConfiguration", nodeModel);
			}

			api.dispatch(
				Events.onInsertChildNodeRequest.done({
					params: action.payload,
					result: { documentModelId, childRelationshipConfiguration }
				})
			);
			return result;
		}

		const options = nodeModel.childRelationshipConfigurations.map((childRelationshipConfiguration) => {
			const { relationshipModelRef } = childRelationshipConfiguration;
			const childEntityCharacteristic = ModelSelector.childEntityCharacteristic(childRelationshipConfiguration)(state);
			if (!childEntityCharacteristic) {
				throw TreeEngineError.NotFoundError("RelationshipModel.EntityCharacteristic", relationshipModelRef);
			}

			return {
				childRelationshipConfiguration,
				documentModelId: childEntityCharacteristic.documentModel
			};
		});

		const dialogState: TreeEngineState.Dialog.InsertChildNode = {
			type: TreeEngineState.Dialog.Type.INSERT_CHILD_NODE,
			insertPosition: action.payload.insertPosition,
			button: action.payload.button,
			options
		};
		api.dispatch(Commands.setDialogState({ state: dialogState }));
	}
	return result;
};
