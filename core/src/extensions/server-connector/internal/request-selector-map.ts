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

import {
	type DocumentJsonRpc2Request,
	Query,
	type QueryJsonRpc2Request,
	type RelationshipJsonRpc2request
} from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type Selector, ModelSelectors } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineError } from "../../../core/error/index.js";
import { RelationshipModelUtils } from "../../../core/models/index.js";

import { DataOperation } from "./data-loaders/data-loader.js";
import { A12QueryAPIUtils } from "./data-loaders/queries/utils.js";
import { JsonRpc } from "./types.js";

/**
 * Selector-based request factories for both queries and mutations.
 * Each method returns a selector and every config includes an activityId.
 */
export interface RequestSelectorMap {
	// Query helpers (split by DataOperation.Query types)
	loadListRootNodes(config: {
		activityId: string;
		query: DataOperation.Query.ListRootNodes.Query;
		paging: { pageNumber: number; pageSize: number };
	}): Selector<QueryJsonRpc2Request>;
	loadListChildNodes(config: {
		activityId: string;
		query: DataOperation.Query.ListChildNodes.Query;
		paging: { pageNumber: number; pageSize: number };
	}): Selector<QueryJsonRpc2Request>;
	loadTreeNodes(config: {
		activityId: string;
		query: DataOperation.Query.TreeNodes.Query;
		pageSize: number;
	}): Selector<QueryJsonRpc2Request>;
	loadDocument(config: {
		activityId: string;
		query: DataOperation.Query.GetDocument.Query;
	}): Selector<QueryJsonRpc2Request>;

	// Mutations
	addLink(
		config: { activityId: string } & Omit<RelationshipJsonRpc2request.AddLinkJsonRpc2request, OmitProps>
	): Selector<RelationshipJsonRpc2request.AddLinkJsonRpc2request>;
	deleteLink(
		config: { activityId: string } & Omit<RelationshipJsonRpc2request.DeleteLinkJsonRpc2request, OmitProps>
	): Selector<RelationshipJsonRpc2request.DeleteLinkJsonRpc2request>;
	modifyLink(
		config: { activityId: string } & Omit<RelationshipJsonRpc2request.ModifyLinkJsonRpc2request, OmitProps>
	): Selector<RelationshipJsonRpc2request.ModifyLinkJsonRpc2request>;
	relinkDocument(
		config: { activityId: string } & Omit<RelationshipJsonRpc2request.RelinkDocumentJsonRpc2request, OmitProps>
	): Selector<RelationshipJsonRpc2request.RelinkDocumentJsonRpc2request>;
	copyDocument(
		config: { activityId: string } & Omit<DocumentJsonRpc2Request.CopyJsonRpc2Request, OmitProps>
	): Selector<DocumentJsonRpc2Request.CopyJsonRpc2Request>;
	deleteDocument(
		config: { activityId: string } & Omit<DocumentJsonRpc2Request.DeleteJsonRpc2Request, OmitProps>
	): Selector<DocumentJsonRpc2Request.DeleteJsonRpc2Request>;
}

type OmitProps = "method" | "jsonrpc";

