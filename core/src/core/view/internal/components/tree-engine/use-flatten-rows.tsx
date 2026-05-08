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

import * as React from "react";

import { useTreeTableContext } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";

import { TreeEngineError } from "../../../../error/index.js";
import {
	DataSelector,
	type DataState,
	type Identifier,
	ModelSelector,
	type ModelsState,
	TreeEngineState,
	UIStateSelector
} from "../../../../store/index.js";
import { useTreeEngineContext, useTreeEngineState } from "../../context/tree-engine-context-provider.js";
import { LinkDescriptorUtils, TreeModel } from "../../../../models/index.js";
import { useIdGenerator } from "../../configuration/id-generator.js";

import { FlattenNodeRow, PaginatedRow, RootNodeRow } from "./sub-components/types.js";

/** @internal */
export namespace FlattenRowHooks {
	export function useFlattenRows(): FlattenNodeRow[] {
		const expandedNodes = useTreeEngineState(UIStateSelector.expandedNodes());
		const pageSizeMap = useTreeEngineState(UIStateSelector.pageSizeMap());
		const data = useTreeEngineState(DataSelector.data());
		const root = useTreeEngineState(DataSelector.root());
		const models = useTreeEngineState(ModelSelector.models());
		const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);
		const preloadChildNodes = useTreeEngineState(UIStateSelector.preloadChildNodes());
		const { getCachedFlattenRow, revalidateCaches } = useFlattenRowsCached();

		// Only cherry-pick pieces of state that are going to be used
		const engineState: DataState & ModelsState = React.useMemo(() => {
			return { root, data, models };
		}, [data, root, models]);

		const generateId = useIdGenerator();
		const createPaginatedRows = useCreatePaginatedRows();

		/**
		 * Create a FlattenNodeRow from nodeIdentifier and nodePath
		 * but try to reuse from the cache by comparing Identifiers and NodePaths.
		 * Recursively calculate its children if it is expanded
		 */
		const makeFlattenNodeRow = React.useCallback(
			(params: {
				flattenNodeRows: FlattenNodeRow[];
				nodeIdentifier: Identifier;
				nodePath: TreeEngineState.NodePath;
				rowIndex?: number;
				parent?: FlattenNodeRow;
				level?: number;
				lastIndex?: boolean;
			}): FlattenNodeRow => {
				const { flattenNodeRows, nodePath, nodeIdentifier, rowIndex = 0, level = 0, parent, lastIndex } = params;
				const nodeModel = ModelSelector.nodeModel(nodeIdentifier.type)(engineState);
				if (!nodeModel) {
					throw TreeEngineError.NotFoundError("TreeEngine.NodeModel", nodeIdentifier.type);
				}
				const node = DataSelector.node(nodeIdentifier)(engineState);
				if (!node) {
					throw TreeEngineError.NotFoundError("TreeEngine.Node", nodeIdentifier.id);
				}

				const shouldShowArrowButton = preloadChildNodes
					? node.children.length > 0
					: nodeModel.childRelationshipConfigurations?.length > 0;

				const flattenNodeRow: FlattenNodeRow = {
					id: generateId(TreeEngineState.NodePath.toString(nodePath)),
					data: { nodeIdentifier, nodePath },
					nodeModel,
					icon: nodeModel.icon && <Icon iconTheme={nodeModel.icon.theme}>{nodeModel.icon.name}</Icon>,
					level,
					parent,
					// The arrow button will not show if the children field is undefined
					children: shouldShowArrowButton ? [] : undefined,
					predecessor: DataSelector.predecessor({ nodeIdentifier, nodePath, nodeIndex: rowIndex })(engineState)
						?.nodePath,
					successor: DataSelector.successor({ nodeIdentifier, nodePath, nodeIndex: rowIndex })(engineState)?.nodePath,
					rowIndex: rowIndex,
					childrenCount: node.children.length,
					fullPageSize: 0,
					lastIndex: lastIndex ?? false
				};

				nodeModel.childRelationshipConfigurations.forEach((crc) => {
					if (!pageSizeMap) {
						return;
					}
					const fullSize = TreeEngineState.PageSizeMap.getFullSize(
						pageSizeMap,
						nodeIdentifier,
						crc.relationshipModelRef
					);
					flattenNodeRow.fullPageSize = (flattenNodeRow.fullPageSize ?? 0) + fullSize;
				});

				flattenNodeRows.push(getCachedFlattenRow(flattenNodeRow));

				const expanded = expandedNodes[TreeEngineState.NodePath.toString(nodePath)];
				if (!expanded) {
					return flattenNodeRow;
				}

				node.children.forEach((childLinkIdentifier, index) => {
					const lastIndex = node.children.length - 1 === index;

					const childNodeIdentifier = DataSelector.findNodeIdentifierFromOtherSide(
						childLinkIdentifier,
						nodeIdentifier
					)(engineState);
					if (!childNodeIdentifier) {
						throw TreeEngineError.NotFoundError(
							"TreeEngine.Identifier",
							`childLinkIdentifier: ${childLinkIdentifier.id}, nodeIdentifier: ${nodeIdentifier.id}`
						);
					}

					makeFlattenNodeRow({
						flattenNodeRows,
						nodeIdentifier: childNodeIdentifier,
						nodePath: [...nodePath, childLinkIdentifier],
						parent: flattenNodeRow,
						level: level + 1,
						rowIndex: index,
						lastIndex
					});

					const lastChild = flattenNodeRows[flattenNodeRows.length - 1];
					flattenNodeRows.push(...createPaginatedRows(lastChild));
				});

				return flattenNodeRow;
			},
			[
				engineState,
				preloadChildNodes,
				generateId,
				Icon,
				getCachedFlattenRow,
				expandedNodes,
				pageSizeMap,
				createPaginatedRows
			]
		);

