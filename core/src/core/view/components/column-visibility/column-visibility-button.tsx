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

import { RESOURCE_KEYS } from "../../../services/localization/languages/keys.js";
import { LocalizerHooks } from "../../../services/localization/localizer-hooks.js";
import { ModelSelector } from "../../../store/selectors/models.js";
import { UIStateSelector } from "../../../store/selectors/ui-state.js";
import { useTreeEngineContext, useTreeEngineState } from "../../context/tree-engine-context.js";

import { hasVisibilityDeviation, isHideableColumn } from "./column-visibility.js";

const t = RESOURCE_KEYS.treeEngine.columnVisibility;

export namespace ColumnVisibilityButton {
	export interface Props {}
}

/**
 * Sub-header trigger that opens the column visibility panel. The panel itself decides whether it is
 * attached to this button or presented as a modal.
 */
export const ColumnVisibilityButton: React.FC<ColumnVisibilityButton.Props> = React.memo(
	function ColumnVisibilityButton() {
		const Button = useTreeEngineContext((context) => context.widgetMap.Button);
		const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);
		const Badge = useTreeEngineContext((context) => context.widgetMap.Badge);
		const ColumnVisibilityPanel = useTreeEngineContext((context) => context.componentMap.ColumnVisibilityPanel);

		const disabled = useTreeEngineState(UIStateSelector.disabled());
		const uiModel = useTreeEngineState(ModelSelector.uiModel());
		const columnVisibility = useTreeEngineState(UIStateSelector.columnVisibility());

		const localizedResource = LocalizerHooks.useLocalizedResource();
		const buttonRef = React.useRef<HTMLButtonElement | null>(null);
		const [open, setOpen] = React.useState(false);

		const { configuration, columns } = uiModel.content;
		const hideableColumns = React.useMemo(
			() => columns.filter((column) => isHideableColumn(column, configuration)),
			[columns, configuration]
		);
		const customized = hasVisibilityDeviation(columns, configuration, columnVisibility);
		const title = localizedResource(open ? t.closeColumnVisibility : t.openColumnVisibility);

		const handleButtonRef = React.useCallback((element: HTMLButtonElement | null) => {
			buttonRef.current = element;
		}, []);

		const onClick = React.useCallback(() => setOpen((wasOpen) => !wasOpen), []);

		const onClose = React.useCallback(() => setOpen(false), []);

		// A tree whose only column is the hierarchical one has nothing to offer, so the trigger
		// would open an empty panel.
		if (hideableColumns.length === 0) {
			return null;
		}

		return (
			<React.Fragment>
				<Button
					buttonRef={handleButtonRef}
					onClick={onClick}
					icon={<Icon>view_column</Icon>}
					title={title}
					badge={<Badge tiny light hidden={open || !customized} title={localizedResource(t.customizedBadgeTitle)} />}
					disabled={disabled}
					buttonAttributes={{ "aria-expanded": open, "aria-haspopup": "dialog" }}
				/>
				{open && <ColumnVisibilityPanel triggerElement={buttonRef} onClose={onClose} />}
			</React.Fragment>
		);
	}
);
