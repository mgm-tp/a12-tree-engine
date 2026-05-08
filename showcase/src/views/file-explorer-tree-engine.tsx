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
	DataSelector,
	UIStateSelector,
	type KeyboardShortcut,
	type RowActionStateGetter,
	TreeEngineFactories,
	TreeEngineSelectors
} from "@com.mgmtp.a12.treeengine/treeengine-core";

import { File } from "../model-editor/document.js";
import { engineShortcuts, nodeShortcuts } from "../utils.js";
import { SHOWCASE_RESOURCE_KEYS } from "../config/resources.js";
import {
	OPEN_DM_NODE_EVENT,
	OPEN_DM_NODE_NON_VIRTUAL_ROOT_EVENT,
	OPEN_DM_NODE_SELECT_PARENT,
	OPEN_DM_PAGINATED_NODE_EVENT,
	OPEN_DM_WITH_REPLACEMENT_NODE_EVENT,
	OPEN_DM_WITH_TEMPORARY_REPLACEMENT_NODE_EVENT,
	OPEN_FM_NODE_EVENT
} from "../helpers.js";
import { useShowcaseContext } from "../context.js";

namespace FileExplorerTreeEngine {
	export type Props = TreeEngineFactories.ViewComponentProps;
}

export const FileExplorerTreeEngine: React.FC<FileExplorerTreeEngine.Props> = (props) => {
	const activityId = props.activityId;
	const dataStateSelector = React.useMemo(() => TreeEngineSelectors.dataState(activityId), [activityId]);
	const dataState = useSelector(dataStateSelector);
	const enableDnd = useShowcaseContext((context) => (context.enableDnd ? undefined : false));

	const rowActionStateGetter: RowActionStateGetter = React.useCallback(
		({ row, action }) => {
			let hidden = false;
			if (!dataState || action.type !== "event") {
				return { hidden };
			}
			const node = DataSelector.node(row.data.nodeIdentifier)(dataState);
			if (!node?.document || !File.isInstance(node.document)) {
				hidden = false;
			} else if (node.document.File.FileType !== "document_model" && node.document.File.FileType !== "form_model") {
				hidden = [
					OPEN_DM_NODE_EVENT,
					OPEN_DM_PAGINATED_NODE_EVENT,
					OPEN_FM_NODE_EVENT,
					OPEN_DM_WITH_REPLACEMENT_NODE_EVENT,
					OPEN_DM_WITH_TEMPORARY_REPLACEMENT_NODE_EVENT,
					OPEN_DM_NODE_NON_VIRTUAL_ROOT_EVENT,
					OPEN_DM_NODE_SELECT_PARENT
				].includes(action.event);
			} else if (node.document.File.FileType === "document_model") {
				hidden = action.event === OPEN_FM_NODE_EVENT;
			} else if (node.document.File.FileType === "form_model") {
				hidden = [
					OPEN_DM_NODE_EVENT,
					OPEN_DM_WITH_REPLACEMENT_NODE_EVENT,
					OPEN_DM_WITH_TEMPORARY_REPLACEMENT_NODE_EVENT,
					OPEN_DM_NODE_NON_VIRTUAL_ROOT_EVENT,
					OPEN_DM_NODE_SELECT_PARENT
				].includes(action.event);
			}
			return { hidden };
		},
		[dataState]
	);

	const selectedNodesSelector = React.useMemo(() => {
		return (state: object) => {
			const uiState = TreeEngineSelectors.uiState(activityId)(state);

			return UIStateSelector.totalMultiSelectionNodeCount()(uiState).toString();
		};
	}, [activityId]);
	const selectedNodes = useSelector(selectedNodesSelector);

	const keyboardShortcuts: KeyboardShortcut[] = React.useMemo(() => {
		const [remainEngineShortcuts, pasteShortcut] = [
			engineShortcuts.slice(0, -1),
			engineShortcuts[engineShortcuts.length - 1]
		];

		return [
			...nodeShortcuts,
			...remainEngineShortcuts,
			{
				...pasteShortcut,
				stopIfUnavailable: () => ({
					key: SHOWCASE_RESOURCE_KEYS.showcase.keyboardShortcut.engineTarget.eventPaste.unavailable,
					args: { selectedNodes: { type: "plain", value: `${selectedNodes}` } }
				})
			}
		];
	}, [selectedNodes]);

	return (
		<TreeEngineFactories.ViewComponent
			{...props}
			rowActionStateGetter={rowActionStateGetter}
			keyboardShortcuts={keyboardShortcuts}
			dndConfiguration={enableDnd}
		/>
	);
};
