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

import { type SagaGenerator, all, call, put, race, select, take } from "typed-redux-saga";

import type { RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	ActivityActions,
	ActivitySelectors,
	NotificationActions,
	type Selector,
	StoreSagas
} from "@com.mgmtp.a12.client/client-core";

import { RelationshipModelUtils } from "../../../../core/models/utils/relationship-utils.js";
import type { RuntimeTreeModel } from "../../../../core/models/tree-model.js";
import { LocalizableFactory } from "../../../../core/services/localization/localizable-factory.js";
import { RESOURCE_KEYS } from "../../../../core/services/localization/languages/keys.js";
import { DataSelector } from "../../../../core/store/selectors/data.js";
import { Events } from "../../../../core/store/actions.js";
import { Identifier, TreeEngineState } from "../../../../core/store/store.js";
import { ModelSelector } from "../../../../core/store/selectors/models.js";
import { TreeDataUtils } from "../../../../core/store/utils.js";
import { TreeEngineActions } from "../../actions.js";
import { TreeEngineActivity, TreeEngineDataHolder } from "../../data-holder.js";
import { TreeEngineOperation } from "../../operation.js";
import { TreeEngineSelectors } from "../../selectors.js";
import { logger } from "../../utils.js";
import { TreeEngineError } from "../../../../core/error/tree-engine-error.js";

import { SagaUtils } from "../saga-utils.js";

/** @internal */
export namespace MoveNodeOperation {
	/** @internal */
	export function* create(params: {
		activityId: string;
		movedRow: TreeEngineOperation.MoveNode.Row;
		targetRow?: TreeEngineOperation.MoveNode.Row;
		position?: TreeTableNodeDropPosition;
	}): SagaGenerator<TreeEngineOperation.MoveNode | undefined> {
		const { activityId } = params;
		let baseOperation:
			| TreeEngineOperation.MoveNode.MakeChildPayload
			| TreeEngineOperation.MoveNode.MakeRootPayload
			| undefined;

		if (params.targetRow) {
			baseOperation = yield* call(createMakeChildOperation, params);
		} else {
			baseOperation = yield* call(createMakeRootOperation, params);
		}
		if (!baseOperation) {
			return undefined;
		}

		const rmAndRoles = yield* call(findRelationshipModelAndRole, { baseOperation, activityId });
		if (!rmAndRoles) {
			return undefined;
		}

		const nodesDataHolders = yield* select(TreeEngineSelectors.nodesDataHolders(activityId));
		if (!nodesDataHolders) {
			return undefined;
		}

		let linkDocument: object | undefined;
		try {
			linkDocument = yield* call(handleLinkDocument, baseOperation, rmAndRoles, activityId);
		} catch (e) {
			const error = e as Error;
			logger.log(error.message);
			return undefined;
		}
		const operation: TreeEngineOperation.MoveNode = {
			type: "MOVE_NODE",
			payload: { ...baseOperation, ...rmAndRoles, linkDocument }
		};
		return addOutdatedDataHolderDescriptors(nodesDataHolders, operation);
	}

