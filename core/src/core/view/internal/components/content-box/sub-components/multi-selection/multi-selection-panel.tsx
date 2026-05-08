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

import { useTreeEngineContext, useTreeEngineState } from "../../../../context/tree-engine-context-provider.js";
import { UIStateSelector } from "../../../../../../store/index.js";
import { TreeModel } from "../../../../../../models/index.js";

import { useMultiSelectionConfig } from "./utils.js";

export namespace MultiSelectionPanel {
	export interface Props {}
}

/** @internal */
export const MultiSelectionPanel: React.FC<MultiSelectionPanel.Props> = React.memo(function MultiSelectionPanel() {
	const MultiSelectionButton = useTreeEngineContext((context) => context.componentMap.MultiSelectionButton);
	const MultiSelectionCounter = useTreeEngineContext((context) => context.componentMap.MultiSelectionCounter);
	const MultiSelectionActions = useTreeEngineContext((context) => context.componentMap.MultiSelectionActions);
	const ActionBarGroup = useTreeEngineContext((context) => context.widgetMap.ActionBarGroup);
	const ActionBarGroupDivider = useTreeEngineContext((context) => context.widgetMap.ActionBarGroupDivider);

	const multiSelectionConfig = useMultiSelectionConfig();
	const hiddenGroupDivider = React.useMemo(
		() =>
			(multiSelectionConfig?.collapseOption === TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE &&
				multiSelectionConfig?.counterOption === TreeModel.MultiSelectionConfiguration.CounterOption.NONE) ||
			!multiSelectionConfig?.buttons?.length,
		[multiSelectionConfig?.buttons?.length, multiSelectionConfig?.collapseOption, multiSelectionConfig?.counterOption]
	);

	const expandedMultiSelectionPanel = useTreeEngineState(UIStateSelector.expandedMultiSelectionPanel());
	if (!expandedMultiSelectionPanel) {
		return <MultiSelectionButton />;
	}

	return (
		<ActionBarGroup role="toolbar">
			<MultiSelectionButton />
			<MultiSelectionCounter />
			{!hiddenGroupDivider && <ActionBarGroupDivider />}
			<MultiSelectionActions />
		</ActionBarGroup>
	);
});
