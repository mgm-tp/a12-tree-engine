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

import {
	type CellStyleGetter,
	type ColumnResizingOptions,
	DefaultTreeTableComponentRenderers,
	type TreeTableComponentRenderers,
	type TreeTableProps,
	type TreeTableRowEventHandlers,
	type TreeTableRowStyling,
	type TreeTableScrollToNodeHandler,
	type TreeTableVirtualScrollOptions,
	DefaultTableComponentRenderers
} from "@com.mgmtp.a12.widgets/widgets-core";

import { TreeModel } from "../../../models/tree-model.js";
import { LocalizerHooks } from "../../../services/localization/localizer-hooks.js";
import { TreeModelKeys } from "../../../services/localization/tree-model-keys.js";
import { ModelSelector } from "../../../store/selectors/models.js";
import { TreeEngineState } from "../../../store/store.js";
import { UIStateSelector } from "../../../store/selectors/ui-state.js";
import { useDndOptions } from "../../configuration/dnd/use-dnd-options.js";
import { useIdGenerator } from "../../configuration/id-generator.js";
import {
	useTreeEngineContext,
	useTreeEngineContextRef,
	useTreeEngineState,
	useTreeEngineStateRef
} from "../../context/tree-engine-context.js";
import { DndUtils } from "../../configuration/dnd/utils.js";
import type { PickStateFromSelectorCreator } from "../../../store/shared.js";

import { DragPreview } from "./sub-components/drag-preview.js";
import { RowActionGroupHooks, RowActionHooks } from "./sub-components/hooks/row-action-hooks.js";
import { toCellId, getScreenReaderColumnRef } from "./sub-components/a11y-utils.js";
import {
	FlattenNodeRow,
	PaginatedRow,
	RootNodeRow,
	TreeEngineActionColumn,
	type TreeEngineColumn,
	TreeEngineDataColumn
} from "./sub-components/types.js";
import { FlattenRowHooks } from "./use-flatten-rows.js";
import { useTreeEngineColumns } from "./use-tree-engine-columns.js";
import { PaginatedBodyRow } from "./sub-components/body-row/paginated-body-row.js";

export namespace TreeEngineRenderer {
	export interface Props {}
}

export const TreeEngineRenderer: React.ComponentType<TreeEngineRenderer.Props> = React.memo(() => {
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const disabled = useTreeEngineState(UIStateSelector.disabled());
	const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();
	const ariaLabel = React.useMemo(
		() => localizedTreeElement(TreeModelKeys.getHeaderLabelsKey(), uiModel.header.labels),
		[localizedTreeElement, uiModel.header.labels]
	);
	const id = useIdGenerator()(uiModel.header.id);

	const eventHandlers = useEventHandlers();
	const rowStyling = useRowStyling();
	const cellStyling = useCellStyling();
	const columns = useTreeEngineColumns();
	const columnResizingOptions = useColumnResizing(columns);
	const componentRenderers = useComponentRenderers();
	const flattenRows = FlattenRowHooks.useFlattenRows();

	const dndOptions = useDndOptions(flattenRows);
	const disableDnd = useTreeEngineContext((context) => context.disableDnd);
	const readonly = useTreeEngineState(UIStateSelector.readonly());

	const dragDropOptions = disableDnd || readonly ? undefined : dndOptions;
	const TreeTable: React.ComponentType<TreeTableProps<FlattenNodeRow, TreeEngineColumn>> = useTreeEngineContext(
		(context) => context.widgetMap.TreeTable
	);
	const DialogsRenderer = useTreeEngineContext((context) => context.componentMap.DialogsRenderer);

	const { enableVirtualScroll, rowHeight } = uiModel.content.configuration;
	const virtualScrollOptions = React.useMemo<TreeTableVirtualScrollOptions | undefined>(() => {
		return enableVirtualScroll && rowHeight ? { rowHeight } : undefined;
	}, [enableVirtualScroll, rowHeight]);

	const scrollToNode = useScrollToNode();

	return (
		<>
			<TreeTable
				hideRoot={!uiModel.content.configuration.virtualRoot}
				componentRenderers={componentRenderers}
				data={flattenRows}
				columns={columns}
				rowEventHandlers={eventHandlers}
				dragDropOptions={dragDropOptions}
				columnResizingOptions={columnResizingOptions}
				rowStyling={rowStyling}
				cellStyling={cellStyling}
				areRowsEqual={FlattenNodeRow.areEqual}
				virtualScrollOptions={virtualScrollOptions}
				scrollToNode={scrollToNode}
				disabled={disabled}
				ariaLabel={ariaLabel}
				id={id}
			/>
			<DialogsRenderer />
		</>
	);
});

