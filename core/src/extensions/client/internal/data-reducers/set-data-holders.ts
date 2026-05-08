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

import { Activity, type ActivityActions, type ActivityReducers } from "@com.mgmtp.a12.client/client-core";

import { getRootNodesFromDataHolder } from "../../../server-connector/internal/shared.js";

import { TreeEngineActions } from "../actions.js";
import { TreeEngineDataHolder } from "../data-holder.js";
import { TreeTraverser } from "../utils.js";

/** @internal */
export const setDataHoldersDataReducer: ActivityReducers.DataReducer = {
	reduce(
		dataHolders: Activity.DataHolder[],
		action: ActivityActions.DataReducerAction,
		defaultDataHolder?: Activity.DataHolder
	): Activity.DataHolder[] {
		if (!TreeEngineActions.setDataHolders.match(action) || !defaultDataHolder) {
			return dataHolders;
		}
		const {
			dataHolders: updatedDataHolders,
			removedDataHolderDescriptors = [],
			removeUnusedDataHolders
		} = action.payload;

		const currentDataHolders: Activity.DataHolder[] = dataHolders ?? [];
		let nextDataHolders: Activity.DataHolder[] = [];

		const leftOverUpdatedDataHolders = [...updatedDataHolders];
		for (const currentDataHolder of currentDataHolders) {
			let nextDataHolder: Activity.DataHolder | undefined = currentDataHolder;
			for (let index = 0; index < leftOverUpdatedDataHolders.length; index++) {
				const updatedDataHolder = leftOverUpdatedDataHolders[index];
				if (Activity.DataHolder.hasDescriptor(updatedDataHolder.descriptor)(currentDataHolder)) {
					nextDataHolder = updatedDataHolder;
					leftOverUpdatedDataHolders.splice(index, 1);
					break;
				}
			}
			for (const removedDataHolderDescriptor of removedDataHolderDescriptors) {
				if (Activity.DataHolder.hasDescriptor(removedDataHolderDescriptor)(currentDataHolder)) {
					nextDataHolder = undefined;
				}
			}

			if (!nextDataHolder) {
				continue;
			}

			if (
				Activity.DataHolder.hasDescriptor(nextDataHolder.descriptor)(defaultDataHolder) &&
				nextDataHolder.loadingState === "loading"
			) {
				nextDataHolder = { ...nextDataHolder, loadingState: "loaded", busy: false };
			}
			nextDataHolders.push(nextDataHolder);
		}
		nextDataHolders.push(...leftOverUpdatedDataHolders);
		if (removeUnusedDataHolders) {
			nextDataHolders = cleanTreeEngineDataHolders(nextDataHolders, defaultDataHolder);
		}

		return nextDataHolders;
	}
};

function cleanTreeEngineDataHolders(
	dataHolders: Activity.DataHolder[],
	defaultDataHolder: Activity.DataHolder
): Activity.DataHolder[] {
	const visitedNodes: Record<string, boolean> = {};
	const treeDataHolders = dataHolders.filter(TreeEngineDataHolder.isAssignableFrom);
	const rootNodes = getRootNodesFromDataHolder(treeDataHolders, defaultDataHolder.descriptor);
	const treeTraverser = new TreeTraverser(treeDataHolders);

	rootNodes.forEach((node) =>
		treeTraverser.traverse(
			node,
			(node) => {
				visitedNodes[node.nodeIdentifier.id] = true;
			},
			{ shouldVisit: (node) => !visitedNodes[node.nodeIdentifier.id] }
		)
	);

	return dataHolders.filter((dataHolder) => {
		if (TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(dataHolder.descriptor)) {
			return visitedNodes[dataHolder.descriptor.source];
		}
		return true;
	});
}
