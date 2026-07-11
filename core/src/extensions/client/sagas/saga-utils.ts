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

import { type SagaGenerator, call, put, race, select, take, all } from "typed-redux-saga";
import { isAction, type UnknownAction } from "redux";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import {
	type Selector,
	type Activity,
	ActivityActions,
	ActivityMap,
	ActivitySagas,
	ActivitySelectors
} from "@com.mgmtp.a12.client/client-core";

import { TreeEngineError } from "../../../core/error/tree-engine-error.js";
import { DataSelector } from "../../../core/store/selectors/data.js";
import { Events } from "../../../core/store/actions.js";
import { Identifier, TreeEngineState } from "../../../core/store/store.js";
import { UIStateSelector } from "../../../core/store/selectors/ui-state.js";
import type { BaseNode } from "../../server-connector/shared.js";

import { TreeEngineActions } from "../actions.js";
import type { TreeEngineDataHolder } from "../data-holder.js";
import type { TreeEngineOperation } from "../operation.js";
import { TreeEngineSelectors } from "../selectors.js";
import { logger } from "../utils.js";

import { createAddGrandChildDataHolders, getLoadedNodeIds } from "./handlers/child-data-holders.js";

/** @internal */
export namespace SagaUtils {
	export function* cancelChildActivitiesIfPresent(activityId: string): SagaGenerator<boolean> {
		const activities = yield* select(ActivitySelectors.activities());
		const childActivities = ActivityMap.toList(activities).filter(
			({ initiatingActivityId }) => initiatingActivityId === activityId
		);
		if (childActivities.length > 0) {
			const activityIds = childActivities.map(({ id }) => id);
			logger.log("Cancel activities: ", activityIds);
			yield* put(ActivityActions.cancelRequested({ activityIds }));

			return yield* call(ActivitySagas.waitForResponseCancelRequested);
		}
		return true;
	}

	export function activityDismissed(activityId: string): Selector<{ stateChanged: boolean; returnValue: undefined }> {
		return (state) => {
			const activity = ActivitySelectors.activityById(activityId)(state);
			return { stateChanged: !activity, returnValue: undefined };
		};
	}

	export function* saveActivity(
		activityId: string,
		additionalPayload?: { operations: TreeEngineOperation[] }
	): SagaGenerator<TreeEngineOperation.Done[] | undefined> {
		yield* put(ActivityActions.save.started({ activityId, ...additionalPayload }));

		const { done } = yield* race({
			done: take<ReturnType<typeof ActivityActions.save.done>>((a: unknown) => {
				return isAction(a) && ActivityActions.save.done.match(a) && a.payload.params.activityId === activityId;
			}),
			failed: take<ReturnType<typeof ActivityActions.save.done>>((a: unknown) => {
				return isAction(a) && ActivityActions.save.failed.match(a) && a.payload.params.activityId === activityId;
			})
		});
		if (
			done &&
			Array.isArray(done.payload.result) &&
			done.payload.result.every((singleResult): singleResult is TreeEngineOperation.Done => "type" in singleResult)
		) {
			return done.payload.result;
		}

		return undefined;
	}

	export function* waitUntilActivitySavingStateIsDoneOrFailed(
		activityId: string
	): SagaGenerator<{ doneAction: UnknownAction | undefined; failedAction: UnknownAction | undefined }> {
		const { doneAction, failedAction } = yield* race({
			doneAction: take(
				(action: unknown) =>
					isAction(action) &&
					(ActivityActions.commit.done.match(action) || ActivityActions.save.done.match(action)) &&
					action.payload.params.activityId === activityId
			),
			failedAction: take(
				(action: unknown) =>
					isAction(action) &&
					(ActivityActions.commit.failed.match(action) || ActivityActions.save.failed.match(action)) &&
					action.payload.params.activityId === activityId
			)
		});

		return { doneAction, failedAction };
	}

	export type EditLinkDocumentResult = { document?: object; dirty: boolean };
	/**
	 * @return object means document has been created successfully, undefined means the document can not be created.
	 * @internal
	 */
	export function* editLinkDocument(
		activityId: string,
		documentModel: string,
		linkDocumentDocRef?: string,
		// Generally should not be used, because it is only a partial document result
		existingLinkDocument?: object
	): SagaGenerator<EditLinkDocumentResult> {
		let nextDocument: object | undefined;
		let dirty = false;

		yield* put(
			TreeEngineActions.editLinkDocument.started({
				activityId,
				model: documentModel,
				instance: linkDocumentDocRef,
				document: existingLinkDocument
			})
		);

		const { done } = yield* race({
			done: take<Action<TreeEngineActions.EditLinkDocumentPayload.Done>>((a: unknown) => {
				return isAction(a) && TreeEngineActions.editLinkDocument.done.match(a) && a.payload.activityId === activityId;
			})
		});
		if (done) {
			nextDocument = done.payload.document;
			dirty = done.payload.dirty;
		}
		return { document: nextDocument, dirty };
	}

	export function* loadActivityData(
		activityId: string,
		payload?: {
			operations?: LoadOperation[];
			dataHolderDescriptors?: Activity.DataHolderDescriptor[];
			missingOnly?: boolean;
		}
	): SagaGenerator<{ done?: UnknownAction; failed?: UnknownAction }> {
		const activity = yield* select(ActivitySelectors.activityById(activityId));
		if (!activity) {
			throw TreeEngineError.NotFoundError("Activity", activityId);
		}

		const { dataHolderDescriptors, ...additionalPayload } = payload ?? {};

		yield* put(
			ActivityActions.loadData({
				activityId,
				dataHolderDescriptors: dataHolderDescriptors ?? [activity.descriptor],
				...additionalPayload
			})
		);

		const { done, failed } = yield* race({
			done: take((action: unknown) => {
				return TreeEngineActions.setDataHolders.match(action) && action.payload.activityId === activityId;
			}),
			failed: take((action: unknown) => {
				return (
					isAction(action) &&
					ActivityActions.error.match(action) &&
					action.payload.activityId === activityId &&
					action.payload.operationType === "loading"
				);
			})
		});

		return { done, failed };
	}

