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

import { useTreeEngineContext } from "../../../../context/tree-engine-context.js";
import { TreeModelKeys } from "../../../../../services/localization/tree-model-keys.js";

import { useMultiSelectionConfig } from "./utils.js";

export namespace MultiSelectionActions {
	export interface Props {}
}

const multiSelectionActionsKey = TreeModelKeys.getMultiSelectionActionsKey();

/** @internal */
export const MultiSelectionActions: React.FC<MultiSelectionActions.Props> = React.memo(
	function MultiSelectionActions() {
		const multiSelectionConfig = useMultiSelectionConfig();
		const ButtonGroup = useTreeEngineContext((context) => context.widgetMap.ButtonGroup);
		const Button = useTreeEngineContext((context) => context.componentMap.Button);

		if (!multiSelectionConfig?.buttons?.length) {
			return null;
		}

		return (
			<ButtonGroup>
				{multiSelectionConfig.buttons.map((button) => (
					<Button
						componentKeys={multiSelectionActionsKey}
						key={`multi-selection-button-${button.event}`}
						element={button}
					/>
				))}
			</ButtonGroup>
		);
	}
);
