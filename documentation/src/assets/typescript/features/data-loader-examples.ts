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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import type { DataOperation } from "@com.mgmtp.a12.treeengine/treeengine-core";

// tag::ListRootNodes[]
const listRootNodes: DataOperation.Query.ListRootNodes.Query = {
	id: "list-root-nodes",
	type: "LIST_ROOT_NODES",
	relationshipModel: "TeamTeam",
	roles: {
		parent: "Parent",
		child: "Child"
	},
	targetDocumentModel: "DomainTeam"
};
// end::ListRootNodes[]

// tag::ListChildNodes[]
const listChildNodes: DataOperation.Query.ListChildNodes.Query = {
	id: "list-child-nodes",
	type: "LIST_CHILD_NODES",
	relationshipModel: "DirectoryFile",
	source: "DomainDirectory/9bd9169a-a8c9-44be-85af-d65ed6ed8e72",
	roles: {
		parent: "Directory",
		child: "File"
	},
	targetDocumentModel: "DomainFile"
};
// end::ListChildNodes[]

// tag::TreeNodes[]
const treeNodes: DataOperation.Query.TreeNodes.Query = {
	id: "tree-nodes",
	type: "TREE_NODES",
	entry: { targetDocumentModel: "DomainCategory", relationshipModel: "CategoryCategory", parentRole: "Parent" },
	links: [
		{
			relationshipModel: "CategoryCategory",
			roles: { parent: "Parent", child: "Child" },
			targetDocumentModel: "DomainCategory",
			fields: ["/Category/Name", "/Category/Description"],
			maxDepth: 4,
			childNodes: [
				{
					relationshipModel: "ProductCategory",
					roles: { parent: "Category", child: "Product" },
					targetDocumentModel: "DomainProduct",
					maxDepth: 2,
					childNodes: [
						{
							relationshipModel: "BundleProduct",
							roles: { parent: "Bundle", child: "Product" },
							targetDocumentModel: "DomainProduct",
							maxDepth: 1
						}
					]
				}
			]
		},
		{
			relationshipModel: "ProductCategory",
			roles: { parent: "Category", child: "Product" },
			targetDocumentModel: "DomainProduct",
			maxDepth: 2,
			childNodes: [
				{
					relationshipModel: "BundleProduct",
					roles: { parent: "Bundle", child: "Product" },
					targetDocumentModel: "DomainProduct",
					maxDepth: 1
				}
			]
		}
	]
};
// end::TreeNodes[]

// tag::SubTreeNodes[]
const subTreeNodes: DataOperation.Query.TreeNodes.Query = {
	id: "sub-tree-nodes",
	type: "TREE_NODES",
	entry: {
		targetDocumentModel: "DomainCategory",
		source: "DomainCategory/18da8433-e39e-4ef6-903e-b38fa7bbdf0d"
	},
	links: [
		{
			relationshipModel: "CategoryCategory",
			roles: { parent: "Parent", child: "Child" },
			targetDocumentModel: "DomainCategory",
			fields: ["/Category/Name", "/Category/Description"],
			maxDepth: 4,
			childNodes: [
				{
					relationshipModel: "ProductCategory",
					roles: { parent: "Category", child: "Product" },
					targetDocumentModel: "DomainProduct",
					maxDepth: 2,
					childNodes: [
						{
							relationshipModel: "BundleProduct",
							roles: { parent: "Bundle", child: "Product" },
							targetDocumentModel: "DomainProduct",
							maxDepth: 1
						}
					]
				}
			]
		},
		{
			relationshipModel: "ProductCategory",
			roles: { parent: "Category", child: "Product" },
			targetDocumentModel: "DomainProduct",
			maxDepth: 2,
			childNodes: [
				{
					relationshipModel: "BundleProduct",
					roles: { parent: "Bundle", child: "Product" },
					targetDocumentModel: "DomainProduct",
					maxDepth: 1
				}
			]
		}
	]
};
// end::SubTreeNodes[]

// tag::ListChildNodesWithFieldsProjection[]
const listChildNodesWithFieldsProjection = {
	id: "list-child-nodes",
	type: "LIST_CHILD_NODES",
	relationshipModel: "DirectoryFile",
	source: "DomainDirectory/9bd9169a-a8c9-44be-85af-d65ed6ed8e72",
	roles: {
		parent: "Directory",
		child: "File"
	},
	targetDocumentModel: "DomainFile",
	// list of fields to be retrieved
	fields: [
		"/File/Basic/Name",
		"/File/Basic/Owner",
		"/File/Basic/Group",
		"/File/FileType",
		"/File/Readonly",
		"/File/Size"
	]
};
// end::ListChildNodesWithFieldsProjection[]