	export function* performLoadOperations(
		activityId: string,
		operations: LoadOperation[],
		dataHolderDescriptors?: Activity.DataHolderDescriptor[]
	): SagaGenerator<void> {
		let lockId: string | undefined;
		try {
			lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "TreeEngine", {});
			yield* call(loadActivityData, activityId, { operations, dataHolderDescriptors });
		} finally {
			if (lockId) {
				yield* put(ActivityActions.unlock({ activityId, lockId }));
			}
		}
	}

	export function* revalidateClipboard(activityId: string): SagaGenerator<void> {
		yield* put(TreeEngineActions.event({ activityId, engineAction: Events.revalidateClipboard({}) }));
	}

	export function withErrorHandling<Args extends unknown[], Action extends UnknownAction>(
		handler: (...args: [...Args, Action]) => SagaGenerator<void>,
		params: {
			activityId: string;
			error: TreeEngineError;
			operationType?: ActivityActions.ErrorPayload["operationType"];
		}
	) {
		return function* errorBoundary(...args: [...Args, Action]) {
			try {
				yield* call(handler, ...args);
			} catch (subError) {
				if (!TreeEngineError.isInstance(subError)) {
					throw subError;
				}
				const { activityId, operationType = "saving" } = params;

				params.error.details = {
					subError,
					causeAction: args[args.length - 1] as Action
				};

				yield* put(ActivityActions.error({ activityId, error: params.error, operationType }));
				logger.error(subError);
			}
		};
	}

	export function* preloadChildNodes(
		activityId: string,
		source: string | ((descriptor: Activity.DataHolderDescriptor) => boolean)
	): SagaGenerator<void> {
		const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
		if (!UIStateSelector.preloadChildNodes()(uiState)) {
			return;
		}
		const loadedNodeIds = yield* call(getLoadedNodeIds, { activityId });
		const dataHolders: TreeEngineDataHolder[] = yield* call(createAddGrandChildDataHolders, {
			activityId,
			loadedNodeIds,
			descriptorPredicate:
				typeof source === "string"
					? (descriptor: Activity.DataHolderDescriptor) => descriptor.source === source
					: source
		});

		if (dataHolders.length > 0) {
			yield* all([
				put(TreeEngineActions.setDataHolders({ activityId, dataHolders })),
				put(ActivityActions.loadData({ activityId, missingOnly: true }))
			]);
		}
	}

	export function* areNodePathsExistedInClipboard(nodePaths: TreeEngineState.NodePath[], activityId: string) {
		const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
		if (!uiState.clipboard || nodePaths.length === 0) {
			return false;
		}
		const { clipboard } = uiState;

		return clipboard.nodes.some(function traverseNode(node: TreeEngineState.Clipboard.Node) {
			if (nodePaths.some((nodePath) => TreeEngineState.NodePath.areEqual(node.nodePath, nodePath))) {
				return true;
			}
			return node.children?.some(traverseNode);
		});
	}

	export function* scrollToNewChildNode(params: {
		activityId: string;
		newLinkIdentifiers: Identifier[];
		target: BaseNode;
	}): SagaGenerator<void> {
		const { activityId, newLinkIdentifiers, target } = params;
		const dataState = yield* select(TreeEngineSelectors.dataState(activityId));
		if (!dataState) {
			throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
		}
		const childNodes = DataSelector.childNodes(target)(dataState);

		yield* call(scrollToFoundChildNode, { activityId, newLinkIdentifiers, childNodes });
	}

	export function* scrollToNewRootNode(params: {
		activityId: string;
		newLinkIdentifiers: Identifier[];
	}): SagaGenerator<void> {
		const { activityId, newLinkIdentifiers } = params;
		const dataState = yield* select(TreeEngineSelectors.dataState(activityId));
		if (!dataState) {
			throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
		}

		const root = DataSelector.root()(dataState);
		// LIST_TERMINATING_LINKS is not supported, the process of scroll to node is only available for hidden root node case
		if (!root.identifier) {
			return;
		}

		const childNodesParams = { nodeIdentifier: root.identifier, nodePath: [root.identifier] };
		const childNodes = DataSelector.childNodes(childNodesParams)(dataState);

		yield* call(scrollToFoundChildNode, { activityId, newLinkIdentifiers, childNodes });
	}

	function* scrollToFoundChildNode(params: {
		activityId: string;
		newLinkIdentifiers: Identifier[];
		childNodes: DataSelector.RelativeNodeReturnedType[];
	}): SagaGenerator<void> {
		const { activityId, newLinkIdentifiers, childNodes } = params;
		const foundChildNode = childNodes.find((childNode) =>
			newLinkIdentifiers.some((newLinkIdentifier) => Identifier.areEqual(newLinkIdentifier, childNode.linkIdentifier))
		);

		if (!foundChildNode) {
			return;
		}

		yield* put(
			TreeEngineActions.event({
				activityId,
				engineAction: Events.scrollToNode({ nodePath: foundChildNode.nodePath })
			})
		);
	}
}

/** @internal */
export type LoadOperation =
	| TreeEngineOperation.ExpandWholeTree
	| TreeEngineOperation.ExpandSubTree
	| TreeEngineOperation.ExpandToNode
	| TreeEngineOperation.ReloadNodes
	| TreeEngineOperation.LoadAllChildNodes
	| TreeEngineOperation.LoadMoreNodes
	| TreeEngineOperation.LoadAllNodes;
