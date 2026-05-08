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

import { call, put, type SagaGenerator, select, takeLatest } from "typed-redux-saga";
import { type Action, type AnyAction } from "typescript-fsa";

import { ActivityActions, ActivitySagas } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineActions } from "../../actions.js";
import {
	Commands,
	DataSelector,
	Events,
	ModelSelector,
	TreeEngineState,
	UIStateSelector
} from "../../../../../core/store/index.js";
import { TreeEngineSelectors } from "../../selectors.js";
import { type Mutable } from "../../shared.js";
import { type TreeEngineOperation } from "../../operation.js";
import { type BaseNode, PaginationUtils } from "../../../../server-connector/internal/shared.js";
import { TreeTraverser } from "../../utils.js";
import { TreeEngineError } from "../../../../../core/error/index.js";
import { type TreeEngineDataHolder } from "../../data-holder.js";

import { SagaUtils } from "../saga-utils.js";

/** @internal */
export function* watchNodeMultiSelectionSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: AnyAction) => {
			return (
				TreeEngineActions.event.match(action) &&
				action.payload.activityId === activityId &&
				Events.onNodeMultiSelectionClicked.match(action.payload.engineAction)
			);
		},
		SagaUtils.withErrorHandling(handleNodeMultiSelection, {
			activityId,
			error: TreeEngineError.MultiSelectNodeError(),
			operationType: "loading"
		})
	);
}

function* handleNodeMultiSelection(
	action: Action<TreeEngineActions.EventPayload<Action<Events.NodeMultiSelectionClickedPayload>>>
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;

	yield* call(handleMultiSelection, activityId, [engineAction.payload]);
}

/** @internal */
export function* watchOverallMultiSelectionSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: AnyAction) => {
			return (
				TreeEngineActions.event.match(action) &&
				action.payload.activityId === activityId &&
				Events.onOverallMultiSelectionClicked.match(action.payload.engineAction)
			);
		},
		SagaUtils.withErrorHandling(handleOverallMultiSelection, {
			activityId,
			error: TreeEngineError.MultiSelectNodeError(),
			operationType: "loading"
		})
	);
}

function* handleOverallMultiSelection(
	action: Action<TreeEngineActions.EventPayload<Action<Events.OverallMultiSelectionClickedPayload>>>
): SagaGenerator<void> {
	const { activityId } = action.payload;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
	}

	const root = DataSelector.root()(engineState);

	if (root.children.length === 0) {
		return;
	}

	const nodes: BaseNode[] = root.children.map((child) => {
		if (!root.identifier) {
			return { nodeIdentifier: child, nodePath: [child] };
		}
		const nodeIdentifier = DataSelector.findNodeIdentifierFromOtherSide(child, root.identifier)(engineState);
		if (!nodeIdentifier) {
			throw TreeEngineError.NotFoundError("TreeEngine.Identifier", `of child of root node ${root.identifier.id}`);
		}

		return { nodeIdentifier, nodePath: [root.identifier, child] };
	});

	yield* call(handleMultiSelection, activityId, nodes);
}

/** @internal */
export function* handleMultiSelection(
	activityId: string,
	nodes: BaseNode[],
	multiSelectionNodes?: TreeEngineState.MultiSelectionNodes
): SagaGenerator<void> {
	const shouldLoad = yield* call(shouldLoadNodes, activityId, nodes);

	if (!shouldLoad) {
		yield* call(setNextMultiSelectionState, { activityId, nodes, multiSelectionNodes });
		return;
	}

	let lockId: string | undefined;
	try {
		const operation: TreeEngineOperation.LoadAllChildNodes = {
			type: "LOAD_ALL_CHILD_NODES",
			payload: { nodes, ignorePagination: true }
		};
		lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "TreeEngine", {});

		yield* call(SagaUtils.loadActivityData, activityId, { operations: [operation] });

		yield* call(setNextMultiSelectionState, { activityId, nodes, multiSelectionNodes });
	} finally {
		if (lockId) {
			yield* put(ActivityActions.unlock({ activityId, lockId }));
		}
	}
}