	function* createMakeChildOperation(params: {
		activityId: string;
		movedRow: TreeEngineOperation.MoveNode.Row;
		targetRow?: TreeEngineOperation.MoveNode.Row;
		position?: TreeTableNodeDropPosition;
	}): SagaGenerator<TreeEngineOperation.MoveNode.MakeChildPayload | undefined> {
		const { activityId, movedRow, targetRow, position } = params;

		if (!targetRow) {
			throw TreeEngineError.TypeError("TreeEngine.Operation", { expect: "Defined targetRow" });
		}

		const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
		if (!engineState) {
			throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
		}

		let targetRowParent: TreeEngineOperation.MoveNode.Row;
		if (position === TreeTableNodeDropPosition.TOP || position === TreeTableNodeDropPosition.BOTTOM) {
			const parent = DataSelector.parent(targetRow)(engineState);
			if (!parent) {
				yield* call(Utils.showErrorNotification, {
					activityId,
					messageKey: RESOURCE_KEYS.treeEngine.notification.message.reorderRootNodeError
				});
				return undefined;
			}

			targetRowParent = { nodeIdentifier: parent.nodeIdentifier, nodePath: parent.nodePath };
		} else {
			targetRowParent = targetRow;
		}

		const activity = yield* select(ActivitySelectors.activityById(activityId));
		if (!activity) {
			throw TreeEngineError.NotFoundError("Activity", { activityId });
		}

		if (TreeEngineActivity.Descriptor.HiddenRootInstance.isAssignableFrom(activity.descriptor)) {
			const root = DataSelector.root()(engineState);
			if (root.identifier && Identifier.areEqual(targetRowParent.nodeIdentifier, root.identifier)) {
				targetRowParent.isRoot = true;
			}
		}

		const movedRowLink = yield* call(Utils.getParentLink, { activityId, nodePath: movedRow.nodePath });
		const movedRowParent = DataSelector.parent(movedRow)(engineState)?.nodeIdentifier;

		return {
			type: TreeEngineOperation.MoveNode.Type.CHILD_NODE,

			movedRow,
			movedRowLink,
			movedRowParent,

			targetRow,
			targetRowParent,
			position
		} as TreeEngineOperation.MoveNode.MakeChildPayload;
	}

	function* createMakeRootOperation(params: {
		activityId: string;
		movedRow: TreeEngineOperation.MoveNode.Row;
	}): SagaGenerator<TreeEngineOperation.MoveNode.MakeRootPayload | undefined> {
		const { activityId, movedRow } = params;
		const { nodeIdentifier, nodePath } = movedRow;
		const { type } = nodeIdentifier;

		const engineState = yield* select(TreeEngineSelectors.engineState(activityId));
		if (!engineState) {
			throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
		}

		const childRelationshipConfigurations = ModelSelector.reversedChildRelationshipConfigurations(type)(engineState);
		if (childRelationshipConfigurations.length === 0) {
			throw TreeEngineError.NotFoundError("TreeEngine.ChildRelationshipConfiguration", { activityId });
		}

		const movedRowLinks = yield* call(Utils.getParentLinks, {
			activityId,
			nodeIdentifier,
			nodePath,
			childRelationshipConfigurations
		});

		const movedRowParents = Utils.getParentNodes({
			activityId,
			nodeIdentifier,
			links: movedRowLinks
		});
		if (!movedRowParents) {
			yield* call(Utils.showErrorNotification, {
				activityId,
				messageKey: RESOURCE_KEYS.treeEngine.notification.message.moveFromCycleToRootError
			});
			return undefined;
		}

		const confirm = yield* call(Utils.confirmMakeRootNode, {
			activityId,
			nodeIdentifier,
			parentLinks: movedRowLinks
		});
		if (!confirm) {
			return undefined;
		}

		const movedRowLink = yield* call(Utils.getParentLink, { activityId, nodePath: movedRow.nodePath });
		const movedRowParent = DataSelector.parent(movedRow)(engineState)?.nodeIdentifier;

		const activity = yield* select(ActivitySelectors.activityById(activityId));
		if (!activity) {
			throw TreeEngineError.NotFoundError("Activity", { activityId });
		}

		let targetRowParent: TreeEngineOperation.MoveNode.Row | undefined = undefined;
		if (TreeEngineActivity.Descriptor.HiddenRootInstance.isAssignableFrom(activity.descriptor)) {
			targetRowParent = {
				nodeIdentifier: Identifier.from(activity.descriptor.rootInstance),
				nodePath: [],
				isRoot: true
			};
		}

		return {
			type: TreeEngineOperation.MoveNode.Type.ROOT_NODE,

			movedRow,
			movedRowLink,
			movedRowLinks,
			movedRowParent,
			movedRowParents,

			targetRowParent,
			position: TreeTableNodeDropPosition.AS_CHILD
		} as TreeEngineOperation.MoveNode.MakeRootPayload;
	}
	/**
	 * Find the relationship model and roles between movedRow and parent of targetRow
	 */
	function* findRelationshipModelAndRole(params: {
		baseOperation: TreeEngineOperation.MoveNode.MakeRootPayload | TreeEngineOperation.MoveNode.MakeChildPayload;
		activityId: string;
	}): SagaGenerator<TreeEngineOperation.MoveNode.RmAndRoles | undefined> {
		const { baseOperation, activityId } = params;
		const { movedRow, targetRowParent } = baseOperation;
		const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
		if (!modelsState) {
			throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
		}
		const activity = yield* select(ActivitySelectors.activityById(activityId));
		if (!activity) {
			throw TreeEngineError.NotFoundError("Activity", { activityId });
		}

		let matchedRelationshipModel: RelationshipModel | undefined;
		if (
			TreeEngineActivity.Descriptor.HiddenRootInstance.isAssignableFrom(activity.descriptor) &&
			targetRowParent?.isRoot
		) {
			const movedRowNodeModel = ModelSelector.nodeModel(movedRow.nodeIdentifier.type)(modelsState);
			if (!movedRowNodeModel) {
				throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", { id: movedRow.nodeIdentifier.type, activityId });
			}
			const { rootInstance, rootRelationshipRole, rootRelationshipName } = activity.descriptor;

			matchedRelationshipModel = ModelSelector.relationshipBetweenDocumentModels([
				movedRowNodeModel.documentModelRef,
				Identifier.from(rootInstance).type
			])(modelsState);

			if (!matchedRelationshipModel || matchedRelationshipModel.header.id !== rootRelationshipName) {
				return undefined;
			}
			const childCharacteristic = RelationshipModelUtils.getEntityCharacteristicByReversedRole(
				matchedRelationshipModel,
				rootRelationshipRole
			);
			if (!childCharacteristic) {
				throw TreeEngineError.NotFoundError("RelationshipModel.EntityCharacteristic", {
					...matchedRelationshipModel.header,
					activityId
				});
			}

			return {
				relationshipModel: matchedRelationshipModel.header.id,
				linkDocumentModel: matchedRelationshipModel.content.linkDocumentModel ?? undefined,
				roles: { parent: rootRelationshipRole, child: childCharacteristic.role }
			};
		}

		if (baseOperation.type === TreeEngineOperation.MoveNode.Type.CHILD_NODE) {
			const parentRowType = baseOperation.targetRowParent.nodeIdentifier.type;
			const movedRowType = movedRow.nodeIdentifier.type;
			const parentRowNodeModel = ModelSelector.nodeModel(parentRowType)(modelsState);
			const movedRowNodeModel = ModelSelector.nodeModel(movedRowType)(modelsState);
			if (!parentRowNodeModel || !movedRowNodeModel) {
				throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", {
					id: `${parentRowType}/${movedRowType}`,
					activityId
				});
			}

