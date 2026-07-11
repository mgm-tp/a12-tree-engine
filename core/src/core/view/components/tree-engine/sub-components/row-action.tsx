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

import type { TreeModel } from "../../../../models/tree-model.js";
import { ModelSelector } from "../../../../store/selectors/models.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";
import { useTreeEngineRowContext } from "../../../context/row-context.js";
import { KeyboardShortcutUtils } from "../../../configuration/keyboard-shortcut/utils.js";
import { useRowActionShortcut } from "../../../configuration/keyboard-shortcut/hooks.js";
import { useButtonA11YProps } from "../../../shared.js";

import { type FlattenNodeRow, RootNodeRow } from "./types.js";
import { RowActionHooks } from "./hooks/row-action-hooks.js";
import { toCellId, getScreenReaderColumnRef } from "./a11y-utils.js";

export namespace RowAction {
	export interface Props {
		row: FlattenNodeRow;
		icon?: React.ReactNode;
		displayAsPopupEntry?: boolean;
		rowActionModel: TreeModel.TreeNodeActionButton;
		divider?: boolean;
	}
}

/** @internal */
export const RowAction: React.ComponentType<RowAction.Props> = React.memo(function RowAction(props) {
	const { rowActionModel, displayAsPopupEntry, row, divider } = props;
	const Button = useTreeEngineContext((context) => context.widgetMap.Button);
	const ListItem = useTreeEngineContext((context) => context.widgetMap.ListItem);

	const rowActionHandler = RowActionHooks.useHandler(row);
	const onClick = React.useMemo(() => rowActionHandler(rowActionModel), [rowActionHandler, rowActionModel]);

	const isRootNode = React.useMemo(() => RootNodeRow.isAssignableFrom(row), [row]);
	const busy = useTreeEngineRowContext((_) => (isRootNode ? false : _.rowState.uiState.busy));
	const isCircular = useTreeEngineRowContext((_) => _.isCircular);
	const disabilityGetter = RowActionHooks.useDisabilityGetter(busy, isCircular);
	const disabled = React.useMemo(() => disabilityGetter(row, rowActionModel), [row, disabilityGetter, rowActionModel]);

	const readonlyGetter = RowActionHooks.useReadonlyGetter(isCircular);
	const readonly = React.useMemo(() => readonlyGetter(row, rowActionModel), [readonlyGetter, row, rowActionModel]);

	const { description, label: modelLabel } = RowActionHooks.useLocalizedText(props);
	const listItemTitle = React.useMemo(
		() => (!modelLabel && description ? description : undefined),
		[modelLabel, description]
	);

	const icon = RowActionHooks.useIconGetter()(props);
	const className = React.useMemo(() => rowActionModel.styles?.join(" ") ?? undefined, [rowActionModel.styles]);
	const shortcut = useRowActionShortcut(rowActionModel, isRootNode);

	const configuration = useTreeEngineState(ModelSelector.uiModel()).content.configuration;
	const screenReaderColumnRef = getScreenReaderColumnRef(configuration);
	const screenReaderCellId = React.useMemo(
		() => toCellId(row.id, screenReaderColumnRef),
		[row.id, screenReaderColumnRef]
	);
	const buttonId = React.useId();
	const ariaLabelledBy = React.useMemo(() => `${buttonId} ${screenReaderCellId}`, [buttonId, screenReaderCellId]);

	const { label, title, buttonAttributes } = useButtonA11YProps({
		modelLabel,
		description,
		labelHidden: rowActionModel.labelHidden,
		shortcut,
		ariaLabelledBy
	});

	return displayAsPopupEntry ? (
		<ListItem
			text={modelLabel}
			readonly={readonly}
			graphic={icon}
			onClick={onClick}
			className={className}
			disabled={disabled}
			divider={divider}
			meta={KeyboardShortcutUtils.toLabel(shortcut)}
			title={listItemTitle}
			ariaLabel={listItemTitle}
		/>
	) : (
		<Button
			id={buttonId}
			label={label}
			title={title}
			buttonAttributes={buttonAttributes}
			icon={icon}
			onClick={(event) => {
				event.stopPropagation();
				onClick();
			}}
			className={className}
			disabled={disabled || readonly}
			primary={rowActionModel.primary}
			destructive={rowActionModel.destructive}
			labelHidden={rowActionModel.labelHidden}
		/>
	);
});