function* shouldLoadNodes(activityId: string, nodes: BaseNode[]): SagaGenerator<boolean> {
	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
	}

	const multiSelectionStates = UIStateSelector.multiSelectionNodes()(engineState);
	const allNodesSelected = nodes.every(
		({ nodePath }) =>
			multiSelectionStates[TreeEngineState.NodePath.toString(nodePath)] === TreeEngineState.MultiSelectionState.SELECTED
	);
	if (allNodesSelected) {
		return false;
	}

	const nodesWithChildren = nodes.flatMap((node) => {
		const nodeModel = ModelSelector.nodeModel(node.nodeIdentifier.type)(engineState);
		return nodeModel?.childRelationshipConfigurations.length ? [node] : [];
	});

	if (!nodesWithChildren.length) {
		return false;
	}

	const nodesDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	if (!nodesDataHolders) {
		throw TreeEngineError.NotFoundError("TreeEngine.DataHolder", { activityId });
	}

	const treeTraverser = new TreeTraverser(nodesDataHolders);
	const dataHolders: TreeEngineDataHolder[] = [];
	const unloadedNodes: BaseNode[] = [];

	nodesWithChildren.forEach((node) => {
		treeTraverser.traverse(node, (node) => {
			const nodeModel = ModelSelector.nodeModel(node.nodeIdentifier.type)(engineState);

			if (!nodeModel?.childRelationshipConfigurations.length) {
				return;
			}

			let loadedDataHolder = false;
			for (const dataHolder of nodesDataHolders) {
				if (dataHolder.descriptor.source === node.nodeIdentifier.id) {
					loadedDataHolder = true;
					dataHolders.push(dataHolder);
				}
			}

			if (!loadedDataHolder) {
				unloadedNodes.push(node);
			}
		});
	});

	if (unloadedNodes.length) {
		return true;
	}

	return !dataHolders.every(isFullyLoaded);
}

function* setNextMultiSelectionState(params: {
	activityId: string;
	nodes: BaseNode[];
	multiSelectionNodes?: TreeEngineState.MultiSelectionNodes;
}): SagaGenerator<void> {
	const { activityId, nodes, multiSelectionNodes } = params;
	const nextMultiSelectionNodes = yield* call(getNextMultiSelectionNodesValues, {
		activityId,
		nodes,
		multiSelectionNodes
	});

	const engineAction = Commands.setMultiSelectionNodes({ multiSelectionNodes: nextMultiSelectionNodes });
	yield* put(TreeEngineActions.command({ activityId, engineAction }));
}

/** @internal */
export function* getNextMultiSelectionNodesValues(params: {
	activityId: string;
	nodes: BaseNode[];
	nextMultiSelectionState?: TreeEngineState.MultiSelectionState;
	multiSelectionNodes?: TreeEngineState.MultiSelectionNodes;
}): SagaGenerator<TreeEngineState.MultiSelectionNodes> {
	const { activityId, nodes, nextMultiSelectionState, multiSelectionNodes } = params;

	const dataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));

	if (!dataHolders || !engineState) {
		throw TreeEngineError.NotFoundError("Activity", { activityId });
	}

	const multiSelectionParent = engineState.models.uiModel.content.configuration.multiSelection?.selectParent;
	const multiSelectionContext = createMultiSelectionContext(
		multiSelectionNodes ?? UIStateSelector.multiSelectionNodes()(engineState)
	);
	const { getState, setState, value } = multiSelectionContext;

	const nextState =
		(nextMultiSelectionState ??
		nodes.every(({ nodePath }) => getState(nodePath) === TreeEngineState.MultiSelectionState.SELECTED))
			? TreeEngineState.MultiSelectionState.DESELECTED
			: TreeEngineState.MultiSelectionState.SELECTED;

	const traverser = new TreeTraverser(dataHolders);

	nodes.forEach((node) => {
		setState(node.nodePath, nextState);

		traverser.traverse(node, (child) => setState(child.nodePath, nextState), {
			shouldVisit: (child) => {
				const parentNodePath = TreeEngineState.NodePath.getParentNodePath(child.nodePath);
				return !parentNodePath || !DataSelector.isCircularPath(parentNodePath)(engineState);
			}
		});

		traverseParent(node, engineState).forEach((parent) => {
			let parentState: TreeEngineState.MultiSelectionState;
			if (multiSelectionParent) {
				const allLoaded = dataHolders
					.filter((dataHolder) => dataHolder.descriptor.source === parent.nodeIdentifier.id)
					.every(isFullyLoaded);

				parentState = calculateParentState({
					parent,
					traverser,
					multiSelectionContext,
					multiSelectionParent,
					allLoaded
				});
			} else {
				parentState =
					nextState === TreeEngineState.MultiSelectionState.SELECTED
						? TreeEngineState.MultiSelectionState.PARTLY_SELECTED
						: calculateParentState({ parent, traverser, multiSelectionContext });
			}

			setState(parent.nodePath, parentState);
		});
	});

	return value();
}

