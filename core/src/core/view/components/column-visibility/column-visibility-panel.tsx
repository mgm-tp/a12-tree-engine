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

import type {
	ColumnVisibilityChange,
	ColumnVisibilityItem,
	ColumnVisibilityMap,
	ColumnVisibilityPanelProps as WidgetsColumnVisibilityPanelProps
} from "@com.mgmtp.a12.widgets/widgets-core";

import { RESOURCE_KEYS } from "../../../services/localization/languages/keys.js";
import { LocalizerHooks } from "../../../services/localization/localizer-hooks.js";
import { TreeModelKeys } from "../../../services/localization/tree-model-keys.js";
import { ModelSelector } from "../../../store/selectors/models.js";
import { UIStateSelector } from "../../../store/selectors/ui-state.js";
import { useTreeEngineContext, useTreeEngineState } from "../../context/tree-engine-context.js";

import {
	getInitialColumnVisibility,
	isColumnVisible,
	isColumnVisibleByDefault,
	isHideableColumn
} from "./column-visibility.js";

const t = RESOURCE_KEYS.treeEngine.columnVisibility;

export namespace ColumnVisibilityPanel {
	export interface Props {
		/** The element the panel attaches to and returns the focus to, i.e. the trigger button. */
		readonly triggerElement: NonNullable<WidgetsColumnVisibilityPanelProps["triggerElement"]>;

		readonly onClose: NonNullable<WidgetsColumnVisibilityPanelProps["onClose"]>;
	}
}

/** Panel that lists the Tree Model's columns and toggles their visibility. */
export const ColumnVisibilityPanel: React.FC<ColumnVisibilityPanel.Props> = React.memo(function ColumnVisibilityPanel({
	triggerElement,
	onClose
}) {
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const columnVisibility = useTreeEngineState(UIStateSelector.columnVisibility());
	const disabled = useTreeEngineState(UIStateSelector.disabled());
	const onColumnVisibilityChanged = useTreeEngineContext((context) => context.eventHandlers.onColumnVisibilityChanged);
	const smallView = useTreeEngineContext((context) => !!context.smallView);

	const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);
	const WidgetsColumnVisibilityPanel = useTreeEngineContext((context) => context.widgetMap.ColumnVisibilityPanel);

	const localizedResource = LocalizerHooks.useLocalizedResource();
	const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();

	const { configuration, columns } = uiModel.content;

	const items = React.useMemo<ColumnVisibilityItem[]>(
		() =>
			// The hierarchical column carries the tree navigation controls, so it is not offered.
			columns
				.filter((column) => isHideableColumn(column, configuration))
				.map((column) => {
					const label = localizedTreeElement([TreeModelKeys.getColumnsKey(), column.id], column.label);

					return {
						id: column.id,
						label: label || undefined,
						icon: column.icon ? <Icon iconTheme={column.icon.theme}>{column.icon.name}</Icon> : undefined,
						visible: isColumnVisible(column, configuration, columnVisibility),
						defaultVisible: isColumnVisibleByDefault(column, configuration)
					};
				}),
		[Icon, columnVisibility, columns, configuration, localizedTreeElement]
	);

	const handleVisibilityChange = React.useCallback(
		(_visibility: ColumnVisibilityMap, change?: ColumnVisibilityChange) =>
			onColumnVisibilityChanged?.({
				columnVisibility: change
					? { ...columnVisibility, [change.id]: change.visible }
					: getInitialColumnVisibility(uiModel)
			}),
		[columnVisibility, onColumnVisibilityChanged, uiModel]
	);

	return (
		<WidgetsColumnVisibilityPanel
			items={items}
			open
			triggerElement={triggerElement}
			presentation={smallView ? "modal" : "attached"}
			disabled={disabled}
			title={localizedResource(t.title)}
			resetLabel={localizedResource(t.reset)}
			closeButtonTitle={localizedResource(t.closeButtonTitle)}
			onVisibilityChange={handleVisibilityChange}
			onClose={onClose}
			closeOnTabOut={true}
		/>
	);
});
