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

import { useTreeEngineRowContext } from "../../../context/row-context.js";
import { useTreeEngineContext } from "../../../context/tree-engine-context.js";
import type { TreeModel } from "../../../../models/tree-model.js";

import type { FlattenNodeRow } from "./types.js";
import { RowActionHooks } from "./hooks/row-action-hooks.js";

export namespace RowActionsGroup {
	export interface Props {
		readonly row: FlattenNodeRow;
	}
}

/** @internal */
export const RowActionsGroup: React.FC<RowActionsGroup.Props> = React.memo(function RowActionsGroup(props) {
	const actions = useTreeEngineRowContext((context) => context.rowState.nodeModel.actions);
	const contextMenuModel = useTreeEngineRowContext((context) => context.rowState.nodeModel.contextMenu);
	const { row } = props;

	const visibilityGetter = RowActionHooks.useVisibilityGetter();
	const visibleActions = React.useMemo(
		() => actions.filter((action) => visibilityGetter(row, action)),
		[actions, row, visibilityGetter]
	);

	return <BaseRowActionGroup row={row} actions={visibleActions} contextMenu={contextMenuModel} />;
});

/** @internal **/
export namespace BaseRowActionGroup {
	/** @internal */
	export interface Props extends RowActionsGroup.Props {
		actions?: TreeModel.TreeNodeActionButton[];
		contextMenu?: TreeModel.TreeNodeContextMenu;
	}
}

/** @internal */
export const BaseRowActionGroup: React.FC<BaseRowActionGroup.Props> = React.memo(function BaseRowActionGroup(props) {
	const ButtonGroup = useTreeEngineContext((context) => context.widgetMap.ButtonGroup);
	const RowAction = useTreeEngineContext((context) => context.componentMap.RowAction);
	const ContextMenu = useTreeEngineContext((context) => context.componentMap.ContextMenu);

	const { row, actions, contextMenu } = props;

	if (!actions?.length && !contextMenu) {
		return null;
	}

	return (
		<ButtonGroup alignment="right">
			{actions?.map((action, index) => (
				<RowAction key={index} rowActionModel={action} row={row} />
			))}
			{contextMenu && <ContextMenu row={row} contextMenuModel={contextMenu} />}
		</ButtonGroup>
	);
});

/** @internal */
export function useFlattenRowActions(
	params: Partial<Pick<TreeModel.TreeNode, "actions" | "contextMenu">> | undefined
): TreeModel.TreeNodeActionButton[] {
	return React.useMemo(
		() => [params?.actions ?? [], params?.contextMenu?.groups.map(({ actions }) => actions) ?? []].flat(2),
		[params?.actions, params?.contextMenu?.groups]
	);
}