interface MultiSelectionContext {
	value(): Mutable<TreeEngineState.MultiSelectionNodes>;
	getState(nodePath: TreeEngineState.NodePath): TreeEngineState.MultiSelectionState;
	setState(nodePath: TreeEngineState.NodePath, state: TreeEngineState.MultiSelectionState): void;
}

function createMultiSelectionContext(initialValue: TreeEngineState.MultiSelectionNodes = {}): MultiSelectionContext {
	const internalValue: Mutable<TreeEngineState.MultiSelectionNodes> = { ...initialValue };

	return {
		value: () => internalValue,
		getState: (nodePath) =>
			internalValue[TreeEngineState.NodePath.toString(nodePath)] ?? TreeEngineState.MultiSelectionState.DESELECTED,
		setState: (nodePath, state) => {
			internalValue[TreeEngineState.NodePath.toString(nodePath)] = state;
		}
	};
}

function traverseParent(node: BaseNode, engineState: TreeEngineState): BaseNode[] {
	const result: BaseNode[] = [];
	let parentNode: BaseNode | undefined = node;

	while (parentNode) {
		parentNode = DataSelector.parent(parentNode)(engineState);
		if (parentNode) {
			result.push(parentNode);
		}
	}

	return result;
}

function calculateParentState(params: {
	parent: BaseNode;
	traverser: TreeTraverser;
	multiSelectionContext: MultiSelectionContext;
	multiSelectionParent?: boolean;
	allLoaded?: boolean;
}): TreeEngineState.MultiSelectionState {
	const { parent, traverser, multiSelectionContext, multiSelectionParent, allLoaded } = params;
	const { getState } = multiSelectionContext;
	const childrenStates: TreeEngineState.MultiSelectionState[] = [];
	traverser.traverseDirectChildren(parent, ({ nodePath }) => childrenStates.push(getState(nodePath)));

	if (
		childrenStates.length > 0 &&
		childrenStates.every((state) => state === TreeEngineState.MultiSelectionState.DESELECTED)
	) {
		return TreeEngineState.MultiSelectionState.DESELECTED;
	}

	if (
		childrenStates.length > 0 &&
		childrenStates.every((state) => state === TreeEngineState.MultiSelectionState.SELECTED) &&
		multiSelectionParent &&
		allLoaded
	) {
		return TreeEngineState.MultiSelectionState.SELECTED;
	}
	return TreeEngineState.MultiSelectionState.PARTLY_SELECTED;
}

function isFullyLoaded(dataHolder: TreeEngineDataHolder): boolean {
	const { fullSize, currentSize } = PaginationUtils.getSize(dataHolder);
	if (fullSize === undefined || currentSize === undefined) {
		return false;
	}
	return fullSize === currentSize;
}
