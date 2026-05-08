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

import { type SagaGenerator, call, put, select } from "typed-redux-saga";

import { Activity, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";
import { type Relationship } from "@com.mgmtp.a12.dataservices/dataservices-access";

import {
	TreeEngineActions,
	TreeEngineDataHolder,
	type TreeEngineOperation,
	TreeEngineSelectors
} from "../../../../client/index.js";
import {
	Commands,
	Identifier,
	ModelSelector,
	TreeDataUtils,
	TreeEngineState
} from "../../../../../core/store/index.js";
import { findNextNode, getCurrentNode, type Mutable } from "../../../../client/internal/shared.js";
import { TreeEngineError } from "../../../../../core/error/index.js";
import { type BaseNode } from "../../shared.js";
import { LinkDescriptorUtils, TreeModel } from "../../../../../core/models/index.js";

import { createTreeQueries } from "../resolver/create-queries.js";
import { handleLoad } from "../resolver/handle-load.js";
import { type BasePayload, type LoadPayload, mergeDataHolders } from "../utils.js";

import { createChildNodeDataHolders } from "./utils.js";

/** @internal */
export function* handleExpandToNode(
	params: LoadPayload & { operation: TreeEngineOperation.ExpandToNode; preloadChildNodes?: boolean }
): SagaGenerator<TreeEngineDataHolder[]> {
	const {
		config: { activityId },
		operation
	} = params;
	const { nodePath, nodesFromNodePath } = operation.payload;
	const dataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	return yield* call(expandToNode, {
		...params,
		activityId,
		nodePath,
		nodesFromNodePath,
		dataHolders: dataHolders ?? []
	});
}

/** @internal */
export function* expandToNode(
	params: {
		activityId: string;
		dataHolders: TreeEngineDataHolder[];
		nodePath: TreeEngineState.NodePath;
		nodesFromNodePath?: Identifier[];
		preloadChildNodes?: boolean;
	} & BasePayload
): SagaGenerator<TreeEngineDataHolder[]> {
	const { activityId, dataHolders, nodePath, nodesFromNodePath, preloadChildNodes } = params;

	const hiddenRootNodeDescriptor = params.dataHolders
		.map((dh) => dh.descriptor)
		.find(TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom);

	const activity = yield* select(ActivitySelectors.activityById(activityId));
	if (!activity) {
		throw TreeEngineError.NotFoundError("Activity", { activityId });
	}
	const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const isPaginatedTree = yield* select(TreeEngineSelectors.isPaginatedTree(activityId));

	const expandedNodes: Mutable<TreeEngineState.ExpandedNodes> = { ...uiState.expandedNodes };

	let updatedDataHolders = [...dataHolders];
	const notPreloadedDataHolders: TreeEngineDataHolder[] = [];

	const uiModel = modelsState ? ModelSelector.uiModel()(modelsState) : undefined;
	if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(uiModel?.content.configuration.expansionStrategy)) {
		const expansionDepthsMap = new Map<string, TreeModel.ExpansionStrategy.Tree.ExpansionDepth>();

		const currentPath: TreeEngineState.NodePath = [];
		for (const linkIdentifier of nodePath) {
			currentPath.push(linkIdentifier);
			expandedNodes[TreeEngineState.NodePath.toString(currentPath)] = {};

			if (!ModelSelector.relationshipModelByName(linkIdentifier.type)(modelsState)) {
				continue;
			}
			const currentExpansionDepth = expansionDepthsMap.get(linkIdentifier.type);
			if (!currentExpansionDepth || currentPath.length > currentExpansionDepth.maxDepth) {
				expansionDepthsMap.set(linkIdentifier.type, {
					relationshipModel: linkIdentifier.type,
					maxDepth: currentPath.length
				});
			}
		}
		const expansionDepths = Array.from(expansionDepthsMap.values());
		const createQueriesResult = createTreeQueries(updatedDataHolders, modelsState, {
			overrideExpansionDepths: expansionDepths,
			preloadChildNodes
		});
		updatedDataHolders = yield* call(handleLoad, { ...params, createQueriesResult });
	} else if (nodesFromNodePath) {
		// Once nodes from node path is given, only a single call of {@link handleLoad} is needed
		const dataHoldersToLoad: TreeEngineDataHolder[] = [];
		for (let index = 0; index < nodesFromNodePath.length; index++) {
			const currentNode = iterate(nodePath, nodesFromNodePath, index);
			expandedNodes[TreeEngineState.NodePath.toString(currentNode.nodePath)] = {};

			const existedDatHolders = updatedDataHolders.filter(
				({ descriptor }) => descriptor.source === currentNode.nodeIdentifier.id
			);
			if (existedDatHolders.length === 0) {
				dataHoldersToLoad.push(...createChildNodeDataHolders(currentNode, modelsState, hiddenRootNodeDescriptor));
			} else if (isPaginatedTree) {
				// If pagination is enabled, always try to load existing dataHolders
				dataHoldersToLoad.push(...existedDatHolders);
			}
		}

		const result = yield* call(handleLoad, { ...params, dataHolders: dataHoldersToLoad, ignorePagination: true });

		updatedDataHolders.push(...result);

		if (preloadChildNodes) {
			for (let index = 0; index < nodesFromNodePath.length; index++) {
				const currentNode = iterate(nodePath, nodesFromNodePath, index);
				const dataHoldersToPreload = findNextChildNodes(currentNode, updatedDataHolders).map((nextChildNode) => {
					return createChildNodeDataHolders(nextChildNode, modelsState, hiddenRootNodeDescriptor);
				});
				notPreloadedDataHolders.push(...dataHoldersToPreload.flat());
			}
		}
	} else {
		/**
		 * Or else, a loop is necessary to load level by level
		 */
		let { currentNode, currentIndex } = getCurrentNode(nodePath, activity, dataHolders);
		while (currentIndex < nodePath.length - 1) {
			expandedNodes[TreeEngineState.NodePath.toString(currentNode.nodePath)] = {};

			let nextNode = findNextNode(currentNode, nodePath[currentIndex + 1], updatedDataHolders);
			if (!nextNode) {
				const childNodeDataHolders = createChildNodeDataHolders(currentNode, modelsState, hiddenRootNodeDescriptor);
				const result = yield* call(handleLoad, {
					...params,
					// If pagination is enabled and nextNode is not found, always try to load all children of that node
					dataHolders: childNodeDataHolders.filter((dataHolder) => {
						if (isPaginatedTree) {
							return true;
						}
						return updatedDataHolders.every(Activity.DataHolder.hasNotDescriptor(dataHolder.descriptor));
					}),
					ignorePagination: true
				});

				updatedDataHolders = mergeDataHolders(updatedDataHolders, result);
				nextNode = findNextNode(currentNode, nodePath[currentIndex + 1], updatedDataHolders);
				if (!nextNode) {
					throw TreeEngineError.ExpandNodeError();
				}
			}

			if (preloadChildNodes) {
				const dataHoldersToPreload = findNextChildNodes(currentNode, updatedDataHolders).map((nextChildNode) => {
					return createChildNodeDataHolders(nextChildNode, modelsState, hiddenRootNodeDescriptor);
				});
				notPreloadedDataHolders.push(...dataHoldersToPreload.flat());
			}

			currentIndex++;
			currentNode = nextNode;
		}
	}

	let preloadedDataHolders: TreeEngineDataHolder[] = [];
	const dataHoldersToPreload = notPreloadedDataHolders.filter((dataHolder) =>
		updatedDataHolders.every((dh) => Activity.DataHolder.hasNotDescriptor(dh.descriptor)(dataHolder))
	);
	if (dataHoldersToPreload.length > 0) {
		preloadedDataHolders = yield* call(handleLoad, {
			...params,
			dataHolders: dataHoldersToPreload
		});
	}

	yield* put(
		TreeEngineActions.command({ activityId, engineAction: Commands.setExpandedNodes({ nodes: expandedNodes }) })
	);

	return [...updatedDataHolders, ...preloadedDataHolders];
}

