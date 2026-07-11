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

import type { RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { Activity } from "@com.mgmtp.a12.client/client-core";

import { LinkDescriptorUtils } from "../../../../../core/models/utils/relationship-utils.js";
import { Identifier, type ModelsState, type TreeEngineState } from "../../../../../core/store/store.js";
import { ModelSelector } from "../../../../../core/store/selectors/models.js";
import { TreeDataUtils } from "../../../../../core/store/utils.js";
import { TreeEngineDataHolder } from "../../../../client/data-holder.js";
import type { DataOperation } from "../../../data-loaders/data-loader.js";
import type { DocumentProcessors } from "../../../types.js";
import { TreeEngineError } from "../../../../../core/error/tree-engine-error.js";
import { type BasePayload, DocumentWithRelationship } from "../../utils.js";

import { createQueryResultDataHolders } from "../create-query-result-data-holders.js";

/** @internal */
export function resolveListQueryResults(
	params: {
		queries: DataOperation.ListQuery[];
		skippedQueries: DataOperation.ListQuery[];
		results: DataOperation.ListQueryResult[];
		dataHolders: TreeEngineDataHolder[];
		models: ModelsState;
		documentProcessors: DocumentProcessors;
		reload?: boolean;
		appended?: boolean;
		ignorePagination?: boolean;
	} & BasePayload
): TreeEngineDataHolder[] {
	const { queries, skippedQueries, results, models, dataHolders, ignorePagination, reload, ...basePayload } = params;
	const updatedDataHolders: TreeEngineDataHolder[] = [];

	for (const tuple of createQueryResultDataHolders(
		[...queries, ...skippedQueries],
		results,
		dataHolders,
		models,
		ignorePagination,
		reload
	)) {
		const { query, result, dataHolder, retrievedSize } = tuple;

		const { descriptor } = dataHolder;
		if (query && !result) {
			const meta = TreeEngineDataHolder.Meta.fromSlices(dataHolder.slices);
			const updatedMeta: TreeEngineDataHolder.Meta = { ...meta, expectedSize: undefined, children: [] };
			const updatedDataHolder: TreeEngineDataHolder = {
				...dataHolder,
				busy: false,
				loadingState: "loaded",
				slices: TreeEngineDataHolder.Slices.toSlices(updatedMeta),
				data: {}
			};
			updatedDataHolders.push(updatedDataHolder);
		} else if (!query || !result) {
			const updatedDataHolder: TreeEngineDataHolder = { ...dataHolder, busy: false, loadingState: "loaded" };

			updatedDataHolders.push(updatedDataHolder);
		} else if (
			query.relationshipModel === descriptor.relationshipModel &&
			query.roles.parent === descriptor.relationshipRole &&
			query.source === descriptor.source
		) {
			updatedDataHolders.push(
				mapQueryResultToDataHolder({
					query,
					result,
					dataHolder,
					models,
					retrievedSize,
					...basePayload
				})
			);
		}
	}

	return updatedDataHolders;
}

function mapQueryResultToDataHolder(
	params: {
		query: DataOperation.ListQuery;
		result: DataOperation.ListQueryResult;
		dataHolder: TreeEngineDataHolder;
		retrievedSize?: number;
		models: ModelsState;
		appended?: boolean;
	} & BasePayload
): TreeEngineDataHolder {
	const { query, result, dataHolder, models, appended, retrievedSize } = params;
	const relationshipName = query.relationshipModel;
	const relationshipModel = ModelSelector.relationshipModelByName(relationshipName)(models);
	if (!relationshipModel) {
		throw TreeEngineError.NotFoundError("RelationshipModel", relationshipName);
	}

	const { descriptor } = dataHolder;

	return {
		...dataHolder,
		data: toData({
			descriptor,
			query,
			result,
			relationshipModel,
			prevData: dataHolder.data,
			retrievedSize,
			appended
		}),
		slices: toSlice({
			descriptor,
			query,
			result,
			relationshipModel,
			retrievedSize,
			prevSlices: dataHolder.slices,
			appended
		}),
		loadingState: "loaded",
		busy: false
	};
}

function toData(params: {
	descriptor: TreeEngineDataHolder["descriptor"];
	query: DataOperation.ListQuery;
	result: DataOperation.ListQueryResult;
	relationshipModel: RelationshipModel;
	prevData?: TreeEngineState.Data;
	appended?: boolean;
	retrievedSize?: number;
}): TreeEngineState.Data {
	const { descriptor, result, query, relationshipModel, prevData, appended, retrievedSize } = params;
	const parentRole = query.roles.parent;
	const childRole = query.roles.child;

	const entityGroupMutatedMap: { [key: string]: boolean } = {};
	let data: TreeEngineState.Data = appended ? { ...prevData } : {};

	for (let index = 0; index < (retrievedSize ?? result.entries.length); index++) {
		const linkWithDocument = result.entries[index];
		if (!linkWithDocument) {
			break;
		}
		if (!DocumentWithRelationship.isInstance(linkWithDocument.document)) {
			throw TreeEngineError.TypeError("Document", {
				expect: "is of type DocumentWithRelationship",
				actual: linkWithDocument.document
			});
		}
		const role = TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(descriptor) ? parentRole : childRole;
		const nodeIdentifier = LinkDescriptorUtils.getNodeIdentifierByRole(linkWithDocument.linkRef.linkDescriptor, role);
		if (!nodeIdentifier) {
			throw TreeEngineError.NotFoundError(
				"TreeEngine.Identifier",
				`role: ${role}, relationshipModel: ${relationshipModel.header.id}`
			);
		}
		const nextNode: TreeEngineState.Node = {
			identifier: nodeIdentifier,
			document: linkWithDocument.document.target,
			children: []
		};

		let nodeMutationType: TreeDataUtils.MutationType;
		if (!entityGroupMutatedMap[nextNode.identifier.type] || index === 0) {
			nodeMutationType = TreeDataUtils.MutationType.IMMUTABLE;
		} else {
			nodeMutationType = TreeDataUtils.MutationType.MUTABLE;
		}
		data = TreeDataUtils.addNodeData(data, nextNode, nodeMutationType);
		entityGroupMutatedMap[nextNode.identifier.type] = true;

		if (TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(descriptor)) {
			continue;
		}

		const linkId = linkWithDocument.linkRef.id;
		if (linkId === null || linkId === undefined) {
			throw TreeEngineError.TypeError("TreeEngine.LinkRef", { expect: "Defined link id", actual: linkId });
		}

		const nextLinkIdentifier: Identifier = {
			type: linkWithDocument.linkRef.linkDescriptor.relationshipModel,
			id: linkId
		};
		const nextLink: TreeEngineState.Link = {
			identifier: nextLinkIdentifier,
			linkRef: { ...linkWithDocument.linkRef, id: linkId },
			linkDocument: linkWithDocument.document.relationship
		};

		let linkMutationType: TreeDataUtils.MutationType;
		if (!entityGroupMutatedMap[nextLink.identifier.type] || index === 0) {
			linkMutationType = TreeDataUtils.MutationType.IMMUTABLE;
		} else {
			linkMutationType = TreeDataUtils.MutationType.MUTABLE;
		}
		data = TreeDataUtils.addLinkData(data, nextLink, linkMutationType);
		entityGroupMutatedMap[nextLink.identifier.type] = true;
	}

	return data;
}

function toSlice(params: {
	descriptor: TreeEngineDataHolder["descriptor"];
	query: DataOperation.ListQuery;
	result: DataOperation.ListQueryResult;
	relationshipModel: RelationshipModel;
	appended?: boolean;
	retrievedSize?: number;
	prevSlices: Activity.DataHolder["slices"];
}): Activity.DataHolder["slices"] {
	const { descriptor, relationshipModel, query, prevSlices, appended, retrievedSize, result } = params;
	const children = TreeEngineDataHolder.Meta.fromSlices(prevSlices)?.children ?? [];

	const childIdentifiers: Identifier[] = [];

	if (TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(descriptor)) {
		/**
		 * The entries returned for root nodes have a chance to contain duplicated document
		 * because they are relationship link based, not document based.
		 * Therefore, having a Set will help with dealing with those duplicated documents.
		 */
		const uniqueChildrenSet = new Set<string>();
		for (const entry of result.entries) {
			const identifier = LinkDescriptorUtils.getNodeIdentifierByRole(entry.linkRef.linkDescriptor, query.roles.parent);
			if (!identifier) {
				throw TreeEngineError.NotFoundError(
					"TreeEngine.Identifier",
					`role: ${query.roles.parent}, relationshipModel: ${relationshipModel.header.id}`
				);
			}
			uniqueChildrenSet.add(identifier.id);
		}
		childIdentifiers.push(...Array.from(uniqueChildrenSet).map(Identifier.from));
	} else {
		if (appended) {
			childIdentifiers.push(...children);
		}

		for (let index = 0; index < (retrievedSize ?? result.entries.length); index++) {
			const entry = result.entries[index];
			if (!entry) {
				break;
			}
			const linkId = entry.linkRef.id;
			if (linkId === null || linkId === undefined) {
				throw TreeEngineError.TypeError("TreeEngine.LinkRef", { expect: "Defined link id", actual: linkId });
			}

			const identifier: Identifier = {
				type: entry.linkRef.linkDescriptor.relationshipModel,
				id: linkId
			};
			childIdentifiers.push(identifier);
		}
	}

	let sourceIdentifier: Identifier | undefined;
	if (TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor)) {
		sourceIdentifier = Identifier.from(descriptor.source);
	}

	let fullSize: number | undefined;
	if (descriptor.source) {
		if ("fullSize" in result) {
			fullSize = result.fullSize;
		} else {
			// This happens when custom TreeEngineDataProvider implementation doesn't return fullSize
			fullSize = childIdentifiers.length;
		}
	}

	const updatedMeta: TreeEngineDataHolder.Meta = {
		children: childIdentifiers,
		identifier: sourceIdentifier,
		fullSize
	};
	return TreeEngineDataHolder.Slices.toSlices(updatedMeta);
}
