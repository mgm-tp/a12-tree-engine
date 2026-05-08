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

import { type SagaGenerator, call, put, select } from "typed-redux-saga";

import {
	type DataProvider,
	Activity,
	ActivitySelectors,
	extractModelsInScenePayload,
	NotificationActions,
	ReferencedModel
} from "@com.mgmtp.a12.client/client-core";

import {
	maybeAsyncFnWrapper,
	TreeEngineActions,
	TreeEngineDataHolder,
	TreeEngineOperation,
	TreeEngineSelectors
} from "../../../client/index.js";
import { SagaUtils } from "../../../client/internal/shared.js";
import {
	createA12DataServiceDataLoader,
	type TreeEngineDataLoader,
	type TreeEngineServerConnectorFactories
} from "../../index.js";
import { TreeEngineError } from "../../../../core/error/index.js";
import { LocalizableFactory, RESOURCE_KEYS } from "../../../../core/services/localization/index.js";

import { RequestValidator } from "../data-loaders/request-validator.js";
import { extractOperationsFromProvideDataConfig } from "../utils.js";

import { handleExpandSubTree, handleExpandWholeTree, handleLoadAllChildNodes, init } from "./load/index.js";
import { handleLoadAllRows } from "./load/handle-load-all-rows.js";
import { handleLoadMoreRows } from "./load/handle-load-more-rows.js";
import { handleReloadNodes } from "./load/handle-reload-nodes.js";
import { handleLoad } from "./resolver/handle-load.js";
import { handleSave } from "./resolver/handle-save.js";
import { type LoadPayload, type SavePayload } from "./utils.js";
import { handleExpandToNode } from "./load/handle-expand-to-node.js";

/** @internal */
export function createTreeEngineDataProvider(
	moduleSetting?: TreeEngineServerConnectorFactories.ModuleSettings
): DataProvider {
	const dataServicesSetting = moduleSetting?.dataServicesSetting ?? {};
	const requestSelectorMap = moduleSetting?.requestSelectorMap;
	const dataLoader =
		moduleSetting?.dataLoader ?? createA12DataServiceDataLoader(dataServicesSetting, requestSelectorMap);

	const shouldCancelChildActivity = moduleSetting?.cancelChildActivity ?? true;

	return {
		name: "TreeEngineDataProvider",
		canHandle({ action }: DataProvider.CanHandleConfig): boolean {
			const { modelsInScene } = extractModelsInScenePayload(action) ?? {};

			return (
				modelsInScene?.some(
					(refModel) =>
						refModel.direct &&
						(ReferencedModel.isLoaded(refModel)
							? refModel.model.header.modelType
							: ReferencedModel.isNotLoaded(refModel)
								? refModel.model.modelType
								: undefined) === "tree"
				) ?? false
			);
		},
		*provideData(config): SagaGenerator<void> {
			const { activityId } = config;
			const operations = extractOperationsFromProvideDataConfig(config);
			const activity = yield* select(ActivitySelectors.activityById(activityId));
			if (!activity) {
				throw TreeEngineError.NotFoundError("Activity", { activityId });
			}

			try {
				switch (config.operation) {
					case "load":
						yield* call(handleLoadOperation, {
							config,
							activity,
							operations,
							dataLoader,
							moduleSetting
						});
						break;
					case "save":
						yield* call(handleSaveOperation, {
							config,
							operations,
							dataLoader,
							shouldCancelChildActivity
						});
						break;
					default:
						throw TreeEngineError.TypeError("TreeEngine.Operation", {
							expect: "A support operation by TreeEngineDataProvider",
							actual: config.operation
						});
				}
			} catch (error) {
				if (error instanceof RequestValidator.RequestLimitExceededError) {
					yield* call(handleRequestLimitError, { error, config });
				} else {
					throw error;
				}
			}
		}
	};
}

