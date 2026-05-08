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

import { TreeEngineError } from "../../../error/index.js";
import { LinkDescriptorUtils } from "../../../models/index.js";

import { type DataState, Identifier, TreeEngineState } from "../store.js";
import { TreeDataUtils } from "../utils.js";

import { createSelector, type Selector } from "./selector.js";

/**
 * These selector provide access to the data state in the store
 */
export namespace DataSelector {
	export function root(): Selector<TreeEngineState.Root, DataState> {
		return (state) => state.root;
	}

	export function data(): Selector<TreeEngineState.Data, DataState> {
		return (state) => state.data;
	}

	export function node(identifier: Identifier): Selector<TreeEngineState.Node | undefined, DataState> {
		return (state) => nodeReselect(state, identifier.type, identifier.id);
	}
	const nodeReselect = createSelector(
		[data(), (_, nodeType: string) => nodeType, (_, __, nodeId: string) => nodeId],
		(data, nodeType, nodeId) => {
			return TreeDataUtils.readNodeData(data, { type: nodeType, id: nodeId });
		}
	);

	export function link(identifier: Identifier): Selector<TreeEngineState.Link | undefined, DataState> {
		return (state) => linkReselect(state, identifier.type, identifier.id);
	}
	const linkReselect = createSelector(
		[data(), (_, relationshipName: string) => relationshipName, (_, __, relationshipId: string) => relationshipId],
		(data, relationshipName, relationshipId) => {
			return TreeDataUtils.readLinkData(data, { type: relationshipName, id: relationshipId });
		}
	);

	export function nodesFromNodePath(nodePath: TreeEngineState.NodePath): Selector<Identifier[] | undefined, DataState> {
		return (state) => nodesFromNodePathReselect(state, TreeEngineState.NodePath.toString(nodePath));
	}
	const nodesFromNodePathReselect = createSelector(
		[data(), root(), (_, nodePath: string) => nodePath],
		(data, root, pathToNode) => {
			const nodePath = TreeEngineState.NodePath.fromString(pathToNode);
			if (nodePath.length === 0) {
				return [];
			}
			const [rootIdentifier, ...linkIdentifiers] = nodePath;
			const parents: Identifier[] = [rootIdentifier];
			for (const linkIdentifier of linkIdentifiers) {
				const nextNode = findNodeIdentifierFromOtherSide(linkIdentifier, parents[parents.length - 1])({ data, root });
				if (!nextNode) {
					return undefined;
				}
				parents.push(nextNode);
			}
			return parents;
		}
	);

	/** @internal */
	export function isCircularPath(nodePath: TreeEngineState.NodePath): Selector<boolean, DataState> {
		return (state) => isCircularPathReselect(state, TreeEngineState.NodePath.toString(nodePath));
	}
	const isCircularPathReselect = createSelector(
		[(state, nodePath: string) => nodesFromNodePathReselect(state, nodePath)],
		(identifiers = []) => {
			return new Set(identifiers.map(Identifier.toString)).size < identifiers.length;
		}
	);

	export function nodeIdentifierFromNodePath(
		nodePath: TreeEngineState.NodePath
	): Selector<Identifier | undefined, DataState> {
		return (state) => nodeIdentifierFromNodePathReselect(state, TreeEngineState.NodePath.toString(nodePath));
	}
	const nodeIdentifierFromNodePathReselect = createSelector(
		[(state, nodePath: string) => nodesFromNodePathReselect(state, nodePath)],
		(identifiers) => {
			if (!identifiers || identifiers.length === 0) {
				return undefined;
			}
			return identifiers[identifiers.length - 1];
		}
	);

	export interface RelativeNodeParams {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	}
	export interface RelativeNodeReturnedType {
		nodeIdentifier: Identifier;
		linkIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	}

	export function parent(params: RelativeNodeParams): Selector<RelativeNodeReturnedType | undefined, DataState> {
		const { nodePath, nodeIdentifier } = params;
		return (state) => parentReselect(state, nodeIdentifier, nodePath);
	}
	const parentReselect = createSelector(
		[
			(state, nodeIdentifier: Identifier, nodePath: TreeEngineState.NodePath) => {
				const linkIdentifier = TreeEngineState.NodePath.toLinkIdentifier(nodePath);
				if (linkIdentifier) {
					return findNodeIdentifierFromOtherSide(linkIdentifier, nodeIdentifier)(state);
				}
				return undefined;
			},
			(_, __, nodePath: TreeEngineState.NodePath) => nodePath
		],
		(parentNodeIdentifier, nodePath) => {
			const parentNodePath = TreeEngineState.NodePath.getParentNodePath(nodePath);
			const parentLinkIdentifier = TreeEngineState.NodePath.toLinkIdentifier(nodePath);
			if (parentLinkIdentifier && parentNodeIdentifier && parentNodePath) {
				return {
					nodeIdentifier: parentNodeIdentifier,
					linkIdentifier: parentLinkIdentifier,
					nodePath: parentNodePath
				};
			}
			return undefined;
		}
	);

