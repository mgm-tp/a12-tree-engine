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

import { type FlattenNodeRow } from "../../components/tree-engine/sub-components/types.js";

import { type DndConfiguration } from "./configuration.js";

/** @internal */
export function useCanDrop(
	dndConfigurationRef: React.MutableRefObject<DndConfiguration | undefined>,
	topLevelMultiSelectedRowsRef: React.MutableRefObject<FlattenNodeRow[]>
): TreeTableDragDropOptions["canDrop"] {
	return React.useCallback(
		(params: {
			dragItem: TreeTableRenderPropsType.DragObject<FlattenNodeRow>;
			hoveredItem: TreeTableRenderPropsType.HoveredObject<FlattenNodeRow>;
		}) => {
			const canDrop = dndConfigurationRef.current?.canDrop;
			if (!canDrop || !topLevelMultiSelectedRowsRef.current) {
				return false;
			}

			if (topLevelMultiSelectedRowsRef.current.length === 0) {
				return !!canDrop(params);
			}

			return topLevelMultiSelectedRowsRef.current.every((topLevelRow) => {
				return !!canDrop({ ...params, dragItem: { row: topLevelRow, rowIndex: 0 } });
			});
		},
		[dndConfigurationRef, topLevelMultiSelectedRowsRef]
	);
}
