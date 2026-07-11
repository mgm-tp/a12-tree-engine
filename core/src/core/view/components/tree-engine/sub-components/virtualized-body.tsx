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

import {
	DefaultTreeTableComponentRenderers,
	type TreeTableRenderPropsType,
	addPrefix
} from "@com.mgmtp.a12.widgets/widgets-core";

import { arePropsWithDataEqual } from "../../../configuration/are-props-with-data-equal.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";

import type { FlattenNodeRow } from "./types.js";
import { InitialViewRightClickContextMenuProvider } from "./initial-view-right-click-context-menu-provider.js";

export namespace VirtualizedBody {
	export type Props = TreeTableRenderPropsType.VirtualizedBodyProps<FlattenNodeRow>;
}

/** @internal */
export const VirtualizedBody: React.FC<VirtualizedBody.Props> = React.memo(function VirtualizedBody(props) {
	const busy = useTreeEngineContext((context) => context.busy);
	const virtualRoot = useTreeEngineState((state) => state.models.uiModel.content.configuration.virtualRoot);
	const InitialViewBody = useTreeEngineContext((context) => context.componentMap.InitialViewBody);

	if (virtualRoot && props.data.length === 1) {
		if (busy) {
			// return this instead of null to prevent horizontal scroll-bar display on top of body
			return <div className={addPrefix("-u-height-full")} />;
		}

		return (
			<InitialViewRightClickContextMenuProvider>
				<InitialViewBody />
			</InitialViewRightClickContextMenuProvider>
		);
	}

	return <>{DefaultTreeTableComponentRenderers.virtualizedBodyRenderer(props)}</>;
}, arePropsWithDataEqual);