function findNextChildNodes(node: BaseNode, dataHolders: Activity.DataHolder[]): BaseNode[] {
	const linkRefs: [Identifier, Relationship.LinkRefResponse][] = [];
	for (const dataHolder of dataHolders) {
		if (
			!TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(dataHolder.descriptor) &&
			!TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(dataHolder.descriptor)
		) {
			continue;
		}
		if (Identifier.areEqual(Identifier.from(dataHolder.descriptor.source), node.nodeIdentifier)) {
			const childIdentifiers = TreeEngineDataHolder.Meta.fromSlices(dataHolder.slices)?.children ?? [];
			for (const childIdentifier of childIdentifiers) {
				const linkRef = TreeDataUtils.readLinkData(dataHolder.data ?? {}, childIdentifier)?.linkRef;
				if (linkRef) {
					linkRefs.push([childIdentifier, linkRef]);
				}
			}
		}
	}

	const nextNodes: BaseNode[] = [];

	for (const [linkIdentifier, linkRef] of linkRefs) {
		const nodeIdentifier = LinkDescriptorUtils.getNodeIdentifierFromOtherSide(
			linkRef.linkDescriptor,
			node.nodeIdentifier
		);
		if (!nodeIdentifier) {
			break;
		}
		nextNodes.push({
			nodeIdentifier: nodeIdentifier,
			nodePath: [...node.nodePath, linkIdentifier]
		});
	}

	return nextNodes;
}

function iterate(nodePath: TreeEngineState.NodePath, nodesFromNodePath: Identifier[], index: number): BaseNode {
	const currentNodeIdentifier = nodesFromNodePath[index];
	const currentNodePath = nodePath.slice(0, index);
	const currentNode: BaseNode = { nodeIdentifier: currentNodeIdentifier, nodePath: currentNodePath };
	return currentNode;
}
