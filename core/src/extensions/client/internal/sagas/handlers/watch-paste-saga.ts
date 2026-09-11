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

import { all, call, put, type SagaGenerator, select, takeLatest } from "typed-redux-saga";
import { type Action, type AnyAction } from "typescript-fsa";

import { type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type Activity, ActivityActions, ActivitySagas } from "@com.mgmtp.a12.client/client-core";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";

import { RelationshipModelUtils, type RuntimeTreeModel } from "../../../../../core/models/index.js";
import {
	Commands,
	DataSelector,
	type DataState,
	Events,
	type Identifier,
	ModelSelector,
	type ModelsState,
	TreeEngineState,
	UIStateSelector
} from "../../../../../core/store/index.js";
import { TreeEngineActions } from "../../actions.js";
import { TreeEngineDataHolder } from "../../data-holder.js";
import { type TreeEngineOperation } from "../../operation.js";
import { TreeEngineSelectors } from "../../selectors.js";
import { TreeEngineError } from "../../../../../core/error/index.js";
import { PasteEvent } from "../../../../../core/view/internal/shared.js";
import { type BaseNode } from "../../../../server-connector/internal/shared.js";

import { SagaUtils } from "../saga-utils.js";

import { MoveNodeOperation } from "./create-move-node-operation.js";
import { createAddGrandChildDataHolders, expandNode } from "./watch-node-expansion-saga.js";

type EngineAction = Action<
	TreeEngineActions.EventPayload<Action<Events.EventButtonClickedPayload | Events.NodeEventButtonClickedPayload>>
>;

/** @internal */
export function* watchPasteSaga(activityId: string): SagaGenerator<void> {
	yield* takeLatest(
		(action: AnyAction) => {
			return (
				TreeEngineActions.event.match(action) &&
				action.payload.activityId === activityId &&
				(Events.onNodeEventButtonClicked.match(action.payload.engineAction) ||
					Events.onEventButtonClicked.match(action.payload.engineAction) ||
					Events.onMultiSelectionEventButtonClicked.match(action.payload.engineAction)) &&
				Object.values<string>(PasteEvent).includes(action.payload.engineAction.payload.button.event)
			);
		},
		SagaUtils.withErrorHandling(handlePaste, { activityId, error: TreeEngineError.PasteNodeError() })
	);
}