			matchedRelationshipModel = ModelSelector.relationshipBetweenDocumentModels(
				[movedRowNodeModel.documentModelRef, parentRowNodeModel.documentModelRef],
				parentRowNodeModel.childRelationshipConfigurations.map(({ relationshipModelRef }) => relationshipModelRef)
			)(modelsState);

			if (!matchedRelationshipModel) {
				return undefined;
			}

			const matchedRelationshipModelRef = matchedRelationshipModel.header.id;
			const childRelationshipConfiguration = parentRowNodeModel.childRelationshipConfigurations.find(
				({ relationshipModelRef }) => relationshipModelRef === matchedRelationshipModelRef
			);
			if (!childRelationshipConfiguration) {
				throw TreeEngineError.NotFoundError("TreeEngine.ChildRelationshipConfiguration", { activityId });
			}
			const parentCharacteristic = RelationshipModelUtils.getEntityCharacteristicByRole(
				matchedRelationshipModel,
				childRelationshipConfiguration.parentRole
			);
			const childCharacteristic = RelationshipModelUtils.getEntityCharacteristicByReversedRole(
				matchedRelationshipModel,
				childRelationshipConfiguration.parentRole
			);
			if (!parentCharacteristic || !childCharacteristic) {
				throw TreeEngineError.NotFoundError("RelationshipModel.EntityCharacteristic", {
					id: matchedRelationshipModelRef,
					activityId
				});
			}

