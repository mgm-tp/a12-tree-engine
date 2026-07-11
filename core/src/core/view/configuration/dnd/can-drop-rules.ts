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

import type { RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core";

import { DataSelector } from "../../../store/selectors/data.js";
import { type DataState, Identifier, type ModelsState, TreeEngineState } from "../../../store/store.js";
import { ModelSelector } from "../../../store/selectors/models.js";
import { type FlattenNodeRow, RootNodeRow } from "../../components/tree-engine/sub-components/types.js";
import { RelationshipModelUtils } from "../../../models/utils/relationship-utils.js";
import { TreeEngineError } from "../../../error/tree-engine-error.js";

import type { CanDropResult, DragObject, HoveredObject } from "./configuration.js";
import { DndUtils } from "./utils.js";

/** @internal */
export interface CanDropRule {
	name: string;
	description?: string;
	canDrop(params: {
		dragItem: DragObject;
		hoveredItem: HoveredObject;
		engineState: DataState & ModelsState;
	}): CanDropResult | "no-statement";
}

/** @internal */
export const ReorderRootRule: CanDropRule = {
	name: "Drag and drop a root node to the blank space to make it the last root node.",
	description: "See A12TE-614",
	canDrop({ dragItem, hoveredItem, engineState }) {
		if (
			RootNodeRow.isAssignableFrom(hoveredItem.row) &&
			dragItem.row.parent &&
			RootNodeRow.isAssignableFrom(dragItem.row.parent)
		) {
			const rootIdentifier = DataSelector.root()(engineState).identifier;
			const lastDroppedNodeRow = DndUtils.selectLastNodeRow(engineState);

			// The dragged node is already the last
			if (
				!rootIdentifier ||
				!lastDroppedNodeRow ||
				Identifier.areEqual(dragItem.row.data.nodeIdentifier, lastDroppedNodeRow.data.nodeIdentifier)
			) {
				return false;
			}

			return {
				draggedNodeRow: dragItem.row,
				droppedNodeRow: lastDroppedNodeRow,
				position: TreeTableNodeDropPosition.BOTTOM
			};
		}
		return "no-statement";
	}
};

/** @internal */
export const MakeRootRule: CanDropRule = {
	name: "If hovered item is of type RootNodeRow, the drag item want to be a root node.",
	description: "See A12TE-37",
	canDrop({ dragItem, hoveredItem, engineState }) {
		if (RootNodeRow.isAssignableFrom(hoveredItem.row)) {
			const dragNodeModel = dragItem.row.nodeModel;
			if (dragItem.row.parent && RootNodeRow.isAssignableFrom(dragItem.row.parent)) {
				return false;
			}

			const rootType = DataSelector.root()(engineState)?.identifier?.type;
			if (rootType) {
				// Hidden root instance
				const docs: [string, string] = [dragNodeModel.documentModelRef, rootType];
				return !!ModelSelector.relationshipBetweenDocumentModels(docs)(engineState);
			} else {
				// Default instance
				const { root } = ModelSelector.uiModel()(engineState).content.configuration;
				if (dragNodeModel.documentModelRef === root.documentModelRef) {
					return true;
				}

				// Support heterogeneity
				const subTypes = ModelSelector.subtypeModelsByName(root.documentModelRef)(engineState);
				return subTypes.some(({ modelId }) => modelId === dragNodeModel.documentModelRef);
			}
		}
		return "no-statement";
	}
};

/** @internal */
export const MakeDuplicatedAllowed: CanDropRule = {
	name: "If relationship between document models has duplicatesAllowed = true, nodes with different node paths can be dropped multiple times onto the same parent.",
	description: "See A12TE-699",
	canDrop({ dragItem, hoveredItem, engineState }) {
		const parentDragRow: FlattenNodeRow | undefined = dragItem.row.parent;
		const parentHoverRow: FlattenNodeRow | undefined = hoveredItem.row.parent;

		if (
			Identifier.areEqual(dragItem.row.data.nodeIdentifier, hoveredItem.row.data.nodeIdentifier) &&
			parentDragRow !== parentHoverRow &&
			!TreeEngineState.NodePath.areEqual(dragItem.row.data.nodePath, hoveredItem.row.data.nodePath)
		) {
			const relationshipModel =
				parentHoverRow &&
				ModelSelector.relationshipBetweenDocumentModels([
					dragItem.row.nodeModel.documentModelRef,
					parentHoverRow.nodeModel.documentModelRef
				])(engineState);

			if (relationshipModel?.content.duplicatesAllowed) {
				return {
					droppedNodeRow: hoveredItem.row,
					draggedNodeRow: dragItem.row,
					position: TreeTableNodeDropPosition.BOTTOM
				};
			}
			return false;
		}

		return "no-statement";
	}
};
/** @internal */
export const ForbidDropOnItselfRule: CanDropRule = {
	name: "A node row is not allowed to drop onto itself.",
	description: "See A12-11276",
	canDrop({ dragItem, hoveredItem }) {
		if (Identifier.areEqual(dragItem.row.data.nodeIdentifier, hoveredItem.row.data.nodeIdentifier)) {
			return false;
		}
		return "no-statement";
	}
};

/** @internal */
export const ForbidDropOnParentRule: CanDropRule = {
	name: "A node row can not be dropped on its parent because it has already been a child of the parent node.",
	canDrop({ dragItem, hoveredItem }) {
		if (
			hoveredItem.position === TreeTableNodeDropPosition.AS_CHILD &&
			dragItem.row.parent &&
			Identifier.areEqual(dragItem.row.parent.data.nodeIdentifier, hoveredItem.row.data.nodeIdentifier)
		) {
			return false;
		}

		return "no-statement";
	}
};

/** @internal */
export const ForbidCreateCircularRule: CanDropRule = {
	name: "A node row can not be dropped on its children because it will cause CIRCULAR relation.",
	description: "See A12-11276",
	canDrop({ dragItem, hoveredItem }) {
		let hoveredItemParent = hoveredItem.row.parent;
		while (hoveredItemParent) {
			if (
				hoveredItemParent &&
				Identifier.areEqual(hoveredItemParent.data.nodeIdentifier, dragItem.row.data.nodeIdentifier)
			) {
				return false;
			}
			hoveredItemParent = hoveredItemParent.parent;
		}
		return "no-statement";
	}
};

/** @internal */
export const MakeChildRule: CanDropRule = {
	name: "A node row can only be dropped as child of other node row when there is a valid relationship between them.",
	canDrop({ hoveredItem, dragItem, engineState }) {
		const { position } = hoveredItem;
		if (position === TreeTableNodeDropPosition.AS_CHILD) {
			if (
				ModelSelector.relationshipBetweenDocumentModels(
					[dragItem.row.nodeModel.documentModelRef, hoveredItem.row.nodeModel.documentModelRef],
					hoveredItem.row.nodeModel.childRelationshipConfigurations.map(
						({ relationshipModelRef }) => relationshipModelRef
					)
				)(engineState)
			) {
				return true;
			}
		}
		return "no-statement";
	}
};

/** @internal */
export const MakeSiblingRule: CanDropRule = {
	name: "A node row can only be dropped as sibling of other node row when there is a valid relationship between dragged item and dropped item's parent",
	canDrop(canDropParams) {
		const { hoveredItem, dragItem } = canDropParams;
		const { position } = hoveredItem;
		if (position !== TreeTableNodeDropPosition.AS_CHILD) {
			return "no-statement";
		}

		const parentHoveredRow = hoveredItem.row.parent;
		const parentDragRow = dragItem.row.parent;

		if (!parentHoveredRow || parentHoveredRow === parentDragRow) {
			return false;
		}

		let params: Parameters<CanDropRule["canDrop"]>[0];

		if (RootNodeRow.isAssignableFrom(parentHoveredRow)) {
			params = { ...canDropParams, hoveredItem: { ...hoveredItem, row: parentHoveredRow } };
			if (MakeRootRule.canDrop(params)) {
				return {
					droppedNodeRow: undefined,
					draggedNodeRow: dragItem.row,
					position: TreeTableNodeDropPosition.AS_CHILD
				};
			}

			return false;
		}

		const belowSiblingRules = [
			ForbidOrderTopLevelRule,
			ForbidOrderInFixedRelationshipRule,
			ForbidOrderBetweenRelatives,
			ForbidOrderBetweenDifferentRelationships
		];

		params = { ...canDropParams, hoveredItem: { ...hoveredItem, position: TreeTableNodeDropPosition.BOTTOM } };
		for (const rule of belowSiblingRules) {
			if (rule.canDrop(params) === true) {
				return {
					droppedNodeRow: hoveredItem.row,
					draggedNodeRow: dragItem.row,
					position: TreeTableNodeDropPosition.BOTTOM
				};
			}
		}

		const unorderedSiblingRules = [
			ForbidDropOnItselfRule,
			ForbidDropOnParentRule,
			ForbidCreateCircularRule,
			MakeChildRule
		];

		params = { ...canDropParams, hoveredItem: { ...hoveredItem, row: parentHoveredRow } };
		for (const rule of unorderedSiblingRules) {
			if (rule.canDrop(params) === true) {
				return {
					droppedNodeRow: parentHoveredRow,
					draggedNodeRow: dragItem.row,
					position: TreeTableNodeDropPosition.AS_CHILD
				};
			}
		}

		return false;
	}
};

/** @internal */
export const ForbidOrderTopLevelRule: CanDropRule = {
	name: "A node row is not allowed to order within the top level in default instance case",
	canDrop({ hoveredItem, engineState }) {
		const root = DataSelector.root()(engineState);
		const { position } = hoveredItem;

		if (
			!root.identifier &&
			(position === TreeTableNodeDropPosition.TOP || position === TreeTableNodeDropPosition.BOTTOM) &&
			RootNodeRow.isAssignableFrom(hoveredItem.row.parent)
		) {
			return false;
		}

		return "no-statement";
	}
};

/** @internal */
export const ForbidOrderInFixedRelationshipRule: CanDropRule = {
	name: "The parent entity characteristic of the relationship model must be order-able.",
	canDrop({ hoveredItem, dragItem, engineState }) {
		const root = DataSelector.root()(engineState);
		const { position } = hoveredItem;
		let parentRow: FlattenNodeRow | undefined = hoveredItem.row;
		if (position === TreeTableNodeDropPosition.TOP || position === TreeTableNodeDropPosition.BOTTOM) {
			parentRow = hoveredItem.row.parent;
		}
		const childRole = dragItem.row.nodeModel.documentModelRef;
		if (root.identifier) {
			const docs: [string, string] = [childRole, root.identifier.type];
			const relationshipModel = ModelSelector.relationshipBetweenDocumentModels(docs)(engineState);

			if (!relationshipModel) {
				return "no-statement";
			}
			const parentEntityCharacteristic = relationshipModel.content.entityCharacteristics.find(({ documentModel }) => {
				return documentModel !== dragItem.row.nodeModel.documentModelRef;
			});
			if (!parentEntityCharacteristic) {
				throw TreeEngineError.NotFoundError(
					"RelationshipModel.EntityCharacteristic",
					`relationship: ${relationshipModel.header.id}, model: ${childRole}`
				);
			}
			if (!parentEntityCharacteristic.ordered) {
				return false;
			}
		} else if (parentRow) {
			const relationshipModel = ModelSelector.relationshipBetweenDocumentModels(
				[childRole, parentRow.nodeModel.documentModelRef],
				parentRow.nodeModel.childRelationshipConfigurations.map(({ relationshipModelRef }) => relationshipModelRef)
			)(engineState);

			if (!relationshipModel) {
				return "no-statement";
			}
			const childRelationshipConfiguration = parentRow.nodeModel.childRelationshipConfigurations.find(
				({ relationshipModelRef }) => relationshipModelRef === relationshipModel.header.id
			);
			if (!childRelationshipConfiguration) {
				throw TreeEngineError.NotFoundError("TreeEngine.ChildRelationshipConfiguration", relationshipModel.header.id);
			}
			const { parentRole } = childRelationshipConfiguration;
			const parentEntityCharacteristic = RelationshipModelUtils.getEntityCharacteristicByRole(
				relationshipModel,
				parentRole
			);
			if (!parentEntityCharacteristic) {
				throw TreeEngineError.NotFoundError(
					"RelationshipModel.EntityCharacteristic",
					`relationship: ${relationshipModel.header.id}, model: ${parentRole}`
				);
			}
			if (!parentEntityCharacteristic.ordered) {
				return false;
			}
		}
		return "no-statement";
	}
};

/** @internal */
export const ForbidOrderBetweenRelatives: CanDropRule = {
	name: "A node row cannot be dropped on its relative row because it has already been.",
	canDrop({ dragItem, hoveredItem }) {
		const { position } = hoveredItem;
		if (
			position === TreeTableNodeDropPosition.BOTTOM &&
			dragItem.row.predecessor &&
			TreeEngineState.NodePath.areEqual(dragItem.row.predecessor, hoveredItem.row.data.nodePath)
		) {
			return false;
		} else if (
			position === TreeTableNodeDropPosition.TOP &&
			dragItem.row.successor &&
			TreeEngineState.NodePath.areEqual(dragItem.row.successor, hoveredItem.row.data.nodePath)
		) {
			return false;
		}

		return "no-statement";
	}
};

/** @internal */
export const ForbidOrderBetweenDifferentRelationships: CanDropRule = {
	name: "The parent node rows must share the same relationship links to be order-able.",
	canDrop({ hoveredItem, dragItem, engineState }) {
		const { position } = hoveredItem;
		let parentRow: FlattenNodeRow | undefined = hoveredItem.row;
		if (position === TreeTableNodeDropPosition.TOP || position === TreeTableNodeDropPosition.BOTTOM) {
			parentRow = hoveredItem.row.parent;
		}
		let relationshipModel: RelationshipModel | undefined;
		const root = DataSelector.root()(engineState);

		if (root.identifier && RootNodeRow.isAssignableFrom(parentRow)) {
			const docs: [string, string] = [dragItem.row.nodeModel.documentModelRef, root.identifier.type];
			relationshipModel = ModelSelector.relationshipBetweenDocumentModels(docs)(engineState);
		} else if (parentRow) {
			relationshipModel = ModelSelector.relationshipBetweenDocumentModels(
				[dragItem.row.nodeModel.documentModelRef, parentRow.nodeModel.documentModelRef],
				parentRow.nodeModel.childRelationshipConfigurations.map(({ relationshipModelRef }) => relationshipModelRef)
			)(engineState);
		}

		if (!relationshipModel) {
			return "no-statement";
		}

		if (
			relationshipModel.header.id === TreeEngineState.NodePath.toLinkIdentifier(hoveredItem.row.data.nodePath)?.type
		) {
			return true;
		}
		if (
			position === TreeTableNodeDropPosition.BOTTOM &&
			hoveredItem.row.successor &&
			relationshipModel.header.id === TreeEngineState.NodePath.toLinkIdentifier(hoveredItem.row.successor)?.type
		) {
			return true;
		}
		if (
			position === TreeTableNodeDropPosition.TOP &&
			hoveredItem.row.predecessor &&
			relationshipModel.header.id === TreeEngineState.NodePath.toLinkIdentifier(hoveredItem.row.predecessor)?.type
		) {
			return true;
		}
		return false;
	}
};

/** @internal */
export const ForbidOrderCircular: CanDropRule = {
	name: "A node row is not allowed to dropped on a circular node.",
	canDrop({ hoveredItem }) {
		const { row } = hoveredItem;

		if (DndUtils.isCircular(row)) {
			return false;
		}

		return "no-statement";
	}
};

/** @internal */
export const rules: CanDropRule[] = [
	ForbidOrderCircular,
	ReorderRootRule,
	MakeRootRule,
	MakeDuplicatedAllowed,
	ForbidDropOnItselfRule,
	ForbidDropOnParentRule,
	ForbidCreateCircularRule,
	MakeChildRule,
	MakeSiblingRule,
	ForbidOrderTopLevelRule,
	ForbidOrderInFixedRelationshipRule,
	ForbidOrderBetweenRelatives,
	ForbidOrderBetweenDifferentRelationships
];
