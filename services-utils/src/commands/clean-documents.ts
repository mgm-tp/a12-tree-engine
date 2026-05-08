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

import { inspect } from "node:util";

import {
	type JsonRpc2Request,
	JsonRpc2Response,
	QueryJsonRpc2Response
} from "@com.mgmtp.a12.dataservices/dataservices-access";

import { deleteDocument, listDocuments, rpcRequest } from "../utils/index.js";

import { type ModelEditorParams } from "./seed/presets/model-editor.js";

export interface CleanDocParams {
	showcases?: string[];
	variant?: ModelEditorParams["variant"] | "all";
}

export async function main({ showcases, variant }: CleanDocParams) {
	const documentModels = findDocumentModels(showcases, variant);

	const listDocumentsRequests = documentModels.map((documentModel) => listDocuments(documentModel));

	const listDocumentsResponses = (await rpcRequest(listDocumentsRequests)) as QueryJsonRpc2Response<
		QueryJsonRpc2Response.DocumentEntry[]
	>[];
	if (JsonRpc2Response.hasErrors(listDocumentsResponses)) {
		console.error(inspect(listDocumentsResponses, { depth: 10 }));
		process.exit(1);
	}

	const deleteDocumentRequests: JsonRpc2Request[] = [];
	listDocumentsResponses.forEach((response) => {
		if (!QueryJsonRpc2Response.isInstance(response)) {
			throw new Error(`Result is not a valid LIST_DOCUMENTS result ${inspect(response, { depth: 10 })}`);
		}
		response.result.entries.forEach(({ docRef }) => deleteDocumentRequests.push(deleteDocument(docRef)));
	});

	const deleteDocumentResponses = await rpcRequest(deleteDocumentRequests);

	if (JsonRpc2Response.hasErrors(deleteDocumentResponses)) {
		console.error(inspect(deleteDocumentResponses, { depth: 10 }));
		process.exit(1);
	}
}

function findDocumentModels(showcases: string[] = [], mode?: CleanDocParams["variant"]): string[] {
	const showcaseMapping: Record<string, string[]> = {
		categories: ["DomainCategory", "DomainProduct", "DomainBundle"],
		"a12-teams": ["DomainTeam", "DomainPerson"],
		"model-editor": findModelEditorDocumentModels(mode)
	};

	if (showcases.length === 0 || showcases.includes("all")) {
		showcaseMapping["model-editor"] = findModelEditorDocumentModels("all");
		return Object.values(showcaseMapping).flat();
	}

	return showcases.map((showcase) => showcaseMapping[showcase] ?? []).flat();
}

function findModelEditorDocumentModels(mode?: CleanDocParams["variant"]): string[] {
	switch (mode) {
		case "pagination":
			return ["DomainComputerPagination"];
		case "group-management":
			return ["DomainGroup-GM", "DomainAttachmentGroup-GM", "DomainMultiSelectGroup-GM"];
		case "all":
			return [
				"DomainComputer",
				"DomainComputerPagination",
				"DomainDrive",
				"DomainDirectory",
				"DomainFile",
				"DomainGroup",
				"DomainAttachmentGroup",
				"DomainMultiSelectGroup",
				"DomainGroup-GM",
				"DomainAttachmentGroup-GM",
				"DomainMultiSelectGroup-GM",
				"DomainField",
				"DomainRule",
				"DomainScreen",
				"DomainScreenElement"
			];
		default:
			return ["DomainComputer"];
	}
}
