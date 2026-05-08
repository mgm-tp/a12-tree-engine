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
	type TreeTableDragDropOptions,
	type TreeTableRenderPropsType
} from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";

import { useTreeEngineContext, useTreeEngineContextRef } from "../../context/tree-engine-context-provider.js";
import { FlattenNodeRow } from "../../components/tree-engine/sub-components/types.js";
import { FlattenRowHooks } from "../../components/tree-engine/use-flatten-rows.js";

import { useRefValue } from "../use-ref-value.js";

import { type DragObject, type DropResult } from "./configuration.js";
import { useOnDrop } from "./use-on-drop.js";
import { useCanDrag } from "./use-can-drag.js";
import { useCanDrop } from "./use-can-drop.js";
import { useOnHover } from "./use-on-hover.js";

/** @internal **/
export function useDndOptions(data: FlattenNodeRow[]): TreeTableDragDropOptions<FlattenNodeRow> {
	const dndStartHandler = useTreeEngineContext((context) => context.eventHandlers.onDndStarted);
	const dndConfigurationRef = useTreeEngineContextRef((context) => context.dndConfiguration);
	const acceptType = useTreeEngineContext((context) => context.dndConfiguration.acceptType);
	const backend = useTreeEngineContext((context) => context.dndConfiguration.backend);
	const options = useTreeEngineContext((context) => context.dndConfiguration.options);
	const hoverDelay = useTreeEngineContext((context) => context.dndConfiguration.hoverDelay);

	const { onDndHover, setDraggingObject, getDraggingObject, onDropCallback } = useOnHover(dndConfigurationRef);
	const topLevelMultiSelectedRows = FlattenRowHooks.useTopLevelMultiSelectedRows(data);
	const topLevelMultiSelectedRowsRef = useRefValue(topLevelMultiSelectedRows);
	const onDrop = useOnDrop(dndConfigurationRef, topLevelMultiSelectedRowsRef, onDropCallback);
	const canDrop = useCanDrop(dndConfigurationRef, topLevelMultiSelectedRowsRef);
	const canDrag = useCanDrag(data);

	const onBeginDrag = React.useRef<TreeTableDragDropOptions<FlattenNodeRow>["onBeginDrag"]>((params) => {
		setDraggingObject({ ...params.dragItem, row: params.dragItem.row });
		dndStartHandler({ draggingNodeRow: params.dragItem.row });
		dndConfigurationRef.current?.onBeginDrag?.(params);
	});

	const onHover = React.useRef<TreeTableDragDropOptions<FlattenNodeRow>["onHover"]>((params) => {
		let hoveredItem: TreeTableRenderPropsType.HoveredObject<FlattenNodeRow> | undefined;
		if (!getDraggingObject()) {
			setDraggingObject(params.dragItem);
		}
		if (params.hoveredItem && FlattenNodeRow.isAssignableFrom(params.hoveredItem.row)) {
			hoveredItem = { ...params.hoveredItem, row: params.hoveredItem.row };
			onDndHover(hoveredItem);
		} else {
			onDndHover();
		}
		const dragItem: DragObject = { ...params.dragItem, row: params.dragItem.row };
		dndConfigurationRef.current?.onHover?.({ dragItem, hoveredItem });
	});

	const onEndDrag = React.useRef<TreeTableDragDropOptions<FlattenNodeRow>["onEndDrag"]>((params) => {
		const dragItem: DragObject = { ...params.dragItem, row: params.dragItem.row };
		let dropResult: DropResult | null = null;
		if (params.dropResult && FlattenNodeRow.isAssignableFrom(params.dropResult.row)) {
			dropResult = { ...params.dropResult, row: params.dropResult.row };
		}
		dndConfigurationRef.current?.onEndDrag?.({ dragItem, dropResult });
	});

	return React.useMemo(
		() => ({
			acceptType,
			backend,
			hoverDelay,
			options,
			onBeginDrag: onBeginDrag.current,
			onHover: onHover.current,
			onEndDrag: onEndDrag.current,
			canDrag,
			canDrop,
			onDrop
		}),
		[acceptType, backend, hoverDelay, options, canDrag, canDrop, onDrop]
	);
}