function* handlePaste(action: EngineAction) {
	let lockId: string | undefined;
	const { activityId, engineAction } = action.payload;

	const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
	const { clipboard } = uiState;
	if (!clipboard) {
		throw TreeEngineError.NotFoundError("TreeEngine.Clipboard", { activityId });
	}

	const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
	const dataState = yield* select(TreeEngineSelectors.dataState(activityId));
	if (!dataState || !modelsState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
	}

	try {
		let target: BaseNode | undefined;
		if (Events.onNodeEventButtonClicked.match(engineAction)) {
			target = engineAction.payload;
		}

		const pasteEvent = Object.values<string>(PasteEvent).find((item) => item === engineAction.payload.button.event);
		let position: TreeTableNodeDropPosition | undefined = undefined;

		if (pasteEvent === PasteEvent.ABOVE) {
			position = TreeTableNodeDropPosition.TOP;
		}
		if (pasteEvent === PasteEvent.BELOW) {
			position = TreeTableNodeDropPosition.BOTTOM;
		}

		let operations: TreeEngineOperation.CopyNode[] | TreeEngineOperation.MoveNode[];
		const params: Params = { clipboard, target, activityId, dataState, modelsState, position };

		if (clipboard.action === TreeEngineState.Clipboard.Action.CUT) {
			operations = yield* call(buildMoveNodeOperations, params);
		} else {
			operations = yield* call(buildCopyNodesOperations, params);
		}

		lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "TreeEngine", {});
		const results = yield* call(SagaUtils.saveActivity, activityId, { operations });

		if (clipboard.action === TreeEngineState.Clipboard.Action.CUT) {
			const setCutNodesAction = Commands.setCutNodes({ cutNodes: null });
			yield* put(TreeEngineActions.command({ activityId, engineAction: setCutNodesAction }));
		}

		if (target) {
			const uiState = yield* select(TreeEngineSelectors.uiState(activityId));
			const isExpanded = uiState.expandedNodes[TreeEngineState.NodePath.toString(target.nodePath)];
			if (!isExpanded && !position) {
				yield* call(expandNode, { ...target, activityId });
			}
		}

		const targetParent = target ? DataSelector.parent(target)(dataState) : undefined;
		// Pasting above/below attaches the nodes to the target's parent, not to the target itself.
		const pasteAsSibling = position === TreeTableNodeDropPosition.TOP || position === TreeTableNodeDropPosition.BOTTOM;
		const pasteParent = pasteAsSibling ? targetParent : target;

		const preloadChildNodes = UIStateSelector.preloadChildNodes()(uiState);
		if (preloadChildNodes) {
			let addedDataHolders: TreeEngineDataHolder[];

			if (pasteParent) {
				addedDataHolders = yield* call(createAddGrandChildDataHolders, {
					activityId,
					descriptorPredicate: ({ source }: Activity.DataHolderDescriptor) => source === pasteParent.nodeIdentifier.id
				});
			} else {
				addedDataHolders = yield* call(createAddGrandChildDataHolders, {
					activityId,
					descriptorPredicate: (descriptor: Activity.DataHolderDescriptor) =>
						TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor) ||
						TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(descriptor)
				});
			}

			if (addedDataHolders.length > 0) {
				yield* all([
					put(
						TreeEngineActions.setDataHolders({
							dataHolders: addedDataHolders,
							activityId
						})
					),
					put(ActivityActions.loadData({ activityId, missingOnly: true }))
				]);
			}
		}

		const copyNodeResult = results?.length === 1 && results[0].type === "COPY_NODE" ? results[0] : undefined;

		if (copyNodeResult) {
			const newLinkIdentifiers = copyNodeResult.payload.newLinkIdentifiers;
			if (newLinkIdentifiers?.length) {
				yield* call(scrollToPastedNodes, {
					activityId,
					position: position ?? TreeTableNodeDropPosition.AS_CHILD,
					target,
					targetParent,
					newLinkIdentifiers
				});
			}
		} else {
			if (!results) {
				return;
			}
			const newLinkIdentifiers = getMovedNodeIdentifiers(results);
			if (newLinkIdentifiers.length) {
				yield* call(scrollToPastedNodes, {
					activityId,
					position: position ?? TreeTableNodeDropPosition.AS_CHILD,
					target,
					targetParent,
					newLinkIdentifiers
				});
			}
		}
	} finally {
		if (lockId) {
			yield* put(ActivityActions.unlock({ activityId, lockId }));
		}
		const engineAction = Commands.setMultiSelectionNodes({ multiSelectionNodes: {} });
		yield* put(TreeEngineActions.command({ activityId, engineAction }));
	}
}

interface TargetNode extends BaseNode {
	relationshipModel?: string;
}

interface Params {
	clipboard: TreeEngineState.Clipboard;
	target: BaseNode | undefined;
	position?: TreeTableNodeDropPosition;
	activityId: string;
	dataState: DataState;
	modelsState: ModelsState;
}

function* buildMoveNodeOperations(params: Params): SagaGenerator<TreeEngineOperation.MoveNode[]> {
	const operations: TreeEngineOperation.MoveNode[] = [];
	const { activityId, clipboard, dataState, modelsState, target, position } = params;
	const dataAndModels = { ...dataState, ...modelsState };

	for (const node of clipboard.nodes) {
		const { nodePath } = node;
		const nodeIdentifier = DataSelector.nodeIdentifierFromNodePath(nodePath)(dataAndModels);
		if (!nodeIdentifier) {
			throw TreeEngineError.NotFoundError("TreeEngine.Identifier", {
				activityId,
				id: TreeEngineState.NodePath.toString(nodePath)
			});
		}
		const movedRow = { nodePath, nodeIdentifier };
		const operation = yield* call(MoveNodeOperation.create, {
			activityId,
			movedRow,
			targetRow: target,
			position
		});
		if (operation) {
			operations.push(operation);
		}
	}
	return operations;
}

