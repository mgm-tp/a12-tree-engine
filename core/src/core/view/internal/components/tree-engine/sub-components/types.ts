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
	type BaseTreeTableColumnType,
	type BaseTreeTableNode,
	type FlattenTreeTableNode
} from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";
import { type TreeTableRowStyles } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";

import { type RuntimeTreeModel, type TreeModel } from "../../../../../models/index.js";
import {
	DataSelector,
	type DataState,
	Identifier,
	ModelSelector,
	type ModelsState,
	TreeEngineState
} from "../../../../../store/index.js";

export interface BaseNodeRow extends BaseTreeTableNode {
	children?: NodeRow[];
}

export interface NodeRow extends BaseNodeRow {
	data: {
		nodeIdentifier: Identifier;
		nodePath: TreeEngineState.NodePath;
	};
	nodeModel: RuntimeTreeModel.TreeNode;
	parent?: NodeRow;
	predecessor?: TreeEngineState.NodePath;
	successor?: TreeEngineState.NodePath;
	rowIndex?: number;
	childrenCount?: number;
	fullPageSize?: number;
	lastIndex?: boolean;
}

export namespace NodeRow {
	export function isAssignableFrom(o: BaseTreeTableNode | FlattenTreeTableNode | undefined): o is NodeRow {
		if (!o) {
			return false;
		}
		const nodeRow = o as NodeRow;
		return !!nodeRow.data && !!nodeRow.data.nodeIdentifier && !!nodeRow.data.nodePath;
	}
}

export type FlattenNodeRow = FlattenTreeTableNode<NodeRow>;

export namespace FlattenNodeRow {
	export function isAssignableFrom(o: BaseTreeTableNode | FlattenTreeTableNode | undefined): o is FlattenNodeRow {
		return NodeRow.isAssignableFrom(o) && o.id !== "ROOT" && !("type" in o);
	}

	export function areEqual(r1: FlattenNodeRow, r2: FlattenNodeRow): boolean {
		if (
			!Identifier.areEqual(r1.data.nodeIdentifier, r2.data.nodeIdentifier) ||
			!TreeEngineState.NodePath.areEqual(r1.data.nodePath, r2.data.nodePath)
		) {
			return false;
		}

		if (Boolean(r1.successor) !== Boolean(r2.successor)) {
			return false;
		}
		if (r1.successor && r2.successor && !TreeEngineState.NodePath.areEqual(r1.successor, r2.successor)) {
			return false;
		}

		if (Boolean(r1.predecessor) !== Boolean(r2.predecessor)) {
			return false;
		}
		if (r1.predecessor && r2.predecessor && !TreeEngineState.NodePath.areEqual(r1.predecessor, r2.predecessor)) {
			return false;
		}

		if (r1.level !== r2.level) {
			return false;
		}

		if (r1.children?.length !== r2.children?.length) {
			return false;
		}

		if (r1.childrenCount !== r2.childrenCount) {
			return false;
		}

		if (r1.fullPageSize !== r2.fullPageSize) {
			return false;
		}

		if (r1.lastIndex !== r2.lastIndex) {
			return false;
		}

		if (r1.rowIndex !== r2.rowIndex) {
			return false;
		}

		if (Boolean(r1.parent) !== Boolean(r2.parent)) {
			return false;
		}
		if (r1.parent && r2.parent && !areEqual(r1.parent, r2.parent)) {
			return false;
		}

		return true;
	}

	export function createFromClipboardNode(
		node: TreeEngineState.Clipboard.Node,
		action: TreeEngineState.Clipboard.Action,
		state: DataState & ModelsState
	): FlattenNodeRow | undefined {
		const { nodePath } = node;
		const flattenNodeRow = createFlattenNodeRow(nodePath, state);
		if (!flattenNodeRow) {
			return undefined;
		}

		if (action === TreeEngineState.Clipboard.Action.CUT) {
			const parentNodePath = nodePath.slice(0, -1);
			const parent = createFlattenNodeRow(parentNodePath, state) ?? RootNodeRow.create();
			return {
				...flattenNodeRow,
				parent
			};
		}

		const { nodeIdentifier } = flattenNodeRow.data;
		const newNodeIdentifier = {
			...nodeIdentifier,
			id: `${nodeIdentifier.type}/__NEW__`
		};
		return {
			...flattenNodeRow,
			data: {
				...flattenNodeRow.data,
				nodeIdentifier: newNodeIdentifier
			}
		};
	}
}

export interface RootNodeRow extends FlattenNodeRow {
	id: "ROOT";
}

