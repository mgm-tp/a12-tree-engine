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

import { type Activity } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineError } from "../../../../../core/error/index.js";
import { TreeModel, type RuntimeTreeModel } from "../../../../../core/models/index.js";
import { TreeEngineActivity, TreeEngineDataHolder } from "../../../../client/index.js";
import { TreeTraverser } from "../../../../client/internal/shared.js";
import { type BaseNode, extractChildNodesFromDataHolder } from "../../shared.js";
import { Identifier, ModelSelector, type ModelsState, TreeEngineState } from "../../../../../core/store/index.js";

/** @internal */
export function createRootNodeDataHolder(activity: Activity, uiModel: RuntimeTreeModel): TreeEngineDataHolder {
	const activityDescriptor = activity.descriptor;
	let rootNodesDataHolder: TreeEngineDataHolder;

	if (TreeEngineActivity.Descriptor.HiddenRootInstance.isAssignableFrom(activityDescriptor)) {
		const { rootInstance, rootRelationshipName, rootRelationshipRole } = activityDescriptor;
		rootNodesDataHolder = {
			descriptor: {
				type: "HIDDEN_ROOT_NODES",
				source: rootInstance,
				relationshipModel: rootRelationshipName,
				relationshipRole: rootRelationshipRole
			},
			savingState: "not_saved",
			loadingState: "loaded",
			dirty: false,
			data: {},
			slices: {}
		};
	} else {
		const expansionStrategy = uiModel.content.configuration.expansionStrategy;
		if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
			rootNodesDataHolder = {
				descriptor: { type: "ROOT_NODES" },
				savingState: "not_saved",
				loadingState: "loaded",
				dirty: false,
				data: {},
				slices: {}
			};
		} else {
			rootNodesDataHolder = {
				descriptor: {
					type: "ROOT_NODES",
					relationshipModel: uiModel.content.configuration.root.relationshipModelRef,
					relationshipRole: uiModel.content.configuration.root.parentRole
				},
				savingState: "not_saved",
				loadingState: "loaded",
				dirty: false,
				data: {},
				slices: {}
			};
		}
	}

	return rootNodesDataHolder;
}

/** @internal */
export function createChildNodeDataHolders(
	node: BaseNode,
	modelsState: ModelsState,
	hiddenRootNodeDescriptor?: TreeEngineDataHolder.Descriptor.HiddenRootNodes
): TreeEngineDataHolder[] {
	const childNodeDataHolders: TreeEngineDataHolder[] = [];

	if (
		hiddenRootNodeDescriptor &&
		Identifier.areEqual(Identifier.from(hiddenRootNodeDescriptor.source), node.nodeIdentifier)
	) {
		childNodeDataHolders.push({
			descriptor: hiddenRootNodeDescriptor,
			savingState: "not_saved",
			loadingState: "loaded",
			dirty: false,
			data: {},
			slices: {}
		});
		return childNodeDataHolders;
	}

	const uiModel = ModelSelector.uiModel()(modelsState);
	if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(uiModel.content.configuration.expansionStrategy)) {
		childNodeDataHolders.push({
			descriptor: {
				type: "CHILD_NODES",
				source: node.nodeIdentifier.id
			},
			savingState: "not_saved",
			loadingState: "missing",
			dirty: false,
			data: {},
			slices: {}
		});
		return childNodeDataHolders;
	}

	const nodeModel = ModelSelector.nodeModel(node.nodeIdentifier.type)(modelsState);
	nodeModel?.childRelationshipConfigurations.forEach(({ relationshipModelRef, parentRole }) => {
		childNodeDataHolders.push({
			descriptor: {
				type: "CHILD_NODES",
				relationshipModel: relationshipModelRef,
				relationshipRole: parentRole,
				source: node.nodeIdentifier.id
			},
			savingState: "not_saved",
			loadingState: "loaded",
			dirty: false,
			data: {},
			slices: {}
		});
	});

	return childNodeDataHolders;
}

/** @internal */
export function calculateCurrentExpansionDepths(
	dataHolders: TreeEngineDataHolder[],
	models: ModelsState
): TreeModel.ExpansionStrategy.Tree.ExpansionDepth[] {
	const uiModel = ModelSelector.uiModel()(models);
	if (!TreeModel.ExpansionStrategy.Tree.isAssignableFrom(uiModel.content.configuration.expansionStrategy)) {
		return [];
	}

	const defaultExpansionDepth = uiModel.content.configuration.expansionStrategy.expansionDepths;
	let expansionDepths: TreeModel.ExpansionStrategy.Tree.ExpansionDepth[] = defaultExpansionDepth.map(
		(expansionDepth) => ({ ...expansionDepth, maxDepth: 0 })
	);

	const rootDataHolder = dataHolders.find((dataHolder) => {
		return (
			TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(dataHolder.descriptor) ||
			TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(dataHolder.descriptor)
		);
	});
	if (!rootDataHolder) {
		throw TreeEngineError.NotFoundError("TreeEngine.DataHolder", { id: "Root data holder" });
	}
	const rootNodes = extractChildNodesFromDataHolder(rootDataHolder);
	const traverser = new TreeTraverser(dataHolders);

	rootNodes.forEach((rootNode) => {
		traverser.traverse(rootNode, (node) => {
			const relationshipModel = TreeEngineState.NodePath.toLinkIdentifier(node.nodePath)?.type;
			expansionDepths = expansionDepths.map((expansionDepth) => {
				if (expansionDepth.relationshipModel === relationshipModel && expansionDepth.maxDepth < node.nodePath.length) {
					return { ...expansionDepth, maxDepth: node.nodePath.length };
				}
				return expansionDepth;
			});
		});
	});

	return expansionDepths;
}
