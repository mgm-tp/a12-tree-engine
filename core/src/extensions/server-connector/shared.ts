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

import { TreeEngineError } from "../../core/error/tree-engine-error.js";
import { LinkDescriptorUtils } from "../../core/models/utils/relationship-utils.js";
import { Identifier, type TreeEngineState } from "../../core/store/store.js";
import { TreeDataUtils } from "../../core/store/utils.js";

import { TreeEngineActivity, TreeEngineDataHolder } from "../client/data-holder.js";

/** @internal */
export interface BaseNode {
	nodeIdentifier: Identifier;
	nodePath: TreeEngineState.NodePath;
}

/** @internal */
export function extractChildNodesFromDataHolder(dataHolder: TreeEngineDataHolder, parent?: BaseNode): BaseNode[] {
	const meta = TreeEngineDataHolder.Meta.fromSlices(dataHolder.slices);
	const children = meta?.children ?? [];
	if (!dataHolder.data) {
		return [];
	}
	if (TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(dataHolder.descriptor) && !parent) {
		return children.map((identifier) => ({ nodePath: [identifier], nodeIdentifier: identifier }));
	}
	if (!parent) {
		throw TreeEngineError.NotFoundError("TreeEngine.ParentNode");
	}
	return children.map((identifier) => {
		const link = TreeDataUtils.readLinkData(dataHolder.data ?? {}, identifier);
		if (!link) {
			throw TreeEngineError.TypeError("TreeEngine.Link", { actual: identifier.id });
		}
		const { linkRef } = link;
		const nodeIdentifier = LinkDescriptorUtils.getNodeIdentifierFromOtherSide(
			linkRef.linkDescriptor,
			parent.nodeIdentifier
		);
		if (linkRef.id === null || linkRef.id === undefined || !nodeIdentifier) {
			throw TreeEngineError.TypeError("TreeEngine.LinkRef", { expect: "Defined link id", actual: linkRef.id });
		}

		const linkIdentifier: Identifier = { id: linkRef.id, type: linkRef.linkDescriptor.relationshipModel };
		let nodePath = [nodeIdentifier];
		if (parent) {
			nodePath = [...parent.nodePath, linkIdentifier];
		}
		return { nodeIdentifier, nodePath };
	});
}

/** @internal */
export function findRootNodeDataHolder(dataHolders: TreeEngineDataHolder[]): TreeEngineDataHolder {
	const rootNodesDataHolder = dataHolders.find((dataHolder) => {
		return (
			TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(dataHolder.descriptor) ||
			TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(dataHolder.descriptor)
		);
	});
	if (!rootNodesDataHolder) {
		throw TreeEngineError.TypeError("TreeEngine.DataHolder", {
			expect: "Contain RootNodes/HiddenRootNodes DataHolder",
			actual: dataHolders
		});
	}
	return rootNodesDataHolder;
}

/** @internal */
export function getRootNodesFromDataHolder(
	dataHolders: TreeEngineDataHolder[],
	activityDescriptor: Activity.Descriptor
): BaseNode[] {
	const rootNodesDataHolder = findRootNodeDataHolder(dataHolders);

	let roots: BaseNode[];
	if (TreeEngineActivity.Descriptor.HiddenRootInstance.isAssignableFrom(activityDescriptor)) {
		if (!TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(rootNodesDataHolder.descriptor)) {
			throw TreeEngineError.TypeError("TreeEngine.DataHolder", {
				expect: "HiddenRootNodes DataHolder",
				actual: rootNodesDataHolder.descriptor
			});
		}
		const hiddenRootIdentifier = Identifier.from(activityDescriptor.rootInstance);
		roots = extractChildNodesFromDataHolder(rootNodesDataHolder, {
			nodeIdentifier: hiddenRootIdentifier,
			nodePath: [hiddenRootIdentifier]
		});
	} else {
		if (!TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(rootNodesDataHolder.descriptor)) {
			throw TreeEngineError.TypeError("TreeEngine.DataHolder", {
				expect: "RootNodes DataHolder",
				actual: rootNodesDataHolder.descriptor
			});
		}
		roots = extractChildNodesFromDataHolder(rootNodesDataHolder);
	}

	return roots;
}

/** @internal */
export { PaginationUtils } from "./data-providers/resolver/pagination-utils.js";
