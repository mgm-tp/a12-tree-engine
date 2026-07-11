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
import { ModelSelector } from "../../../../store/selectors/models.js";
import { TreeEngineState } from "../../../../store/store.js";
import { UIStateSelector } from "../../../../store/selectors/ui-state.js";
import { LocalizerHooks } from "../../../../services/localization/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../services/localization/languages/keys.js";
import { KeyboardShortcut } from "../../../configuration/keyboard-shortcut/types.js";
import { KeyboardShortcutUtils } from "../../../configuration/keyboard-shortcut/utils.js";
import { useBuiltinShortcut } from "../../../configuration/keyboard-shortcut/hooks.js";
import { useTreeEngineRowContext } from "../../../context/row-context.js";

import { toCellId, getScreenReaderColumnRef } from "./a11y-utils.js";
import type { FlattenNodeRow } from "./types.js";

export namespace RowCheckbox {
	export interface Props {
		readonly row: FlattenNodeRow;
		readonly disabled?: boolean;
		readonly readonly?: boolean;
	}
}

/** @internal */
export const RowCheckbox: React.FC<RowCheckbox.Props> = React.memo(function RowCheckbox(props) {
	const { row } = props;

	const engineDisabled = useTreeEngineState(UIStateSelector.disabled());
	const disabled = React.useMemo(() => engineDisabled || !!props.disabled, [engineDisabled, props.disabled]);
	const engineReadonly = useTreeEngineState(UIStateSelector.readonly());
	const readonly = React.useMemo(() => engineReadonly || !!props.readonly, [engineReadonly, props.readonly]);

	const rowCheckboxHandler = RowCheckboxHandler.useHandler();

	const onNodeRangeSelectionClicked = useTreeEngineContext(
		(context) => context.eventHandlers.onNodeRangeSelectionClicked
	);

	const onChange = React.useCallback(
		(_value: boolean, event: React.MouseEvent<Element, MouseEvent>) => {
			event.stopPropagation();

			if (event.shiftKey) {
				onNodeRangeSelectionClicked({ nodePath: row.data.nodePath });
			} else {
				rowCheckboxHandler({ row, disabled })?.();
			}
		},
		[disabled, onNodeRangeSelectionClicked, row, rowCheckboxHandler]
	);

	const multiSelection = useTreeEngineRowContext((context) => context.rowState.uiState.multiSelection);

	const checked = React.useMemo(() => {
		if (multiSelection === TreeEngineState.MultiSelectionState.SELECTED) {
			return true;
		}
		if (multiSelection === TreeEngineState.MultiSelectionState.PARTLY_SELECTED) {
			return "mixed";
		}
		return false;
	}, [multiSelection]);

	const shortcut = useBuiltinShortcut(KeyboardShortcut.NodeBuiltinAction.TOGGLE_MULTI_SELECTION);
	const localizedResource = LocalizerHooks.useLocalizedResource();

	const title = React.useMemo(() => {
		return (
			localizedResource(RESOURCE_KEYS.treeEngine.multiSelection.rowCheckboxTitle) +
			KeyboardShortcutUtils.toTitle(shortcut)
		);
	}, [shortcut, localizedResource]);

	const configuration = useTreeEngineState(ModelSelector.uiModel()).content.configuration;
	const screenReaderColumnRef = getScreenReaderColumnRef(configuration);
	const screenReaderCellId = React.useMemo(
		() => toCellId(row.id, screenReaderColumnRef),
		[row.id, screenReaderColumnRef]
	);
	const checkboxId = React.useId();
	const ariaLabelledBy = React.useMemo(() => `${checkboxId} ${screenReaderCellId}`, [checkboxId, screenReaderCellId]);

	const inputProps = React.useMemo(
		() => ({
			onClick: (event: React.MouseEvent<HTMLElement>) => event.stopPropagation(),
			"aria-labelledby": ariaLabelledBy
		}),
		[ariaLabelledBy]
	);

	const isCircularPath = useTreeEngineRowContext((context) => context.isCircular);
	const IndeterminateCheckbox = useTreeEngineContext((context) => context.widgetMap.IndeterminateCheckbox);

	if (isCircularPath) {
		return null;
	}

	return (
		<IndeterminateCheckbox
			id={checkboxId}
			disabled={disabled}
			readonly={readonly}
			title={title}
			checked={checked}
			onChange={onChange}
			inputProps={inputProps}
		/>
	);
});

/** @internal */
export namespace RowCheckboxHandler {
	export function useHandler() {
		const onNodeMultiSelectionClicked = useTreeEngineContext((_) => _.eventHandlers.onNodeMultiSelectionClicked);
		const expandedMultiSelectionPanel = useTreeEngineState(UIStateSelector.expandedMultiSelectionPanel());

		return React.useCallback(
			({ row }: RowCheckbox.Props) => {
				if (expandedMultiSelectionPanel) {
					return () => onNodeMultiSelectionClicked(row.data);
				}
				return undefined;
			},
			[expandedMultiSelectionPanel, onNodeMultiSelectionClicked]
		);
	}
}
