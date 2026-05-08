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

import {
	type EntityCharacteristics,
	type ModelGraph,
	type RelationshipModel
} from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { RelationshipModelUtils, type RuntimeTreeModel } from "../../../models/index.js";

import { type Models, type ModelsState } from "../store.js";

import { type Selector, createSelector } from "./selector.js";

/**
 * These selectors provide access to the models in the store
 */
export namespace ModelSelector {
	export function models(): Selector<Models, ModelsState> {
		return (state) => state.models;
	}

	export function modelGraph(): Selector<ModelGraph, ModelsState> {
		return (state) => models()(state).modelGraph;
	}

	export function documentModels(): Selector<DocumentModel[], ModelsState> {
		return (state) => models()(state).documentModels;
	}

	export function documentModelByName(name: string): Selector<DocumentModel | undefined, ModelsState> {
		return (state) => documentModelByNameReselect(state, name);
	}
	const documentModelByNameReselect = createSelector(
		[documentModels(), (_, name: string) => name],
		(documentModels, name) => {
			return documentModels.find((model) => model.header.id === name);
		}
	);

	export function linkDocumentModel(relationshipModelName: string): Selector<DocumentModel | undefined, ModelsState> {
		return (state) => linkDocumentModelReselect(state, relationshipModelName);
	}
	const linkDocumentModelReselect = createSelector(
		[(state, relationshipModelName: string) => relationshipModelByName(relationshipModelName)(state), documentModels()],
		(relationshipModel, documentModels) => {
			if (!relationshipModel) {
				return undefined;
			}
			const { linkDocumentModel } = relationshipModel.content;
			if (!linkDocumentModel) {
				return undefined;
			}
			return documentModels.find((model) => model.header.id === linkDocumentModel);
		}
	);

	export function relationshipModels(): Selector<RelationshipModel[], ModelsState> {
		return (state) => modelGraph()(state).relationshipModels;
	}

	export function relationshipModelByName(name: string): Selector<RelationshipModel | undefined, ModelsState> {
		return (state) => relationshipModelByNameReselect(state, name);
	}
	const relationshipModelByNameReselect = createSelector(
		[relationshipModels(), (_, name: string) => name],
		(relationshipModels, name) => {
			return relationshipModels.find((model) => model.header.id === name);
		}
	);

	export function relationshipBetweenDocumentModels(
		[model1, model2]: [string, string],
		candidateRelationshipModels?: string[]
	): Selector<RelationshipModel | undefined, ModelsState> {
		return (state) =>
			relationshipBetweenDocumentModelsReselect(
				state,
				model1,
				model2,
				CandidateRelationshipModels.toString(candidateRelationshipModels)
			);
	}
	/** @internal */
	namespace CandidateRelationshipModels {
		const DIVIDER = "~";
		export function toString(relationshipModels?: string[]): string | undefined {
			return relationshipModels?.join(DIVIDER);
		}
		export function fromString(candidates?: string): string[] | undefined {
			return candidates === "" ? [] : candidates?.split(DIVIDER);
		}
		export function toCandidates(modelGraph: ModelGraph, candidates?: string): RelationshipModel[] | undefined {
			const candidateRelationshipModelNames = CandidateRelationshipModels.fromString(candidates);
			if (!candidateRelationshipModelNames) {
				return undefined;
			}
			return modelGraph.relationshipModels.filter((rm) => {
				return candidateRelationshipModelNames.includes(rm.header.id);
			});
		}
	}
	const relationshipBetweenDocumentModelsReselect = createSelector(
		[
			models(),
			(_, model1: string) => model1,
			(_, __, model2: string) => model2,
			(_, __, ___, candidates?: string) => candidates
		],
		(models, model1, model2, candidates) => {
			const relationshipModels =
				CandidateRelationshipModels.toCandidates(models.modelGraph, candidates) ?? models.modelGraph.relationshipModels;

			return relationshipModels.find((relationshipModel) => {
				const { entityCharacteristics } = relationshipModel.content;
				let matchedCount = 0;
				const leftOverDocumentModelNames = [model1, model2];
				const pickedDocumentModelNames = [];

				for (const entityCharacteristic of entityCharacteristics) {
					const { documentModel } = entityCharacteristic;
					const index = leftOverDocumentModelNames.findIndex((name) => documentModel === name);
					if (index !== -1) {
						leftOverDocumentModelNames.splice(index, 1);
						pickedDocumentModelNames.push(documentModel);
						matchedCount++;
					}
				}
				if (matchedCount === 2) {
					return true;
				}
				/**
				 * This case is designed for supporting heterogeneous case where there is only 1 side of the relationship is matched.
				 * We will try to find the super type of the left-over side of the relationship then recurse with it.
				 */
				if (matchedCount === 1 && leftOverDocumentModelNames.length === 1) {
					const pickedDocumentModelName = pickedDocumentModelNames[0];
					const leftOverDocumentModelName = leftOverDocumentModelNames[0];
					const superDocumentModel = superTypeModel(leftOverDocumentModelName)({ models });
					if (!superDocumentModel) {
						return false;
					}
					const superDocumentModelName = superDocumentModel.modelId;
					return !!relationshipBetweenDocumentModels(
						[pickedDocumentModelName, superDocumentModelName],
						[relationshipModel.header.id]
					)({ models });
				}

				/**
				 * This case is designed for supporting heterogeneous case where there is none of these relationships are match
				 * We will get the super types of both document models then recurse with it
				 */
				if (matchedCount === 0 && leftOverDocumentModelNames.length === 2) {
					const superTypes = leftOverDocumentModelNames.map((name) => superTypeModel(name)({ models })?.modelId);
					if (superTypes.some((type) => !type)) {
						return false;
					}
					const docs = superTypes as [string, string];
					return !!relationshipBetweenDocumentModels(docs, [relationshipModel.header.id])({ models });
				}

				return false;
			});
		}
	);

