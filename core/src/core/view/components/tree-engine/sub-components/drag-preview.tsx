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
import type { DragLayerMonitor } from "react-dnd";

import {
	TableContextProvider,
	useTableContext,
	DnDTable,
	type TableRenderPropsType,
	DefaultTreeTableComponentRenderers,
	type Container
} from "@com.mgmtp.a12.widgets/widgets-core";

import { UIStateSelector } from "../../../../store/selectors/ui-state.js";
import type { DragObject } from "../../../configuration/dnd/configuration.js";
import { TreeEngineRowContextProvider, useTreeEngineRowContextProvider } from "../../../context/row-context.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";

import { FlattenNodeRow } from "./types.js";

/** @internal */
export const DragPreview: React.FC<TableRenderPropsType.DragPreviewProps> = (props) => {
	const totalMultiSelectionNodeCount = useTreeEngineState(UIStateSelector.totalMultiSelectionNodeCount());
	const { item } = DnDTable.useEfficientDragLayer((monitor: DragLayerMonitor<DragObject>) => ({
		item: monitor.getItem() as DragObject
	}));
	if (!item || !FlattenNodeRow.isAssignableFrom(item.row)) {
		return null;
	}

	if (totalMultiSelectionNodeCount) {
		return (
			<MultiSelectionDragPreviewContainer>
				{DefaultTreeTableComponentRenderers.dragPreviewRenderer(props)}
			</MultiSelectionDragPreviewContainer>
		);
	}

	return (
		<DragPreviewRowContainer row={item.row}>
			{DefaultTreeTableComponentRenderers.dragPreviewRenderer(props)}
		</DragPreviewRowContainer>
	);
};

namespace DragPreviewRowContainer {
	export interface Props extends Container {
		row: FlattenNodeRow;
	}
}
const DragPreviewRowContainer: React.FC<DragPreviewRowContainer.Props> = (props) => {
	const rowContext = useTreeEngineRowContextProvider(props.row);
	if (!rowContext) {
		return null;
	}
	return <TreeEngineRowContextProvider value={rowContext}>{props.children}</TreeEngineRowContextProvider>;
};

namespace MultiSelectionDragPreviewContainer {
	export type Props = Container;
}
const MultiSelectionDragPreviewContainer: React.FC<MultiSelectionDragPreviewContainer.Props> = (props) => {
	const MultiSelectionDragPreview = useTreeEngineContext((c) => c.componentMap.MultiSelectionDragPreview);
	const context = useTableContext<FlattenNodeRow>((c) => c);

	/** These variables only exist until we remove deprecated props from {@link MultiSelectionDragPreview} */
	const memoizedEmptyObject = React.useMemo(() => ({}), []);
	const memoizedEmptyArray = React.useMemo(() => [], []);

	const componentRenderers: typeof context.componentRenderers = React.useMemo(() => {
		return {
			...context.componentRenderers,
			bodyRowRenderer: () => {
				return (
					<MultiSelectionDragPreview
						data={memoizedEmptyArray}
						componentRenderers={memoizedEmptyObject}
						columns={memoizedEmptyArray}
					/>
				);
			}
		};
	}, [MultiSelectionDragPreview, context.componentRenderers, memoizedEmptyArray, memoizedEmptyObject]);

	return <TableContextProvider value={{ ...context, componentRenderers }}>{props.children}</TableContextProvider>;
};