/** @internal */
export function useEventHandlers(): TreeTableRowEventHandlers<FlattenNodeRow> {
	const onNodeExpansionChanged = useTreeEngineContext((context) => context.eventHandlers.onNodeExpansionChanged);
	const onRowClicked = useTreeEngineContext((context) => context.eventHandlers.onRowClicked);
	const disabledRef = useTreeEngineStateRef(UIStateSelector.disabled());
	const readonlyRef = useTreeEngineStateRef(UIStateSelector.readonly());
	const isMultiSelectionClickActiveRef = useTreeEngineStateRef(UIStateSelector.isMultiSelectionRowClickActive());
	const rowStylingRef = useTreeEngineContextRef((context) => context.rowStyling);

	const selectRows = RowActionHooks.useRowsSelect();

	const onClickHandler = React.useCallback(
		(row: FlattenNodeRow) => (event: React.MouseEvent<HTMLElement>) => {
			if (isMultiSelectionClickActiveRef.current) {
				selectRows(event, row);
				return;
			}

			onRowClicked({ ...row.data, nodeModel: row.nodeModel });
		},
		[isMultiSelectionClickActiveRef, onRowClicked, selectRows]
	);

	const onArrowClickHandler = React.useCallback(
		(row: FlattenNodeRow) => () => {
			onNodeExpansionChanged({ ...row.data });
		},
		[onNodeExpansionChanged]
	);

	return React.useCallback(
		({ row }) => {
			if (RootNodeRow.isAssignableFrom(row)) {
				return {};
			}
			const interactive = rowStylingRef.current?.({ row }).interactive ?? true;
			const isCircular = DndUtils.isCircular(row);

			if (interactive && !disabledRef.current && !readonlyRef.current && !isCircular) {
				return { onArrowClick: onArrowClickHandler(row), onClick: onClickHandler(row) };
			}

			return { onArrowClick: onArrowClickHandler(row) };
		},
		[rowStylingRef, disabledRef, readonlyRef, onArrowClickHandler, onClickHandler]
	);
}

/** @internal */
export function useRowStyling(): TreeTableRowStyling<FlattenNodeRow> {
	const disabled = useTreeEngineState(UIStateSelector.disabled());
	const selectedNodes = useTreeEngineState(UIStateSelector.selectedNodes());
	const expandedNodes = useTreeEngineState(UIStateSelector.expandedNodes());
	const matchedNodes = useTreeEngineState(UIStateSelector.matchedNodes());
	const busyNodes = useTreeEngineState(UIStateSelector.busyNodes());
	const multiSelectionNodes = useTreeEngineState(UIStateSelector.multiSelectionNodes());
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();
	const rowStyling = useTreeEngineContext((context) => context.rowStyling);
	const isMultiSelectionClickActive = useTreeEngineState(UIStateSelector.isMultiSelectionRowClickActive());

	const nodesState = React.useMemo<PickStateFromSelectorCreator<typeof UIStateSelector.nodeState>>(() => {
		return { busyNodes, expandedNodes, matchedNodes, multiSelectionNodes, selectedNodes };
	}, [busyNodes, expandedNodes, matchedNodes, multiSelectionNodes, selectedNodes]);

	const rowStyle = React.useMemo(
		() => ({ height: uiModel.content.configuration.rowHeight }),
		[uiModel.content.configuration.rowHeight]
	);

	const rightClickGroupsGetter = RowActionGroupHooks.useRightClickGroupsGetter();
	const visibleGroupFilter = RowActionGroupHooks.useVisibilityFilter();
	const readonly = useTreeEngineState(UIStateSelector.readonly());

	return React.useCallback(
		({ row }) => {
			const visibleRightClickGroups = visibleGroupFilter(row, rightClickGroupsGetter(row));
			const disabledRightClickContextMenu = visibleRightClickGroups.length === 0;

			if (RootNodeRow.isAssignableFrom(row)) {
				return { selected: false, collapsed: false, disabledRightClickContextMenu, style: rowStyle };
			}
			const { nodeModel, level, data } = row;
			const { expanded, selected, busy, multiSelection } = UIStateSelector.nodeState(
				data.nodeIdentifier,
				data.nodePath
			)(nodesState);
			const className = `${nodeModel.styles?.join(" ") ?? ""} treeEngine__node--level-${level}`.trim();
			const highlighted = multiSelection === TreeEngineState.MultiSelectionState.SELECTED;
			const title = localizedTreeElement([TreeModelKeys.ROWS, TreeModelKeys.TITLE], nodeModel.rowTitle) || undefined;

			const isNonInteractiveRow = TreeModel.NonInteractiveRowActivation.isAssignableFrom(nodeModel.rowActivation ?? {});
			const shouldForceNonInteractive = isNonInteractiveRow && !isMultiSelectionClickActive;

			return {
				selected,
				collapsed: !expanded,
				interactive: shouldForceNonInteractive ? false : !busy && !readonly,
				highlighted,
				className,
				disabledRightClickContextMenu,
				style: rowStyle,
				title: readonly || disabled || busy || shouldForceNonInteractive ? undefined : title,
				...rowStyling?.({ row })
			};
		},
		[
			visibleGroupFilter,
			rightClickGroupsGetter,
			nodesState,
			localizedTreeElement,
			readonly,
			rowStyle,
			disabled,
			rowStyling,
			isMultiSelectionClickActive
		]
	);
}