	export function predecessor(
		params: RelativeNodeParams & { nodeIndex?: number }
	): Selector<RelativeNodeReturnedType | undefined, DataState> {
		return (state) =>
			siblingReselect(
				state,
				params.nodeIdentifier.type,
				params.nodeIdentifier.id,
				TreeEngineState.NodePath.toString(params.nodePath),
				params.nodeIndex,
				true
			);
	}
	export function successor(
		params: RelativeNodeParams & { nodeIndex?: number }
	): Selector<RelativeNodeReturnedType | undefined, DataState> {
		return (state) =>
			siblingReselect(
				state,
				params.nodeIdentifier.type,
				params.nodeIdentifier.id,
				TreeEngineState.NodePath.toString(params.nodePath),
				params.nodeIndex,
				false
			);
	}
	const siblingReselect = createSelector(
		[
			data(),
			root(),
			(_, nodeType: string) => nodeType,
			(_, __, nodeId: string) => nodeId,
			(_, __, ___, nodePath: string) => nodePath,
			(_, __, ___, ____, nodeIndex?: number) => nodeIndex,
			(_, __, ___, ____, _____, predecessor?: boolean) => predecessor
		],
		(data, root, nodeType, nodeId, pathToNode, targetedNodeIndex, predecessor) => {
			const nodeIdentifier = { type: nodeType, id: nodeId };
			const nodePath = TreeEngineState.NodePath.fromString(pathToNode);

			const childLinkIdentifier = TreeEngineState.NodePath.toLinkIdentifier(nodePath);
			if (!childLinkIdentifier) {
				return undefined;
			}

			const parent = DataSelector.parent({ nodePath, nodeIdentifier })({ data, root });
			const parentNode = parent ? DataSelector.node(parent.nodeIdentifier)({ data, root }) : undefined;
			if (!parent || !parentNode) {
				return undefined;
			}

			let childLinksOfParentNode: Identifier[];
			if (root.identifier && Identifier.areEqual(parentNode.identifier, root.identifier)) {
				childLinksOfParentNode = root.children;
			} else {
				childLinksOfParentNode = parentNode.children;
			}

			const nodeIndex =
				targetedNodeIndex ??
				childLinksOfParentNode.findIndex((identifier) => Identifier.areEqual(childLinkIdentifier, identifier));

			let targetIndex = -1;
			if (predecessor) {
				targetIndex = nodeIndex - 1;
			} else {
				targetIndex = nodeIndex + 1;
			}
			const targetLinkIdentifier = childLinksOfParentNode[targetIndex];
			if (!targetLinkIdentifier) {
				return undefined;
			}
			const targetNodeIdentifier = findNodeIdentifierFromOtherSide(
				targetLinkIdentifier,
				parentNode.identifier
			)({ data, root });
			if (!targetNodeIdentifier) {
				return undefined;
			}
			return {
				nodeIdentifier: targetNodeIdentifier,
				linkIdentifier: targetLinkIdentifier,
				nodePath: [...parent.nodePath, targetLinkIdentifier]
			} satisfies RelativeNodeReturnedType;
		}
	);

	export function childNodes({
		nodePath,
		nodeIdentifier
	}: RelativeNodeParams): Selector<RelativeNodeReturnedType[], DataState> {
		return (state) =>
			childNodesReselect(state, nodeIdentifier.type, nodeIdentifier.id, TreeEngineState.NodePath.toString(nodePath));
	}
	const childNodesReselect = createSelector(
		[
			data(),
			root(),
			(_, nodeType: string) => nodeType,
			(_, __, nodeId: string) => nodeId,
			(_, __, ___, nodePath: string) => nodePath
		],
		(data, root, nodeType, nodeId, pathToNode) => {
			const childNodes: RelativeNodeReturnedType[] = [];
			const nodeIdentifier = { type: nodeType, id: nodeId };
			const node = DataSelector.node(nodeIdentifier)({ data, root });

			if (root.identifier && Identifier.areEqual(nodeIdentifier, root.identifier)) {
				const rootIdentifier = root.identifier;
				return root.children.map((nodeIdentifier) => {
					const nodePath: TreeEngineState.NodePath = [rootIdentifier, nodeIdentifier];
					const linkIdentifier = nodeIdentifier;
					return { nodeIdentifier, nodePath, linkIdentifier };
				});
			}

			const nodePath = TreeEngineState.NodePath.fromString(pathToNode);
			for (const linkIdentifier of node?.children ?? []) {
				const childNode = findNodeIdentifierFromOtherSide(linkIdentifier, nodeIdentifier)({ data, root });
				if (childNode) {
					childNodes.push({ nodeIdentifier: childNode, linkIdentifier, nodePath: [...nodePath, linkIdentifier] });
				}
			}
			return childNodes;
		}
	);

