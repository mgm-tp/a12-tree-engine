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
	type TreeTableDragDropOptions,
	type TreeTableNodeDropPosition,
	type TreeTableRenderPropsType
} from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";
import { DragAndDropUtils } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/drag-and-drop-utils.js";

import { type DataState, ModelSelector, type ModelsState } from "../../../../store/index.js";
import { type FlattenNodeRow } from "../../components/tree-engine/sub-components/types.js";

import { logger } from "../logger.js";

import { rules, type CanDropRule } from "./can-drop-rules.js";

export type DragObject = TreeTableRenderPropsType.DragObject<FlattenNodeRow>;
export type HoveredObject = TreeTableRenderPropsType.HoveredObject<FlattenNodeRow>;
export type DropResult = TreeTableRenderPropsType.DropResult<FlattenNodeRow>;

export interface DndConfiguration
	extends Omit<TreeTableDragDropOptions<FlattenNodeRow, DragObject, DropResult, HoveredObject>, "canDrop"> {
	acceptType: string;
	backend: typeof DragAndDropUtils.DefaultDndBackend;
	options: typeof DragAndDropUtils.DefaultDndBackendOptions;
	hoverDelay: number;
	canDrop?(params: { dragItem: DragObject; hoveredItem: HoveredObject }): CanDropResult;
}

export type CanDropResult = boolean | DndRedirection;
export type DndRedirection = {
	draggedNodeRow: FlattenNodeRow;
	droppedNodeRow?: FlattenNodeRow;
	position?: TreeTableNodeDropPosition;
};

export function defaultDndConfiguration(engineState: DataState & ModelsState): DndConfiguration {
	return {
		acceptType: "TreeEngineDndRow",
		backend: DragAndDropUtils.DefaultDndBackend,
		options: DragAndDropUtils.DefaultDndBackendOptions,
		canDrop({ dragItem, hoveredItem }) {
			let result: CanDropResult | "no-statement" = "no-statement";
			for (const rule of rules) {
				result = rule.canDrop({ dragItem, hoveredItem, engineState });
				if (result !== "no-statement") {
					logger.trace(stringify({ dragItem, hoveredItem, result, rule }));
					return result;
				}
			}

			return false;
		},
		canDrag({ dragItem }) {
			const nodeModel = ModelSelector.nodeModel(dragItem.row.data.nodeIdentifier.type)(engineState);
			return nodeModel?.configuration.dnd ?? false;
		},
		hoverDelay: 600
	};
}

/** @internal */
export function stringify(params: {
	dragItem: DragObject;
	hoveredItem: HoveredObject;
	rule: CanDropRule;
	result: CanDropResult;
}): string {
	return (
		"CanDrop calculation\n" +
		stringifyRecord({
			"Drag item": params.dragItem.row.data,
			"Hover item": params.hoveredItem.row.data,
			Position: params.hoveredItem.position,
			"Rule name": params.rule.name,
			Result:
				typeof params.result === "boolean"
					? params.result
					: "redirection\n" +
						stringifyRecord({
							"\tRedirect dropped row": params.result.droppedNodeRow?.data,
							"\tRedirect position": params.result.position
						})
		})
	);
}

function stringifyRecord(record: Record<string, unknown>) {
	return Object.entries(record)
		.map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
		.join("\n");
}