/** @internal */
export function useColumnResizing(columns: TreeEngineColumn[]): ColumnResizingOptions<TreeEngineColumn> | undefined {
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const columnWidths = useTreeEngineState(UIStateSelector.columnWidths());
	const onColumnWidthsChanged = useTreeEngineContext((context) => context.eventHandlers.onColumnWidthsChanged);

	return React.useMemo(() => {
		if (!uiModel.content.configuration.enableColumnsResize) {
			return undefined;
		}

		return {
			onEndResize: ({ resizedWidthsGetter }) => {
				const changedColumnWidths: TreeEngineState.ColumnWidths = columns.reduce((result, column) => {
					if (!TreeEngineDataColumn.isInstance(column)) {
						return result;
					}
					const newColumnWidth = resizedWidthsGetter?.(column) ?? column.width;
					const oldColumnWidth = columnWidths?.[column.columnModel.id];

					if (newColumnWidth === oldColumnWidth) {
						return result;
					}

					return { ...result, [column.columnModel.id]: newColumnWidth };
				}, {});

				if (Object.keys(changedColumnWidths).length > 0) {
					onColumnWidthsChanged?.({ changedColumnWidths });
				}
			}
		};
	}, [columnWidths, columns, onColumnWidthsChanged, uiModel.content.configuration.enableColumnsResize]);
}

/** @internal */
export function useCellStyling(): CellStyleGetter<FlattenNodeRow, TreeEngineColumn> {
	return React.useCallback(({ column }) => {
		if (TreeEngineDataColumn.isInstance(column)) {
			return { className: column.columnModel.styles?.content?.join(" ") };
		}
		return {};
	}, []);
}

type Renderers = TreeTableComponentRenderers<FlattenNodeRow, TreeEngineColumn>;

