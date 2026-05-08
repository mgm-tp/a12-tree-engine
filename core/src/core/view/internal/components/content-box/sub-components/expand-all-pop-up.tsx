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

import { type ButtonProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/main/button.api.js";

import { RESOURCE_KEYS, LocalizerHooks } from "../../../../../services/localization/index.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context-provider.js";
import { KeyboardShortcutUtils } from "../../../configuration/keyboard-shortcut/utils.js";
import { KeyboardShortcut } from "../../../configuration/keyboard-shortcut/types.js";
import { useBuiltinShortcut } from "../../../configuration/keyboard-shortcut/hooks.js";
import { UIStateSelector } from "../../../../../store/index.js";

export namespace ExpandAllPopUp {
	export interface Props {}
}

/** @internal */
export const ExpandAllPopUp: React.FC<ExpandAllPopUp.Props> = () => {
	const [isOpen, setIsOpen] = React.useState(false);

	const disabled = useTreeEngineState(UIStateSelector.disabled());

	const expandShortcut = useBuiltinShortcut(KeyboardShortcut.EngineBuiltinAction.EXPAND_WHOLE_TREE);
	const collapseShortcut = useBuiltinShortcut(KeyboardShortcut.EngineBuiltinAction.COLLAPSE_WHOLE_TREE);
	const expandProps = ExpandAllPopUpHooks.useExpandAllButtonProps("expand");
	const collapseProps = ExpandAllPopUpHooks.useExpandAllButtonProps("collapse");

	const PopUpMenu = useTreeEngineContext((context) => context.widgetMap.PopUpMenu);
	const List = useTreeEngineContext((context) => context.widgetMap.List);
	const ListItem = useTreeEngineContext((context) => context.widgetMap.ListItem);
	const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);

	return (
		<PopUpMenu icon={<Icon>{isOpen ? "clear" : "menu"}</Icon>} onVisibilityChange={setIsOpen} disabled={disabled}>
			<List>
				<ListItem
					{...expandProps}
					text={expandProps.label}
					graphic={expandProps.icon}
					meta={KeyboardShortcutUtils.toLabel(expandShortcut)}
				/>
				<ListItem
					{...collapseProps}
					text={collapseProps.label}
					graphic={collapseProps.icon}
					meta={KeyboardShortcutUtils.toLabel(collapseShortcut)}
				/>
			</List>
		</PopUpMenu>
	);
};

interface ExpandAllButtonProps extends Pick<ButtonProps, "label" | "onClick" | "icon"> {
	key: string;
}

/** @internal */
export namespace ExpandAllPopUpHooks {
	export function useExpandAllButtonProps(type: "expand" | "collapse"): ExpandAllButtonProps {
		const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);
		const localizedResource = LocalizerHooks.useLocalizedResource();
		const onClick = useWholeTreeExpansionHandler(type);

		return React.useMemo(() => {
			if (type === "expand") {
				return {
					key: type,
					label: localizedResource(RESOURCE_KEYS.treeEngine.wholeTreeExpansion.expandAll),
					icon: <Icon>unfold_more</Icon>,
					onClick
				};
			} else {
				return {
					key: type,
					label: localizedResource(RESOURCE_KEYS.treeEngine.wholeTreeExpansion.collapseAll),
					icon: <Icon>unfold_less</Icon>,
					onClick
				};
			}
		}, [type, localizedResource, Icon, onClick]);
	}

	export function useWholeTreeExpansionHandler(type: "expand" | "collapse") {
		const { wholeTreeExpansion } = useTreeEngineState((state) => state.models.uiModel.content.configuration);
		const onEventButtonClicked = useTreeEngineContext((context) => context.eventHandlers.onEventButtonClicked);
		const event = `event_${type}_whole_tree`;

		return React.useMemo(() => {
			if (wholeTreeExpansion) {
				return () => onEventButtonClicked({ button: { event, id: event } });
			}
			return undefined;
		}, [event, onEventButtonClicked, wholeTreeExpansion]);
	}
}
