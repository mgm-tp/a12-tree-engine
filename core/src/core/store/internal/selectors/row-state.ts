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

import { type RuntimeTreeModel } from "../../../models/index.js";

import { TreeEngineState } from "../store.js";

import { DataSelector } from "./data.js";
import { ModelSelector } from "./models.js";
import { createSelector, type Selector } from "./selector.js";
import { UIStateSelector } from "./ui-state.js";

export interface RowState {
	node?: TreeEngineState.Node;
	link?: TreeEngineState.Link;
	nodeModel: RuntimeTreeModel.TreeNode;
	uiState: UIStateSelector.NodeState;
}

export namespace RowStateSelector {
	export function rowState(params: DataSelector.RelativeNodeParams): Selector<RowState | undefined, TreeEngineState> {
		const { nodeIdentifier, nodePath } = params;
		const linkIdentifier = TreeEngineState.NodePath.toLinkIdentifier(nodePath) ?? { type: "unknown", id: "unknown" };
		return (state) =>
			rowStateReselect(
				state,
				nodeIdentifier.type,
				nodeIdentifier.id,
				linkIdentifier.type,
				linkIdentifier.id,
				TreeEngineState.NodePath.toString(nodePath)
			);
	}
	const rowStateReselect = createSelector(
		[
			(state, nodeType: string) => ModelSelector.nodeModel(nodeType)(state),
			(state, nodeType: string, nodeId: string) => DataSelector.node({ type: nodeType, id: nodeId })(state),
			(state, _, __, relationshipName: string, relationshipId: string) => {
				return DataSelector.link({ type: relationshipName, id: relationshipId })(state);
			},
			(state, nodeType: string, nodeId: string, _, __, pathToNode: string) => {
				return UIStateSelector.nodeState(
					{ type: nodeType, id: nodeId },
					TreeEngineState.NodePath.fromString(pathToNode)
				)(state);
			}
		],
		(nodeModel, node, link, uiState) => {
			if (!nodeModel) {
				return undefined;
			}
			return { nodeModel, node, link, uiState };
		}
	);
}