			return {
				relationshipModel: matchedRelationshipModel.header.id,
				roles: { parent: parentCharacteristic.role, child: childCharacteristic.role },
				linkDocumentModel: matchedRelationshipModel.content.linkDocumentModel ?? undefined
			};
		}

		if (baseOperation.type === TreeEngineOperation.MoveNode.Type.ROOT_NODE) {
			const rootConfiguration = ModelSelector.models()(modelsState).uiModel.content.configuration.root;

			matchedRelationshipModel = ModelSelector.relationshipModelByName(rootConfiguration.relationshipModelRef)(
				modelsState
			);
			if (!matchedRelationshipModel) {
				throw TreeEngineError.NotFoundError("RelationshipModel", {
					id: rootConfiguration.relationshipModelRef,
					activityId
				});
			}

			return { relationshipModel: matchedRelationshipModel.header.id, roles: undefined };
		}

		throw TreeEngineError.TypeError("TreeEngine.Operation", {
			expect: "Valid TargetNode.Type",
			actual: baseOperation
		});
	}

	function* handleLinkDocument(
		baseOperation: TreeEngineOperation.MoveNode.BasePayload,
		rmAndRoles: TreeEngineOperation.MoveNode.RmAndRoles,
		activityId: string
	): SagaGenerator<object | undefined> {
		let newLinkDocument: object | undefined;
		const { movedRowParent, targetRowParent, movedRowLink } = baseOperation;
		const linkDocumentModel = rmAndRoles.linkDocumentModel;
		const linkDocumentDocRef = getLinkDocumentDocRef(baseOperation);

		if (linkDocumentModel && movedRowLink && movedRowParent) {
			if (!movedRowParent || !targetRowParent || !Identifier.areEqual(movedRowParent, targetRowParent.nodeIdentifier)) {
				const result = yield* call(() =>
					SagaUtils.editLinkDocument(activityId, linkDocumentModel, linkDocumentDocRef, movedRowLink.linkDocument)
				);
				if (!result.document) {
					throw TreeEngineError.AddLinkError(`No link document returned.`);
				}
				if (result.dirty) {
					newLinkDocument = { ...result.document, modelId: undefined };
				}
			}
		}
		return newLinkDocument;
	}

	function getLinkDocumentDocRef({ movedRowLink }: TreeEngineOperation.MoveNode.BasePayload): string | undefined {
		return typeof movedRowLink?.linkDocument === "object" &&
			movedRowLink.linkDocument !== null &&
			"docRef" in movedRowLink.linkDocument &&
			typeof movedRowLink.linkDocument.docRef === "string"
			? movedRowLink.linkDocument.docRef
			: undefined;
	}

	function addOutdatedDataHolderDescriptors(
		dataHolders: TreeEngineDataHolder[],
		operation: TreeEngineOperation.MoveNode
	): TreeEngineOperation.MoveNode {
		const outdatedDataHolderDescriptors = dataHolders
			.filter(({ descriptor }) => {
				const { movedRowParent, targetRowParent } = operation.payload;

				let allMovedRowParents: Identifier[] = [];
				if (operation.payload.type === TreeEngineOperation.MoveNode.Type.ROOT_NODE) {
					allMovedRowParents = operation.payload.movedRowParents;
				} else if (movedRowParent) {
					allMovedRowParents = [movedRowParent];
				}

				if (descriptor.type === "ROOT_NODES") {
					if (!movedRowParent || !targetRowParent?.nodeIdentifier) {
						return true;
					}
				} else if (descriptor.type === "HIDDEN_ROOT_NODES") {
					if (!movedRowParent || !targetRowParent?.nodeIdentifier) {
						return true;
					}
					if (movedRowParent && Identifier.areEqual(movedRowParent, Identifier.from(descriptor.source))) {
						return true;
					}
					if (targetRowParent?.isRoot) {
						return true;
					}
				} else if (descriptor.type === "CHILD_NODES") {
					const docRef = descriptor.source;
					if (
						docRef === movedRowParent?.id ||
						docRef === targetRowParent?.nodeIdentifier.id ||
						allMovedRowParents.some((parent) => docRef === parent.id)
					) {
						return true;
					}
				}

				return false;
			})
			.map(({ descriptor }) => descriptor);

		return { ...operation, payload: { ...operation.payload, outdatedDataHolderDescriptors } };
	}
}

