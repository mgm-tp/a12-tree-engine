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

import { type FlattenNodeRow, RootNodeRow } from "./types.js";
import { InitialViewRightClickContextMenuProvider } from "./initial-view-right-click-context-menu-provider.js";
import { useInitialViewContextMenuModel, useLocalizationText } from "./initial-view-hooks.js";

export namespace Body {
	export type Props = TreeTableRenderPropsType.BodyProps<FlattenNodeRow>;
}

/** @internal */
export const Body: React.FC<Body.Props> = React.memo(function Body(props) {
	const { data } = props;
	const busy = useTreeEngineContext((context) => context.busy);
	const virtualRoot = useTreeEngineState((state) => state.models.uiModel.content.configuration.virtualRoot);
	const InitialViewBody = useTreeEngineContext((context) => context.componentMap.InitialViewBody);

	if (virtualRoot && data.length === 1) {
		if (busy) {
			return null;
		}

		return (
			<InitialViewRightClickContextMenuProvider>
				<InitialViewBody />
			</InitialViewRightClickContextMenuProvider>
		);
	}

	return <>{DefaultTreeTableComponentRenderers.bodyRenderer(props)}</>;
}, arePropsWithDataEqual);

export namespace InitialViewBody {
	export interface Props {}
}

/** @internal */
export const InitialViewBody: React.FC<InitialViewBody.Props> = React.memo(function InitialViewBody() {
	const ContextMenu = useTreeEngineContext((context) => context.componentMap.ContextMenu);
	const Message = useTreeEngineContext((context) => context.widgetMap.Message);
	const Button = useTreeEngineContext((context) => context.widgetMap.Button);
	const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);

	const contextMenuModel = useInitialViewContextMenuModel();
	const { message, addButtonLabel } = useLocalizationText();

	if (!contextMenuModel) {
		return null;
	}

	return (
		<Message className={addPrefix("-u-height-full -u-flex -u-flex-col -u-items-center")}>
			{message}
			<ContextMenu
				contextMenuModel={contextMenuModel}
				row={RootNodeRow.create()}
				triggerElement={<Button label={addButtonLabel} icon={<Icon>add</Icon>} />}
			/>
		</Message>
	);
});

/** @internal */
