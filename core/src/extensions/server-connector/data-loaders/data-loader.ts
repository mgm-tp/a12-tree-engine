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

import type { Relationship, LoadThumbnailUrlsJsonRpc2 } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { MaybeAsync } from "../../client/utils.js";
import type { TreeEngineOperation } from "../../client/operation.js";

import type { DocumentProcessors } from "../types.js";

export interface TreeEngineDataLoader {
	provideData(params: ProvideDataParams): ProvideDataResults;
}

export interface ProvideDataParams {
	activityId: string;
	queries: DataOperation.Query[];
	mutations?: TreeEngineOperation.Mutation[];
	documentProcessors: DocumentProcessors;
}

export type ProvideDataResults = MaybeAsync<DataOperation.ResultSet>;

export namespace DataOperation {
	export interface ResultSet {
		queryResults: QueryResult[];
		mutationResults?: (TreeEngineOperation.Done | TreeEngineOperation.Failed)[];
	}

	export type Query =
		| ListQuery
		| Query.TreeNodes.Query
		| Query.GetDocument.Query
		| Query.LoadThumbnailUrls.Query
		| Query.BaseQuery;

	export type QueryResult =
		| ListQueryResult
		| Query.TreeNodes.Result
		| Query.GetDocument.Result
		| Query.LoadThumbnailUrls.Result
		| Query.BaseResult;

	export type ListQuery = Query.ListRootNodes.Query | Query.ListChildNodes.Query;
	export namespace ListQuery {
		export function isAssignableFrom(query: unknown): query is ListQuery {
			return [Query.ListRootNodes.Query, Query.ListChildNodes.Query].some((q) => q.isAssignableFrom(query));
		}
	}

	export type ListQueryResult = Query.ListRootNodes.Result | Query.ListChildNodes.Result;
	export namespace ListQueryResult {
		export function isAssignableFrom(result: unknown): result is ListQueryResult {
			return [Query.ListRootNodes.Result, Query.ListChildNodes.Result].some((res) => res.isAssignableFrom(result));
		}
	}

	export namespace Query {
		export interface BaseQuery {
			id: string;
			type: string;
		}

		export namespace BaseQuery {
			export function isAssignableFrom(query: unknown): query is BaseQuery {
				return !!query && typeof query === "object" && "id" in query && "type" in query;
			}
		}

		export interface Paging {
			limit: number;
			offset: number;
		}

		export interface BaseResult {
			id: string;
		}

		export namespace BaseResult {
			export function isAssignableFrom(result: unknown): result is BaseResult {
				return !!result && typeof result === "object" && "id" in result;
			}
		}

		export namespace TreeNodes {
			export interface Query extends BaseQuery {
				type: "TREE_NODES";
				entry: RootEntry | ParentEntry;
				links: LinkQuery[];
			}

			export interface LinkQuery {
				relationshipModel: string;
				roles: { parent: string; child: string };
				targetDocumentModel: string;
				maxDepth: number;
				childNodes?: LinkQuery[];
				fields?: string[];
				linkDocumentFields?: string[];
			}

			export interface RootEntry {
				targetDocumentModel: string;
				parentRole: string;
				relationshipModel: string;
				source?: string;
			}
			export namespace RootEntry {
				export function isAssignableFrom(entry: unknown): entry is RootEntry {
					return (
						!!entry &&
						typeof entry === "object" &&
						"targetDocumentModel" in entry &&
						"parentRole" in entry &&
						"relationshipModel" in entry
					);
				}
			}

			export interface ParentEntry {
				targetDocumentModel: string;
				source: string;
			}
			export namespace ParentEntry {
				export function isAssignableFrom(entry: unknown): entry is ParentEntry {
					return !!entry && typeof entry === "object" && "targetDocumentModel" in entry && "source" in entry;
				}
			}

			export namespace Query {
				export function isAssignableFrom(query: unknown): query is Query {
					return BaseQuery.isAssignableFrom(query) && query.type === "TREE_NODES";
				}
			}

			export interface Result extends BaseResult {
				entries: Entry[];
				links: Link[];
				fullSize?: number;
			}

			export interface Entry {
				docRef: string;
				document: object;
				documentModelName: string;
			}

			export namespace Entry {
				export function isAssignableFrom(o: unknown): o is Entry {
					return typeof o === "object" && !!o && !("linkId" in o);
				}
			}