function useComponentRenderers(): Partial<Renderers> {
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const screenReaderColumnRef = getScreenReaderColumnRef(uiModel.content.configuration);

	const DndBodyRow = useTreeEngineContext((context) => context.componentMap.DndBodyRow);
	const BodyRow = useTreeEngineContext((context) => context.componentMap.BodyRow);
	const DragSource = useTreeEngineContext((context) => context.componentMap.DragSource);
	const VirtualRootRow = useTreeEngineContext((context) => context.componentMap.VirtualRootRow);
	const Body = useTreeEngineContext((context) => context.componentMap.Body);
	const VirtualizedBody = useTreeEngineContext((context) => context.componentMap.VirtualizedBody);
	const RightClickContextMenu = useTreeEngineContext((context) => context.componentMap.RightClickContextMenu);
	const RowProgressIndicator = useTreeEngineContext((context) => context.componentMap.RowProgressIndicator);

	const headCellRenderer: Renderers["headCellRenderer"] = React.useCallback((params) => {
		let className: string | undefined;
		if (TreeEngineDataColumn.isInstance(params.column)) {
			className = params.column.columnModel?.styles?.header?.join(" ");
		}
		return DefaultTreeTableComponentRenderers.headCellRenderer({ ...params, className });
	}, []);

	const dndBodyRowRenderer: Renderers["dndBodyRowRenderer"] = React.useCallback(
		(params) => {
			if (RootNodeRow.isAssignableFrom(params.row)) {
				return DefaultTreeTableComponentRenderers.dndBodyRowRenderer(params);
			}
			if (PaginatedRow.isAssignableFrom(params.row)) {
				const { key, ...rest } = params;
				return <PaginatedBodyRow key={key} {...rest} row={params.row} />;
			}
			const { key, ...rest } = params;
			return <DndBodyRow key={key} {...rest} row={params.row} />;
		},
		[DndBodyRow]
	);

	const bodyRowRenderer: Renderers["bodyRowRenderer"] = React.useCallback(
		(params) => {
			if (RootNodeRow.isAssignableFrom(params.row)) {
				const { key, ...rest } = params;
				return <VirtualRootRow key={key} {...rest} row={params.row} />;
			}
			if (PaginatedRow.isAssignableFrom(params.row)) {
				const { key, ...rest } = params;
				return <PaginatedBodyRow key={key} {...rest} row={params.row} />;
			}

			const { key, ...rest } = params;
			return <BodyRow key={key} {...rest} row={params.row} />;
		},
		[BodyRow, VirtualRootRow]
	);

	const bodyCellRenderer: Renderers["bodyCellRenderer"] = React.useCallback(
		(params) => {
			const { column, row } = params;
			let key: string;
			if (TreeEngineDataColumn.isInstance(column)) {
				key = column.id;
			} else if (TreeEngineActionColumn.isInstance(column)) {
				key = column.type;
			} else {
				throw new Error(`Invalid column type`);
			}

			if (TreeEngineDataColumn.isInstance(column) && column.id === screenReaderColumnRef) {
				const cellId = toCellId(row.id, column.id);
				return (
					<React.Fragment key={key}>
						{DefaultTableComponentRenderers.bodyCellRenderer({ ...params, id: cellId })}
					</React.Fragment>
				);
			}

			return <React.Fragment key={key}>{DefaultTableComponentRenderers.bodyCellRenderer(params)}</React.Fragment>;
		},
		[screenReaderColumnRef]
	);

	const additionalContentRenderer: Renderers["additionalContentRenderer"] = React.useMemo(
		() => (params) => <RowProgressIndicator row={params.row} />,
		[RowProgressIndicator]
	);

	const bodyRenderer: Renderers["bodyRenderer"] = React.useCallback((params) => <Body {...params} />, [Body]);

	const virtualizedBodyRenderer: Renderers["virtualizedBodyRenderer"] = React.useCallback(
		(params) => <VirtualizedBody {...params} />,
		[VirtualizedBody]
	);
	const dragSourceRenderer: Renderers["dragSourceRenderer"] = React.useCallback(
		(params) => <DragSource {...params} />,
		[DragSource]
	);

	const contextMenuRenderer: Renderers["contextMenuRenderer"] = React.useMemo(
		() => (params) => <RightClickContextMenu {...params} />,
		[RightClickContextMenu]
	);

	const dragPreviewRenderer: Renderers["dragPreviewRenderer"] = React.useMemo(
		() => (params) => <DragPreview {...params} />,
		[]
	);
	return React.useMemo(() => {
		return {
			bodyRowRenderer,
			headCellRenderer,
			dndBodyRowRenderer,
			bodyRenderer,
			virtualizedBodyRenderer,
			contextMenuRenderer,
			dragSourceRenderer,
			additionalContentRenderer,
			dragPreviewRenderer,
			bodyCellRenderer
		};
	}, [
		bodyRowRenderer,
		headCellRenderer,
		dndBodyRowRenderer,
		bodyRenderer,
		virtualizedBodyRenderer,
		contextMenuRenderer,
		dragSourceRenderer,
		additionalContentRenderer,
		dragPreviewRenderer,
		bodyCellRenderer
	]);
}

function useScrollToNode() {
	const scrollHandlerRef = React.useRef<TreeTableScrollToNodeHandler | null>(null);
	const bindScrollToNodeHandler = React.useCallback((handler: TreeTableScrollToNodeHandler) => {
		scrollHandlerRef.current = handler;
	}, []);

	const scrollToNode = useTreeEngineState((state) => state.scrollToNode);
	const busy = useTreeEngineContext((context) => context.busy);
	const onScrollToNodeDone = useTreeEngineContext((context) => context.eventHandlers.onScrollToNodeDone);
	const generateId = useIdGenerator();

	React.useEffect(() => {
		if (busy === false && scrollToNode) {
			setTimeout(() => {
				scrollHandlerRef.current?.(generateId(TreeEngineState.NodePath.toString(scrollToNode.nodePath)), {
					autoFocus: scrollToNode.autoFocus ?? true
				});
				onScrollToNodeDone(scrollToNode);
			});
		}
	}, [scrollToNode, busy, onScrollToNodeDone, scrollHandlerRef, generateId]);

	return bindScrollToNodeHandler;
}