function* handleLoadOperation(params: {
	config: DataProvider.LoadConfig;
	activity: Activity;
	operations: TreeEngineOperation[] | undefined;
	dataLoader: TreeEngineDataLoader;
	moduleSetting?: TreeEngineServerConnectorFactories.ModuleSettings;
}): SagaGenerator<void> {
	const { config, activity, operations, dataLoader, moduleSetting } = params;
	const { activityId } = config;

	let updatedDataHolders: TreeEngineDataHolder[] | undefined;
	const preloadChildNodes = yield* call(getPreloadChildNode, activityId, moduleSetting);
	const payload: LoadPayload = { config, dataLoader, preloadChildNodes };

	if (operations?.length === 1) {
		const [operation] = operations;
		if (operation.type === "EXPAND_WHOLE_TREE") {
			updatedDataHolders = yield* call(handleExpandWholeTree, { ...payload });
		} else if (operation.type === "EXPAND_SUB_TREE") {
			updatedDataHolders = yield* call(handleExpandSubTree, { ...payload, operation });
		} else if (operation.type === "EXPAND_TO_NODE") {
			updatedDataHolders = yield* call(handleExpandToNode, { ...payload, operation });
		} else if (operation.type === "LOAD_ALL_CHILD_NODES") {
			updatedDataHolders = yield* call(handleLoadAllChildNodes, { ...payload, operation });
		} else if (operation.type === "LOAD_MORE_NODES") {
			updatedDataHolders = yield* call(handleLoadMoreRows, { ...payload, operation });
		} else if (operation.type === "LOAD_ALL_NODES") {
			updatedDataHolders = yield* call(handleLoadAllRows, { ...payload, operation });
		} else if (operation.type === "RELOAD_NODES") {
			updatedDataHolders = yield* call(handleReloadNodes, { ...payload, operation });
		}
	} else if (
		config.dataHolders.length === 1 &&
		Activity.DataHolder.hasDescriptor(activity.descriptor)(config.dataHolders[0])
	) {
		const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
		updatedDataHolders = yield* call(init, {
			loadPayload: payload,
			preloadChildNodes,
			isScrollToNode: !!uiState.scrollToNode
		});
	}

	if (updatedDataHolders) {
		yield* put(TreeEngineActions.setDataHolders({ activityId, dataHolders: updatedDataHolders }));
		return;
	}

	const nodesDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	const dataHolders = yield* call(handleLoad, {
		dataHolders: config.dataHolders.filter(TreeEngineDataHolder.isAssignableFrom),
		activityId,
		dataLoader,
		reload: config.dataHolders.filter(TreeEngineDataHolder.isAssignableFrom).length === nodesDataHolders?.length
	});

	const currentActivity = yield* select(ActivitySelectors.activityById(activityId));
	yield* put(
		TreeEngineActions.setDataHolders({
			activityId,
			dataHolders,
			// Only remove unused data holders when activity reload
			removeUnusedDataHolders: currentActivity?.lock?.owner === "dataSagas.reload"
		})
	);
}

function* handleSaveOperation(params: {
	config: DataProvider.SaveConfig;
	operations: TreeEngineOperation[] | undefined;
	dataLoader: TreeEngineDataLoader;
	shouldCancelChildActivity: boolean;
}): SagaGenerator<void> {
	const { config, operations, dataLoader, shouldCancelChildActivity } = params;
	const { activityId } = config;

	if (!operations) {
		throw TreeEngineError.TypeError("TreeEngine.Operation", {
			expect: "The ProvideDataConfig contains at least one operation"
		});
	}
	if (!operations.every(TreeEngineOperation.Mutation.isAssignableFrom)) {
		throw TreeEngineError.TypeError("TreeEngine.Operation", {
			expect: "All operations are mutations"
		});
	}

	if (shouldCancelChildActivity) {
		const cancelled = yield* call(SagaUtils.cancelChildActivitiesIfPresent, activityId);
		if (!cancelled) {
			yield* put(config.details.saving.failed({}));
			return;
		}
	}

	const savePayload: SavePayload = { config, dataLoader };
	const { result, dataHolders, removedDataHolderDescriptors } = yield* call(handleSave, {
		...savePayload,
		mutations: operations
	});

	const removeUnusedDataHolders = operations.some((op) => op.type === "DELETE_NODE" || op.type === "DELETE_LINK");
	yield* put(
		TreeEngineActions.setDataHolders({
			activityId,
			dataHolders,
			removedDataHolderDescriptors,
			removeUnusedDataHolders
		})
	);
	yield* put(config.details.saving.done(result ?? {}));
}

function* handleRequestLimitError(params: {
	error: RequestValidator.RequestLimitExceededError;
	config: DataProvider.ProvideDataConfig;
}): SagaGenerator<void> {
	const { error, config } = params;
	const { activityId } = config;

	// Show notification
	yield* put(
		NotificationActions.add({
			activityId,
			severity: "error",
			title: LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.treeEngine.error.requestLimitExceeded.title),
			message: LocalizableFactory.createResourceLocalizable(
				RESOURCE_KEYS.treeEngine.error.requestLimitExceeded.message,
				{
					maxRequests: { type: "plain", value: String(error.maxRequests) }
				}
			)
		})
	);

	// Reset loading state while preserving existing data
	if (config.operation === "save") {
		yield* put(config.details.saving.failed({}));
	} else {
		const currentDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
		yield* put(
			TreeEngineActions.setDataHolders({
				activityId,
				dataHolders: currentDataHolders ?? []
			})
		);
	}
}

function* getPreloadChildNode(
	activityId: string,
	moduleSetting?: TreeEngineServerConnectorFactories.ModuleSettings
): SagaGenerator<boolean> {
	let preloadChildNodes = moduleSetting?.preloadChildNodes;
	if (typeof preloadChildNodes === "function") {
		preloadChildNodes = yield* call(maybeAsyncFnWrapper(preloadChildNodes), activityId);
	}
	return preloadChildNodes ?? false;
}