namespace Utils {
	export function* confirmMakeRootNode(params: {
		activityId: string;
		nodeIdentifier: Identifier;
		parentLinks: TreeEngineState.Link[];
	}): SagaGenerator<boolean> {
		const { activityId, parentLinks, nodeIdentifier } = params;

		let confirm: boolean;
		if (parentLinks.length === 1) {
			confirm = true;
		} else {
			yield* put(
				TreeEngineActions.command({
					activityId,
					engineAction: Events.onMakeRootNodeRequest.started({ nodeIdentifier, parentLinks })
				})
			);

			const { done } = yield* race({
				done: take((action: unknown) => {
					return (
						TreeEngineActions.event.match(action) &&
						Events.onMakeRootNodeRequest.done.match(action.payload.engineAction) &&
						action.payload.activityId === activityId
					);
				}),
				failed: take((action: unknown) => {
					return (
						TreeEngineActions.event.match(action) &&
						Events.onMakeRootNodeRequest.failed.match(action.payload.engineAction) &&
						action.payload.activityId === activityId
					);
				})
			});

			confirm = !!done;
		}

		const activity = yield* select(ActivitySelectors.activityById(activityId));
		if (activity?.dataHolders) {
			yield* put(
				TreeEngineActions.setDataHolders({
					activityId,
					dataHolders: [],
					removedDataHolderDescriptors: activity?.dataHolders
						.filter(({ descriptor }) => TreeEngineDataHolder.Descriptor.ParentNodes.isAssignableFrom(descriptor))
						.map(({ descriptor }) => descriptor)
				})
			);
		}

		return confirm;
	}

	export function* getParentLinks(params: {
		activityId: string;
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
		childRelationshipConfigurations: RuntimeTreeModel.ChildRelationshipConfiguration[];
	}): SagaGenerator<TreeEngineState.Link[]> {
		const { activityId, nodeIdentifier, nodePath, childRelationshipConfigurations } = params;

		const singleParent = yield* call(hasSingleParent, {
			activityId,
			childRelationshipConfigurations
		});

		if (singleParent) {
			const parentLink = yield* call(getParentLink, { activityId, nodePath });
			if (!parentLink) {
				throw TreeEngineError.NotFoundError("TreeEngine.Link", { id: nodeIdentifier.id, activityId });
			}
			return [parentLink];
		}

		const parentNodesDataHolders = yield* call(fetchParentLinks, {
			activityId,
			nodeIdentifier,
			childRelationshipConfigurations
		});

		const parentLinks: TreeEngineState.Link[] = [];

		parentNodesDataHolders.forEach(({ slices, data }) => {
			if (!data) {
				return;
			}
			const childLinkIdentifiers = TreeEngineDataHolder.Meta.fromSlices(slices)?.children ?? [];
			const links = childLinkIdentifiers
				.map((identifier) => TreeDataUtils.readLinkData(data, identifier))
				.filter((link): link is TreeEngineState.Link => !!link);
			parentLinks.push(...links);
		});

		return parentLinks;
	}

