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
	TreeTableNodeDropPosition,
	type TreeTableRenderPropsType
} from "@com.mgmtp.a12.widgets/widgets-core";

import { useTreeEngineContext } from "../../context/tree-engine-context.js";
import { FlattenNodeRow, RootNodeRow } from "../../components/tree-engine/sub-components/types.js";

import type { DndConfiguration, DragObject, DropResult } from "./configuration.js";

/** @internal */
export function useOnDrop(
	dndConfigurationRef: React.MutableRefObject<DndConfiguration | undefined>,
	topLevelMultiSelectedRowsRef: React.MutableRefObject<FlattenNodeRow[]>,
	cleanup: () => void
): TreeTableDragDropOptions["onDrop"] {
	const bulkDndHandler = useBulkDndHandler(dndConfigurationRef, topLevelMultiSelectedRowsRef);
	const singleDndHandler = useSingleDndHandler(dndConfigurationRef);

	return React.useCallback(
		(params: {
			dragItem: TreeTableRenderPropsType.DragObject<FlattenNodeRow>;
			dropResult: TreeTableRenderPropsType.HoveredObject<FlattenNodeRow>;
		}) => {
			const dragItem: DragObject = { ...params.dragItem, row: params.dragItem.row };
			dndConfigurationRef.current?.onDrop?.({ ...params, dragItem });
			let dropResult: DropResult | undefined = undefined;
			if (FlattenNodeRow.isAssignableFrom(params.dropResult.row)) {
				dropResult = { ...params.dropResult, row: params.dropResult.row };
			}

			cleanup();

			if (topLevelMultiSelectedRowsRef.current.length === 0) {
				singleDndHandler(dragItem, dropResult);
			} else {
				bulkDndHandler(dragItem, dropResult);
			}
		},
		[bulkDndHandler, cleanup, dndConfigurationRef, singleDndHandler, topLevelMultiSelectedRowsRef]
	);
}

/** @internal */
export function useBulkDndHandler(
	dndConfigurationRef: React.MutableRefObject<DndConfiguration | undefined>,
	topLevelMultiSelectedRowsRef: React.MutableRefObject<FlattenNodeRow[]>
) {
	const bulkDndDoneHandler = useTreeEngineContext((context) => context.eventHandlers.onBulkDndDone);

	return React.useCallback(
		(dragObject: DragObject, dropResult?: DropResult): void => {
			if (!dropResult) {
				bulkDndDoneHandler({ draggedNodeRows: topLevelMultiSelectedRowsRef.current });
				return;
			}

			const canDropResults = topLevelMultiSelectedRowsRef.current.map((row) => {
				return (
					dndConfigurationRef.current?.canDrop?.({
						dragItem: { row, rowIndex: 0 },
						hoveredItem: { ...dropResult.row, row: dropResult.row, position: dropResult.position, rowIndex: 0 }
					}) ?? false
				);
			});

			if (canDropResults.some((result) => result === false)) {
				throw new Error("canDropResult can not be false");
			}
			if (canDropResults.every((result) => result === true)) {
				return bulkDndDoneHandler({
					draggedNodeRows: topLevelMultiSelectedRowsRef.current,
					droppedNodeRow: dropResult.row,
					position: dropResult.position
				});
			}
			if (canDropResults.every((result) => typeof result !== "boolean")) {
				return bulkDndDoneHandler({
					draggedNodeRows: topLevelMultiSelectedRowsRef.current,
					droppedNodeRow: dropResult.row,
					position: TreeTableNodeDropPosition.BOTTOM
				});
			}
			throw new Error(`Unexpected canDrop result, only expect every result of a bulk to be "true" or redirection`);
		},
		[bulkDndDoneHandler, dndConfigurationRef, topLevelMultiSelectedRowsRef]
	);
}

/** @internal */
export function useSingleDndHandler(dndConfigurationRef: React.MutableRefObject<DndConfiguration | undefined>) {
	const onDndDone = useTreeEngineContext((context) => context.eventHandlers.onDndDone);

	return React.useCallback(
		(dragObject: DragObject, dropResult?: DropResult): void => {
			const newDropResult = {
				row: RootNodeRow.create(),
				position: TreeTableNodeDropPosition.AS_CHILD,
				rowIndex: 0,
				...dropResult
			};

			const canDropResult =
				dndConfigurationRef.current?.canDrop?.({
					dragItem: dragObject,
					hoveredItem: newDropResult
				}) ?? false;

			if (canDropResult === true) {
				if (!dropResult) {
					onDndDone({ draggedNodeRow: dragObject.row });
					return;
				}

				onDndDone({
					draggedNodeRow: dragObject.row,
					droppedNodeRow: newDropResult.row,
					position: newDropResult.position
				});
				return;
			}

			if (canDropResult === false) {
				throw new Error("canDropResult can not be false");
			}

			return onDndDone(canDropResult);
		},
		[dndConfigurationRef, onDndDone]
	);
}