export const DefaultRequestSelectorMap: RequestSelectorMap = {
	loadListRootNodes:
		({ query, paging }) =>
		(state) => {
			if (!query.source) {
				return JsonRpc.Request.builder.query({
					id: query.id,
					params: {
						query: {
							projectionName: "document",
							targetDocumentModel: query.targetDocumentModel,
							constraint: {
								operator: Query.OPERATORS.NOT_OPERATOR,
								operand: {
									operator: Query.OPERATORS.HAS_OPERATOR,
									relationshipModel: query.relationshipModel,
									targetRole: query.roles.parent,
									maxDepth: 1
								}
							},
							links: [
								{
									relationshipModel: query.relationshipModel,
									targetRole: query.roles.child,
									maxDepth: 1,
									linkDocumentFields: query.linkDocumentFields
								}
							],
							paging,
							fields: query.fields
						}
					}
				});
			}

			const relationshipModel = ModelSelectors.modelGraph()(state).relationshipModels.find(
				(model) => model.header.id === query.relationshipModel
			);
			if (!relationshipModel) {
				throw TreeEngineError.NotFoundError("RelationshipModel", query.relationshipModel);
			}

			const targetEntity = RelationshipModelUtils.getEntityCharacteristicByRole(relationshipModel, query.roles.parent);
			if (!targetEntity) {
				throw TreeEngineError.NotFoundError("RelationshipModel.LinkEntitySpec", query.roles.parent);
			}

			return JsonRpc.Request.builder.query({
				id: query.id,
				params: {
					query: {
						projectionName: "document",
						targetDocumentModel: targetEntity.documentModel,
						exclude: true,
						constraint: {
							operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
							field: A12QueryAPIUtils.DOCUMENT_REFERENCE_FIELD,
							value: query.source
						},
						links: [
							{
								relationshipModel: query.relationshipModel,
								targetRole: query.roles.child,
								maxDepth: 1,
								fields: query.fields,
								linkDocumentFields: query.linkDocumentFields
							}
						],
						paging
					}
				}
			});
		},
	loadListChildNodes:
		({ query, paging }) =>
		(state) => {
			const relationshipModel = ModelSelectors.modelGraph()(state).relationshipModels.find(
				(model) => model.header.id === query.relationshipModel
			);
			if (!relationshipModel) {
				throw TreeEngineError.NotFoundError("RelationshipModel", query.relationshipModel);
			}

			const targetEntity = RelationshipModelUtils.getEntityCharacteristicByRole(relationshipModel, query.roles.parent);
			if (!targetEntity) {
				throw TreeEngineError.NotFoundError("RelationshipModel.LinkEntitySpec", query.roles.parent);
			}
			return JsonRpc.Request.builder.query({
				id: query.id,
				params: {
					query: {
						projectionName: "document",
						targetDocumentModel: targetEntity.documentModel,
						exclude: true,
						constraint: {
							operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
							field: A12QueryAPIUtils.DOCUMENT_REFERENCE_FIELD,
							value: query.source
						},
						links: [
							{
								relationshipModel: query.relationshipModel,
								targetRole: query.roles.child,
								maxDepth: 1,
								fields: query.fields,
								linkDocumentFields: query.linkDocumentFields
							}
						],
						paging
					}
				}
			});
		},
	loadTreeNodes:
		({ query, pageSize }) =>
		() => {
			const links = query.links.map(function mapLinkQuery(linkQuery): Query.QueryLink {
				return {
					relationshipModel: linkQuery.relationshipModel,
					targetRole: linkQuery.roles.child,
					maxDepth: linkQuery.maxDepth,
					links: linkQuery.childNodes?.map(mapLinkQuery),
					fields: linkQuery.fields,
					linkDocumentFields: linkQuery.linkDocumentFields
				};
			});

			if (DataOperation.Query.TreeNodes.RootEntry.isAssignableFrom(query.entry)) {
				const { targetDocumentModel, relationshipModel: relationshipModelName, parentRole } = query.entry;

				let constraint: Query.Operator;
				if (query.entry.source) {
					// Hidden root node
					constraint = {
						operator: Query.OPERATORS.HAS_OPERATOR,
						relationshipModel: relationshipModelName,
						targetRole: parentRole,
						maxDepth: 1,
						constraint: {
							operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
							field: A12QueryAPIUtils.DOCUMENT_REFERENCE_FIELD,
							value: query.entry.source
						}
					};
				} else {
					// Unknown root nodes
					constraint = {
						operator: Query.OPERATORS.NOT_OPERATOR,
						operand: {
							operator: Query.OPERATORS.HAS_OPERATOR,
							relationshipModel: relationshipModelName,
							targetRole: parentRole,
							maxDepth: 0
						}
					};
				}

				return JsonRpc.Request.builder.query({
					id: query.id,
					params: {
						query: {
							targetDocumentModel,
							projectionName: "document",
							constraint,
							paging: { pageNumber: 0, pageSize },
							links
						}
					}
				});
			}

			// Usual subtree from a specific parent
			const { targetDocumentModel, source } = query.entry;
			return JsonRpc.Request.builder.query({
				id: query.id,
				params: {
					query: {
						targetDocumentModel,
						projectionName: "document",
						constraint: {
							operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
							field: A12QueryAPIUtils.DOCUMENT_REFERENCE_FIELD,
							value: source
						},
						paging: { pageNumber: 0, pageSize },
						links
					}
				}
			});
		},
	loadDocument:
		({ query }) =>
		() =>
			JsonRpc.Request.builder.query({
				id: query.id,
				params: {
					query: {
						projectionName: "document",
						targetDocumentModel: query.targetDocumentModel,
						constraint: {
							operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
							field: A12QueryAPIUtils.DOCUMENT_REFERENCE_FIELD,
							value: query.source
						},
						paging: { pageNumber: 0, pageSize: 1 },
						fields: query.fields
					}
				}
			}),

	addLink: (config) => () => JsonRpc.Request.builder.addLink(config),
	deleteLink: (config) => () => JsonRpc.Request.builder.deleteLink(config),
	modifyLink: (config) => () => JsonRpc.Request.builder.modifyLink(config),
	relinkDocument: (config) => () => JsonRpc.Request.builder.relinkDocument(config),
	copyDocument: (config) => () => JsonRpc.Request.builder.copyDocument(config),
	deleteDocument: (config) => () => JsonRpc.Request.builder.deleteDocument(config)
};
