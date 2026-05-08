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

import { useTreeEngineState } from "../../../context/tree-engine-context-provider.js";

import { BaseRowActionGroup } from "./row-actions-group.js";
import { type RootNodeRow } from "./types.js";

export namespace VirtualRootRowActionsGroup {
	export interface Props {
		readonly row: RootNodeRow;
	}
}

/** @internal */
export const VirtualRootRowActionsGroup: React.FC<VirtualRootRowActionsGroup.Props> = React.memo(
	function VirtualRootRowActionsGroup(props) {
		const { actions, contextMenu } =
			useTreeEngineState((state) => state.models.uiModel.content.configuration.virtualRoot) ?? {};

		return <BaseRowActionGroup row={props.row} actions={actions} contextMenu={contextMenu} />;
	}
);
