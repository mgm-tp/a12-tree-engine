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
	TreeTableNodeDropPosition,
	type TreeTableRenderPropsType
} from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";

import { type FlattenNodeRow } from "../../components/tree-engine/sub-components/types.js";
import { Identifier, ModelSelector, type ModelsState, type Selector } from "../../../../store/index.js";
import { useTreeEngineContext, useTreeEngineState } from "../../context/tree-engine-context-provider.js";

import { type DndConfiguration, type DragObject, type HoveredObject } from "./configuration.js";

/** @internal */
export function useOnHover(dndConfigurationRef: React.MutableRefObject<DndConfiguration | undefined>) {
	const expandHoveredNodeSelector: Selector<boolean | undefined, ModelsState> = React.useCallback(
		(state) => ModelSelector.uiModel()(state).content.configuration.dnd?.onDrag.expandHoveredNode,
		[]
	);
	const expandHoveredNode = useTreeEngineState(expandHoveredNodeSelector);
	const dndHoverHandler = useTreeEngineContext((context) => context.eventHandlers.onDndHover);

	const hoveredObjectRef = React.useRef<HoveredObject>(null);
	const draggingObjectRef = React.useRef<DragObject>(null);
	const timeoutInstanceRef = React.useRef<number>(undefined);

	const timeoutCallback = React.useCallback(() => {
		if (expandHoveredNode && hoveredObjectRef.current && draggingObjectRef.current) {
			const canDrop =
				dndConfigurationRef.current?.canDrop?.({
					dragItem: draggingObjectRef.current,
					hoveredItem: hoveredObjectRef.current
				}) ?? false;

			dndHoverHandler({
				hoveredNodeRow: hoveredObjectRef.current.row,
				position: hoveredObjectRef.current.position,
				draggingNodeRow: draggingObjectRef.current.row,
				canDrop: !!canDrop
			});
		}
	}, [dndConfigurationRef, dndHoverHandler, draggingObjectRef, expandHoveredNode, hoveredObjectRef]);

	const onDndHover = React.useCallback(
		(hoveredObject?: TreeTableRenderPropsType.HoveredObject<FlattenNodeRow>) => {
			if (!hoveredObject) {
				clearTimeout(timeoutInstanceRef.current);
				hoveredObjectRef.current = null;
				return;
			}

			const isUpdatedHoveredObject =
				!hoveredObjectRef.current ||
				hoveredObject.position !== hoveredObjectRef.current.position ||
				!Identifier.areEqual(hoveredObjectRef.current.row.data.nodeIdentifier, hoveredObject.row.data.nodeIdentifier);

			if (isUpdatedHoveredObject) {
				clearTimeout(timeoutInstanceRef.current);
				if (hoveredObject.position !== TreeTableNodeDropPosition.AS_CHILD) {
					return;
				}

				hoveredObjectRef.current = hoveredObject;
				timeoutInstanceRef.current = window.setTimeout(timeoutCallback, dndConfigurationRef.current?.hoverDelay);
			}
		},
		[dndConfigurationRef, hoveredObjectRef, timeoutCallback]
	);

	const onDropCallback = React.useCallback(() => {
		draggingObjectRef.current = null;
		hoveredObjectRef.current = null;
		clearTimeout(timeoutInstanceRef.current);
	}, [timeoutInstanceRef]);

	const setDraggingObject = React.useCallback((dragObject: DragObject) => {
		draggingObjectRef.current = dragObject;
	}, []);

	const getDraggingObject = React.useCallback(() => {
		return draggingObjectRef.current;
	}, []);

	return { onDndHover, setDraggingObject, getDraggingObject, onDropCallback };
}