function* buildCopyNodesOperations(params: Params): SagaGenerator<TreeEngineOperation.CopyNode[]> {
	const { activityId, clipboard, dataState, modelsState, target, position } = params;

	const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
	if (!engineState) {
		throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
	}

	const nodesDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
	if (!nodesDataHolders) {
		throw TreeEngineError.NotFoundError("DataHolder", { activityId });
	}

	const outdatedDataHolderDescriptors = getOutdatedDataHolderDescriptors(
		nodesDataHolders,
		engineState,
		position ?? TreeTableNodeDropPosition.AS_CHILD,
		target
	);

	const nodes: TreeEngineOperation.CopyNode.Node[] = [];
	for (const source of clipboard.nodes) {
		let node: TreeEngineOperation.CopyNode.Node | undefined = undefined;
		if (target && (position === TreeTableNodeDropPosition.TOP || position === TreeTableNodeDropPosition.BOTTOM)) {
			const parent = DataSelector.parent(target)(engineState);
			if (!parent) {
				throw TreeEngineError.NotFoundError("TreeEngine.ParentNode", { activityId });
			}
			node = buildCopyNode({ dataState, modelsState, source, target: parent });
		} else {
			node = buildCopyNode({ dataState, modelsState, source, target });
		}
		if (!node) {
			const engineAction = Commands.setCopiedNodes({ copiedNodes: null });
			yield* put(TreeEngineActions.command({ activityId, engineAction }));

			throw TreeEngineError.TypeError("TreeEngine.Clipboard", {
				expect: "Clipboard should not have undefined node",
				actual: node
			});
		}
		nodes.push(node);
	}

	let nodeModel: RuntimeTreeModel.TreeNode | undefined = undefined;
	if (target && (position === TreeTableNodeDropPosition.TOP || position === TreeTableNodeDropPosition.BOTTOM)) {
		const parent = DataSelector.parent(target)(engineState);
		if (!parent) {
			throw TreeEngineError.NotFoundError("TreeEngine.ParentNode", { activityId });
		}
		nodeModel = ModelSelector.nodeModel(parent.nodeIdentifier.type)(modelsState);
	}
	if (target) {
		nodeModel = ModelSelector.nodeModel(target.nodeIdentifier.type)(modelsState);
	}

	const childRelationshipConfigurations = nodeModel?.childRelationshipConfigurations ?? [];
	const relationshipOrders = childRelationshipConfigurations.map(
		(childRelationshipConfiguration) => childRelationshipConfiguration.relationshipModelRef
	);

	nodes.sort((nodeA, nodeB) => {
		if (nodeA.relationshipModel && nodeB.relationshipModel) {
			return relationshipOrders.indexOf(nodeA.relationshipModel) - relationshipOrders.indexOf(nodeB.relationshipModel);
		}
		return 0;
	});

	return [
		{
			type: "COPY_NODE",
			payload: { nodes, target, outdatedDataHolderDescriptors, position }
		}
	];
}

function buildCopyNode(params: {
	dataState: DataState;
	modelsState: ModelsState;
	source: TreeEngineState.TopLevelMultiSelectedNode | TreeEngineState.SubLevelMultiSelectedNode;
	target?: TargetNode;
}): TreeEngineOperation.CopyNode.Node | undefined {
	const { dataState, modelsState, source, target } = params;

	let children: TreeEngineOperation.CopyNode.Node[] | undefined;
	if (source.children) {
		const nodes = source.children.map((child) => {
			const linkIdentifier = TreeEngineState.NodePath.toLinkIdentifier(child.nodePath);
			if (!linkIdentifier) {
				throw TreeEngineError.NotFoundError("TreeEngine.LinkRef");
			}
			return buildCopyNode({
				dataState,
				modelsState,
				source: child,
				target: {
					nodePath: source.nodePath,
					nodeIdentifier: source.nodeIdentifier,
					relationshipModel: linkIdentifier.type
				}
			});
		});

		if (nodes.some((node) => node === undefined)) {
			return undefined;
		}
		children = nodes.filter((node): node is TreeEngineOperation.CopyNode.Node => !!node);
	}

	if (target) {
		const rmAndRoles = findRelationshipModelAndRole({
			modelsState,
			source: source.nodeIdentifier.type,
			target: target.nodeIdentifier.type,
			knownRelationshipModelName: target.relationshipModel
		});
		if (!rmAndRoles) {
			return undefined;
		}
		return {
			...rmAndRoles,
			docRef: source.nodeIdentifier.id,
			nodeType: source.nodeIdentifier.type,
			children
		};
	}

	return { docRef: source.nodeIdentifier.id, nodeType: source.nodeIdentifier.type, children };
}