	/** @internal */
	export function subtypeModels(
		documentModel: ModelGraph.DocumentModel,
		recursive?: boolean
	): Selector<ModelGraph.DocumentModel[], ModelsState> {
		return (state) => subtypeModelsReselect(state, Subtypes.toString(documentModel.subTypes), recursive);
	}
	/** @internal */
	namespace Subtypes {
		const DIVIDER = "#@#";
		export function toString(subTypes: string[] | null): string | undefined {
			return subTypes?.join(DIVIDER);
		}
		export function fromString(subTypes?: string): string[] {
			return subTypes ? subTypes.split(DIVIDER) : [];
		}
	}
	const subtypeModelsReselect = createSelector(
		[models(), (_, subTypes: string) => subTypes, (_, __, recursive?: boolean) => recursive],
		(models, subTypes, recursive) => {
			const result: ModelGraph.DocumentModel[] = [];

			for (const subtypeId of Subtypes.fromString(subTypes)) {
				const subtypeModel = models.modelGraph.documentModels.find(({ modelId }) => modelId === subtypeId);
				if (subtypeModel) {
					result.push(subtypeModel);
					if (recursive) {
						result.push(...subtypeModels(subtypeModel, recursive)({ models }));
					}
				}
			}

			return result;
		}
	);

	/** @internal */
	export function subtypeModelsByName(documentModelName: string): Selector<ModelGraph.DocumentModel[], ModelsState> {
		return (state) => subtypeModelsByNameReselect(state, documentModelName);
	}
	const subtypeModelsByNameReselect = createSelector(
		[models(), (_, documentModelName: string) => documentModelName],
		(models, documentModelName) => {
			const { documentModels } = models.modelGraph;
			const documentModel = documentModels.find(({ modelId }) => modelId === documentModelName);
			if (!documentModel) {
				return [];
			}
			return ModelSelector.subtypeModels(documentModel, true)({ models });
		}
	);

	/**
	 * @internal
	 * Identify the supertype of certain document model by searching for its subtype.
	 * The selector will try to go through each referenced model to narrow down the list of candidates
	 * to avoid picking up document models outside the current tree model.
	 *
	 * TODO: Try somehow to merge/reuse with collectReferencedDocumentModels function in extensions/client/internal/utils.ts
	 */
	export function superTypeModel(type: string): Selector<ModelGraph.DocumentModel | undefined, ModelsState> {
		return (state) => superTypeModelReselect(state, type);
	}
	const superTypeModelReselect = createSelector(
		[modelGraph(), uiModel(), (_, type: string) => type],
		(modelGraph, uiModel, type) => {
			const { documentModels, relationshipModels } = modelGraph;

			const relatedDocumentModels = uiModel.header.modelReferences
				.flatMap((modelReference) => {
					if (modelReference.purpose === "document-model-for-tree") {
						return [modelReference.reference];
					}

					if (modelReference.purpose === "relationship-model-for-tree") {
						return relationshipModels
							.find((e) => e.header.id === modelReference.reference)
							?.header.modelReferences?.map(({ reference }) => reference);
					}

					return [];
				})
				.flatMap((documentModelRef) => documentModels.find(({ modelId }) => modelId === documentModelRef));

			const superTypeModel = relatedDocumentModels.find((documentModel) => documentModel?.subTypes?.includes(type));
			if (superTypeModel) {
				return superTypeModel;
			}

			return documentModels.find((documentModel) => documentModel?.subTypes?.includes(type));
		}
	);

	export function uiModel(): Selector<RuntimeTreeModel, ModelsState> {
		return (state) => models()(state).uiModel;
	}