	function* fetchParentLinks(params: {
		activityId: string;
		nodeIdentifier: Identifier;
		childRelationshipConfigurations: RuntimeTreeModel.ChildRelationshipConfiguration[];
	}): SagaGenerator<TreeEngineDataHolder[]> {
		const { activityId, nodeIdentifier, childRelationshipConfigurations } = params;

		const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
		if (!modelsState) {
			throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
		}

		const actions = childRelationshipConfigurations.map((childRelationshipConfiguration) => {
			const relationshipRole =
				ModelSelector.childEntityCharacteristic(childRelationshipConfiguration)(modelsState)?.role;
			if (!relationshipRole) {
				throw TreeEngineError.NotFoundError("TreeEngine.ChildRelationshipConfiguration", {
					activityId,
					id: childRelationshipConfiguration.id
				});
			}
			const relationshipModel = childRelationshipConfiguration.relationshipModelRef;
			const source = nodeIdentifier.id;
			return TreeEngineActions.addParentNodesDataHolder({ activityId, relationshipModel, relationshipRole, source });
		});
		yield* all(actions.map((action) => put(action)));
		yield* put(ActivityActions.loadData({ activityId, missingOnly: true }));

		const parentNodesDataHoldersSelector: Selector<{
			stateChanged: boolean;
			returnValue: TreeEngineDataHolder[] | null;
		}> = (state) => {
			const dataHolders = ActivitySelectors.activityById(activityId)(state)?.dataHolders;
			const parentNodesDataHolders = dataHolders?.filter((dataHolder): dataHolder is TreeEngineDataHolder => {
				return TreeEngineDataHolder.Descriptor.ParentNodes.isAssignableFrom(dataHolder.descriptor);
			});
			if (!parentNodesDataHolders || parentNodesDataHolders.length === 0) {
				return { stateChanged: false, returnValue: null };
			}
			const loaded = parentNodesDataHolders.every(({ loadingState }) => loadingState === "loaded");
			if (!loaded) {
				return { stateChanged: false, returnValue: null };
			}
			return { stateChanged: true, returnValue: parentNodesDataHolders };
		};

		const parentNodesDataHolders = yield* call(() => StoreSagas.waitForStateChange(parentNodesDataHoldersSelector));
		if (!parentNodesDataHolders) {
			throw new Error("Can not find parent nodes dataHolders");
		}
		return parentNodesDataHolders;
	}

	export function getParentNodes(params: {
		activityId: string;
		nodeIdentifier: Identifier;
		links: TreeEngineState.Link[];
	}): Identifier[] | undefined {
		const { nodeIdentifier, links } = params;
		const parentNodes: Identifier[] = [];

		for (const link of links) {
			const { entities } = link.linkRef.linkDescriptor;
			const childEntity = entities.find(({ docRef }) => docRef === nodeIdentifier.id);
			const parentEntity = entities.find(({ docRef }) => docRef !== nodeIdentifier.id);

			if (!childEntity || !parentEntity?.docRef) {
				return undefined;
			}

			parentNodes.push(Identifier.from(parentEntity.docRef));
		}

		return parentNodes;
	}

	function* hasSingleParent(params: {
		activityId: string;
		childRelationshipConfigurations: RuntimeTreeModel.ChildRelationshipConfiguration[];
	}): SagaGenerator<boolean> {
		const { activityId, childRelationshipConfigurations } = params;
		const modelsState = yield* select(TreeEngineSelectors.modelsState(activityId));
		if (!modelsState) {
			throw TreeEngineError.NotFoundError("TreeEngine.ModelsState", { activityId });
		}

		if (childRelationshipConfigurations.length > 1) {
			return false;
		}

		const childEntityCharacteristic = ModelSelector.childEntityCharacteristic(childRelationshipConfigurations[0])(
			modelsState
		);
		if (!childEntityCharacteristic) {
			throw TreeEngineError.NotFoundError("RelationshipModel.EntityCharacteristic", {
				id: childRelationshipConfigurations[0].relationshipModelRef,
				activityId
			});
		}

		const { unbounded, upperLimit } = childEntityCharacteristic.linkConstraints.multiplicity;

		return !unbounded && upperLimit === 1;
	}

	export function* getParentLink(params: {
		activityId: string;
		nodePath: TreeEngineState.NodePath;
	}): SagaGenerator<TreeEngineState.Link | undefined> {
		const { activityId, nodePath } = params;
		const dataState = yield* select(TreeEngineSelectors.dataState(activityId));
		if (!dataState) {
			throw TreeEngineError.NotFoundError("TreeEngine.DataState", { activityId });
		}

		const linkIdentifier = TreeEngineState.NodePath.toLinkIdentifier(nodePath);
		if (!linkIdentifier) {
			return undefined;
		}

		return DataSelector.link(linkIdentifier)(dataState);
	}

	export function* showErrorNotification(params: { activityId: string; messageKey: string }) {
		const { activityId, messageKey } = params;

		yield* put(
			NotificationActions.add({
				activityId,
				severity: "error",
				title: LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.treeEngine.notification.title.error),
				message: LocalizableFactory.createResourceLocalizable(messageKey),
				duration: 6000
			})
		);
	}
}
