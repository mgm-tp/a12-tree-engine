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

import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";
import { TreeEngineState } from "../../../../store/store.js";
import { UIStateSelector } from "../../../../store/selectors/ui-state.js";
import { RESOURCE_KEYS } from "../../../../services/localization/languages/keys.js";
import { LocalizerHooks } from "../../../../services/localization/localizer-hooks.js";
import { KeyboardShortcut } from "../../../configuration/keyboard-shortcut/types.js";
import { KeyboardShortcutUtils } from "../../../configuration/keyboard-shortcut/utils.js";
import { useBuiltinShortcut } from "../../../configuration/keyboard-shortcut/hooks.js";

export namespace OverallCheckbox {
	export interface Props {}
}

/** @internal */
export const OverallCheckbox: React.FC<OverallCheckbox.Props> = React.memo(function OverallCheckbox() {
	const disabled = useTreeEngineState(UIStateSelector.disabled());
	const readonly = useTreeEngineState(UIStateSelector.readonly());
	const overallMultiSelection = useTreeEngineState(UIStateSelector.overallMultiSelection());
	const checked = React.useMemo(() => {
		if (overallMultiSelection === TreeEngineState.MultiSelectionState.SELECTED) {
			return true;
		}
		if (overallMultiSelection === TreeEngineState.MultiSelectionState.DESELECTED) {
			return false;
		}
		return "mixed";
	}, [overallMultiSelection]);

	const shortcut = useBuiltinShortcut(KeyboardShortcut.EngineBuiltinAction.TOGGLE_OVERALL_MULTI_SELECTION);
	const localizedResource = LocalizerHooks.useLocalizedResource();

	const title = React.useMemo(
		() =>
			localizedResource(RESOURCE_KEYS.treeEngine.multiSelection.overallCheckboxTitle) +
			KeyboardShortcutUtils.toTitle(shortcut),
		[localizedResource, shortcut]
	);

	const overallCheckboxHandler = OverallCheckboxHooks.useOverallCheckboxHandler();
	const onChange = React.useCallback(() => overallCheckboxHandler?.(), [overallCheckboxHandler]);
	const IndeterminateCheckbox = useTreeEngineContext((context) => context.widgetMap.IndeterminateCheckbox);

	return (
		<IndeterminateCheckbox
			checked={checked}
			title={title}
			onChange={onChange}
			disabled={disabled}
			readonly={readonly}
		/>
	);
});

/** @internal */
export namespace OverallCheckboxHooks {
	export function useOverallCheckboxHandler() {
		const expandedMultiSelectionPanel = useTreeEngineState(UIStateSelector.expandedMultiSelectionPanel());
		const onOverallMultiSelectionClicked = useTreeEngineContext((_) => _.eventHandlers.onOverallMultiSelectionClicked);

		return React.useMemo(() => {
			return expandedMultiSelectionPanel ? onOverallMultiSelectionClicked : undefined;
		}, [expandedMultiSelectionPanel, onOverallMultiSelectionClicked]);
	}
}
