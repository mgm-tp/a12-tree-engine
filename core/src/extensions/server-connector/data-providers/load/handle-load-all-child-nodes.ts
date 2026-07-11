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

import { type SagaGenerator, call, select } from "typed-redux-saga";

import { Activity, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { Identifier, type ModelsState } from "../../../../core/store/store.js";
import { ModelSelector } from "../../../../core/store/selectors/models.js";
import { TreeEngineDataHolder } from "../../../client/data-holder.js";
import type { TreeEngineOperation } from "../../../client/operation.js";
import { TreeEngineSelectors } from "../../../client/selectors.js";
import { TreeTraverser } from "../../../client/shared.js";
import {
	type BaseNode,
	extractChildNodesFromDataHolder,
	findRootNodeDataHolder,
	getRootNodesFromDataHolder
} from "../../shared.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { TreeModel } from "../../../../core/models/tree-model.js";

import { handleLoad } from "../resolver/handle-load.js";
import { type BasePayload, type LoadPayload, mergeDataHolders } from "../utils.js";

import { createChildNodeDataHolders } from "./utils.js";

/** @internal */
export type BaseNodeWithParent = BaseNode & { parent?: BaseNodeWithParent };
type NodeWithDataHolders = { node: BaseNodeWithParent; dataHolders: TreeEngineDataHolder[] };
type LoadNodeMap = Record<string, BaseNodeWithParent & { loaded: boolean }>;

/** @internal */
export type LoadResult = { updatedDataHolders: TreeEngineDataHolder[]; loadedNodes: BaseNode[] };

/** @internal */
export function* handleLoadAllChildNodes({
	config,
	operation,
	dataLoader
}: LoadPayload & { operation: TreeEngineOperation.LoadAllChildNodes }): SagaGenerator<TreeEngineDataHolder[]> {
	const { activityId } = config;

	let currentLevel = operation.payload.level ?? Infinity;

	const dataHolders: TreeEngineDataHolder[] = [];

	let nodes: BaseNode[] = operation.payload.nodes ?? [];
	// When nodes are not provided, attempt to load the whole tree from root until reaching the limit value
	if (!operation.payload.nodes) {
		const currentDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
		const activityDescriptor = yield* select(ActivitySelectors.activityPropById(activityId, (a) => a.descriptor));
		if (!activityDescriptor || !currentDataHolders) {
			throw TreeEngineError.NotFoundError("Activity", { activityId });
		}

		const rootDataHolder = findRootNodeDataHolder(currentDataHolders);
		const result = yield* call(handleLoad, {
			dataHolders: [rootDataHolder],
			activityId,
			dataLoader,
			ignorePagination: operation.payload.ignorePagination
		});
		dataHolders.push(...result);
		nodes = getRootNodesFromDataHolder(result, activityDescriptor);
		currentLevel--;
	}

	const result = yield* call(loadAllChildNodes, {
		...operation.payload,
		activityId,
		dataHolders,
		dataLoader,
		nodes,
		shouldLoadNextLevel: () => {
			currentLevel -= 1;
			return currentLevel >= 0;
		}
	});

	return result.updatedDataHolders;
}

/** @internal */
export function* loadAllChildNodes(
	params: BasePayload &
		TreeEngineOperation.LoadAllChildNodes.Payload & {
			activityId: string;
			dataHolders: TreeEngineDataHolder[];
			nodes: BaseNode[];
			getAffectedNodes?: (node: BaseNodeWithParent[]) => BaseNodeWithParent[] | undefined;
			shouldLoadNextLevel?: () => boolean;
			preloadChildNodes?: boolean;
			overrideTreeExpansionDepths?: TreeModel.ExpansionStrategy.Tree.ExpansionDepth[];
		}
): SagaGenerator<LoadResult> {
	const { activityId } = params;
	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const uiModel = ModelSelector.uiModel()(modelsState);
	if (TreeModel.ExpansionStrategy.Tree.isAssignableFrom(uiModel.content.configuration.expansionStrategy)) {
		return yield* loadAllChildNodesWithTreeQuery(params);
	} else {
		return yield* loadAllChildNodesWithListQuery(params);
	}
}

function* loadAllChildNodesWithTreeQuery(
	params: BasePayload &
		TreeEngineOperation.LoadAllChildNodes.Payload & {
			activityId: string;
			dataHolders: TreeEngineDataHolder[];
			nodes: BaseNode[];
			shouldLoadNextLevel?: () => boolean;
			getAffectedNodes?: (node: BaseNodeWithParent[]) => BaseNodeWithParent[] | undefined;
			preloadChildNodes?: boolean;
			overrideTreeExpansionDepths?: TreeModel.ExpansionStrategy.Tree.ExpansionDepth[];
		}
): SagaGenerator<LoadResult> {
	const {
		dataLoader,
		nodes,
		shouldLoadNextLevel,
		activityId,
		preloadChildNodes,
		getAffectedNodes,
		overrideTreeExpansionDepths
	} = params;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	const dataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	if (!engineState || !dataHolders) {
		throw TreeEngineError.NotFoundError("Activity", { activityId });
	}

	const dataHolderBySource = new Map<string, TreeEngineDataHolder>();
	let hiddenRootDescriptor: TreeEngineDataHolder.Descriptor.HiddenRootNodes | undefined;
	// The fallback dataHolder from params will take effect on initial load
	for (const dataHolder of [...params.dataHolders]) {
		if (TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(dataHolder.descriptor)) {
			hiddenRootDescriptor = dataHolder.descriptor;
		}
		if (dataHolder.descriptor.source) {
			dataHolderBySource.set(dataHolder.descriptor.source, dataHolder);
		}
	}

	const loadedNodes: BaseNode[] = [];
	let updatedDataHolders: TreeEngineDataHolder[] = params.dataHolders;
	let nextNodes = nodes;

	do {
		const toBeLoadedNodes = getAffectedNodes?.(nextNodes) ?? nextNodes;
		if (toBeLoadedNodes.length === 0) {
			break;
		}

		const dataHolders: TreeEngineDataHolder[] = toBeLoadedNodes.flatMap((node) =>
			createChildNodeDataHolders(node, engineState, hiddenRootDescriptor)
		);

		const loadedDataHolders = yield* call(handleLoad, {
			dataHolders,
			activityId,
			dataLoader,
			preloadChildNodes,
			overrideTreeExpansionDepths
		});

		for (const dataHolder of loadedDataHolders) {
			if (dataHolder.descriptor.source) {
				dataHolderBySource.set(dataHolder.descriptor.source, dataHolder);
			}
		}
		updatedDataHolders = mergeDataHolders(updatedDataHolders, loadedDataHolders);

		nextNodes = [];
		traverseNodes(toBeLoadedNodes, (childNode) => {
			const { id, type } = childNode.nodeIdentifier;
			const existingDataHolder = dataHolderBySource.get(id);
			if (existingDataHolder) {
				// Mark the loaded node
				loadedNodes.push(childNode);
			} else if (ModelSelector.nodeModel(type)(engineState)?.childRelationshipConfigurations.length !== 0) {
				// Otherwise include it for the next iteration, if it could potentially have a child
				nextNodes.push(childNode);
			}
		});
	} while (shouldLoadNextLevel?.() === true);

	return { loadedNodes, updatedDataHolders };

	function traverseNodes(nodes: BaseNode[], onVisit: (node: BaseNode) => void) {
		const traverser = new TreeTraverser(updatedDataHolders);
		nodes.forEach((node) => traverser.traverse(node, onVisit));
	}
}

function* loadAllChildNodesWithListQuery(
	params: BasePayload &
		TreeEngineOperation.LoadAllChildNodes.Payload & {
			activityId: string;
			dataHolders: TreeEngineDataHolder[];
			nodes: BaseNode[];
			getAffectedNodes?: (node: BaseNodeWithParent[]) => BaseNodeWithParent[] | undefined;
			shouldLoadNextLevel?: () => boolean;
			preloadChildNodes?: boolean;
		}
): SagaGenerator<LoadResult> {
	const { activityId, nodes, dataLoader, getAffectedNodes } = params;
	const { onlyLoadedNodes, ignorePagination, preloadChildNodes } = params;

	const nodesDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	const hiddenRootNodeDescriptor = nodesDataHolders
		?.map((dh) => dh.descriptor)
		.find(TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom);

	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	if (!modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
	}
	const loadedNodes: BaseNode[] = [];
	let toBeLoadedNodes: BaseNodeWithParent[] = [...nodes];
	const onlyLoadedNodesFilter = onlyLoadedNodes ? yield* call(getOnlyLoadedNodesFilter, activityId) : undefined;

	const updatedDataHolders = [...params.dataHolders];
	const loadNodeMap: LoadNodeMap = {};
	if (preloadChildNodes) {
		toBeLoadedNodes.forEach((node) => (loadNodeMap[node.nodeIdentifier.id] = { ...node, loaded: false }));
	}

	while (params.shouldLoadNextLevel?.() ?? true) {
		toBeLoadedNodes = getAffectedNodes?.(toBeLoadedNodes) ?? toBeLoadedNodes;
		toBeLoadedNodes = getNonCircularNodes(toBeLoadedNodes);
		toBeLoadedNodes = onlyLoadedNodesFilter ? toBeLoadedNodes.filter(onlyLoadedNodesFilter) : toBeLoadedNodes;

		if (preloadChildNodes) {
			toBeLoadedNodes.forEach((node) => (loadNodeMap[node.nodeIdentifier.id] = { ...node, loaded: true }));
		}

		if (toBeLoadedNodes.length === 0) {
			break;
		}

		const nodeWithDataHolders: NodeWithDataHolders[] = toBeLoadedNodes.map((node) => ({
			node,
			dataHolders: createChildNodeDataHolders(node, modelsState, hiddenRootNodeDescriptor)
		}));

		nodeWithDataHolders.forEach(({ node, dataHolders }) => {
			if (dataHolders.length > 0) {
				loadedNodes.push(node);
			}
		});

		const extractedDhs = extractDataHolders(nodeWithDataHolders, updatedDataHolders);
		const result = yield* call(handleLoad, { dataHolders: extractedDhs, activityId, dataLoader, ignorePagination });

		updatedDataHolders.push(...result);
		toBeLoadedNodes = getNextToBeLoadedNodes(nodeWithDataHolders, result);
		if (preloadChildNodes) {
			toBeLoadedNodes.forEach((node) => (loadNodeMap[node.nodeIdentifier.id] = { ...node, loaded: false }));
		}
	}

	if (preloadChildNodes) {
		const preloadResult = yield* call(preloadDataHolders, {
			loadNodeMap,
			updatedDataHolders,
			activityId,
			dataLoader,
			modelsState,
			hiddenRootNodeDescriptor
		});
		updatedDataHolders.push(...preloadResult);
	}

	return {
		loadedNodes,
		updatedDataHolders: updatedDataHolders.map<TreeEngineDataHolder>((dataHolder) => {
			if (TreeEngineDataHolder.isAssignableFrom(dataHolder)) {
				return { ...dataHolder, loadingState: "loaded", busy: false };
			}
			return dataHolder;
		})
	};
}

function* preloadDataHolders(
	params: {
		activityId: string;
		loadNodeMap: LoadNodeMap;
		updatedDataHolders: TreeEngineDataHolder[];
		modelsState: ModelsState;
		hiddenRootNodeDescriptor?: TreeEngineDataHolder.Descriptor.HiddenRootNodes;
	} & BasePayload
): SagaGenerator<TreeEngineDataHolder[]> {
	const { loadNodeMap, updatedDataHolders, activityId, dataLoader, modelsState, hiddenRootNodeDescriptor } = params;

	const unloadedNodes = getNonCircularNodes(Object.values(loadNodeMap).filter((node) => !node.loaded));
	const unloadedNodeWithDataHolders = unloadedNodes.map((node) => ({
		node,
		dataHolders: createChildNodeDataHolders(node, modelsState, hiddenRootNodeDescriptor)
	}));

	const dataHolders = extractDataHolders(unloadedNodeWithDataHolders, updatedDataHolders);
	return yield* call(handleLoad, { dataHolders, activityId, dataLoader });
}

function getNonCircularNodes(nodes: BaseNodeWithParent[]): BaseNode[] {
	return nodes.filter((node) => !isCircularNode(node));

	function isCircularNode(node: BaseNodeWithParent): boolean {
		let parentNode = node?.parent;
		while (parentNode) {
			if (Identifier.areEqual(parentNode.nodeIdentifier, node.nodeIdentifier)) {
				return true;
			}
			parentNode = parentNode.parent;
		}
		return false;
	}
}

function extractDataHolders(
	nodesWithDataHolders: NodeWithDataHolders[],
	updatedDataHolders: TreeEngineDataHolder[]
): TreeEngineDataHolder[] {
	const extractedDataHolders: TreeEngineDataHolder[] = [];

	for (const nodesWithDataHolder of nodesWithDataHolders) {
		for (const dataHolder of nodesWithDataHolder.dataHolders) {
			const isExtractedDataHolder = extractedDataHolders.some(Activity.DataHolder.hasDescriptor(dataHolder.descriptor));
			const isUpdatedDataHolder = updatedDataHolders.some(Activity.DataHolder.hasDescriptor(dataHolder.descriptor));
			if (!isExtractedDataHolder && !isUpdatedDataHolder) {
				extractedDataHolders.push(dataHolder);
			}
		}
	}
	return extractedDataHolders;
}

function getNextToBeLoadedNodes(
	nodeWithDataHolders: NodeWithDataHolders[],
	newDataHolders: TreeEngineDataHolder[]
): BaseNodeWithParent[] {
	const nextNodes: BaseNodeWithParent[] = [];
	nodeWithDataHolders.forEach(({ node, dataHolders }) => {
		dataHolders.forEach(({ descriptor }) => {
			const matchedDataHolder = newDataHolders.find(Activity.DataHolder.hasDescriptor(descriptor));
			if (matchedDataHolder) {
				const nextBaseNodes = extractChildNodesFromDataHolder(matchedDataHolder, node);
				nextNodes.push(...nextBaseNodes.map((childNode) => ({ ...childNode, parent: node })));
			}
		});
	});
	return nextNodes;
}

function* getOnlyLoadedNodesFilter(activityId: string): SagaGenerator<(node: BaseNode) => boolean> {
	const loadedNodesSet: Set<string> = new Set();
	const currentDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	currentDataHolders?.forEach(({ descriptor }) => {
		if (descriptor.source) {
			loadedNodesSet.add(descriptor.source);
		}
	});
	return (node) => loadedNodesSet.has(node.nodeIdentifier.id);
}
