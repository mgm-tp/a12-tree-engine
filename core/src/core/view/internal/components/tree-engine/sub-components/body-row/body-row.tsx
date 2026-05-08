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
import { shallowEqual } from "react-redux";

import { type TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/table-renderer.api.js";
import { DefaultTreeTableComponentRenderers } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.view.js";

import { LocalizableFactory, RESOURCE_KEYS } from "../../../../../../services/localization/index.js";
import { DataSelector, UIStateSelector } from "../../../../../../store/index.js";
import { KeyboardShortcut } from "../../../../configuration/keyboard-shortcut/index.js";
import { useKeyDown } from "../../../../configuration/keyboard-shortcut/hooks.js";
import {
	useNodeActionController,
	useNodeBuiltinActionController
} from "../../../../configuration/keyboard-shortcut/node-controllers.js";
import { TreeEngineRowContextProvider, useTreeEngineRowContextProvider } from "../../../../context/row-context.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../../context/tree-engine-context-provider.js";

import { type FlattenNodeRow } from "../types.js";

export namespace BodyRow {
	export type Props = TableRenderPropsType.BodyRowProps<FlattenNodeRow>;
}

/** @internal */
export const BodyRow: React.FC<BodyRow.Props> = React.memo(function BodyRow(props) {
	const readonly = useTreeEngineState(UIStateSelector.readonly());
	const disableDnd = useTreeEngineContext((context) => context.disableDnd);
	/**
	 * The {@link TreeEngineRowContextProvider} will be initialized by DndBodyRow.
	 * This is the fallback in case of dnd is disabled.
	 */
	if (disableDnd || readonly) {
		return <BodyRowContextProvider {...props} />;
	}
	return <BodyRowContent {...props} />;
});

const BodyRowContextProvider: React.FC<BodyRow.Props> = React.memo(function BodyRowContextProvider(props) {
	const rowContext = useTreeEngineRowContextProvider(props.row);

	if (!rowContext) {
		return null;
	}

	return (
		<TreeEngineRowContextProvider value={rowContext} key={props.row.id}>
			<BodyRowContent {...props} />
		</TreeEngineRowContextProvider>
	);
});

const BodyRowContent: React.FC<BodyRow.Props> = React.memo(
	function BodyRowContent(props) {
		const { row } = props;

		const disabled = useTreeEngineState(UIStateSelector.disabled());
		const readonly = useTreeEngineState(UIStateSelector.readonly());

		const node = useTreeEngineState(DataSelector.node(row.data.nodeIdentifier));
		const link = useTreeEngineState(DataSelector.link(row.data.nodeIdentifier));

		const nodeActionController = useNodeActionController(row);
		const nodeBuiltinActionController = useNodeBuiltinActionController(row);

		const controllers = React.useMemo(
			() => [nodeActionController, nodeBuiltinActionController],
			[nodeActionController, nodeBuiltinActionController]
		);

		const rowData = React.useMemo(() => ({ node, link }), [node, link]);

		const defaultUnavailableNodeShortcutMessage = React.useMemo(() => {
			return LocalizableFactory.createResourceLocalizable(
				RESOURCE_KEYS.treeEngine.notification.message.unavailableNodeShortcut
			);
		}, []);

		const onKeyDown = useKeyDown({
			targetPredicate: KeyboardShortcut.NodeTarget.isAssignableFrom,
			controllers,
			row: rowData,
			defaultMessage: defaultUnavailableNodeShortcutMessage
		});

		return (
			<>
				{DefaultTreeTableComponentRenderers.bodyRowRenderer({
					...props,
					interactive: !readonly,
					disabled,
					onKeyDown,
					rowIndex: row.rowIndex ?? 0
				})}
			</>
		);
	},
	(propsA, propsB) => {
		const { style: styleA, ...restA } = propsA;
		const { style: styleB, ...restB } = propsB;
		return shallowEqual(restA, restB) && shallowEqual(styleA, styleB);
	}
);