	/** @internal */
	export function findNodeIdentifierFromOtherSide(
		linkIdentifier: Identifier,
		nodeIdentifier: Identifier
	): Selector<Identifier | undefined, DataState> {
		return (state) =>
			findNodeIdentifierFromOtherSideReselect(
				state,
				linkIdentifier.type,
				linkIdentifier.id,
				nodeIdentifier.type,
				nodeIdentifier.id
			);
	}

	const findNodeIdentifierFromOtherSideReselect = createSelector(
		[
			(state, relationshipName: string, relationshipId: string) =>
				DataSelector.link({ type: relationshipName, id: relationshipId })(state),
			(_, __, ___, nodeType: string) => nodeType,
			(_, __, ___, ____, nodeId: string) => nodeId
		],
		(link, nodeType, nodeId) => {
			if (!link) {
				return undefined;
			}
			return LinkDescriptorUtils.getNodeIdentifierFromOtherSide(link.linkRef.linkDescriptor, {
				type: nodeType,
				id: nodeId
			});
		}
	);

	export interface FlattenNode {
		identifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	}
	export function flattenNodes(): Selector<FlattenNode[], DataState> {
		return flattenNodesReselect;
	}
	const flattenNodesReselect = createSelector([DataSelector.data(), DataSelector.root()], (data, root) => {
		const dataState: DataState = { root, data };
		const flattenNodes: FlattenNode[] = [];

		const rootIdentifier = root.identifier;
		root.children.forEach((identifier) => {
			const link = TreeDataUtils.readLinkData(data, identifier);
			if (link && rootIdentifier) {
				const nodeIdentifier = LinkDescriptorUtils.getNodeIdentifierFromRootNode(
					link.linkRef.linkDescriptor,
					rootIdentifier
				);

				makeFlattenNode(flattenNodes, nodeIdentifier, [rootIdentifier, identifier]);
			} else {
				makeFlattenNode(flattenNodes, identifier, [identifier]);
			}
		});

		return flattenNodes;

		function makeFlattenNode(list: FlattenNode[], identifier: Identifier, nodePath: TreeEngineState.NodePath) {
			if (DataSelector.isCircularPath(nodePath)(dataState)) {
				return;
			}
			list.push({ identifier, nodePath });

			const node = TreeDataUtils.readNodeData(data, identifier);
			node?.children.forEach((linkIdentifier) => {
				const link = TreeDataUtils.readLinkData(data, linkIdentifier);
				if (!link) {
					throw TreeEngineError.NotFoundError("TreeEngine.Link", { id: linkIdentifier.id });
				}

				const nodeIdentifierFromOtherSide = LinkDescriptorUtils.getNodeIdentifierFromOtherSide(
					link.linkRef.linkDescriptor,
					identifier
				);
				if (!nodeIdentifierFromOtherSide) {
					throw TreeEngineError.NotFoundError("TreeEngine.Node", { id: identifier.id });
				}
				makeFlattenNode(list, nodeIdentifierFromOtherSide, [...nodePath, linkIdentifier]);
			});
		}
	});

	export function nodePaths(docRef: string, stopOnFound = false): Selector<TreeEngineState.NodePath[], DataState> {
		return (state) => nodePathsReselect(state, docRef, stopOnFound);
	}

	const nodePathsReselect = createSelector(
		[data(), root(), (_, docRef: string) => docRef, (_, __, stopOnFound: boolean) => stopOnFound],
		(data, root, docRef, stopOnFound) => {
			const targetIdentifier = Identifier.from(docRef);
			const result: TreeEngineState.NodePath[] = [];
			const rootIdentifier = root.identifier;

			if (rootIdentifier && Identifier.areEqual(rootIdentifier, targetIdentifier)) {
				return [];
			}

			root.children.forEach((identifier) => {
				const link = DataSelector.link(identifier)({ data, root });
				// Hidden root case
				if (link && rootIdentifier) {
					const nodeIdentifier = LinkDescriptorUtils.getNodeIdentifierFromRootNode(
						link.linkRef.linkDescriptor,
						rootIdentifier
					);
					traverse([rootIdentifier, identifier], nodeIdentifier);
				} else {
					traverse([identifier], identifier);
				}
			});

			function traverse(nodePath: TreeEngineState.NodePath, nodeIdentifier: Identifier): void {
				if (DataSelector.isCircularPath(nodePath)({ data, root })) {
					return;
				}

				if (stopOnFound && result.length) {
					return;
				}

				const node = DataSelector.node(nodeIdentifier)({ data, root });
				if (!node) {
					throw TreeEngineError.NotFoundError("TreeEngine.Node", nodeIdentifier.id);
				}

				if (Identifier.areEqual(nodeIdentifier, targetIdentifier)) {
					result.push(nodePath);
					return;
				}

				DataSelector.childNodes({ nodePath, nodeIdentifier })({ data, root }).forEach((childNode) => {
					traverse([...nodePath, childNode.linkIdentifier], childNode.nodeIdentifier);
				});
			}

			return result;
		}
	);

	export function nodePath(docRef: string): Selector<TreeEngineState.NodePath | undefined, DataState> {
		return (state) => nodePaths(docRef, true)(state)[0];
	}
}
