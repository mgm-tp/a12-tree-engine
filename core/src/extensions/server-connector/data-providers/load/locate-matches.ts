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

import type { Activity } from "@com.mgmtp.a12.client/client-core";

import type { TreeEngineState } from "../../../../core/store/store.js";
import { Identifier } from "../../../../core/store/store.js";
import type { TreeEngineDataHolder } from "../../../client/data-holder.js";
import { TreeTraverser } from "../../../client/utils.js";
import { type BaseNode, getRootNodesFromDataHolder } from "../../shared.js";

/**
 * Ancestor chains from the search response: per docRef, the links pointing to its parents.
 *
 * @internal
 */
export type SearchParentLinks = Map<string, SearchParentLink[]>;

/** @internal */
export interface SearchParentLink {
	parentDocRef: string;
	linkId: string;
	relationshipModel: string;
	/** Role of the parent (target) side of the edge in the relationship model. */
	parentRole: string;
	/** Role of the child (source) side of the edge in the relationship model. */
	childRole: string;
}

/**
 * Every match found in the given holders, as identifier + path. The branches are already
 * materialized, so a plain traversal finds them all — a node reachable by several paths yields one
 * entry per path.
 *
 * @internal
 */
export function locateMatchedNodes(params: {
	dataHolders: TreeEngineDataHolder[];
	activityDescriptor: Activity.Descriptor;
	matchedDocRefs: Set<string>;
}): BaseNode[] {
	const { dataHolders, activityDescriptor, matchedDocRefs } = params;

	if (matchedDocRefs.size === 0 || dataHolders.length === 0) {
		return [];
	}

	const roots = getRootNodesFromDataHolder(dataHolders, activityDescriptor);
	const matchedBaseNodes: BaseNode[] = [];
	const traverser = new TreeTraverser(dataHolders);
	for (const root of roots) {
		traverser.traverse(root, (node) => {
			if (matchedDocRefs.has(node.nodeIdentifier.id)) {
				matchedBaseNodes.push({ nodeIdentifier: node.nodeIdentifier, nodePath: node.nodePath });
			}
		});
	}

	return matchedBaseNodes;
}

/**
 * The ancestor chains as identifier paths: the topmost node followed by one identifier per link down
 * to the match. Only the link types and the path lengths are meaningful — they feed the expansion
 * depth calculation, which is how the complete-tree view learns how deep to load.
 *
 * A chain ends where the response holds no more parents. That top is not necessarily a root of this
 * tree — a chain through data the tree never shows still contributes its length, over-estimating the
 * depth. Accepted for now; filtering them out needs a root check against the loaded tree.
 *
 * @internal
 */
export function collectChainLinkPaths(
	matchedDocRefs: Set<string>,
	parentLinks: SearchParentLinks
): TreeEngineState.NodePath[] {
	const paths: TreeEngineState.NodePath[] = [];

	function ascend(docRef: string, linksBelow: Identifier[], visited: Set<string>): void {
		if (visited.has(docRef)) {
			return;
		}

		const parents = parentLinks.get(docRef) ?? [];
		if (parents.length === 0) {
			paths.push([Identifier.from(docRef), ...linksBelow]);
			return;
		}

		for (const parentLink of parents) {
			ascend(
				parentLink.parentDocRef,
				[{ type: parentLink.relationshipModel, id: parentLink.linkId }, ...linksBelow],
				new Set([...visited, docRef])
			);
		}
	}

	for (const docRef of matchedDocRefs) {
		ascend(docRef, [], new Set());
	}

	return paths;
}