export namespace RootNodeRow {
	const defaultRootNodeRow: RootNodeRow = {
		id: "ROOT",
		data: { nodeIdentifier: { id: "ROOT", type: "ROOT" }, nodePath: [] },
		nodeModel: undefined as unknown as RuntimeTreeModel.TreeNode,
		level: -1,
		rowIndex: 0,
		childrenCount: 0,
		fullPageSize: undefined
	};

	export function create(): RootNodeRow {
		return defaultRootNodeRow;
	}

	export function isAssignableFrom(o: BaseTreeTableNode | undefined): o is RootNodeRow {
		return !!o && NodeRow.isAssignableFrom(o) && o.id === "ROOT" && !("type" in o);
	}
}

/** @internal */
export type PaginatedRow = PaginatedRow.RootRow | PaginatedRow.FlattenRow;

/** @internal */
export namespace PaginatedRow {
	export interface FlattenRow extends FlattenNodeRow {
		type: "PaginatedFlattenRow";
	}
	export namespace FlattenRow {
		export function create(originalNode: FlattenNodeRow): FlattenRow {
			return { ...originalNode, id: `BelongsTo${originalNode?.id}`, type: "PaginatedFlattenRow" };
		}

		export function isAssignableFrom(o: BaseTreeTableNode | FlattenTreeTableNode | undefined): o is FlattenRow {
			return !!o && "type" in o && o.type === "PaginatedFlattenRow";
		}
	}

	export interface RootRow extends Omit<RootNodeRow, "id"> {
		id: "BelongsToROOT";
		type: "PaginatedRootRow";
	}
	export namespace RootRow {
		export function create(originalNode: RootNodeRow): RootRow {
			return { ...originalNode, id: "BelongsToROOT", type: "PaginatedRootRow" };
		}

		export function isAssignableFrom(o: BaseTreeTableNode | FlattenTreeTableNode | undefined): o is RootRow {
			return !!o && "type" in o && o.type === "PaginatedRootRow";
		}
	}

	export function create(originalNode: RootNodeRow | FlattenNodeRow): PaginatedRow {
		if (RootNodeRow.isAssignableFrom(originalNode)) {
			return RootRow.create(originalNode);
		}
		return FlattenRow.create(originalNode);
	}

	export function isAssignableFrom(o: BaseTreeTableNode | FlattenTreeTableNode | undefined): o is FlattenRow | RootRow {
		return FlattenRow.isAssignableFrom(o) || RootRow.isAssignableFrom(o);
	}
}

export type RowActionStateGetter = (param: {
	row: FlattenNodeRow;
	action: TreeModel.TreeNodeActionButton;
}) => IndividualRowActionState;

export interface IndividualRowActionState {
	readonly hidden?: boolean;
	readonly disabled?: boolean;
}

export type RowStyleGetter = (param: { row: FlattenNodeRow }) => TreeTableRowStyles;

export interface TreeEngineColumn extends BaseTreeTableColumnType<FlattenNodeRow> {
	type?: string;
}

export interface TreeEngineDataColumn extends TreeEngineColumn {
	id: string;
	type: "data";
	columnModel: TreeModel.Column;
}

/**
 * @internal
 */
export namespace TreeEngineDataColumn {
	export function isInstance(column: TreeEngineColumn): column is TreeEngineDataColumn {
		return column.type === "data";
	}
}

/**
 * @internal
 */
export interface TreeEngineActionColumn extends TreeEngineColumn {
	type: "action";
}

/**
 * @internal
 */
export namespace TreeEngineActionColumn {
	export function isInstance(column: TreeEngineColumn): column is TreeEngineActionColumn {
		return column.type === "action";
	}
}

function createFlattenNodeRow(
	nodePath: TreeEngineState.NodePath,
	state: DataState & ModelsState
): FlattenNodeRow | undefined {
	const nodeIdentifiers = DataSelector.nodesFromNodePath(nodePath)(state);
	if (!nodeIdentifiers?.length) {
		return undefined;
	}
	const nodeIdentifier = nodeIdentifiers[nodeIdentifiers.length - 1];
	const nodeModel = ModelSelector.nodeModel(nodeIdentifier.type)(state);
	const node = DataSelector.node(nodeIdentifier)(state);
	if (!nodeModel || !node) {
		return undefined;
	}
	return {
		id: TreeEngineState.NodePath.toString(nodePath),
		data: { nodePath, nodeIdentifier },
		level: nodeIdentifiers.length - 1,
		nodeModel,
		rowIndex: 0,
		childrenCount: 0
	};
}
