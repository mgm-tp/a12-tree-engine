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
import { useSelector } from "react-redux";

import {
	TreeEngineFactories,
	type RowActionStateGetter,
	type RowStyleGetter
} from "@com.mgmtp.a12.treeengine/treeengine-core";
import { ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { useShowcaseContext } from "../context.js";
import { OPEN_DM_NODE_EVENT_TWIN } from "../helpers.js";

namespace CustomTreeEngine {
	export type Props = TreeEngineFactories.ViewComponentProps;
}

export const CustomTreeEngine: React.FC<CustomTreeEngine.Props> = (props) => {
	const activityId = props.activityId;
	const modelDescriptor = useSelector(ActivitySelectors.activityPropById(activityId, (a) => a.descriptor.model));
	const dndConfiguration = useShowcaseContext((context) => (context.enableDnd ? undefined : false));

	const rowActionStateGetter: RowActionStateGetter = React.useCallback(
		({ row, action }) => {
			if (action.type !== "event") {
				return {};
			}

			let hidden = false;
			if (modelDescriptor === "groups-tree-twin" && row.data.nodeIdentifier.type === "DomainField") {
				hidden = OPEN_DM_NODE_EVENT_TWIN === action.event;
			}

			return { hidden };
		},
		[modelDescriptor]
	);

	const rowStyleGetter: RowStyleGetter = React.useCallback(({ row }) => {
		if (row.data.nodeIdentifier.type === "DomainField" && row.rowIndex === 10) {
			return {
				disabled: true,
				interactive: false
			};
		}
		return { disabled: false, interactive: true };
	}, []);

	return (
		<TreeEngineFactories.ViewComponent
			{...props}
			dndConfiguration={dndConfiguration}
			rowActionStateGetter={rowActionStateGetter}
			rowStyling={rowStyleGetter}
		/>
	);
};
