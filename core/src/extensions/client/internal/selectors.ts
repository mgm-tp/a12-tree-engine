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

import { type ModelGraph } from "@com.mgmtp.a12.dataservices/dataservices-access";
import {
	Activity,
	ActivitySelectors,
	LocaleSelectors,
	Model,
	ModelSelectors,
	type Selector
} from "@com.mgmtp.a12.client/client-core";
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { isModelInstance } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";

import { TreeEngineError } from "../../../core/error/index.js";
import { marshallTreeModel, TreeModel } from "../../../core/models/index.js";
import {
	buildInitialUiState,
	type DataState,
	Identifier,
	ModelSelector,
	type ModelsState,
	TreeDataUtils,
	TreeEngineState,
	type UiState
} from "../../../core/store/index.js";
import { isUiState, createLruSelector as createSelector } from "../../../core/store/internal/shared.js";

import { TreeEngineDataHolder } from "./data-holder.js";
import { collectReferencedDocumentModels } from "./utils.js";

import MutationType = TreeEngineState.PageSizeMap.MutationType;

export namespace TreeEngineSelectors {
	/** @deprecated use {@link Activity.findDefaultDataHolder} instead */
	export function dataHolder(activityId: string): Selector<Activity.DataHolder | undefined> {
		return (state) => ActivitySelectors.activityPropById(activityId, Activity.findDefaultDataHolder)(state);
	}

	interface RelatedModelMap {
		treeModel: TreeModel;
		modelGraph: ModelGraph;
		[key: string]: DocumentModel | unknown | null;
	}
	/**
	 * This selector is meant to be used for chery-picking every necessary models and should not include any computation.
	 * This map then can be memorized for computing the {@link RuntimeTreeModel} in the {@link modelsState} selector.
	 */
	function relatedModelMap(activityId: string): Selector<RelatedModelMap | Model.Error | undefined> {
		return (state) => relatedModelMapReselect(state, activityId);
	}
	const relatedModelMapReselect = createSelector(
		[
			(state, activityId) => ModelSelectors.modelInScene<TreeModel>({ activityId, modelType: "tree" })(state),
			(state, activityId) => ModelSelectors.modelErrorInScene({ activityId, modelType: "tree" })(state),
			(state) => ModelSelectors.models()(state),
			(state) => ModelSelectors.modelGraph()(state)
		],
		(treeModel, treeModelError, modelMap, modelGraph) => {
			if (!treeModel) {
				return treeModelError;
			}

			if (modelGraph.relationshipModels.length === 0 || modelGraph.documentModels.length === 0) {
				return undefined;
			}

			const relatedModelMap: RelatedModelMap = { treeModel, modelGraph };
			for (const reference of collectReferencedDocumentModels(treeModel, modelGraph.relationshipModels)) {
				const model = modelMap[reference];
				if (isDocumentModel(model)) {
					relatedModelMap[reference] = model;
					continue;
				}

				if (Model.Error.isInstance(model)) {
					return model;
				}

				return undefined;
			}

			return relatedModelMap;
		}
	);

	/** @internal */
	export function modelsStateOrError(activityId: string): Selector<ModelsState | Model.Error | undefined> {
		return (state) => modelsStateOrErrorReselect(state, activityId);
	}
	const modelsStateOrErrorReselect = createSelector(
		[(state, activityId) => relatedModelMap(activityId)(state)],
		(relatedModels) => {
			if (!relatedModels || Model.Error.isInstance(relatedModels)) {
				return relatedModels;
			}

			const { treeModel, modelGraph, ...documentModelsMap } = relatedModels;

			const documentModels = Object.values(documentModelsMap).map((model) => {
				if (isDocumentModel(model)) {
					return model;
				}

				throw TreeEngineError.TypeError("DocumentModel", { actual: model });
			});

			const uiModel = marshallTreeModel(treeModel, documentModels, modelGraph);
			return { models: { uiModel, documentModels, modelGraph } };
		}
	);

	export function modelsState(activityId: string): Selector<ModelsState | undefined> {
		return (state) => {
			const modelsOrError = modelsStateOrError(activityId)(state);
			if (Model.Error.isInstance(modelsOrError)) {
				return undefined;
			}

			return modelsOrError;
		};
	}

