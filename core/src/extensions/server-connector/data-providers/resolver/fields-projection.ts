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

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { Attachment } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { ModelSelector } from "../../../../core/store/selectors/models.js";
import type { ModelsState } from "../../../../core/store/store.js";
import { DocumentModelUtils } from "../../../../core/models/shared.js";
import type { RuntimeTreeModel } from "../../../../core/models/tree-model.js";

/** @internal */
export function createFieldsMap(modelsState: ModelsState): Map<string, string[]> {
	const prebuiltFieldsMap = new Map<string, string[]>();
	const uiModel = ModelSelector.uiModel()(modelsState);
	for (const node of uiModel.content.nodes) {
		const fields = createFieldsForDocumentModel(node.columns, node.documentModelRef, modelsState);
		prebuiltFieldsMap.set(node.documentModelRef, fields);
		for (const childRelationshipConfiguration of node.childRelationshipConfigurations) {
			const rm = ModelSelector.relationshipModelByName(childRelationshipConfiguration.relationshipModelRef)(
				modelsState
			);
			if (!childRelationshipConfiguration.columns || !rm?.content.linkDocumentModel) {
				continue;
			}
			const { columns } = childRelationshipConfiguration;
			const childFields = createFieldsForDocumentModel(columns, rm.content.linkDocumentModel, modelsState);
			prebuiltFieldsMap.set(rm.content.linkDocumentModel, childFields);
		}
	}
	return prebuiltFieldsMap;
}

function createFieldsForDocumentModel(
	columns: RuntimeTreeModel.TreeNodeColumn[],
	documentModelRef: string,
	modelsState: ModelsState
): string[] {
	const documentModel = ModelSelector.documentModelByName(documentModelRef)(modelsState);
	if (!documentModel) {
		return [];
	}
	const fields = columns
		.map((column) => {
			if (column.usageType === "attachment") {
				return expandAttachmentFields(column.elementPath);
			}
			if (column.usageType === "multi-select") {
				return expandMultiselectFields(documentModel, column.elementPath);
			}

			return [column.elementPath];
		})
		.flat()
		.map((path) => ModelPath.toString(path));

	return fields;
}

/** @internal */
export function collectFieldsProjection(
	documentModel: string | undefined,
	prebuiltFieldsMap: Map<string, string[]>,
	modelsState: ModelsState
): string[] | undefined {
	if (!documentModel || prebuiltFieldsMap.size === 0) {
		return undefined;
	}

	const fieldsProjection = new Set<string>();
	let subTypes = [documentModel];
	while (subTypes.length > 0) {
		const nextSubTypes: string[] = [];
		for (const entity of subTypes) {
			const prebuildFields = prebuiltFieldsMap.get(entity);
			prebuildFields?.forEach((field) => fieldsProjection.add(field));
			nextSubTypes.push(...ModelSelector.subtypeModelsByName(entity)(modelsState).map((entity) => entity.modelId));
		}
		subTypes = nextSubTypes;
	}

	return [...fieldsProjection];
}

function expandAttachmentFields(modelPath: ModelPath): ModelPath[] {
	const fields = [
		"original_filename",
		"internal_filename",
		"attachment_id",
		"mime_type",
		"description"
	] satisfies (keyof Attachment)[];

	return fields.map((field) => [...modelPath, { elementName: field }]);
}

function expandMultiselectFields(documentModel: DocumentModel, modelPath: ModelPath): ModelPath[] {
	const group = DocumentModelUtils.findByPath(documentModel, modelPath);

	if (group.type !== "Group" || group.elements.length < 1) {
		return [];
	}

	return group.elements.map((element) => {
		return [...modelPath, { elementName: element.name }];
	});
}
