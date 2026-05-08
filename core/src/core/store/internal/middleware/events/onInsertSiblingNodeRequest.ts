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
import { Commands, Events } from "../../actions.js";
import { ModelSelector } from "../../selectors/models.js";
import { DataSelector } from "../../selectors/data.js";
import { TreeEngineState } from "../../store.js";

/**
 * @internal
 */
export const onInsertSiblingNodeRequestMiddleware: Middleware = (api) => (next) => (action) => {
	const result = next(action);
	if (Events.onInsertSiblingNodeRequest.started.match(action)) {
		const state = api.getState();
		const { insertPosition, documentModelId } = action.payload;
		const nodeParams = insertPosition.target;
		const { nodeIdentifier, nodePath } = nodeParams;

		const nodeModel = ModelSelector.nodeModel(nodeIdentifier.type)(state);
		if (!nodeModel) {
			throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", nodeIdentifier.type);
		}

		const documentModel = ModelSelector.documentModelByName(nodeModel.documentModelRef)(state);
		if (!documentModel) {
			throw TreeEngineError.NotFoundError("DocumentModel", documentModel);
		}

		const parent = DataSelector.parent(nodeParams)(state);

		if (documentModelId) {
			if (!parent) {
				api.dispatch(
					Events.onInsertRootNodeRequest.done({
						params: action.payload,
						result: { documentModelId }
					})
				);
				return result;
			}

			const parentNodeModel = ModelSelector.nodeModel(parent.nodeIdentifier.type)(state);
			if (!parentNodeModel) {
				api.dispatch(
					Events.onInsertRootNodeRequest.done({
						params: action.payload,
						result: { documentModelId }
					})
				);
				return result;
			}

			const childRelationshipConfiguration = ModelSelector.childRelationshipConfiguration(
				parentNodeModel,
				documentModelId
			)(state);
			if (!childRelationshipConfiguration) {
				throw TreeEngineError.NotFoundError("TreeEngine.ChildRelationshipConfiguration", parentNodeModel);
			}

			api.dispatch(
				Events.onInsertSiblingNodeRequest.done({
					params: action.payload,
					result: { documentModelId, childRelationshipConfiguration }
				})
			);
			return result;
		}

		const linkIdentifier = TreeEngineState.NodePath.toLinkIdentifier(nodePath);
		if (!linkIdentifier) {
			throw TreeEngineError.NotFoundError("TreeEngine.Link", JSON.stringify(nodePath));
		}
		if (!parent) {
			throw TreeEngineError.NotFoundError("TreeEngine.ParentNode", JSON.stringify(nodePath));
		}
		const parentNodeModel = ModelSelector.nodeModel(parent.nodeIdentifier.type)(state);
		if (!parentNodeModel) {
			throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", parent.nodeIdentifier.type);
		}

		const childRelationshipConfiguration = parentNodeModel.childRelationshipConfigurations.find(
			(crc) => crc.relationshipModelRef === linkIdentifier.type
		);
		if (!childRelationshipConfiguration) {
			throw TreeEngineError.NotFoundError("TreeEngine.ChildRelationshipConfiguration", linkIdentifier.type);
		}

		const { relationshipModelRef } = childRelationshipConfiguration;
		const childEntityCharacteristic = ModelSelector.childEntityCharacteristic(childRelationshipConfiguration)(state);
		if (!childEntityCharacteristic) {
			throw TreeEngineError.NotFoundError("RelationshipModel.EntityCharacteristic", relationshipModelRef);
		}

		const dialogState: TreeEngineState.Dialog.InsertSiblingNode = {
			type: TreeEngineState.Dialog.Type.INSERT_SIBLING_NODE,
			insertPosition: action.payload.insertPosition,
			button: action.payload.button,
			options: [
				{
					childRelationshipConfiguration,
					documentModelId: childEntityCharacteristic.documentModel
				}
			]
		};
		api.dispatch(Commands.setDialogState({ state: dialogState }));
	}
	return result;
};
