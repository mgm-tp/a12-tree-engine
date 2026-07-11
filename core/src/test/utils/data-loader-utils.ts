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

import type { JsonRpc2Request } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { DataOperation } from "../../extensions/server-connector/data-loaders/data-loader.js";

/** @internal */
export function createMockRequest(id: string): JsonRpc2Request {
	return { jsonrpc: "2.0", id, method: "test" } as JsonRpc2Request;
}

/** @internal */
export function orphanedRootListQuery(id: string): DataOperation.Query.ListRootNodes.Query {
	return {
		id,
		type: "LIST_ROOT_NODES",
		relationshipModel: "rm",
		roles: { parent: "parent", child: "child" },
		targetDocumentModel: "dm"
	};
}

/** @internal */
export function hiddenRootListQuery(id: string): DataOperation.Query.ListRootNodes.Query {
	return { ...orphanedRootListQuery(id), source: "source-1" };
}

/** @internal */
export function rootTreeQuery(id: string): DataOperation.Query.TreeNodes.Query {
	return {
		id,
		type: "TREE_NODES",
		entry: { targetDocumentModel: "dm", parentRole: "parent", relationshipModel: "rm" },
		links: []
	};
}

/** @internal */
export function subtreeTreeQuery(id: string): DataOperation.Query.TreeNodes.Query {
	return { id, type: "TREE_NODES", entry: { targetDocumentModel: "dm", source: "source-1" }, links: [] };
}

/** @internal */
export function listResult(id: string, fullSize: number): DataOperation.ListQueryResult {
	return { id, entries: [], fullSize };
}

/** @internal */
export function treeResult(id: string, fullSize: number): DataOperation.Query.TreeNodes.Result {
	return { id, entries: [], links: [], fullSize };
}
