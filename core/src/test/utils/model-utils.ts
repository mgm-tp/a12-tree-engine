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

import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/api.js";
import { type ModelGraph, type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { type TreeModel, type RuntimeTreeModel } from "../../core/models/index.js";
import { type TreeEngineState } from "../../core/store/index.js";

import { defaultEngineState } from "../setup/basic.spec.js";

import { mockType } from "./mock-utils.js";

export const createEngineState = {
	from: (state: TreeEngineState) => createChainableState(state)
};

const createChainableState = (state: TreeEngineState): ChainableState => {
	return {
		withRelationshipModels: (relationshipModels) =>
			createChainableState({
				...state,
				models: {
					...state.models,
					modelGraph: {
						...state.models.modelGraph,
						relationshipModels
					}
				}
			}),
		withDocumentModels: (documentModels) =>
			createChainableState({
				...state,
				models: {
					...state.models,
					modelGraph: {
						...state.models.modelGraph,
						documentModels
					}
				}
			}),
		withModelReferences: createTreeHeaderFunc(state, "modelReferences"),

		withNodes: createTreeContentFunc(state, "nodes"),
		withColumns: createTreeContentFunc(state, "columns"),
		withFooterBox: createTreeContentFunc(state, "footerBox"),
		withSubHeaderBox: createTreeContentFunc(state, "subHeaderBox"),
		withConfigurations: createTreeContentFunc(state, "configuration"),
		withLabels: createTreeHeaderFunc(state, "labels"),

		create() {
			return state;
		}
	};
};

function createTreeHeaderFunc<K extends keyof TreeModel.Header>(state: TreeEngineState, key: K) {
	return (value: TreeModel.Header[K]) =>
		createChainableState({
			...state,
			models: {
				...state.models,
				uiModel: {
					...state.models.uiModel,
					header: {
						...state.models.uiModel.header,
						[key]: value
					}
				}
			}
		});
}

function createTreeContentFunc<K extends keyof RuntimeTreeModel.Content>(state: TreeEngineState, contentKey: K) {
	return (contentValue: RuntimeTreeModel.Content[K]) =>
		createChainableState({
			...state,
			models: {
				...state.models,
				uiModel: {
					...state.models.uiModel,
					content: {
						...state.models.uiModel.content,
						[contentKey]: contentValue
					}
				}
			}
		});
}

interface ChainableState {
	withDocumentModels(documentModels: ModelGraph.DocumentModel[]): ChainableState;
	withRelationshipModels(relationshipModels: RelationshipModel[]): ChainableState;

	withLabels(labels: TreeModel.Header["labels"]): ChainableState;

	withColumns(columns: TreeModel.Column[]): ChainableState;
	withFooterBox(footerBox: TreeModel.FooterType): ChainableState;
	withSubHeaderBox(subHeaderBox: TreeModel.SubHeaderType): ChainableState;
	withModelReferences(modelReferences: TreeModel.ModelReference[]): ChainableState;

	withNodes(nodes: RuntimeTreeModel.TreeNode[]): ChainableState;
	withConfigurations(configuration: RuntimeTreeModel.Configuration): ChainableState;

	create(): TreeEngineState;
}

export const categoryEngineState = (() => {
	const categoryDmId = "DomainCategory";
	const productDmId = "DomainProduct";
	const bundleDmId = "DomainBundle";

	const categoryDocumentModel = mockType<ModelGraph.DocumentModel>({
		modelId: categoryDmId,
		subTypes: []
	});

	const productDocumentModel = mockType<ModelGraph.DocumentModel>({
		modelId: productDmId,
		subTypes: ["DomainBundle"]
	});

	const bundleDocumentModel = mockType<ModelGraph.DocumentModel>({
		modelId: bundleDmId,
		subTypes: []
	});

	const productNodeModel = mockType<RuntimeTreeModel.TreeNode>({
		documentModelRef: productDmId,
		childRelationshipConfigurations: []
	});

	const categoryCategoryConfig = mockType<RuntimeTreeModel.ChildRelationshipConfiguration>({
		relationshipModelRef: "CategoryCategory",
		parentRole: "Parent",
		id: "0"
	});

	const categoryProductConfig = mockType<RuntimeTreeModel.ChildRelationshipConfiguration>({
		relationshipModelRef: "CategoryProduct",
		parentRole: "Category",
		id: "1"
	});

	const categoryNodeModel = mockType<RuntimeTreeModel.TreeNode>({
		documentModelRef: categoryDmId,
		childRelationshipConfigurations: [categoryCategoryConfig, categoryProductConfig]
	});

	const categoryCategoryRelationshipModel = mockType<RelationshipModel>({
		header: {
			id: "CategoryCategory"
		},
		content: {
			entityCharacteristics: [
				{ role: "Parent", documentModel: "DomainCategory" },
				{ role: "Child", documentModel: "DomainCategory" }
			]
		}
	});

	const categoryProductRelationshipModel = mockType<RelationshipModel>({
		header: {
			id: "CategoryProduct"
		},
		content: {
			entityCharacteristics: [
				{ role: "Category", documentModel: "DomainCategory" },
				{ role: "Product", documentModel: "DomainProduct" }
			]
		}
	});

	const configuration = mockType<RuntimeTreeModel.Configuration>({
		root: {
			parentRole: "Parent",
			relationshipModelRef: "CategoryCategory",
			documentModelRef: "DomainCategory"
		}
	});

	return createEngineState
		.from(defaultEngineState)
		.withDocumentModels([bundleDocumentModel, productDocumentModel, categoryDocumentModel])
		.withRelationshipModels([categoryCategoryRelationshipModel, categoryProductRelationshipModel])
		.withConfigurations(configuration)
		.withNodes([categoryNodeModel, productNodeModel])
		.create();
})();

export const dataModelerEngineState = (() => {
	const RULE = "DomainRule";
	const FIELD = "DomainField";
	const GROUP = "DomainGroup";
	const ELEMENT = "DomainElement";
	const ATTACHMENT_GROUP = "DomainAttachmentGroup";
	const MULTI_SELECT_GROUP = "DomainMultiSelectGroup";

	const documentModels = [
		mockType<ModelGraph.DocumentModel>({
			modelId: ELEMENT,
			subTypes: [GROUP, FIELD, RULE]
		}),
		mockType<ModelGraph.DocumentModel>({
			modelId: GROUP,
			subTypes: [ATTACHMENT_GROUP, MULTI_SELECT_GROUP]
		}),
		mockType<ModelGraph.DocumentModel>({
			modelId: ATTACHMENT_GROUP,
			subTypes: []
		}),
		mockType<ModelGraph.DocumentModel>({
			modelId: MULTI_SELECT_GROUP,
			subTypes: []
		}),
		mockType<ModelGraph.DocumentModel>({
			modelId: FIELD,
			subTypes: []
		}),
		mockType<ModelGraph.DocumentModel>({
			modelId: RULE,
			subTypes: []
		})
	];

	const groupElementRm = mockType<RelationshipModel>({
		header: {
			id: "GroupElement",
			modelReferences: [
				{
					purpose: "Document model",
					modelType: "document",
					alias: "parent",
					reference: "DomainGroup"
				},
				{
					purpose: "Document model",
					modelType: "document",
					alias: "child",
					reference: "DomainElement"
				}
			]
		},
		content: {
			entityCharacteristics: [
				{ role: "Group", documentModel: GROUP },
				{ role: "Element", documentModel: ELEMENT }
			]
		}
	});

	const groupElementConfig = mockType<RuntimeTreeModel.ChildRelationshipConfiguration>({
		relationshipModelRef: groupElementRm.header.id,
		parentRole: "Group",
		id: "2"
	});

	const nodes = [
		mockType<RuntimeTreeModel.TreeNode>({
			documentModelRef: GROUP,
			childRelationshipConfigurations: [groupElementConfig]
		}),
		mockType<RuntimeTreeModel.TreeNode>({
			documentModelRef: RULE,
			childRelationshipConfigurations: []
		}),
		mockType<RuntimeTreeModel.TreeNode>({
			documentModelRef: FIELD,
			childRelationshipConfigurations: []
		})
	];

	const configuration = mockType<RuntimeTreeModel.Configuration>({
		root: {
			parentRole: "Group",
			relationshipModelRef: "GroupElement",
			documentModelRef: "DomainGroup"
		}
	});

	return createEngineState
		.from(defaultEngineState)
		.withDocumentModels(documentModels)
		.withRelationshipModels([groupElementRm])
		.withConfigurations(configuration)
		.withNodes(nodes)
		.withModelReferences([
			{
				purpose: "document-model-for-tree",
				modelType: "document",
				reference: "DomainAttachmentGroup"
			},
			{
				purpose: "document-model-for-tree",
				modelType: "document",
				reference: "DomainGroup"
			},
			{
				purpose: "document-model-for-tree",
				modelType: "document",
				reference: "DomainField"
			},
			{
				purpose: "document-model-for-tree",
				modelType: "document",
				reference: "DomainRule"
			},
			{
				purpose: "relationship-model-for-tree",
				modelType: "relationship",
				reference: "GroupElement"
			}
		])
		.create();
})();

export function createDocumentModel(id: string, elements: DocumentModel.Element[]): DocumentModel {
	return {
		header: {
			id,
			locales: [{ code: "en" }, { code: "de" }],
			modelType: "document",
			modelVersion: "24.0.0"
		},
		content: {
			modelConfig: {
				timeZone: "UTC"
			},
			modelInfo: {},
			modelRoot: {
				type: "Group",
				id: "RootGroup",
				name: "RootGroup",
				elements: [
					{
						type: "Group",
						id: "G0",
						name: "root",
						repeatability: 1,
						elements
					}
				],
				repeatability: 1
			}
		}
	};
}

export function createMultiSelectGroup(alphabeticalSorting?: boolean): DocumentModel.Group {
	const enumField: DocumentModel.Field = {
		type: "Field",
		id: "enum",
		name: "value",
		fieldType: {
			type: "EnumerationType",
			values: [
				{
					value: "1",
					label: [
						{ locale: "en", text: "One" },
						{ locale: "de", text: "Einer" }
					]
				},
				{
					value: "2",
					label: [
						{ locale: "en", text: "Two" },
						{ locale: "de", text: "Zwei" }
					]
				},
				{
					value: "3",
					label: [
						{ locale: "en", text: "Three" },
						{ locale: "de", text: "Drei" }
					]
				}
			],
			alphabeticalSorting
		}
	};
	return {
		type: "Group",
		id: "multi-select",
		name: "multi-select",
		usageType: "multi-select",
		repeatability: 3,
		elements: [enumField]
	};
}