			export interface Link {
				docRef: string;
				document: object;
				documentModelName: string;
				relationshipModel: string;
				linkId: string;
				sourceDocRef: string;
				sourceRole: string;
				targetDocRef: string;
				targetRole: string;
			}

			export namespace Link {
				export function isAssignableFrom(o: unknown): o is Link {
					return typeof o === "object" && !!o && "linkId" in o;
				}
			}

			export namespace Result {
				export function isAssignableFrom(result: unknown): result is Result {
					return BaseResult.isAssignableFrom(result) && "entries" in result && "links" in result;
				}
			}
		}

		export namespace ListRootNodes {
			export interface Query extends BaseQuery {
				type: "LIST_ROOT_NODES";
				source?: string;
				relationshipModel: string;
				roles: { parent: string; child: string };
				paging?: Paging;
				targetDocumentModel: string;
				fields?: string[];
				linkDocumentFields?: string[];
			}

			export namespace Query {
				export function isAssignableFrom(query: unknown): query is Query {
					return BaseQuery.isAssignableFrom(query) && query.type === "LIST_ROOT_NODES";
				}

				/** @internal */
				export function isOrphanedRootNode(query: unknown): query is Query {
					return ListRootNodes.Query.isAssignableFrom(query) && !query.source;
				}
			}

			export interface Result extends BaseResult {
				entries: Relationship.LinkWithDocument[];
			}

			export namespace Result {
				export function isAssignableFrom(result: unknown): result is Query {
					return BaseResult.isAssignableFrom(result) && "entries" in result;
				}
			}
		}

		export namespace ListChildNodes {
			export interface Query extends BaseQuery {
				type: "LIST_CHILD_NODES";
				source: string;
				relationshipModel: string;
				roles: { parent: string; child: string };
				paging?: Paging;
				targetDocumentModel: string;
				fields?: string[];
				linkDocumentFields?: string[];
			}

			export namespace Query {
				export function isAssignableFrom(query: unknown): query is Query {
					return BaseQuery.isAssignableFrom(query) && query.type === "LIST_CHILD_NODES";
				}
			}

			export interface Result extends BaseResult {
				entries: Relationship.LinkWithDocument[];
				fullSize?: number;
			}

			export namespace Result {
				export function isAssignableFrom(result: unknown): result is Result {
					return BaseResult.isAssignableFrom(result) && "entries" in result;
				}
			}
		}

		export namespace GetDocument {
			export interface Query extends BaseQuery {
				type: "GET_DOCUMENT";
				source: string;
				targetDocumentModel: string;
				fields?: string[];
			}

			export namespace Query {
				export function isAssignableFrom(query: unknown): query is Query {
					return BaseQuery.isAssignableFrom(query) && query.type === "GET_DOCUMENT";
				}
			}

			export interface Result extends BaseResult {
				docRef: string;
				documentModelName: string;
				document: object;
			}

			export namespace Result {
				export function isAssignableFrom(result: unknown): result is Result {
					return (
						BaseResult.isAssignableFrom(result) &&
						"docRef" in result &&
						"documentModelName" in result &&
						"document" in result
					);
				}
			}
		}

		export namespace LoadThumbnailUrls {
			export function create(): Query {
				return {
					id: "LOAD_THUMBNAIL_URLS_INTERNAL",
					type: "LOAD_THUMBNAIL_URLS_INTERNAL"
				};
			}

			export interface Query extends Omit<BaseQuery, "paging"> {
				type: "LOAD_THUMBNAIL_URLS_INTERNAL";
			}

			export namespace Query {
				export function isAssignableFrom(query: unknown): query is Query {
					return BaseQuery.isAssignableFrom(query) && query.type === "LOAD_THUMBNAIL_URLS_INTERNAL";
				}
			}

			export interface Result extends BaseResult {
				result: LoadThumbnailUrlsJsonRpc2.Response["result"];
			}

			export namespace Result {
				export function isAssignableFrom(result: unknown): result is Result {
					return BaseResult.isAssignableFrom(result) && "result" in result;
				}

				/** @internal */
				export function toResponse(result: Result): LoadThumbnailUrlsJsonRpc2.Response {
					return { id: result.id, result: result.result, jsonrpc: "2.0" };
				}
			}
		}
	}
}
