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

import { type SagaGenerator } from "typed-redux-saga";

import { type Relationship, type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import { type Activity } from "@com.mgmtp.a12.client/client-core";

import { LinkDescriptorUtils, type TreeModel } from "../../../core/models/index.js";
import { type BaseNode, extractChildNodesFromDataHolder } from "../../server-connector/internal/shared.js";
import { DataSelector, Identifier, TreeDataUtils, type TreeEngineState } from "../../../core/store/index.js";
import { TreeEngineError } from "../../../core/error/index.js";

import { TreeEngineActivity, TreeEngineDataHolder } from "./data-holder.js";
import { TreeEngineSelectors } from "./selectors.js";

/** @internal */
export const logger = LoggerFactory.getLogger("TreeEngine");

/** @internal */
export function collectReferencedDocumentModels(uiModel: TreeModel, relationshipModels: RelationshipModel[]): string[] {
	const documentModels = new Set<string>();
	const { modelReferences } = uiModel.header;

	modelReferences.forEach(({ reference, modelType }) => {
		if (modelType === "document") {
			documentModels.add(reference);
		}
	});

	relationshipModels.forEach(({ header, content }) => {
		if (modelReferences.find(({ reference }) => reference === header.id) && content.linkDocumentModel) {
			documentModels.add(content.linkDocumentModel);
		}
	});

	return Array.from(documentModels);
}

/** @internal */
export class TreeTraverser {
	private dataHoldersMapping: Record<string, TreeEngineDataHolder[]> = {};
	private shouldVisit: (node: BaseNode) => boolean = () => true;

	constructor(dataHolders: TreeEngineDataHolder[], shouldVisit?: (node: BaseNode) => boolean) {
		dataHolders.forEach((dataHolder) => {
			if (TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(dataHolder.descriptor)) {
				this.dataHoldersMapping[dataHolder.descriptor.source] ??= [];
				this.dataHoldersMapping[dataHolder.descriptor.source].push(dataHolder);
			}
		});

		const dataState = TreeEngineSelectors.mergeDataHolders(dataHolders);
		this.shouldVisit = shouldVisit ?? ((node) => !DataSelector.isCircularPath(node.nodePath)(dataState));
	}

	// Go through all child nodes. A node will be visited as many times as it appears in Tree.
	// Has a built-in check to avoid circular paths, but also pose a limitation because of heavily rely on the input dataHolders.
	public traverse(
		node: BaseNode,
		handler: (node: BaseNode, childNodes?: BaseNode[]) => void,
		options?: { shouldVisit?(node: BaseNode): boolean }
	) {
		const shouldVisit = options?.shouldVisit ?? this.shouldVisit;

		if (!shouldVisit(node)) {
			return;
		}

		let childNodes: BaseNode[] | undefined;
		for (const nodeDataHolder of this.dataHoldersMapping[node.nodeIdentifier.id] ?? []) {
			const newChildNodes = extractChildNodesFromDataHolder(nodeDataHolder, node);
			if (!childNodes) {
				childNodes = newChildNodes;
			} else {
				childNodes.push(...extractChildNodesFromDataHolder(nodeDataHolder, node));
			}
		}

		handler(node, childNodes);

		for (const childNode of childNodes ?? []) {
			this.traverse(childNode, handler, options);
		}
	}

	public traverseDirectChildren(node: BaseNode, handler: (node: BaseNode) => void) {
		for (const nodeDataHolder of this.dataHoldersMapping[node.nodeIdentifier.id] ?? []) {
			extractChildNodesFromDataHolder(nodeDataHolder, node).forEach(handler);
		}
	}
}

export type MaybeAsync<T> = T | Promise<T> | SagaGenerator<T>;

/**
 * Turn the function that return a {@link MaybeAsync} into a type-safe & compatible version of typed-redux-saga
 */
export function maybeAsyncFnWrapper<ReturnType, Params extends unknown[]>(
	fn: (...params: Params) => MaybeAsync<ReturnType>
): (...params: Params) => SagaGenerator<ReturnType> {
	return (...params) => fn(...params) as SagaGenerator<ReturnType>;
}

/** @internal */
export function findNextNode(
	node: BaseNode,
	linkIdentifier: Identifier,
	dataHolders: Activity.DataHolder[]
): BaseNode | undefined {
	let linkRef: Relationship.LinkRefResponse | undefined;
	for (const dataHolder of dataHolders) {
		if (
			!TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(dataHolder.descriptor) &&
			!TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(dataHolder.descriptor)
		) {
			continue;
		}

		if (Identifier.areEqual(Identifier.from(dataHolder.descriptor.source), node.nodeIdentifier)) {
			linkRef = dataHolder.data ? TreeDataUtils.readLinkData(dataHolder.data, linkIdentifier)?.linkRef : undefined;
			if (linkRef) {
				break;
			}
		}
	}
	if (!linkRef) {
		return undefined;
	}
	const nextNode = LinkDescriptorUtils.getNodeIdentifierFromOtherSide(linkRef.linkDescriptor, node.nodeIdentifier);
	if (!nextNode) {
		return undefined;
	}
	return {
		nodeIdentifier: nextNode,
		nodePath: [...node.nodePath, linkIdentifier]
	};
}

/** @internal */
export function getCurrentNode(
	nodePath: TreeEngineState.NodePath,
	activity: Activity,
	dataHolders: TreeEngineDataHolder[]
): { currentNode: BaseNode; currentIndex: number } {
	let startNode: BaseNode = { nodeIdentifier: nodePath[0], nodePath: [nodePath[0]] };
	if (TreeEngineActivity.Descriptor.HiddenRootInstance.isAssignableFrom(activity.descriptor)) {
		const nextNode = findNextNode(startNode, nodePath[1], dataHolders);
		if (!nextNode) {
			throw TreeEngineError.ExpandNodeError();
		}
		startNode = nextNode;
	}

	return { currentNode: startNode, currentIndex: startNode.nodePath.length - 1 };
}
