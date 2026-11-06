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

import { type DocumentModel, DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

/**
 * Browser tests have no filesystem, so the showcase document models are pulled into the module graph
 * eagerly at build time. Loading them synchronously keeps {@link createDocumentModel} usable from the
 * top-level constants in `basic.spec.ts`.
 */
const DOCUMENT_MODEL_JSONS = import.meta.glob<Record<string, unknown>>(
	"../../../../showcase/resources/models/*/document-models/*.json",
	{ eager: true, import: "default" }
);

export const PATH = {
	MODELS: "../../../../showcase/resources/models"
};

/** Deserializes a showcase document model, addressed by its path below {@link PATH.MODELS}. */
export function createDocumentModel(documentModelFilePath: string): DocumentModel {
	const json = DOCUMENT_MODEL_JSONS[`${documentModelFilePath}.json`];

	if (json === undefined) {
		throw new Error(`No document model bundled for "${documentModelFilePath}"`);
	}

	return new DocumentServiceFactory().getDocumentModelSerializer().deserialize(JSON.stringify(json));
}
