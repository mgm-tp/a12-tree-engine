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

import { TreeModel } from "../../../../../../models/index.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../../context/tree-engine-context-provider.js";
import { RESOURCE_KEYS, LocalizerHooks } from "../../../../../../services/localization/index.js";
import { UIStateSelector } from "../../../../../../store/index.js";
import { KeyboardShortcutUtils } from "../../../../configuration/keyboard-shortcut/utils.js";
import { KeyboardShortcut } from "../../../../configuration/keyboard-shortcut/types.js";
import { useBuiltinShortcut } from "../../../../configuration/keyboard-shortcut/hooks.js";

import { useMultiSelectionConfig } from "./utils.js";

export namespace MultiSelectionButton {
	export interface Props {}
}

/** @internal */
export const MultiSelectionButton: React.FC<MultiSelectionButton.Props> = React.memo(function MultiSelectionButton() {
	const expandedMultiSelectionPanel = useTreeEngineState(UIStateSelector.expandedMultiSelectionPanel());
	const disabled = useTreeEngineState(UIStateSelector.disabled());

	const Button = useTreeEngineContext((context) => context.widgetMap.Button);
	const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);

	const shortcut = useBuiltinShortcut(KeyboardShortcut.EngineBuiltinAction.TOGGLE_MULTI_SELECTION_PANEL);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	const title = React.useMemo(() => {
		const key = expandedMultiSelectionPanel ? "collapseTitle" : "expandTitle";

		return (
			localizedResource(RESOURCE_KEYS.treeEngine.multiSelection.multiSelectionButton[key]) +
			KeyboardShortcutUtils.toTitle(shortcut)
		);
	}, [expandedMultiSelectionPanel, localizedResource, shortcut]);

	const onClick = MultiSelectionButtonHooks.useMultiSelectionButtonHandler();
	if (!onClick) {
		return null;
	}

	return (
		<Button
			key="multi-selection-button"
			secondary
			icon={<Icon>library_add</Icon>}
			title={title}
			onClick={onClick}
			disabled={disabled}
		/>
	);
});

/** @internal */
export namespace MultiSelectionButtonHooks {
	export function useMultiSelectionButtonHandler() {
		const onMultiSelectionButtonClicked = useTreeEngineContext(
			(context) => context.eventHandlers.onMultiSelectionButtonClicked
		);
		const collapseOption = useMultiSelectionConfig()?.collapseOption;

		return React.useMemo(() => {
			if (
				collapseOption === TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED ||
				collapseOption === TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_COLLAPSED
			) {
				return onMultiSelectionButtonClicked;
			}

			return undefined;
		}, [collapseOption, onMultiSelectionButtonClicked]);
	}
}
