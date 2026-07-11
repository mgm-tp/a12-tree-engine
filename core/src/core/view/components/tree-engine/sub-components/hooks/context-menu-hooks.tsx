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

import type { TreeModel } from "../../../../../models/tree-model.js";
import { type TreeEngineRowContext, useTreeEngineRowContext } from "../../../../context/row-context.js";
import { TreeModelKeys } from "../../../../../services/localization/tree-model-keys.js";
import { LocalizerHooks } from "../../../../../services/localization/localizer-hooks.js";
import { useTreeEngineContext } from "../../../../context/tree-engine-context.js";

import { type FlattenNodeRow, RootNodeRow } from "../types.js";

import { RowActionGroupHooks, RowActionHooks } from "./row-action-hooks.js";

/** @internal */
export namespace ContextMenuHooks {
	export function useItems(params: {
		row: FlattenNodeRow;
		groups: (TreeModel.TreeNodeActionGroup | TreeModel.TreeNodeAddGroup)[];
		paddedLeft?: boolean;
	}) {
		const { row, groups } = params;

		const RowAction = useTreeEngineContext((context) => context.componentMap.RowAction);
		const ListSubheader = useTreeEngineContext((context) => context.widgetMap.ListSubheader);

		const visibleGroups = RowActionGroupHooks.useVisibilityFilter()(row, groups);
		const iconGetter = RowActionHooks.useIconGetter();
		const titleGetter = useTitleGetter(row);

		return React.useMemo(() => {
			const menuItems = visibleGroups.map((group, groupIndex) => {
				const title = titleGetter(group);

				return (
					<React.Fragment key={groupIndex}>
						{title && <ListSubheader fill>{title}</ListSubheader>}
						{group.actions.map((action, actionIndex) => {
							let divider = false;
							if (actionIndex === group.actions.length - 1 && groups[groupIndex + 1] && !groups[groupIndex + 1].title) {
								divider = true;
							}

							return (
								<RowAction displayAsPopupEntry key={actionIndex} row={row} rowActionModel={action} divider={divider} />
							);
						})}
					</React.Fragment>
				);
			});

			const paddedLeft =
				params.paddedLeft ??
				visibleGroups.some(({ actions }) => actions.some((rowActionModel) => iconGetter({ row, rowActionModel })));

			return { menuItems, paddedLeft };
		}, [ListSubheader, RowAction, groups, iconGetter, params.paddedLeft, row, titleGetter, visibleGroups]);
	}

	function useTitleGetter(row: FlattenNodeRow) {
		const nodeModelIdSelector = React.useCallback(
			(context: TreeEngineRowContext.Type) =>
				RootNodeRow.isAssignableFrom(row) ? undefined : context.rowState.nodeModel.id,
			[row]
		);
		const nodeModelId = useTreeEngineRowContext(nodeModelIdSelector);
		const baseGroupKey = React.useMemo(() => {
			const rowKeys = nodeModelId ? [TreeModelKeys.getNodesKey(), nodeModelId] : [TreeModelKeys.getVirtualRootKey()];

			return [...rowKeys, TreeModelKeys.getContextMenuKey(), TreeModelKeys.getActionGroupKey()];
		}, [nodeModelId]);

		const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();

		return React.useCallback(
			(group: TreeModel.TreeNodeActionGroup) =>
				localizedTreeElement([...baseGroupKey, group.name, TreeModelKeys.TITLE], group.title),
			[baseGroupKey, localizedTreeElement]
		);
	}
}