		return React.useMemo<FlattenNodeRow[]>(() => {
			const rootRow = {
				...RootNodeRow.create(),
				childrenCount: root.children.length,
				fullPageSize: root.fullSize
			};
			const flattenRows: FlattenNodeRow[] = [getCachedFlattenRow(rootRow)];
			const rootIdentifier = root.identifier;
			root.children.forEach((identifier, index) => {
				const link = DataSelector.link(identifier)(engineState);
				// Hidden root case
				if (link && rootIdentifier) {
					const lastIndex = index === root.children.length - 1;
					const nodeIdentifier = LinkDescriptorUtils.getNodeIdentifierFromRootNode(
						link.linkRef.linkDescriptor,
						rootIdentifier
					);

					makeFlattenNodeRow({
						flattenNodeRows: flattenRows,
						nodeIdentifier,
						nodePath: [rootIdentifier, identifier],
						parent: rootRow,
						rowIndex: index,
						lastIndex
					});

					const lastChild = flattenRows[flattenRows.length - 1];
					flattenRows.push(...createPaginatedRows(lastChild));
				} else {
					makeFlattenNodeRow({
						flattenNodeRows: flattenRows,
						nodeIdentifier: identifier,
						nodePath: [identifier],
						parent: rootRow,
						rowIndex: index
					});
				}
			});

			revalidateCaches(flattenRows);

			return flattenRows;
		}, [
			root.children,
			root.fullSize,
			root.identifier,
			getCachedFlattenRow,
			revalidateCaches,
			engineState,
			makeFlattenNodeRow,
			createPaginatedRows
		]);
	}

	function useIsPaginatedRow() {
		const expansionStrategy = useTreeEngineState(ModelSelector.uiModel()).content.configuration.expansionStrategy;

		return React.useCallback(
			(row: FlattenNodeRow) => {
				if (
					!TreeModel.ExpansionStrategy.LevelByLevel.isAssignableFrom(expansionStrategy) ||
					!expansionStrategy.pageSize
				) {
					return false;
				}
				if (!row.parent) {
					return false;
				}
				if (row.parent.fullPageSize === row.parent.childrenCount) {
					return false;
				}

				const parentFullSize = row.parent.fullPageSize ?? 0;
				const parentChildrenCount = row.parent.childrenCount ?? 0;
				if (parentChildrenCount - 1 !== row.rowIndex || parentFullSize === parentChildrenCount) {
					return false;
				}

				if (!row.lastIndex) {
					return false;
				}

				return true;
			},
			[expansionStrategy]
		);
	}

	function useCreatePaginatedRows() {
		const isPaginatedRow = useIsPaginatedRow();
		return React.useCallback(
			(row: FlattenNodeRow) => {
				const result: PaginatedRow[] = [];

				let child: FlattenNodeRow | undefined;
				let parent: FlattenNodeRow | undefined = row;
				while (parent) {
					if (isPaginatedRow(parent)) {
						if (child && !child.lastIndex) {
							break;
						}
						if (parent.parent) {
							const level = parent.parent.level + 1;
							result.push(PaginatedRow.create({ ...parent.parent, level }));
						}
					}
					child = parent;
					parent = parent.parent;
				}
				return result;
			},
			[isPaginatedRow]
		);
	}

	export function useMultiSelectedRows(data?: FlattenNodeRow[]): FlattenNodeRow[] {
		const multiSelectionNodes = useTreeEngineState(UIStateSelector.multiSelectionNodes());

		const { getCachedFlattenRow, revalidateCaches } = useFlattenRowsCached();

		const contextData = useTreeTableContext<FlattenNodeRow>((context) => context.data);
		const rows: FlattenNodeRow[] = data ?? contextData;

		return React.useMemo(() => {
			const multiSelectedRows = rows.filter((row) => {
				const path = TreeEngineState.NodePath.toString(row.data.nodePath);
				return multiSelectionNodes[path] === TreeEngineState.MultiSelectionState.SELECTED;
			});

			const previewMultiSelectedRows: FlattenNodeRow[] = [];
			// Recalculate level of selected rows
			for (const row of multiSelectedRows) {
				const parentNodePath = row.data.nodePath.slice(0, -1);
				const parentPath = TreeEngineState.NodePath.toString(parentNodePath);
				const parent = previewMultiSelectedRows.find(({ data: { nodePath } }) =>
					TreeEngineState.NodePath.areEqual(nodePath, parentNodePath)
				);
				let selectedRow: FlattenNodeRow;
				if (parent && multiSelectionNodes[parentPath] === TreeEngineState.MultiSelectionState.SELECTED) {
					selectedRow = { ...row, level: parent.level + 1 };
				} else {
					selectedRow = { ...row, level: 1 };
				}

				previewMultiSelectedRows.push(getCachedFlattenRow(selectedRow));
			}

			revalidateCaches(previewMultiSelectedRows);

			return previewMultiSelectedRows;
		}, [getCachedFlattenRow, multiSelectionNodes, revalidateCaches, rows]);
	}

	function useFlattenRowsCached() {
		const cachedRef = React.useRef<{ [key: string]: FlattenNodeRow | undefined }>({});

		const revalidateCaches = React.useCallback((flattenRows: FlattenNodeRow[]) => {
			cachedRef.current = {};
			flattenRows.forEach((item) => {
				cachedRef.current[item.id] = item;
			});
		}, []);

		const getCachedFlattenRow = React.useCallback((flattenRow: FlattenNodeRow): FlattenNodeRow => {
			const cachedRow = cachedRef.current[flattenRow.id];
			if (cachedRow && FlattenNodeRow.areEqual(cachedRow, flattenRow)) {
				return cachedRow;
			}
			return flattenRow;
		}, []);

		return React.useMemo(() => ({ getCachedFlattenRow, revalidateCaches }), [getCachedFlattenRow, revalidateCaches]);
	}

	export function useTopLevelMultiSelectedRows(data: FlattenNodeRow[]) {
		const topLevelMultiSelectedNodesSelector = React.useMemo(() => UIStateSelector.topLevelMultiSelectedNodes(), []);
		const topLevelMultiSelectedNodes = useTreeEngineState(topLevelMultiSelectedNodesSelector);

		return React.useMemo(() => {
			return data.filter((row) =>
				topLevelMultiSelectedNodes.find((node) => TreeEngineState.NodePath.areEqual(row.data.nodePath, node.nodePath))
			);
		}, [data, topLevelMultiSelectedNodes]);
	}
}
