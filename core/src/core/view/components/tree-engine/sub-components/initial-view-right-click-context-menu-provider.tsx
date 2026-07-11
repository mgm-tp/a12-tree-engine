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
import { VALUE_ESCAPE } from "keycode-js";

import {
	addPrefix,
	AttachedPortal,
	type AttachedPortalProps,
	type Container
} from "@com.mgmtp.a12.widgets/widgets-core";

import { useTreeEngineContext } from "../../../context/tree-engine-context.js";

import { ContextMenuHooks } from "./hooks/context-menu-hooks.js";
import { useInitialViewContextMenuModel, useLocalizationText } from "./initial-view-hooks.js";
import { RootNodeRow } from "./types.js";

/** @internal */
export const InitialViewRightClickContextMenuProvider: React.FC<Container> = React.memo(
	function InitialViewRightClickContextMenuProvider(props) {
		const [contextMenuPosition, setContextMenuPosition] = React.useState<AttachedPortalProps["position"]>();
		const [contextMenuOpen, setContextMenuOpen] = React.useState(false);

		const onContextMenu = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
			event.preventDefault();
			const { clientX, clientY } = event;
			setContextMenuPosition({ top: clientY, left: clientX });
			setContextMenuOpen(true);
		}, []);

		const closeContextMenuPortal = React.useCallback(() => setContextMenuOpen(false), []);

		const onKeyDown = React.useCallback(
			(event: React.KeyboardEvent) => {
				if (event.key === VALUE_ESCAPE) {
					closeContextMenuPortal();
				}
			},
			[closeContextMenuPortal]
		);

		const { addButtonLabel } = useLocalizationText();

		const contextMenuModel = useInitialViewContextMenuModel();
		const { menuItems, paddedLeft } = ContextMenuHooks.useItems({
			row: RootNodeRow.create(),
			groups: contextMenuModel?.groups ?? []
		});

		const List = useTreeEngineContext((context) => context.widgetMap.List);
		const ListSubheader = useTreeEngineContext((context) => context.widgetMap.ListSubheader);

		return (
			<div onContextMenu={onContextMenu} className={addPrefix("-u-height-full")}>
				{props.children}
				{contextMenuOpen && (
					<AttachedPortal
						position={contextMenuPosition}
						fixedOrientation={false}
						adjustPositionToScreen
						onClickOutside={closeContextMenuPortal}
						onClick={closeContextMenuPortal}
						onKeyDown={onKeyDown}
						className={addPrefix("-u-margin-3xs")}>
						<List paddedLeft={paddedLeft} border style={{ outlineStyle: "none" }}>
							{addButtonLabel && <ListSubheader fill>{addButtonLabel}</ListSubheader>}
							{menuItems}
						</List>
					</AttachedPortal>
				)}
			</div>
		);
	}
);
