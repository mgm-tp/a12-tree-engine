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

import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { TreeModel } from "../../../../core/models/tree-model.js";
import { ModelSelector } from "../../../../core/store/selectors/models.js";
import type { ModelsState } from "../../../../core/store/store.js";
import type { DataOperation } from "../../data-loaders/data-loader.js";
import { A12QueryAPIUtils } from "../../data-loaders/queries/utils.js";

import { createRelationshipModelUtils } from "./create-queries.js";

/**
 * The search reads identity only — the rows come from the tree load that follows. The field cannot
 * simply be left out: Data Services then returns whole documents, attachment content included.
 */
const DOCUMENT_REFERENCE_PROJECTION = [A12QueryAPIUtils.DOCUMENT_REFERENCE_FIELD];

/**
 * Build one search query per searchable document model: a simple_search over all document fields,
 * plus reversed-link chains (child -> parent) carrying the ancestor and link documents.
 *
 * @internal
 */
export function createSearchQueries(
	searchTerm: string,
	models: ModelsState,
	maxQueryDepth: number
): DataOperation.Query.SearchNodes.Query[] {
	const uiModel = ModelSelector.uiModel()(models);
	const { expansionStrategy } = uiModel.content.configuration;
	if (!TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		throw TreeEngineError.TypeError("TreeEngine.Model.ExpansionStrategy", { actual: expansionStrategy });
	}

	const searchableDocumentModels = ModelSelector.searchableDocumentModels()(models);

	const queries: DataOperation.Query.SearchNodes.Query[] = [];
	for (const docModel of searchableDocumentModels) {
		queries.push({
			id: `search-${docModel}`,
			type: "SEARCH_NODES",
			searchTerm,
			// No searchFields: match against all document fields.
			fields: DOCUMENT_REFERENCE_PROJECTION,
			entry: {
				targetDocumentModel: docModel
			},
			links: createReversedLinkQueries(models, docModel, maxQueryDepth)
		});
	}

	return queries;
}

/**
 * Build the link queries that walk from the searched model up to the root: the forward tree links
 * with parent/child roles swapped, so every match comes back with the chain of links above it.
 *
 * A fixed link needs one hop — a repeat cannot match — while a self-referencing one recurses up to
 * `maxQueryDepth`; DS validates each `maxDepth` value on its own, nested hops are not summed.
 */
function createReversedLinkQueries(
	models: ModelsState,
	searchedDocModel: string,
	maxQueryDepth: number
): DataOperation.Query.TreeNodes.LinkQuery[] {
	type ParentEdge = {
		relationshipModel: string;
		parentRole: string;
		childRole: string;
		parentDocModel: string;
		childDocModel: string;
	};

	const { getChildEntity, getParentEntity } = createRelationshipModelUtils(models);
	const uiModel = ModelSelector.uiModel()(models);

	const childToParentEdges = new Map<string, ParentEdge[]>();

	function addEdge(childDocModel: string, edge: ParentEdge): void {
		const existing = childToParentEdges.get(childDocModel) ?? [];
		existing.push(edge);
		childToParentEdges.set(childDocModel, existing);
	}

	for (const node of uiModel.content.nodes) {
		for (const { relationshipModelRef, parentRole } of node.childRelationshipConfigurations) {
			const parentEntity = getParentEntity(relationshipModelRef, parentRole);
			const childEntity = getChildEntity(relationshipModelRef, parentRole);

			const edge: ParentEdge = {
				relationshipModel: relationshipModelRef,
				parentRole,
				childRole: childEntity.role,
				parentDocModel: parentEntity.documentModel,
				childDocModel: childEntity.documentModel
			};

			// Register under the child model and its subtypes, so a walk starting from a concrete
			// type still finds edges declared on its abstract supertype.
			addEdge(childEntity.documentModel, edge);
			for (const subType of ModelSelector.subtypeModelsByName(childEntity.documentModel)(models)) {
				addEdge(subType.modelId, edge);
			}
		}
	}

	return buildLinkQueries(searchedDocModel, undefined);

	function resolveEdges(docModel: string): ParentEdge[] {
		let edges = childToParentEdges.get(docModel);
		if (!edges || edges.length === 0) {
			const superType = ModelSelector.superTypeModel(docModel)(models);
			if (superType) {
				edges = childToParentEdges.get(superType.modelId);
			}
		}
		return edges ?? [];
	}

	function buildLinkQueries(
		docModel: string,
		fromRelationshipModel: string | undefined
	): DataOperation.Query.TreeNodes.LinkQuery[] {
		const queries: DataOperation.Query.TreeNodes.LinkQuery[] = [];
		for (const edge of resolveEdges(docModel)) {
			// Don't recurse a self-referencing relationship — its repeated hops come from maxDepth.
			if (fromRelationshipModel === edge.relationshipModel) {
				continue;
			}
			const selfReferential = ModelSelector.areTypeRelated(edge.parentDocModel, edge.childDocModel)(models);
			queries.push({
				relationshipModel: edge.relationshipModel,
				// Swapped roles: traverse toward the parent.
				roles: { parent: edge.childRole, child: edge.parentRole },
				targetDocumentModel: edge.parentDocModel,
				fields: DOCUMENT_REFERENCE_PROJECTION,
				linkDocumentFields: DOCUMENT_REFERENCE_PROJECTION,
				maxDepth: selfReferential ? maxQueryDepth : 1,
				childNodes: buildLinkQueries(edge.parentDocModel, edge.relationshipModel)
			});
		}
		return queries;
	}
}
