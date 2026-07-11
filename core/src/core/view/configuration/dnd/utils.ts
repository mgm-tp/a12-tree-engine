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

import { DataSelector } from "../../../store/selectors/data.js";
import { type DataState, Identifier, type ModelsState, TreeEngineState } from "../../../store/store.js";
import { ModelSelector } from "../../../store/selectors/models.js";
import { type FlattenNodeRow, RootNodeRow } from "../../components/tree-engine/sub-components/types.js";

/** @internal */
export namespace DndUtils {
	export function selectLastNodeRow(engineState: DataState & ModelsState): FlattenNodeRow | undefined {
		const { children: childrenNodePaths, identifier: rootNodeIdentifier } = DataSelector.root()(engineState);

		if (!childrenNodePaths.length || !rootNodeIdentifier) {
			return undefined;
		}

		const lastChildNodePath = childrenNodePaths[childrenNodePaths.length - 1];

		const lastNodeIdentifier = DataSelector.findNodeIdentifierFromOtherSide(
			lastChildNodePath,
			rootNodeIdentifier
		)(engineState);

		const lastNodeModel = ModelSelector.nodeModel(lastNodeIdentifier?.type ?? "")(engineState);

		if (!lastNodeIdentifier || !lastNodeModel) {
			return undefined;
		}
		const lastNode = DataSelector.node(lastNodeIdentifier)(engineState);

		return {
			id: TreeEngineState.NodePath.toString([rootNodeIdentifier, lastChildNodePath]),
			data: {
				nodeIdentifier: lastNodeIdentifier,
				nodePath: [rootNodeIdentifier, lastChildNodePath]
			},
			nodeModel: lastNodeModel,
			level: 0,
			parent: RootNodeRow.create(),
			rowIndex: childrenNodePaths.length - 1,
			childrenCount: lastNode?.children.length ?? 0
		};
	}

	export function isCircular(row: FlattenNodeRow): boolean {
		const nodeIdentifier = row.data.nodeIdentifier;
		let parentNode = row.parent;

		while (parentNode) {
			if (isCircular(parentNode)) {
				return true;
			}

			if (Identifier.areEqual(parentNode.data.nodeIdentifier, nodeIdentifier)) {
				return true;
			}
			parentNode = parentNode.parent;
		}
		return false;
	}
}