	export function nodesDataHolders(activityId: string): Selector<TreeEngineDataHolder[] | undefined> {
		return (state) => nodesDataHoldersReselect(state, activityId);
	}

	const nodesDataHoldersReselect = createSelector(
		[(state, activityId) => ActivitySelectors.activityPropById(activityId, (a) => a.dataHolders)(state)],
		(dataHolders) => {
			if (!dataHolders) {
				return undefined;
			}
			return dataHolders?.filter((dataHolder): dataHolder is TreeEngineDataHolder => {
				return (
					TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(dataHolder.descriptor) ||
					TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(dataHolder.descriptor) ||
					TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(dataHolder.descriptor)
				);
			});
		}
	);

	const initialUiState: UiState = buildInitialUiState();
	type Mutable<T> = {
		-readonly [P in keyof T]: Mutable<T[P]>;
	};
	function busyDataHolderDescriptors(activityId: string): Selector<Activity.DataHolderDescriptor[] | undefined> {
		return (state) => busyDataHolderDescriptorsReselect(state, activityId);
	}
	const busyDataHolderDescriptorsReselect = createSelector(
		[(state, activityId) => nodesDataHolders(activityId)(state)],
		(dataHolders) => {
			return dataHolders
				?.filter(({ busy, descriptor }) => {
					return TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(descriptor) && !!busy;
				})
				.map<Activity.DataHolderDescriptor>(({ descriptor }) => descriptor);
		}
	);

	const defaultPageSizeMap: TreeEngineState.PageSizeMap = {};
	function pageSizeMaps(activityId: string): Selector<TreeEngineState.PageSizeMap> {
		return (state) => pageSizeMapsReselect(state, activityId);
	}
	const pageSizeMapsReselect = createSelector(
		[(state, activityId) => nodesDataHolders(activityId)(state)],
		(dataHolders) => {
			let pageSizeMap: TreeEngineState.PageSizeMap = {};
			for (const dataHolder of dataHolders ?? []) {
				if (!dataHolder.descriptor.relationshipModel) {
					return defaultPageSizeMap;
				}
				if (!dataHolder.descriptor.source) {
					continue;
				}
				const identifier = Identifier.from(dataHolder.descriptor.source);
				const meta = TreeEngineDataHolder.Meta.fromSlices(dataHolder.slices);
				if (meta) {
					const { fullSize, expectedSize } = meta;

					pageSizeMap = TreeEngineState.PageSizeMap.setSize(
						pageSizeMap,
						identifier,
						dataHolder.descriptor.relationshipModel,
						{ expectedSize, fullSize },
						MutationType.MUTABLE
					);
				}
			}
			return pageSizeMap;
		}
	);

	export function uiState(activityId: string): Selector<UiState> {
		return (state) => uiStateReselect(state, activityId);
	}
	const uiStateReselect = createSelector(
		[
			(state, activityId) => dataHolder(activityId)(state)?.slices["uiState"],
			(state, activityId) => busyDataHolderDescriptors(activityId)(state),
			(state, activityId) => pageSizeMaps(activityId)(state)
		],
		(uiState, busyDataHolders, pageSizeMap) => {
			if (!isUiState(uiState) || !busyDataHolders) {
				return initialUiState;
			}

			if (busyDataHolders.length === 0) {
				return { ...uiState, pageSizeMap };
			}

			const busyNodes: Mutable<TreeEngineState.BusyNodes> = {};
			busyDataHolders.forEach((descriptor) => {
				if (!descriptor.source) {
					return;
				}
				const identifier = Identifier.from(descriptor.source);
				if (!busyNodes[identifier.type]) {
					busyNodes[identifier.type] = {};
				}
				busyNodes[identifier.type][identifier.id] = {};
			});

			return { ...uiState, busyNodes, pageSizeMap };
		}
	);

