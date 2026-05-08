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

import { TreeEngineError } from "../../../../../core/error/index.js";
import { RelationshipModelUtils, TreeModel } from "../../../../../core/models/index.js";
import { Identifier, ModelSelector, type ModelsState } from "../../../../../core/store/index.js";
import { TreeEngineDataHolder } from "../../../../client/index.js";
import { DataOperation } from "../../data-loaders/data-loader.js";

import { PaginationUtils } from "./pagination-utils.js";
import { hasAttachment } from "./attachment-utils.js";
import { collectFieldsProjection, createFieldsMap } from "./fields-projection.js";

export interface CreateQueriesResult {
	queries: DataOperation.Query[];
	skippedQueries: DataOperation.ListQuery[];
}

/** @internal */
export function createListQueries(
	dataHolders: TreeEngineDataHolder[],
	models: ModelsState,
	reload = false
): CreateQueriesResult {
	const result: CreateQueriesResult = { queries: [], skippedQueries: [] };

	const prebuiltFieldsMap = createFieldsMap(models);

	const expansionStrategy = ModelSelector.uiModel()(models).content.configuration.expansionStrategy;
	const defaultPageSize = TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy)
		? expansionStrategy.pageSize
		: undefined;

	const { getChildEntity, getLinkDocumentModel, getParentEntity } = createRelationshipModelUtils(models);

	for (const dataHolder of dataHolders) {
		let paging: DataOperation.Query.Paging | undefined;

		const { expectedSize, currentSize } = PaginationUtils.getSize(dataHolder);
		if (expectedSize !== Infinity) {
			paging = PaginationUtils.toPaging(dataHolder, defaultPageSize, reload);
		}
		const { relationshipRole, source, type } = dataHolder.descriptor;
		const relationshipModelName = dataHolder.descriptor.relationshipModel;
		if (!relationshipModelName || !relationshipRole) {
			throw TreeEngineError.NotFoundError("RelationshipModel", JSON.stringify(dataHolder.descriptor));
		}
		const parentEntity = getParentEntity(relationshipModelName, relationshipRole);
		const childEntity = getChildEntity(relationshipModelName, relationshipRole);
		const linkDocumentModel = getLinkDocumentModel(relationshipModelName);

		if (!parentEntity || !childEntity) {
			throw TreeEngineError.NotFoundError(
				"RelationshipModel.EntityCharacteristic",
				`relationshipModel: ${relationshipModelName}, relationshipRole: ${relationshipRole}`
			);
		}

		let query: DataOperation.ListQuery | undefined;
		if (type === "ROOT_NODES" && !source) {
			query = {
				id: `RM${relationshipModelName}Role${relationshipRole}SourceUnknown`,
				type: "LIST_ROOT_NODES",
				relationshipModel: relationshipModelName,
				roles: { parent: parentEntity.role, child: childEntity.role },
				paging: source ? paging : undefined,
				targetDocumentModel: parentEntity.documentModel,
				fields: collectFieldsProjection(parentEntity.documentModel, prebuiltFieldsMap, models),
				linkDocumentFields: collectFieldsProjection(linkDocumentModel, prebuiltFieldsMap, models)
			};
		}

		if (type === "HIDDEN_ROOT_NODES" && source) {
			query = {
				id: `RM${relationshipModelName}Role${relationshipRole}Source${source}`,
				type: "LIST_ROOT_NODES",
				relationshipModel: relationshipModelName,
				source,
				roles: { parent: parentEntity.role, child: childEntity.role },
				paging: source ? paging : undefined,
				targetDocumentModel: childEntity.documentModel,
				fields: collectFieldsProjection(childEntity.documentModel, prebuiltFieldsMap, models),
				linkDocumentFields: collectFieldsProjection(linkDocumentModel, prebuiltFieldsMap, models)
			};
		}

		if ((type === "PARENT_NODES" || type === "CHILD_NODES") && source) {
			query = {
				id: `RM${relationshipModelName}Role${relationshipRole}Source${source}`,
				type: "LIST_CHILD_NODES",
				relationshipModel: relationshipModelName,
				source,
				roles: { parent: parentEntity.role, child: childEntity.role },
				paging,
				targetDocumentModel: childEntity.documentModel,
				fields: collectFieldsProjection(childEntity.documentModel, prebuiltFieldsMap, models),
				linkDocumentFields: collectFieldsProjection(linkDocumentModel, prebuiltFieldsMap, models)
			};
		}

		if (!query) {
			throw TreeEngineError.NotFoundError("TreeEngine.Query");
		} else if (paging?.limit === 0) {
			result.skippedQueries.push(query);
		} else if (expectedSize !== currentSize || reload) {
			result.queries.push(query);
		}
	}

	if (hasAttachment({ models })) {
		result.queries.push(DataOperation.Query.LoadThumbnailUrls.create());
	}

	return result;
}

