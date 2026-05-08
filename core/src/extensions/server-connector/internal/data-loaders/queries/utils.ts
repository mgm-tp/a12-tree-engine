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

import { Query, type QueryJsonRpc2Response, Relationship } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { Identifier } from "../../../../../core/store/index.js";
import { type DocumentProcessors } from "../../types.js";

import { DataOperation } from "../data-loader.js";

/** @internal */
export namespace A12QueryAPIUtils {
	export const DOCUMENT_REFERENCE_FIELD = "/__meta/docRef";

	export const DEFAULT_PAGE_SIZE = 100;

	export namespace Paging {
		export function transformPaging(
			paging?: DataOperation.Query.Paging,
			maximumPageSize = DEFAULT_PAGE_SIZE
		): Query.Paging {
			if (!paging) {
				return { pageNumber: 0, pageSize: maximumPageSize };
			}

			const { offset, limit } = paging;

			let pageNumber = Math.floor(offset / limit);

			if (pageNumber === 0) {
				return { pageNumber, pageSize: offset + limit };
			}
			let pageSize = limit;

			while (
				offset % pageSize !== 0 &&
				(pageSize * pageNumber > offset || pageSize * (pageNumber + 1) < offset + limit)
			) {
				pageSize++;
				pageNumber = Math.floor(offset / pageSize);
			}

			return { pageNumber, pageSize };
		}

		export function removedUnusedResults<T>(
			results: T[],
			queryAPIPaging: Query.Paging,
			queryPaging?: DataOperation.Query.Paging
		): T[] {
			if (!queryPaging || queryAPIPaging.pageSize <= queryPaging.limit) {
				return results;
			}

			const { pageNumber, pageSize } = queryAPIPaging;
			const fistUsedIndex = queryPaging.offset - pageNumber * pageSize;
			const lastUsedIndex = fistUsedIndex + queryPaging.limit;

			return results.slice(fistUsedIndex, lastUsedIndex);
		}
	}

	function getLinkEntities(query: DataOperation.ListQuery) {
		if (DataOperation.Query.ListRootNodes.Query.isOrphanedRootNode(query)) {
			return { sourceRole: query.roles.parent, targetRole: query.roles.child };
		}

		return { sourceRole: query.roles.child, targetRole: query.roles.parent };
	}

	function linkRefFromEntry(
		query: DataOperation.ListQuery,
		entry: QueryJsonRpc2Response.DocumentEntry,
		link?: QueryJsonRpc2Response.Link,
		linkDocument?: QueryJsonRpc2Response.Link
	): Relationship.LinkRefResponse {
		const { sourceRole, targetRole } = getLinkEntities(query);

		return {
			id: link?.linkId ?? null,
			linkDescriptor: {
				relationshipModel: query.relationshipModel,
				position: Relationship.LinkPosition.TOP,
				linkDocumentDocRef: linkDocument?.docRef,
				entities: [
					{ role: sourceRole, docRef: link?.sourceDocRef ?? entry.docRef, modelName: entry.documentModelName },
					// @ts-expect-error `modelName` can be null
					{ role: targetRole, docRef: link?.targetDocRef ?? null, modelName: link?.documentModelName ?? null }
				]
			}
		};
	}

	function linkRefFromLink(
		query: DataOperation.ListQuery,
		link: QueryJsonRpc2Response.Link,
		linkDocument?: QueryJsonRpc2Response.Link
	): Relationship.LinkRefResponse {
		return {
			id: link.linkId,
			linkDescriptor: {
				relationshipModel: query.relationshipModel,
				position: Relationship.LinkPosition.TOP,
				linkDocumentDocRef: linkDocument?.docRef,
				entities: [
					{ role: link.sourceRole, docRef: link.sourceDocRef, modelName: Identifier.from(link.sourceDocRef).type },
					{ role: link.targetRole, docRef: link.targetDocRef, modelName: link.documentModelName }
				]
			}
		};
	}

	export class ListNodesProcessor {
		constructor(
			public readonly query: DataOperation.ListQuery,
			public readonly documentProcessors: DocumentProcessors
		) {}

		public fromEntriesAndLinks(
			entries: QueryJsonRpc2Response.DocumentEntry[],
			links: QueryJsonRpc2Response.Link[]
		): Relationship.LinkWithDocument[] {
			return entries.map((entry) => {
				const targetLink = links.find((link) => {
					return link.sourceDocRef === entry.docRef && link.targetDocRef === this.query.source;
				});

				// entry without links
				if (!targetLink) {
					return { document: { target: this.processDocument(entry) }, linkRef: linkRefFromEntry(this.query, entry) };
				}

				const linkDocument = links.find(
					(link) => link.type === Query.DocumentTreeNodeType.LINK && link.linkId === targetLink.linkId
				);

				return {
					document: { target: this.processDocument(entry), relationship: this.processLinkDocument(linkDocument) },
					linkRef: linkRefFromEntry(this.query, entry, targetLink, linkDocument)
				};
			});
		}

		public fromLinks(links: QueryJsonRpc2Response.Link[]): Relationship.LinkWithDocument[] {
			const result: Relationship.LinkWithDocument[] = [];
			const linkDocumentsMap = new Map(
				links.filter((link) => link.type === Query.DocumentTreeNodeType.LINK).map((link) => [link.linkId, link])
			);

			for (const link of links) {
				if (link.type !== Query.DocumentTreeNodeType.CHILD) {
					continue;
				}

				const linkDocument = linkDocumentsMap.get(link.linkId);

				result.push({
					document: { target: this.processDocument(link), relationship: this.processLinkDocument(linkDocument) },
					linkRef: linkRefFromLink(this.query, link, linkDocument)
				});
			}

			return result;
		}

		private processDocument(
			documentResponse: QueryJsonRpc2Response.Link | QueryJsonRpc2Response.DocumentEntry
		): object {
			return this.documentProcessors.postLoadDocument(documentResponse.document, documentResponse.documentModelName);
		}

		private processLinkDocument(linkDocumentResponse?: QueryJsonRpc2Response.Link): object | undefined {
			if (!linkDocumentResponse?.document) {
				return undefined;
			}

			return this.documentProcessors.postLoadLinkDocument(
				linkDocumentResponse.document,
				linkDocumentResponse.relationshipModel
			);
		}
	}
}
