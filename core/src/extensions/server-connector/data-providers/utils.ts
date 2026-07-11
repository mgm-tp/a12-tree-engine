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

import { Activity, type DataProvider } from "@com.mgmtp.a12.client/client-core";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { TreeEngineError } from "../../../core/error/tree-engine-error.js";
import { DocumentUtils } from "../../../core/models/shared.js";
import { ModelSelector } from "../../../core/store/selectors/models.js";
import type { ModelsState } from "../../../core/store/store.js";
import type { TreeEngineDataHolder } from "../../client/data-holder.js";

import type { TreeEngineDataLoader } from "../data-loaders/data-loader.js";
import type { DocumentProcessors } from "../types.js";

/** @internal */
export interface BasePayload {
	dataLoader: TreeEngineDataLoader;
}

/** @internal */
export interface LoadPayload extends BasePayload {
	config: DataProvider.LoadConfig;
	preloadChildNodes?: boolean;
}

/** @internal */
export interface SavePayload extends BasePayload {
	config: DataProvider.SaveConfig;
}

/** @internal */
export interface DocumentWithRelationship {
	relationship?: object;
	target: object;
}

/** @internal */
export namespace DocumentWithRelationship {
	export function isInstance(o: unknown): o is DocumentWithRelationship {
		const dynamicObject = o as DocumentWithRelationship;
		if (dynamicObject.relationship && !DocumentUtils.isGroupInstance(dynamicObject.relationship)) {
			return false;
		}
		return !!dynamicObject.target && DocumentUtils.isGroupInstance(dynamicObject.target);
	}
}

/** @internal */
export function getDocumentProcessors(modelsState: ModelsState): DocumentProcessors {
	const documentService = new DocumentServiceFactory().getDocumentService();
	return {
		postLoadDocument(document, documentModelName) {
			const nodeModel = ModelSelector.nodeModel(documentModelName)(modelsState);
			if (!nodeModel) {
				throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", documentModelName);
			}
			const documentModel = ModelSelector.documentModelByName(nodeModel.documentModelRef)(modelsState);
			if (!documentModel) {
				throw TreeEngineError.NotFoundError("DocumentModel", nodeModel.documentModelRef);
			}
			if (!DocumentUtils.isGroupInstance(document)) {
				throw TreeEngineError.TypeError("GroupInstance", { actual: document });
			}

			return documentService.parseDates(document, documentModel);
		},
		postLoadLinkDocument(linkDocument, relationshipName) {
			const linkDocumentModel = ModelSelector.linkDocumentModel(relationshipName)(modelsState);
			if (!linkDocumentModel) {
				throw TreeEngineError.NotFoundError("RelationshipModel.LinkDocumentModel", { id: relationshipName });
			}
			if (!DocumentUtils.isGroupInstance(linkDocument)) {
				throw TreeEngineError.TypeError("GroupInstance", { actual: linkDocument });
			}

			return documentService.parseDates(linkDocument, linkDocumentModel);
		},
		preSaveDocument(document, documentModelName) {
			const nodeModel = ModelSelector.nodeModel(documentModelName)(modelsState);
			if (!nodeModel) {
				throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", documentModelName);
			}
			const documentModel = ModelSelector.documentModelByName(nodeModel.documentModelRef)(modelsState);
			if (!documentModel) {
				throw TreeEngineError.NotFoundError("DocumentModel", nodeModel.documentModelRef);
			}
			if (!DocumentUtils.isGroupInstance(document)) {
				throw TreeEngineError.TypeError("GroupInstance", { actual: document });
			}

			return documentService.formatDates(document, documentModel);
		},
		preSaveLinkDocument(linkDocument, relationshipName) {
			const linkDocumentModel = ModelSelector.linkDocumentModel(relationshipName)(modelsState);
			if (!linkDocumentModel) {
				throw TreeEngineError.NotFoundError("RelationshipModel.LinkDocumentModel", { id: relationshipName });
			}
			if (!DocumentUtils.isGroupInstance(linkDocument)) {
				throw TreeEngineError.TypeError("GroupInstance", { actual: linkDocument });
			}

			return documentService.formatDates(linkDocument, linkDocumentModel);
		}
	};
}

/** @internal */
export function mergeDataHolders(
	sources: TreeEngineDataHolder[],
	targets: TreeEngineDataHolder[]
): TreeEngineDataHolder[] {
	const mergedTargetsSet = new Set<TreeEngineDataHolder>();
	const mergedDataHolders = sources.map((sourceDataHolder) => {
		const foundTargetDataHolder = targets.find((dataHolder) =>
			Activity.DataHolder.hasDescriptor(sourceDataHolder.descriptor)(dataHolder)
		);
		if (foundTargetDataHolder) {
			mergedTargetsSet.add(foundTargetDataHolder);
			return foundTargetDataHolder;
		}
		return sourceDataHolder;
	});

	for (const target of targets) {
		if (!mergedTargetsSet.has(target)) {
			mergedDataHolders.push(target);
		}
	}

	return mergedDataHolders;
}