function findRelationshipModelAndRole(params: {
	modelsState: ModelsState;
	source: string;
	target: string;
	knownRelationshipModelName?: string;
}): TreeEngineOperation.CopyNode.RmAndRoles | undefined {
	const { modelsState, target, source, knownRelationshipModelName } = params;
	let relationshipModel: RelationshipModel | undefined;
	if (knownRelationshipModelName) {
		relationshipModel = ModelSelector.relationshipModelByName(knownRelationshipModelName)(modelsState);
	} else {
		const targetRowNodeModel = ModelSelector.nodeModel(target)(modelsState);
		if (!targetRowNodeModel) {
			throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", target);
		}
		relationshipModel = ModelSelector.relationshipBetweenDocumentModels(
			[source, target],
			targetRowNodeModel.childRelationshipConfigurations.map(({ relationshipModelRef }) => relationshipModelRef)
		)(modelsState);
	}
	if (!relationshipModel) {
		return undefined;
	}

	const nodeModel = ModelSelector.nodeModel(target)(modelsState);
	const childRelationshipConfigurations = nodeModel?.childRelationshipConfigurations ?? [];

	const relationshipModelName = relationshipModel.header.id;
	const crc = childRelationshipConfigurations.find((_) => _.relationshipModelRef === relationshipModelName);
	if (!crc) {
		return undefined;
	}

	const { parentRole } = crc;
	const childRole = RelationshipModelUtils.getEntityCharacteristicByReversedRole(relationshipModel, parentRole)?.role;
	if (!parentRole || !childRole) {
		return undefined;
	}

	return {
		relationshipModel: relationshipModelName,
		roles: { parent: parentRole, child: childRole }
	};
}

function getOutdatedDataHolderDescriptors(
	dataHolders: TreeEngineDataHolder[],
	engineState: TreeEngineState,
	position: TreeTableNodeDropPosition,
	target?: BaseNode
): Activity.Descriptor[] {
	return dataHolders
		.filter(({ descriptor }) => {
			if (target) {
				if (position === TreeTableNodeDropPosition.AS_CHILD) {
					return descriptor.source === target.nodeIdentifier.id;
				}

				if (position === TreeTableNodeDropPosition.TOP || position === TreeTableNodeDropPosition.BOTTOM) {
					const parent = DataSelector.parent(target)(engineState);
					return descriptor.source === parent?.nodeIdentifier.id;
				}

				return false;
			}

			return (
				TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor) ||
				TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(descriptor)
			);
		})
		.map(({ descriptor }) => descriptor);
}

function getMovedNodeIdentifiers(results: TreeEngineOperation.Done[]): Identifier[] {
	return results.flatMap((result) => {
		if (result.type === "MOVE_NODE" && result.payload.newLinkIdentifier) {
			return result.payload.newLinkIdentifier;
		}
		return [];
	});
}

function* scrollToPastedNodes(params: {
	activityId: string;
	position: TreeTableNodeDropPosition;
	target?: BaseNode;
	targetParent?: DataSelector.RelativeNodeReturnedType;
	newLinkIdentifiers: Identifier[];
}) {
	const { activityId, target, targetParent, newLinkIdentifiers, position } = params;

	if (target) {
		if (position === TreeTableNodeDropPosition.AS_CHILD) {
			yield* call(SagaUtils.scrollToNewChildNode, { activityId, target, newLinkIdentifiers });
			return;
		}

		if (targetParent) {
			yield* call(SagaUtils.scrollToNewChildNode, { activityId, target: targetParent, newLinkIdentifiers });
			return;
		}
	}

	yield* call(SagaUtils.scrollToNewRootNode, { activityId, newLinkIdentifiers });
}
