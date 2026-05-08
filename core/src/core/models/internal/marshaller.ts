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

import { type ModelGraph, type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { TreeEngineError } from "../../error/index.js";

import { type RuntimeTreeModel, type TreeModel } from "./tree-model.js";
import { DocumentModelUtils } from "./utils/document-model-utils.js";

/**
 * Parse a {@link TreeModel} into a compatible {@link RuntimeTreeModel}.
 */
export function marshallTreeModel(
	treeModel: TreeModel,
	documentModels: DocumentModel[],
	modelGraph: ModelGraph
): RuntimeTreeModel {
	const { header, content } = treeModel;

	const marshallingParams: MarshallingParams = {
		treeModel,
		documentModels,
		relationshipModels: modelGraph.relationshipModels,
		documentModelsGraph: modelGraph.documentModels
	};

	return {
		header,
		content: {
			...content,
			nodes: content.nodes.map((node) => marshallTreeNode(node, marshallingParams)),
			configuration: { ...content.configuration, root: marshallTreeRootConfiguration(marshallingParams) }
		}
	};
}

/** @internal */
export interface MarshallingParams {
	treeModel: TreeModel;
	documentModels: DocumentModel[];
	documentModelsGraph?: ModelGraph.DocumentModel[];
	relationshipModels: RelationshipModel[];
}

/** @internal */
export function marshallTreeNode(
	node: TreeModel.TreeNode,
	marshallingParams: MarshallingParams
): RuntimeTreeModel.TreeNode {
	const hasInheritProperties = Object.values(node.configuration.inherit ?? {}).some(Boolean);
	let marshalledSuperTreeNode: TreeModel.TreeNode;
	if (hasInheritProperties) {
		const superTypeNode = findSuperTypeNode(node.documentModelRef, marshallingParams);
		if (!superTypeNode) {
			throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", node.documentModelRef);
		}
		marshalledSuperTreeNode = marshallTreeNode(superTypeNode, marshallingParams);
	}

	type InheritKeys = keyof NonNullable<TreeModel.TreeNodeConfiguration["inherit"]>;
	const inheritKeys: InheritKeys[] = [
		"icon",
		"styles",
		"columns",
		"actions",
		"contextMenu",
		"defaultRowAction",
		"rowTitle",
		"childRelationshipConfigurations"
	];

	return inheritKeys.reduce<RuntimeTreeModel.TreeNode>(
		(currentResult, inheritKey) => {
			let value: TreeModel.TreeNode[InheritKeys];

			if (node.configuration.inherit?.[inheritKey] && marshalledSuperTreeNode) {
				value = marshalledSuperTreeNode[inheritKey];
			} else if (inheritKey === "columns") {
				value = marshallTreeNodeColumns(node, marshallingParams);
			} else if (inheritKey === "childRelationshipConfigurations") {
				value = marshallTreeNodeChildRelationshipConfigurations(node, marshallingParams);
			} else {
				value = node[inheritKey];
			}

			return { ...currentResult, [inheritKey]: value };
		},
		{ ...node, columns: [], childRelationshipConfigurations: [] }
	);
}

/** @internal */
export function findSuperTypeNode(
	subtype: string,
	marshallingParams: MarshallingParams
): TreeModel.TreeNode | undefined {
	const { documentModels, documentModelsGraph, treeModel } = marshallingParams;
	const superTypeDocumentModels: string[] = [];

	if (documentModelsGraph) {
		documentModelsGraph.forEach(({ modelId, subTypes }) => {
			if (subTypes?.includes(subtype)) {
				superTypeDocumentModels.push(modelId);
			}
		});
	} else {
		documentModels.forEach(({ header }) => {
			header.annotations?.forEach(({ name, value }) => {
				const subTypes = value?.split(",").map((docRef) => docRef.trim());
				if (name === "subTypes" && subTypes?.includes(subtype)) {
					superTypeDocumentModels.push(header.id);
				}
			});
		});
	}

	const superTypeNode = treeModel.content.nodes.find((node) => superTypeDocumentModels.includes(node.documentModelRef));
	if (!superTypeNode && superTypeDocumentModels.length) {
		return superTypeDocumentModels.map((docRef) => findSuperTypeNode(docRef, marshallingParams)).find(Boolean);
	}

	return superTypeNode;
}

function marshallTreeNodeChildRelationshipConfigurations(
	node: TreeModel.TreeNode,
	marshallingParams: MarshallingParams
): RuntimeTreeModel.ChildRelationshipConfiguration[] {
	const { documentModels, relationshipModels } = marshallingParams;

	return node.childRelationshipConfigurations.map((config) => {
		if (!config.columns) {
			return { ...config, columns: undefined };
		}
		const relationshipModel = relationshipModels.find((model) => model.header.id === config.relationshipModelRef);
		if (!relationshipModel) {
			throw TreeEngineError.NotFoundError("RelationshipModel", config.relationshipModelRef);
		}

		const linkDocumentModelName = relationshipModel.content.linkDocumentModel;
		if (!linkDocumentModelName) {
			return { ...config, columns: undefined };
		}

		const linkDocumentModel = documentModels.find((model) => model.header.id === linkDocumentModelName);
		if (!linkDocumentModel) {
			throw TreeEngineError.NotFoundError("DocumentModel", linkDocumentModelName);
		}

		const columns = config.columns.map<RuntimeTreeModel.TreeNodeColumn>((column) => {
			const elementPath = DocumentModelUtils.findPathById(linkDocumentModel, column.elementRef);
			const element = DocumentModelUtils.findByPath(linkDocumentModel, elementPath);

			return { ...column, elementPath, usageType: element.type === "Group" ? element.usageType : undefined };
		});

		return { ...config, columns };
	});
}

function marshallTreeNodeColumns(
	node: TreeModel.TreeNode,
	{ documentModels }: MarshallingParams
): RuntimeTreeModel.TreeNodeColumn[] {
	const documentModel = documentModels.find((model) => model.header.id === node.documentModelRef);
	if (!documentModel) {
		throw TreeEngineError.NotFoundError("DocumentModel", node.documentModelRef);
	}

	return node.columns.map((column) => {
		const elementPath = DocumentModelUtils.findPathById(documentModel, column.elementRef);
		const element = DocumentModelUtils.findByPath(documentModel, elementPath);
		return { ...column, elementPath, usageType: element.type === "Group" ? element.usageType : undefined };
	});
}

function marshallTreeRootConfiguration(marshallingParams: MarshallingParams): RuntimeTreeModel.RootConfiguration {
	const { content } = marshallingParams.treeModel;
	const { rootRef } = content.configuration;
	let childRelationshipConfiguration: TreeModel.ChildRelationshipConfiguration | undefined;
	let documentModelRef: string | undefined;
	for (const nodeConfiguration of content.nodes) {
		for (const nodeChildRelationshipConfiguration of nodeConfiguration.childRelationshipConfigurations) {
			if (nodeChildRelationshipConfiguration.id === rootRef) {
				documentModelRef = nodeConfiguration.documentModelRef;
				childRelationshipConfiguration = nodeChildRelationshipConfiguration;
			}
		}
	}
	if (!childRelationshipConfiguration) {
		throw TreeEngineError.NotFoundError("TreeEngine.ChildRelationshipConfiguration");
	}
	if (!documentModelRef) {
		throw TreeEngineError.NotFoundError("DocumentModel");
	}

	const { parentRole, relationshipModelRef } = childRelationshipConfiguration;

	return {
		parentRole,
		relationshipModelRef,
		documentModelRef
	};
}
