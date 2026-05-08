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

import { type TreeModel } from "../../../../models/index.js";
import { type FlattenNodeRow } from "../../components/tree-engine/sub-components/types.js";
import { useTreeEngineContext } from "../../context/tree-engine-context-provider.js";
import { RowCheckboxHandler } from "../../components/tree-engine/sub-components/row-checkbox.js";
import { useFlattenRowActions } from "../../components/tree-engine/sub-components/row-actions-group.js";
import { RowActionHooks } from "../../components/tree-engine/sub-components/hooks/row-action-hooks.js";
import { useTreeEngineRowContext } from "../../context/row-context.js";

import { KeyboardShortcut } from "./types.js";
import { type Controller } from "./hooks.js";
import { KeyboardShortcutUtils } from "./utils.js";

/** @internal */
export function useNodeBuiltinActionController(row: FlattenNodeRow): Controller {
	const onNodeExpansionChanged = useTreeEngineContext((_) => _.eventHandlers.onNodeExpansionChanged);
	const toggleMultiSelectionHandlerGetter = RowCheckboxHandler.useHandler();

	return React.useMemo(() => {
		return {
			getHandler(...targets) {
				const target = targets[0];
				if (!KeyboardShortcut.NodeBuiltinActionTarget.isAssignableFrom(target)) {
					return undefined;
				}
				const { action } = target;

				if (action === KeyboardShortcut.NodeBuiltinAction.TOGGLE_MULTI_SELECTION) {
					return toggleMultiSelectionHandlerGetter({ row }) ?? target;
				}
				if (action === KeyboardShortcut.NodeBuiltinAction.TOGGLE_EXPANSION) {
					return () => onNodeExpansionChanged(row.data);
				}

				return undefined;
			}
		};
	}, [toggleMultiSelectionHandlerGetter, row, onNodeExpansionChanged]);
}

/** @internal */
export function useNodeActionController(row: FlattenNodeRow): Controller {
	const availableRowActions = useRowActions(row);
	const unavailableRowActions = useRowActions(row, false);

	const rowActionHandler = RowActionHooks.useHandler(row);

	return React.useMemo(() => {
		const matcher = (target: KeyboardShortcut.Target, rowAction: TreeModel.TreeNodeActionButton) => {
			return (
				KeyboardShortcut.NodeEventActionTarget.isTargetFor(target, rowAction) ||
				KeyboardShortcut.NodeInsertActionTarget.isTargetFor(target, rowAction)
			);
		};
		return {
			getHandler(...targets) {
				const rowAction = KeyboardShortcutUtils.findMatchedAction(availableRowActions, targets, matcher)?.action;
				if (rowAction) {
					return rowActionHandler(rowAction);
				}

				return KeyboardShortcutUtils.findMatchedAction(unavailableRowActions, targets, matcher)?.target;
			}
		};
	}, [availableRowActions, rowActionHandler, unavailableRowActions]);
}

/** @internal */
export function useRowActions(row: FlattenNodeRow, isAvailable = true): TreeModel.TreeNodeActionButton[] {
	const busy = useTreeEngineRowContext((c) => c.rowState.uiState.busy);
	const isCircular = useTreeEngineRowContext((c) => c.isCircular);
	const nodeModel = useTreeEngineRowContext((c) => c.rowState.nodeModel);
	const disabilityGetter = RowActionHooks.useDisabilityGetter(busy, isCircular);
	const readonlyGetter = RowActionHooks.useReadonlyGetter(busy);
	const visibilityGetter = RowActionHooks.useVisibilityGetter();
	const rowActions = useFlattenRowActions(nodeModel);

	return React.useMemo(() => {
		return rowActions.filter((action) => {
			return (
				isAvailable ===
				(visibilityGetter(row, action) && !disabilityGetter(row, action) && !readonlyGetter(row, action))
			);
		});
	}, [rowActions, isAvailable, visibilityGetter, row, disabilityGetter, readonlyGetter]);
}