	/** @internal */
	export function isLinkDocumentExisted(): Selector<boolean, ModelsState> {
		return isLinkDocumentExistedReselect;
	}

	const isLinkDocumentExistedReselect = createSelector([uiModel(), relationshipModels()], (uiModel, models) => {
		const rmFromUiModels = uiModel.header.modelReferences
			.filter(({ purpose }) => purpose === "relationship-model-for-tree")
			.map(({ reference }) => reference);

		return models
			.filter((model) => rmFromUiModels.includes(model.header.id))
			.some((model) => !!model.content.linkDocumentModel);
	});

	export function nodeModel(identifierType: string): Selector<RuntimeTreeModel.TreeNode | undefined, ModelsState> {
		return (state) => nodeModelReselect(state, identifierType);
	}

	const nodeModelReselect = createSelector(
		[modelGraph(), uiModel(), (_, identifierType: string) => identifierType],
		(modelGraph, uiModel, identifierType) => {
			return findNodeModel(modelGraph.documentModels, uiModel.content.nodes, identifierType);

			function findNodeModel(
				documentModels: ModelGraph.DocumentModel[],
				nodeModels: RuntimeTreeModel.TreeNode[],
				type: string
			): RuntimeTreeModel.TreeNode | undefined {
				let result = nodeModels.find(({ documentModelRef }) => documentModelRef === type);
				if (result) {
					return result;
				}

				for (const documentModel of documentModels) {
					if (documentModel.subTypes?.includes(type)) {
						result =
							nodeModels.find(({ documentModelRef }) => documentModelRef === documentModel.modelId) ??
							findNodeModel(documentModels, nodeModels, documentModel.modelId);

						if (result) {
							return result;
						}
					}
				}
				return undefined;
			}
		}
	);

	/** @internal
	 * Find all 'reversed' ChildRelationshipConfigurations in which the document model of child entity characteristic
	 * is document model or super document models of identifierType
	 */
	export function reversedChildRelationshipConfigurations(
		identifierType: string
	): Selector<RuntimeTreeModel.ChildRelationshipConfiguration[], ModelsState> {
		const areDifferentConfigurations = (
			config1: RuntimeTreeModel.ChildRelationshipConfiguration,
			config2: RuntimeTreeModel.ChildRelationshipConfiguration
		): boolean => {
			return config1.relationshipModelRef !== config2.relationshipModelRef || config1.parentRole !== config2.parentRole;
		};

		return (state) => {
			const superDocumentModels = modelGraph()(state).documentModels.filter((model) => {
				return subtypeModels(model, true)(state).some(({ modelId }) => modelId === identifierType);
			});
			const acceptableDocumentModels = [identifierType, ...superDocumentModels.map(({ modelId }) => modelId)];

			const results: RuntimeTreeModel.ChildRelationshipConfiguration[] = [];
			const nodeModels = uiModel()(state).content.nodes;

			for (const { childRelationshipConfigurations } of nodeModels) {
				for (const config of childRelationshipConfigurations) {
					const childDocumentModel = childEntityCharacteristic(config)(state)?.documentModel;
					const isAcceptableDocumentModel = childDocumentModel && acceptableDocumentModels.includes(childDocumentModel);

					if (isAcceptableDocumentModel && results.every((config2) => areDifferentConfigurations(config, config2))) {
						results.push(config);
					}
				}
			}

			return results;
		};
	}

	/** @internal */
	export function childEntityCharacteristic(
		childRelationshipConfiguration: RuntimeTreeModel.ChildRelationshipConfiguration
	): Selector<EntityCharacteristics | undefined, ModelsState> {
		return (state) => {
			const { relationshipModelRef, parentRole } = childRelationshipConfiguration;

			const relationshipModel = relationshipModelByName(relationshipModelRef)(state);
			if (!relationshipModel) {
				return undefined;
			}

			return RelationshipModelUtils.getEntityCharacteristicByReversedRole(relationshipModel, parentRole);
		};
	}

	/** @internal */
	export function childRelationshipConfiguration(
		nodeModel: RuntimeTreeModel.TreeNode,
		childDocumentModelId: string
	): Selector<RuntimeTreeModel.ChildRelationshipConfiguration | undefined, ModelsState> {
		return (state) => {
			return nodeModel.childRelationshipConfigurations.find((config) => {
				const childDocumentModel = childEntityCharacteristic(config)(state)?.documentModel;
				if (!childDocumentModel) {
					return false;
				}
				if (childDocumentModelId === childDocumentModel) {
					return true;
				}
				const subTypes = subtypeModelsByName(childDocumentModel)(state);
				return subTypes.some(({ modelId }) => modelId === childDocumentModelId);
			});
		};
	}
}
