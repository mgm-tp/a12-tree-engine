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

import type { RuntimeTreeModel } from "../../../../models/tree-model.js";
import type { TreeEngineState } from "../../../../store/store.js";
import { useTreeEngineContext } from "../../../context/tree-engine-context.js";
import { isColumnVisible } from "../../column-visibility/column-visibility.js";

/** @internal */
export function toCellId(rowId: string, columnId: string): string {
	return `${rowId}_${columnId}`;
}

/**
 * The id of `configuration.screenReaderColumnRef`, or of the hierarchical column when unset,
 * but only while that column is visible.
 *
 * @internal
 */
export function resolveScreenReaderColumnId(
	uiModel: RuntimeTreeModel,
	columnVisibility?: TreeEngineState.ColumnVisibility
): string | undefined {
	const { configuration, columns } = uiModel.content;
	const { screenReaderColumnRef, hierarchicalColumnRef } = configuration;

	if (!screenReaderColumnRef) {
		return hierarchicalColumnRef;
	}

	// A hidden or unknown column renders no cell, so its id would dangle in `aria-labelledby`.
	const column = columns.find(({ id }) => id === screenReaderColumnRef);

	return column && isColumnVisible(column, configuration, columnVisibility) ? screenReaderColumnRef : undefined;
}

/**
 * Reads what {@link resolveScreenReaderColumnId} put on the context.
 *
 * @internal
 */
export function useScreenReaderColumnRef(): string | undefined {
	return useTreeEngineContext((context) => context.screenReaderColumnId);
}