	function dataHolderWithData(
		activityId: string
	): Selector<Pick<TreeEngineDataHolder, "descriptor" | "data" | "slices">[] | undefined> {
		return (state) => dataHolderWithDataReselect(state, activityId);
	}
	const dataHolderWithDataReselect = createSelector(
		[(state, activityId) => nodesDataHolders(activityId)(state)],
		(dataHolders) => {
			return dataHolders
				?.filter(({ data = {} }) => Object.keys(data).length > 0)
				.map(({ data, slices, descriptor }) => ({ data, slices, descriptor }));
		}
	);

	export function dataState(activityId: string): Selector<DataState | undefined> {
		return (state) => dataStateReselect(state, activityId);
	}

	const dataStateReselect = createSelector(
		[(state, activityId) => dataHolderWithData(activityId)(state)],
		mergeDataHolders
	);

	/** @internal */
	export function mergeDataHolders(dataHolders?: Pick<TreeEngineDataHolder, "descriptor" | "data" | "slices">[]) {
		const result: Mutable<DataState> = { root: { children: [] }, data: {} };
		dataHolders?.forEach(({ data, slices, descriptor }) => {
			if (
				TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(descriptor) ||
				TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor)
			) {
				const meta = TreeEngineDataHolder.Meta.fromSlices(slices);
				if (meta) {
					result.root = meta;
				}
				result.data = mergeData(result.data, data as TreeEngineState.Data);
			} else if (TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(descriptor)) {
				result.data = mergeData(result.data, data as TreeEngineState.Data);
			}
		});

		dataHolders?.forEach(({ slices, descriptor }) => {
			if (!TreeEngineDataHolder.Descriptor.ChildNodes.isAssignableFrom(descriptor)) {
				return;
			}

			const nodeIdentifier: Identifier = Identifier.from(descriptor.source);
			const node = TreeDataUtils.readNodeData(result.data, nodeIdentifier);
			if (!node) {
				return;
			}
			const meta = TreeEngineDataHolder.Meta.fromSlices(slices);
			if (meta?.children) {
				node.children.push(...meta.children);
			}
			result.data = TreeDataUtils.updateNodeData(result.data, node, TreeDataUtils.MutationType.MUTABLE);
		});

		return result;
	}

	function mergeData(data: TreeEngineState.Data, newData: TreeEngineState.Data): TreeEngineState.Data {
		Object.values(newData).forEach((dataByType = {}) => {
			Object.values(dataByType).forEach((entity) => {
				if (!entity) {
					return;
				}
				if (TreeEngineState.Node.isAssignableFrom(entity)) {
					const node: TreeEngineState.Node = { ...entity, children: [] };
					data = TreeDataUtils.addNodeData(data, node, TreeDataUtils.MutationType.MUTABLE);
				} else if (TreeEngineState.Link.isAssignableFrom(entity)) {
					data = TreeDataUtils.addLinkData(data, entity, TreeDataUtils.MutationType.MUTABLE);
				}
			});
		});
		return data;
	}

	export function engineState(activityId: string): Selector<TreeEngineState | undefined> {
		return (state) => engineStateReselect(state, activityId);
	}

	const engineStateReselect = createSelector(
		[
			(state, activityId) => dataState(activityId)(state),
			(state, activityId) => uiState(activityId)(state),
			(state, activityId) => modelsState(activityId)(state),
			LocaleSelectors.locale()
		],
		(dataState, uiState, models, locale) => {
			if (!dataState || !models) {
				return undefined;
			}
			return { ...uiState, ...dataState, ...models, locale };
		}
	);

	export function isPaginatedTree(activityId: string): Selector<boolean> {
		return (state) => isPaginatedTreeReselect(state, activityId);
	}

	const isPaginatedTreeReselect = createSelector([(state, activityId) => modelsState(activityId)(state)], (models) => {
		if (!models) {
			return false;
		}
		const uiModel = ModelSelector.uiModel()(models);
		const expansionStrategy = uiModel.content.configuration.expansionStrategy;
		return (
			TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy) &&
			typeof expansionStrategy.pageSize === "number"
		);
	});
}

function isDocumentModel(model: unknown): model is DocumentModel {
	return !!model && isModelInstance(model) && Model.isDocumentModel(model);
}
