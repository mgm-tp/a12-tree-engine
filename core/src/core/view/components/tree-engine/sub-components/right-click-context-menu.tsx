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

import type { TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core";

import { useTreeInternalContext } from "../../../context/tree-internal-context-provider.js";
import { useTreeEngineContext } from "../../../context/tree-engine-context.js";

import type { FlattenNodeRow } from "./types.js";
import { ContextMenuHooks } from "./hooks/context-menu-hooks.js";
import { RowActionGroupHooks } from "./hooks/row-action-hooks.js";

export namespace RightClickContextMenu {
	export interface Props extends TableRenderPropsType.ContextMenuProps<FlattenNodeRow> {
		readonly paddedLeft?: boolean;
	}
}

/** @internal */
export const RightClickContextMenu: React.FC<RightClickContextMenu.Props> = React.memo(
	function RightClickContextMenu(props) {
		const { row, closeHandler } = props;

		const groups = RowActionGroupHooks.useRightClickGroupsGetter()(row);
		const { menuItems, paddedLeft } = ContextMenuHooks.useItems({ ...props, groups });

		const List = useTreeEngineContext((context) => context.widgetMap.List);
		const closeContextMenuHandler = useTreeInternalContext((context) => context.closeContextMenuHandler);

		// Register the callback so the successful shortcut action still can close this menu, like in A12TE-521
		React.useEffect(() => {
			closeContextMenuHandler.current = closeHandler;

			return () => {
				closeContextMenuHandler.current = null;
			};
		}, [closeContextMenuHandler, closeHandler]);

		return (
			<List border paddedLeft={paddedLeft}>
				{menuItems}
			</List>
		);
	}
);
