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

import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";

import type { TreeModel } from "../../../models/tree-model.js";
import type { TreeEngineState } from "../../../store/store.js";
import { UIStateSelector } from "../../../store/selectors/ui-state.js";
import { useTreeInternalContext } from "../../context/tree-internal-context-provider.js";
import {
	useTreeEngineContext,
	useTreeEngineContextRef,
	useTreeEngineState
} from "../../context/tree-engine-context.js";

import { useRefValue } from "../use-ref-value.js";

import { KeyboardShortcut } from "./types.js";
import { KeyboardShortcutUtils } from "./utils.js";

/** @internal */
export function useKeyDown<Target extends KeyboardShortcut.Target>(params: {
	targetPredicate: (obj: unknown) => obj is Target;
	controllers: Controller[];
	defaultMessage: Localizable;
	row?: { node?: TreeEngineState.Node; link?: TreeEngineState.Link };
}): React.KeyboardEventHandler<HTMLElement> | undefined {
	const controllersRef = useRefValue(params.controllers);
	const { targetPredicate, row, defaultMessage } = params;
	const closeContextMenuHandler = useTreeInternalContext((_) => _.closeContextMenuHandler);
	const keyboardShortcutsRef = useTreeEngineContextRef((_) => _.keyboardShortcuts);
	const onAddWarning = useTreeEngineContext((_) => _.eventHandlers.onAddWarning);
	const readonly = useTreeEngineState(UIStateSelector.readonly());

	return React.useMemo(() => {
		if (readonly) {
			return undefined;
		}

		return (event) => {
			if (event.repeat) {
				return;
			}

			const pressedKeys = KeyboardShortcutUtils.toKeyCombination(event);

			const targets =
				keyboardShortcutsRef.current
					?.filter(({ keyCombinations, target }) => {
						return (
							targetPredicate(target) &&
							keyCombinations.some((keys) => KeyboardShortcut.KeyCombination.areEqual(pressedKeys, keys))
						);
					})
					.map(({ target }) => target) ?? [];

			if (targets.length === 0) {
				return;
			}

			for (const controller of controllersRef.current) {
				const result = controller.getHandler(...targets);

				if (result === undefined) {
					continue;
				}

				if (typeof result === "function") {
					result();
					event.stopPropagation();
					event.preventDefault();
					closeContextMenuHandler.current?.();
					return;
				}

				// a shortcut
				const stopIfUnavailable = keyboardShortcutsRef.current?.find(
					({ target }) => target === result
				)?.stopIfUnavailable;
				let message: Localizable | undefined;

				if (stopIfUnavailable === true) {
					message = defaultMessage;
				} else if (typeof stopIfUnavailable === "function") {
					message = stopIfUnavailable({ ...row });
				} else {
					message = stopIfUnavailable;
				}

				if (!message) {
					continue;
				}

				onAddWarning?.({ message });
				event.stopPropagation();
				event.preventDefault();
				closeContextMenuHandler.current?.();
				return;
			}
		};
	}, [
		closeContextMenuHandler,
		controllersRef,
		defaultMessage,
		keyboardShortcutsRef,
		onAddWarning,
		readonly,
		row,
		targetPredicate
	]);
}

/** @internal */
export interface Controller {
	getHandler(...targets: KeyboardShortcut.Target[]): (() => void) | KeyboardShortcut.Target | undefined;
}

/** @internal */
export function useBuiltinShortcut(
	action: KeyboardShortcut.NodeBuiltinAction | KeyboardShortcut.EngineBuiltinAction
): KeyboardShortcut | undefined {
	const keyboardShortcuts = useTreeEngineContext((_) => _.keyboardShortcuts);

	return React.useMemo(() => {
		return keyboardShortcuts?.find(({ target }) => {
			if (
				KeyboardShortcut.NodeBuiltinActionTarget.isAssignableFrom(target) ||
				KeyboardShortcut.EngineBuiltinActionTarget.isAssignableFrom(target)
			) {
				return target.action === action;
			}

			return false;
		});
	}, [action, keyboardShortcuts]);
}

/** @internal */
export function useRowActionShortcut(
	rowAction: TreeModel.TreeNodeActionButton,
	isRootNode: boolean
): KeyboardShortcut | undefined {
	const keyboardShortcuts = useTreeEngineContext((context) => context.keyboardShortcuts);

	return React.useMemo(() => {
		return keyboardShortcuts?.find(({ target }) => {
			if (isRootNode) {
				return (
					KeyboardShortcut.EngineEventActionTarget.isTargetFor(target, rowAction) ||
					KeyboardShortcut.EngineInsertActionTarget.isTargetFor(target, rowAction)
				);
			}

			return (
				KeyboardShortcut.NodeEventActionTarget.isTargetFor(target, rowAction) ||
				KeyboardShortcut.NodeInsertActionTarget.isTargetFor(target, rowAction)
			);
		});
	}, [isRootNode, keyboardShortcuts, rowAction]);
}
