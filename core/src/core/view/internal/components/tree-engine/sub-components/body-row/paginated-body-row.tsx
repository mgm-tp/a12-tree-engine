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
import { css, useTheme, styled } from "styled-components";

import { StyledLink } from "@com.mgmtp.a12.widgets/widgets-core/lib/link/index.js";
import { type Placeholder } from "@com.mgmtp.a12.utils/utils-localization";
import { type TableContextType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/index.js";
import { type DefaultThemeType } from "@com.mgmtp.a12.widgets/widgets-core/lib/theme/index.js";
import { TableContextProvider } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/table.view.js";
import {
	type TreeTableRenderPropsType,
	useTreeTableContext
} from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";
import { type TreeTableContextType } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";
import {
	DefaultTreeTableComponentRenderers,
	TreeTableContextProvider
} from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.view.js";
import { HiddenText } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";
import { type TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/table-renderer.api.js";

import { DocumentModelUtils, TreeModelUtils, DocumentUtils } from "../../../../../../models/internal/shared.js";
import { LocalizerHooks, RESOURCE_KEYS } from "../../../../../../services/localization/index.js";
import { DataSelector, ModelSelector, UIStateSelector } from "../../../../../../store/index.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../../context/tree-engine-context-provider.js";
import { MultiSelectGroup } from "../../../../../../services/multi-select/index.js";

import { type FlattenNodeRow, PaginatedRow, TreeEngineDataColumn } from "../types.js";

export namespace PaginatedBodyRow {
	export type Props = TableRenderPropsType.BodyRowProps<PaginatedRow>;
}
/**
 * @internal
 * The component is not intended to be customized/override at the moment
 */
export const PaginatedBodyRow: React.FC<PaginatedBodyRow.Props> = React.memo(function PaginatedBodyRow(props) {
	const theme = useTheme() as DefaultThemeType;
	const rowHeight = useTreeEngineState(ModelSelector.uiModel()).content.configuration.rowHeight;
	const style = React.useMemo<React.CSSProperties>(() => {
		return { height: rowHeight ?? "auto", backgroundColor: theme.colors.background.secondaryBackground };
	}, [rowHeight, theme.colors.background.secondaryBackground]);

	const treeTableContext: TreeTableContextType = useTreeTableContext((context) => context);
	const customTreeTableContext = React.useMemo<typeof treeTableContext>(() => {
		return {
			...treeTableContext,
			rowStyling: () => ({ style }),
			rowEventHandlers: () => ({}),
			componentRenderers: {
				...treeTableContext.componentRenderers,
				contextMenuRenderer: undefined,
				bodyContentRenderer: (props) => {
					if (!TreeEngineDataColumn.isInstance(props.column) || !props.column.hierarchical) {
						return null;
					}
					if (PaginatedRow.RootRow.isAssignableFrom(props.row)) {
						return <RootPaginationButtons row={props.row} />;
					}
					if (PaginatedRow.FlattenRow.isAssignableFrom(props.row)) {
						return <PaginationButtons row={props.row} rowIndex={props.rowIndex} column={props.column} />;
					}
					return null;
				}
			}
		};
	}, [style, treeTableContext]);

	return (
		<TreeTableContextProvider value={customTreeTableContext}>
			<TableContextProvider value={customTreeTableContext as unknown as TableContextType}>
				{DefaultTreeTableComponentRenderers.bodyRowRenderer({ ...props, dataRole: "paginated-table-body-row" })}
			</TableContextProvider>
		</TreeTableContextProvider>
	);
});

/** @internal */
export namespace RootPaginationButtons {
	export interface Props {
		row: PaginatedRow.RootRow;
	}
}

/** @internal */
export const RootPaginationButtons: React.FC<RootPaginationButtons.Props> = React.memo(
	function RootPaginationButtons(props) {
		const { row } = props;
		const Link = useTreeEngineContext((context) => context.widgetMap.Link);
		const ActionBarGroupDivider = useTreeEngineContext((context) => context.widgetMap.ActionBarGroupDivider);

		const onLoadMore = useTreeEngineContext((context) => context.eventHandlers.onLoadMore);
		const onLoadAll = useTreeEngineContext((context) => context.eventHandlers.onLoadAll);

		const root = useTreeEngineState(DataSelector.root());

		const onLoadMoreButtonClick = React.useCallback(
			(e: React.SyntheticEvent) => {
				e.stopPropagation();
				if (root.identifier) {
					onLoadMore({ nodeIdentifier: root.identifier, nodePath: [root.identifier] });
				}
			},
			[onLoadMore, root.identifier]
		);

		const onLoadAllButtonClick = React.useCallback(
			(e: React.SyntheticEvent) => {
				e.stopPropagation();
				if (root.identifier) {
					onLoadAll({ nodeIdentifier: root.identifier, nodePath: [root.identifier] });
				}
			},
			[onLoadAll, root.identifier]
		);

		const localizedResource = LocalizerHooks.useLocalizedResource();
		const amountPlaceholder: Placeholder = React.useMemo(
			() => ({ type: "plain", value: row.fullPageSize }),
			[row.fullPageSize]
		);

		const nodeStateSelector = React.useMemo(
			() => UIStateSelector.nodeState(row.data.nodeIdentifier, row.data.nodePath),
			[row.data]
		);
		const { busy } = useTreeEngineState(nodeStateSelector);

		return (
			<StyledPaginationButtonsContainer $level={props.row.level} $busy={busy}>
				<HiddenText htmlTag="div">{localizedResource(RESOURCE_KEYS.treeEngine.pagination.belongsToRoot)}</HiddenText>
				<Link
					linkAttributes={{ "aria-disabled": busy }}
					onClick={onLoadMoreButtonClick}
					title={localizedResource(RESOURCE_KEYS.treeEngine.pagination.loadMoreForRootTitle)}>
					{localizedResource(RESOURCE_KEYS.treeEngine.pagination.loadMore)}
				</Link>
				<ActionBarGroupDivider className="pagination-divider" />
				<Link
					linkAttributes={{ "aria-disabled": busy }}
					onClick={onLoadAllButtonClick}
					title={localizedResource(RESOURCE_KEYS.treeEngine.pagination.loadAllForRootTitle)}>
					{localizedResource(RESOURCE_KEYS.treeEngine.pagination.loadAll, { amount: amountPlaceholder })}
				</Link>
			</StyledPaginationButtonsContainer>
		);
	}
);

/** @internal */
export namespace PaginationButtons {
	export type Props = TreeTableRenderPropsType.HierarchicalBodyContentProps<FlattenNodeRow, TreeEngineDataColumn>;
}

/** @internal */
export const PaginationButtons: React.FC<PaginationButtons.Props> = React.memo(function PaginationCell(props) {
	const { row } = props;
	const ActionBarGroupDivider = useTreeEngineContext((context) => context.widgetMap.ActionBarGroupDivider);
	const Link = useTreeEngineContext((context) => context.widgetMap.Link);

	const onLoadMore = useTreeEngineContext((context) => context.eventHandlers.onLoadMore);
	const onLoadAll = useTreeEngineContext((context) => context.eventHandlers.onLoadAll);

	const onLoadMoreButtonClick = React.useCallback(
		(e: React.SyntheticEvent) => {
			e.stopPropagation();
			onLoadMore(row.data);
		},
		[onLoadMore, row.data]
	);

	const onLoadAllButtonClick = React.useCallback(
		(e: React.SyntheticEvent) => {
			e.stopPropagation();
			onLoadAll(row.data);
		},
		[onLoadAll, row.data]
	);

	const documentModel = useTreeEngineState(ModelSelector.documentModelByName(props.row.nodeModel.documentModelRef));
	const documentModelPath = React.useMemo(() => {
		return TreeModelUtils.findColumnById(props.row.nodeModel.columns, props.column.id)?.elementPath;
	}, [props.column.id, props.row.nodeModel.columns]);

	const element = React.useMemo(() => {
		if (!documentModel || !documentModelPath) {
			return undefined;
		}
		try {
			return DocumentModelUtils.findByPath(documentModel, documentModelPath);
		} catch (e) {
			return undefined;
		}
	}, [documentModel, documentModelPath]);

	const node = useTreeEngineState(DataSelector.node(props.row.data.nodeIdentifier));
	const parentLabel = React.useMemo(() => {
		if (!documentModelPath || !node?.document || !DocumentUtils.isGroupInstance(node.document)) {
			return undefined;
		}
		const isMultiSelectGroup = element && MultiSelectGroup.isInstance(element);
		const label = DocumentUtils.getValue(
			node.document,
			DocumentModelUtils.toEntityInstancePath(documentModelPath, isMultiSelectGroup)
		);
		if (typeof label !== "string") {
			return undefined;
		}
		return label;
	}, [documentModelPath, element, node]);

	const localizedResource = LocalizerHooks.useLocalizedResource();
	const parentLabelPlaceholder: Placeholder = React.useMemo(
		() => ({ type: "plain", value: parentLabel }),
		[parentLabel]
	);
	const amountPlaceholder: Placeholder = React.useMemo(
		() => ({ type: "plain", value: row.fullPageSize }),
		[row.fullPageSize]
	);

	const nodeStateSelector = React.useMemo(
		() => UIStateSelector.nodeState(row.data.nodeIdentifier, row.data.nodePath),
		[row.data]
	);
	const { busy } = useTreeEngineState(nodeStateSelector);

	return (
		<StyledPaginationButtonsContainer $level={props.row.level} $busy={busy}>
			<HiddenText htmlTag="div">
				{localizedResource(RESOURCE_KEYS.treeEngine.pagination.belongsTo, { node: parentLabelPlaceholder })}
			</HiddenText>
			<Link
				linkAttributes={{ "aria-disabled": busy }}
				onClick={onLoadMoreButtonClick}
				title={localizedResource(RESOURCE_KEYS.treeEngine.pagination.loadMoreTitle, { node: parentLabelPlaceholder })}>
				{localizedResource(RESOURCE_KEYS.treeEngine.pagination.loadMore)}
			</Link>
			<ActionBarGroupDivider className="pagination-divider" />
			<Link
				linkAttributes={{ "aria-disabled": busy }}
				onClick={onLoadAllButtonClick}
				title={localizedResource(RESOURCE_KEYS.treeEngine.pagination.loadAllTitle, { node: parentLabelPlaceholder })}>
				{localizedResource(RESOURCE_KEYS.treeEngine.pagination.loadAll, { amount: amountPlaceholder })}
			</Link>
		</StyledPaginationButtonsContainer>
	);
});

namespace StyledPaginationButtonsContainer {
	export interface Props {
		$level: number;
		$busy: boolean;
		children: React.ReactNode;
	}
}
const StyledPaginationButtonsContainer = styled.div<StyledPaginationButtonsContainer.Props>(
	({ theme, $level, $busy }) => {
		const { components, colors, spacing } = theme as DefaultThemeType;
		const { node } = components.tree;

		const busyLinkStyle = css`
			${StyledLink} {
				color: ${colors.text.secondaryColor};
				pointer-events: none;
				cursor: default;
			}
		`;

		return css`
			display: flex;
			align-items: center;
			padding-left: ${`calc(${node.indentPaddingLeft * (1 + $level)}px + ${node.titleSpacingLeft} )`};

			.pagination-divider {
				margin-left: ${spacing.spacing.spacingSm}px;
				margin-right: ${spacing.spacing.spacingSm}px;
			}

			${$busy && busyLinkStyle}
		`;
	}
);