type TreeQueryOptions = {
	overrideExpansionDepths?: TreeModel.ExpansionStrategy.Tree.ExpansionDepth[];
	preloadChildNodes?: boolean;
};

/** @internal */
export function createTreeQueries(
	dataHolders: TreeEngineDataHolder[],
	models: ModelsState,
	options?: TreeQueryOptions
): CreateQueriesResult {
	const { overrideExpansionDepths, preloadChildNodes } = options || {};
	const queries: DataOperation.Query[] = [];

	const uiModel = ModelSelector.uiModel()(models);
	const prebuiltFieldsMap = createFieldsMap(models);

	const { expansionStrategy } = uiModel.content.configuration;
	if (!TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		throw TreeEngineError.TypeError("TreeEngine.Model.ExpansionStrategy", { actual: expansionStrategy });
	}

	const descriptor = dataHolders[0]?.descriptor;

	if (dataHolders.length === 0 || TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(descriptor)) {
		const query: DataOperation.Query.TreeNodes.Query = {
			id: "tree",
			type: "TREE_NODES",
			entry: {
				targetDocumentModel: uiModel.content.configuration.root.documentModelRef,
				relationshipModel: uiModel.content.configuration.root.relationshipModelRef,
				parentRole: uiModel.content.configuration.root.parentRole
			},
			links: createTreeLinkQueries(models, prebuiltFieldsMap, undefined, overrideExpansionDepths, preloadChildNodes)
		};

		queries.push(query);
	} else if (TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor) && descriptor.source) {
		const { source, relationshipModel: relationshipModelName, relationshipRole } = descriptor;

		const query: DataOperation.Query.TreeNodes.Query = {
			id: `hidden-root-tree-${source}`,
			type: "TREE_NODES",
			entry: {
				source,
				relationshipModel: relationshipModelName,
				targetDocumentModel: uiModel.content.configuration.root.documentModelRef,
				parentRole: relationshipRole
			},
			links: createTreeLinkQueries(models, prebuiltFieldsMap, undefined, overrideExpansionDepths, preloadChildNodes)
		};

		queries.push(query);
	} else {
		for (const dataHolder of dataHolders) {
			if (!dataHolder.descriptor.source) {
				continue;
			}
			const { id, type } = Identifier.from(dataHolder.descriptor.source);
			const query: DataOperation.Query.TreeNodes.Query = {
				id: `subtree-${id}`,
				type: "TREE_NODES",
				entry: { targetDocumentModel: type, source: id },
				links: createTreeLinkQueries(models, prebuiltFieldsMap, type, overrideExpansionDepths, preloadChildNodes)
			};
			queries.push(query);
		}
	}

	if (hasAttachment({ models })) {
		queries.push(DataOperation.Query.LoadThumbnailUrls.create());
	}

	return { queries, skippedQueries: [] };
}

