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

import { type RuntimeTreeModel, TreeModel } from "../../../models/tree-model.js";
import type { TreeEngineState } from "../../../store/store.js";

type HierarchicalColumnConfiguration = Pick<TreeModel.Configuration, "hierarchicalColumnRef">;

/**
 * Whether the feature is enabled and a trigger is placed in a sub header slot.
 *
 * @internal
 */
export function isColumnVisibilityAvailable(uiModel: RuntimeTreeModel): boolean {
	const { configuration, subHeaderBox } = uiModel.content;

	return (
		!!configuration.enableUserDefinedColumnVisibility &&
		[...subHeaderBox.leftSlot, ...subHeaderBox.rightSlot].some(TreeModel.ColumnVisibilityElement.isAssignableFrom)
	);
}

/**
 * Whether the end user may hide this column.
 *
 * The hierarchical column cannot be hidden because it contains the tree navigation controls.
 *
 * @internal
 */
export function isHideableColumn(column: TreeModel.Column, configuration: HierarchicalColumnConfiguration): boolean {
	return column.id !== configuration.hierarchicalColumnRef;
}

/**
 * The visibility the Modeller configured.
 *
 * @internal
 */
export function isColumnVisibleByDefault(
	column: TreeModel.Column,
	configuration: HierarchicalColumnConfiguration
): boolean {
	if (!isHideableColumn(column, configuration)) {
		return true;
	}
	return column.initiallyHidden !== true;
}

/**
 * The visibility state a Tree Model starts out in: one entry per column, following `initiallyHidden`.
 */
export function getInitialColumnVisibility(uiModel: RuntimeTreeModel): TreeEngineState.ColumnVisibility {
	const { configuration, columns } = uiModel.content;

	return Object.fromEntries(columns.map((column) => [column.id, isColumnVisibleByDefault(column, configuration)]));
}

/**
 * The runtime override if one is set, otherwise the modelled default.
 *
 * @internal
 */
export function isColumnVisible(
	column: TreeModel.Column,
	configuration: HierarchicalColumnConfiguration,
	columnVisibility?: TreeEngineState.ColumnVisibility
): boolean {
	if (!isHideableColumn(column, configuration)) {
		return true;
	}
	return columnVisibility?.[column.id] ?? isColumnVisibleByDefault(column, configuration);
}

/**
 * Whether any column deviates from the modelled default, i.e. a reset would change something.
 *
 * @internal
 */
export function hasVisibilityDeviation(
	columns: ReadonlyArray<TreeModel.Column>,
	configuration: HierarchicalColumnConfiguration,
	columnVisibility?: TreeEngineState.ColumnVisibility
): boolean {
	return columns.some(
		(column) =>
			isColumnVisible(column, configuration, columnVisibility) !== isColumnVisibleByDefault(column, configuration)
	);
}
