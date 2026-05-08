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

import { type TreeModel } from "../../../../../models/index.js";
import { useTreeInternalContext } from "../../../context/tree-internal-context-provider.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context-provider.js";
import { UIStateSelector } from "../../../../../store/index.js";

import { type FlattenNodeRow } from "./types.js";
import { ContextMenuHooks } from "./hooks/context-menu-hooks.js";

export namespace ContextMenu {
	export interface Props {
		row: FlattenNodeRow;
		contextMenuModel: TreeModel.TreeNodeContextMenu;
		triggerElement?: React.ReactElement;
		paddedLeft?: boolean;
	}
}

/** @internal */
export const ContextMenu: React.ComponentType<ContextMenu.Props> = React.memo(function ContextMenu(props) {
	const disabled = useTreeEngineState(UIStateSelector.disabled());
	const closeContextMenuHandler = useTreeInternalContext((context) => context.closeContextMenuHandler);
	const closeHandler = React.useRef<(() => void) | null>(null);
	const setCloseHandler = React.useCallback((handler: NonNullable<() => void>) => (closeHandler.current = handler), []);

	const onVisibilityChange = React.useCallback(
		(isPopupVisible: boolean) => {
			closeContextMenuHandler.current = isPopupVisible ? closeHandler.current : null;
		},
		[closeContextMenuHandler]
	);

	const onTriggerElementClick = React.useCallback((event: React.MouseEvent) => event.stopPropagation(), []);

	const { menuItems, paddedLeft } = ContextMenuHooks.useItems({
		...props,
		groups: props.contextMenuModel.groups
	});

	const List = useTreeEngineContext((context) => context.widgetMap.List);
	const PopUpMenu = useTreeEngineContext((context) => context.widgetMap.PopUpMenu);

	if (menuItems.length === 0) {
		return null;
	}

	return (
		<PopUpMenu
			disabled={disabled}
			focusOnTriggerElementAfterClose
			onTriggerElementClick={onTriggerElementClick}
			close={setCloseHandler}
			onVisibilityChange={onVisibilityChange}
			triggerElement={props.triggerElement}>
			<List paddedLeft={paddedLeft}>{menuItems}</List>
		</PopUpMenu>
	);
});
