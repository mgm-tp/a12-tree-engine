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

import { put, type SagaGenerator } from "typed-redux-saga";

import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { convertThumbnailResponse, setThumbnails } from "@com.mgmtp.a12.client/client-core/a12internal";

import { DataOperation } from "../../data-loaders/data-loader.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";
import { ModelSelector } from "../../../../core/store/selectors/models.js";
import type { ModelsState } from "../../../../core/store/store.js";
import { DocumentModelUtils } from "../../../../core/models/shared.js";

/**
 * @internal
 * Look for {@link DataOperation.Query.LoadThumbnailUrls.Result} then update the thumbnail slice accordingly,
 * will also attempt to strip thumbnail result from the queryResults
 */
export function* handleThumbnailUrlResult(
	queryResults: DataOperation.QueryResult[],
	activityId: string
): SagaGenerator<DataOperation.QueryResult[]> {
	const loadThumbnailResults = queryResults.filter(DataOperation.Query.LoadThumbnailUrls.Result.isAssignableFrom);
	const otherResults = queryResults.filter((q) => !DataOperation.Query.LoadThumbnailUrls.Result.isAssignableFrom(q));

	if (loadThumbnailResults.length > 1) {
		throw TreeEngineError.TypeError("TreeEngine.Response", {
			expect: "1 LoadThumbnailUrls Response",
			actual: loadThumbnailResults.length
		});
	}

	if (loadThumbnailResults.length === 1) {
		const [loadThumbnailResult] = loadThumbnailResults;

		const originalResponse = DataOperation.Query.LoadThumbnailUrls.Result.toResponse(loadThumbnailResult);
		yield* put(setThumbnails({ activityId, thumbnails: convertThumbnailResponse(originalResponse) }));
	}

	return otherResults;
}

/** @internal */
export function hasAttachment(params: { models: ModelsState }): boolean {
	const { models } = params;

	const elementPathsMap = Object.fromEntries(
		models.models.uiModel.content.nodes.map(({ columns, documentModelRef }) => {
			return [documentModelRef, columns.map(({ elementPath }) => elementPath)];
		})
	);

	for (const [documentModelRef, elementPaths] of Object.entries(elementPathsMap)) {
		const documentModel = ModelSelector.documentModelByName(documentModelRef)(models);
		if (!documentModel) {
			throw TreeEngineError.NotFoundError("DocumentModel", documentModelRef);
		}

		for (const elementPath of elementPaths) {
			const modelElement = new DocumentServiceFactory()
				.getDocumentModelSearchService(documentModel)
				.getByPath(elementPath);
			if (modelElement && DocumentModelUtils.isAttachment(modelElement)) {
				return true;
			}
		}
	}

	return false;
}
