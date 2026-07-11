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

import type * as React from "react";

import { formatEventCode as formatEventCodeImpl } from "./event-code.js";
import { KeyboardShortcut } from "./types.js";

/** @internal */
export namespace KeyboardShortcutUtils {
	export function toLabel(shortcut: KeyboardShortcut | undefined): string {
		if (!shortcut) {
			return "";
		}
		const { label, keyCombinations } = shortcut;

		return label ?? keyCombinations.map(KeyboardShortcut.KeyCombination.toString).join(", ");
	}

	export function toTitle(shortcut: KeyboardShortcut | undefined): string {
		if (!shortcut) {
			return "";
		}

		return shortcut.title ?? ` (${KeyboardShortcutUtils.toLabel(shortcut)})`;
	}

	export function toKeyCombination(event: React.KeyboardEvent<HTMLElement>): KeyboardShortcut.KeyCombination {
		const modifierKeys: KeyboardShortcut.ModifierKey[] = [];
		if (event.shiftKey) {
			modifierKeys.push(KeyboardShortcut.ModifierKey.Shift);
		}
		if (event.altKey) {
			modifierKeys.push(KeyboardShortcut.ModifierKey.Alt);
		}
		if (event.ctrlKey) {
			modifierKeys.push(KeyboardShortcut.ModifierKey.Ctrl);
		}
		if (event.metaKey) {
			modifierKeys.push(KeyboardShortcut.ModifierKey.Meta);
		}

		return { modifierKeys, eventCode: event.code };
	}

	export const formatEventCode = formatEventCodeImpl;

	export function findMatchedAction<Action>(
		actions: Action[],
		targets: KeyboardShortcut.Target[],
		matcher: (target: KeyboardShortcut.Target, action: Action) => boolean
	): { action: Action; target: KeyboardShortcut.Target } | undefined {
		for (const action of actions) {
			for (const target of targets) {
				if (matcher(target, action)) {
					return { action, target };
				}
			}
		}
		return undefined;
	}
}