function createTreeLinkQueries(
	models: ModelsState,
	prebuiltFieldsMap: Map<string, string[]>,
	rootDocumentModel?: string,
	overrideExpansionDepths?: TreeModel.ExpansionStrategy.Tree.ExpansionDepth[],
	preloadChildNodes?: boolean
): DataOperation.Query.TreeNodes.LinkQuery[] {
	type PrebuiltLinkQuery = Omit<DataOperation.Query.TreeNodes.LinkQuery, "childNodes">;
	const prebuiltLinkQueriesMap = new Map<string, PrebuiltLinkQuery[]>();

	const uiModel = ModelSelector.uiModel()(models);
	const expansionStrategy = uiModel.content.configuration.expansionStrategy;
	if (!TreeModel.ExpansionStrategy.Tree.isAssignableFrom(expansionStrategy)) {
		throw TreeEngineError.TypeError("TreeEngine.Model.ExpansionStrategy", { actual: expansionStrategy });
	}
	const { getChildEntity, getLinkDocumentModel, getParentEntity } = createRelationshipModelUtils(models);

	for (const node of uiModel.content.nodes) {
		const nodes: PrebuiltLinkQuery[] = [];
		let parentDocumentModel: string | undefined;
		for (const { relationshipModelRef, parentRole } of node.childRelationshipConfigurations) {
			const parentEntity = getParentEntity(relationshipModelRef, parentRole);
			const childEntity = getChildEntity(relationshipModelRef, parentRole);
			const linkDocumentModel = getLinkDocumentModel(relationshipModelRef);
			parentDocumentModel = parentEntity.documentModel;

			const overrideExpansionDepth = overrideExpansionDepths?.find(
				({ relationshipModel }) => relationshipModel === relationshipModelRef
			);
			const expansionDepth = expansionStrategy.expansionDepths.find(
				({ relationshipModel }) => relationshipModel === relationshipModelRef
			);

			let maxDepth = 0;

			if (overrideExpansionDepth?.maxDepth) {
				maxDepth = overrideExpansionDepth.maxDepth;
			} else if (expansionDepth?.maxDepth) {
				maxDepth = preloadChildNodes ? expansionDepth.maxDepth + 1 : expansionDepth.maxDepth;
			}

			nodes.push({
				relationshipModel: relationshipModelRef,
				roles: { parent: parentRole, child: childEntity.role },
				targetDocumentModel: childEntity.documentModel,
				fields: collectFieldsProjection(childEntity.documentModel, prebuiltFieldsMap, models),
				linkDocumentFields: collectFieldsProjection(linkDocumentModel, prebuiltFieldsMap, models),
				maxDepth
			});
		}

		if (parentDocumentModel) {
			prebuiltLinkQueriesMap.set(node.documentModelRef, nodes);
			// Backup for heterogeneity support, most of the time the parentDocumentModel is the same as the documentModelRef
			prebuiltLinkQueriesMap.set(parentDocumentModel, nodes);
		}
	}

	// Use default root from UI model if not configured
	if (!rootDocumentModel) {
		rootDocumentModel = uiModel.content.configuration.root.documentModelRef;
	}
	const queries = createLinkQueries(models, rootDocumentModel);
	if (!queries) {
		throw TreeEngineError.NotFoundError("TreeEngine.Query");
	}
	return queries;

	function createLinkQueries(
		models: ModelsState,
		rootDocumentModel: string,
		parentRelationshipModel?: string
	): DataOperation.Query.TreeNodes.LinkQuery[] | undefined {
		let prebuiltLinkQueries = prebuiltLinkQueriesMap.get(rootDocumentModel);
		// Try to look through all possible "subTypes" if there is no entry found yet
		if (!prebuiltLinkQueries || prebuiltLinkQueries.length === 0) {
			prebuiltLinkQueries = ModelSelector.subtypeModelsByName(rootDocumentModel)(models)
				.flatMap((subType) => prebuiltLinkQueriesMap.get(subType.modelId))
				.filter((nodeQuery): nodeQuery is PrebuiltLinkQuery => !!nodeQuery);
		}

		const queries: DataOperation.Query.TreeNodes.LinkQuery[] = [];
		for (const prebuiltQuery of prebuiltLinkQueries ?? []) {
			// Prevent self-reference relationship model to recurs itself
			if (parentRelationshipModel === prebuiltQuery.relationshipModel) {
				continue;
			}

			queries.push({
				...prebuiltQuery,
				childNodes: createLinkQueries(models, prebuiltQuery.targetDocumentModel, prebuiltQuery.relationshipModel)
			});
		}

		return queries.length > 0 ? queries : undefined;
	}
}

function createRelationshipModelUtils(models: ModelsState) {
	function getChildEntity(rmRef: string, parent: string) {
		const rm = ModelSelector.relationshipModelByName(rmRef)(models);
		const childEntity = rm ? RelationshipModelUtils.getEntityCharacteristicByReversedRole(rm, parent) : undefined;
		if (!childEntity) {
			throw TreeEngineError.NotFoundError("RelationshipModel", { id: rmRef });
		}
		return childEntity;
	}
	function getParentEntity(rmRef: string, parent: string) {
		const rm = ModelSelector.relationshipModelByName(rmRef)(models);
		const parentEntity = rm ? RelationshipModelUtils.getEntityCharacteristicByRole(rm, parent) : undefined;
		if (!parentEntity) {
			throw TreeEngineError.NotFoundError("RelationshipModel", { id: rmRef });
		}
		return parentEntity;
	}
	function getLinkDocumentModel(rmRef: string) {
		const rm = ModelSelector.relationshipModelByName(rmRef)(models);
		return rm?.content.linkDocumentModel ?? undefined;
	}
	return {
		getChildEntity,
		getParentEntity,
		getLinkDocumentModel
	};
}
