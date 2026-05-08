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

import { type Localizable } from "@com.mgmtp.a12.utils/utils-localization";

import { TreeModel } from "../../../../models/index.js";
import { type TreeEngineState } from "../../../../store/index.js";

import { KeyboardShortcutUtils } from "./utils.js";

export interface KeyboardShortcut {
	/**
	 * The action will be executed
	 */
	readonly target: KeyboardShortcut.Target;

	/**
	 * A list of key combinations will trigger the corresponding target action if possible
	 */
	readonly keyCombinations: KeyboardShortcut.KeyCombination[];

	/**
	 * Used to display next to the action in the context menu. If not specified, the default one will be used.
	 */
	readonly label?: string;

	/**
	 * The appended text for the action's title. If not specified, the default one will be used.
	 */
	readonly title?: string;

	/**
	 * Used to check if a warning message, which is related to the failure in handling keyboard shortcuts, should be shown to users.
	 */
	readonly stopIfUnavailable?:
		| true
		| Localizable
		| ((params: { node?: TreeEngineState.Node; link?: TreeEngineState.Link }) => Localizable);
}

export namespace KeyboardShortcut {
	export type Target = NodeTarget | EngineTarget | never;
	export namespace Target {
		export function isAssignableFrom(target: unknown): target is Target {
			return NodeTarget.isAssignableFrom(target) || EngineTarget.isAssignableFrom(target);
		}
	}

	/**
	 * Node targets
	 */
	export type NodeTarget = NodeEventActionTarget | NodeInsertActionTarget | NodeBuiltinActionTarget | never;
	export namespace NodeTarget {
		export function isAssignableFrom(target: unknown): target is NodeTarget {
			return (
				NodeEventActionTarget.isAssignableFrom(target) ||
				NodeInsertActionTarget.isAssignableFrom(target) ||
				NodeBuiltinActionTarget.isAssignableFrom(target)
			);
		}
	}

	export enum TargetType {
		NODE_BUILTIN_ACTION = "nodeBuiltinAction",
		NODE_EVENT_ACTION = "nodeEventAction",
		NODE_INSERT_ACTION = "nodeInsertAction",
		ENGINE_BUILTIN_ACTION = "engineBuiltinAction",
		ENGINE_EVENT_ACTION = "engineEventAction",
		ENGINE_INSERT_ACTION = "engineInsertAction"
	}

	export enum NodeBuiltinAction {
		TOGGLE_MULTI_SELECTION = "toggleMultiSelection",
		TOGGLE_EXPANSION = "toggleExpansion"
	}
	export interface NodeBuiltinActionTarget extends BaseTarget {
		readonly type: TargetType.NODE_BUILTIN_ACTION;
		readonly action: NodeBuiltinAction;
	}
	export namespace NodeBuiltinActionTarget {
		export function isAssignableFrom(target: unknown): target is NodeBuiltinActionTarget {
			return BaseTarget.isAssignableFrom(target) && target.type === TargetType.NODE_BUILTIN_ACTION;
		}
	}

	export interface NodeEventActionTarget extends BaseTarget {
		readonly type: TargetType.NODE_EVENT_ACTION;
		readonly event: string;
	}
	export namespace NodeEventActionTarget {
		export function isAssignableFrom(target: unknown): target is NodeEventActionTarget {
			return BaseTarget.isAssignableFrom(target) && target.type === TargetType.NODE_EVENT_ACTION;
		}
		export function isTargetFor(target: KeyboardShortcut.Target, action: TreeModel.TreeNodeActionButton) {
			return (
				isAssignableFrom(target) &&
				TreeModel.TreeNodeEventActionButton.isAssignableFrom(action) &&
				target.event === action.event
			);
		}
	}

	export interface NodeInsertActionTarget extends BaseTarget {
		readonly type: TargetType.NODE_INSERT_ACTION;
		readonly position: TreeModel.InsertPosition;
		readonly documentModelRef?: string;
	}
	export namespace NodeInsertActionTarget {
		export function isAssignableFrom(target: unknown): target is NodeInsertActionTarget {
			return BaseTarget.isAssignableFrom(target) && target.type === TargetType.NODE_INSERT_ACTION;
		}
		export function isTargetFor(target: KeyboardShortcut.Target, action: TreeModel.TreeNodeActionButton) {
			return (
				isAssignableFrom(target) &&
				TreeModel.TreeNodeInsertActionButton.isAssignableFrom(action) &&
				target.documentModelRef === action.documentModelRef &&
				target.position === action.position
			);
		}
	}

	/**
	 * Engine targets
	 */
	export type EngineTarget = EngineBuiltinActionTarget | EngineEventActionTarget | EngineInsertActionTarget | never;
	export namespace EngineTarget {
		export function isAssignableFrom(target: unknown): target is EngineTarget {
			return (
				EngineEventActionTarget.isAssignableFrom(target) ||
				EngineInsertActionTarget.isAssignableFrom(target) ||
				EngineBuiltinActionTarget.isAssignableFrom(target)
			);
		}
	}

	export enum EngineBuiltinAction {
		TOGGLE_OVERALL_MULTI_SELECTION = "toggleOverallMultiSelection",
		TOGGLE_MULTI_SELECTION_PANEL = "toggleMultiSelectionPanel",
		EXPAND_WHOLE_TREE = "expandWholeTree",
		COLLAPSE_WHOLE_TREE = "collapseWholeTree"
	}

	export interface EngineBuiltinActionTarget extends BaseTarget {
		readonly type: TargetType.ENGINE_BUILTIN_ACTION;
		readonly action: EngineBuiltinAction;
	}

	export namespace EngineBuiltinActionTarget {
		export function isAssignableFrom(target: unknown): target is EngineBuiltinActionTarget {
			return BaseTarget.isAssignableFrom(target) && target.type === TargetType.ENGINE_BUILTIN_ACTION;
		}
	}

	export interface EngineEventActionTarget extends BaseTarget {
		readonly type: TargetType.ENGINE_EVENT_ACTION;
		readonly event: string;
	}
	export namespace EngineEventActionTarget {
		export function isAssignableFrom(target: unknown): target is EngineEventActionTarget {
			return BaseTarget.isAssignableFrom(target) && target.type === TargetType.ENGINE_EVENT_ACTION;
		}
		export function isTargetFor(
			target: KeyboardShortcut.Target,
			button: TreeModel.TreeNodeActionButton | TreeModel.ButtonType
		) {
			if (TreeModel.TreeNodeInsertActionButton.isAssignableFrom(button)) {
				return false;
			}

			return isAssignableFrom(target) && target.event === button.event;
		}
	}
	export interface EngineInsertActionTarget extends BaseTarget {
		readonly type: TargetType.ENGINE_INSERT_ACTION;
		readonly documentModelRef?: string;
	}
	export namespace EngineInsertActionTarget {
		export function isAssignableFrom(target: unknown): target is EngineInsertActionTarget {
			return BaseTarget.isAssignableFrom(target) && target.type === TargetType.ENGINE_INSERT_ACTION;
		}
		export function isTargetFor(target: KeyboardShortcut.Target, button: TreeModel.TreeNodeActionButton): boolean {
			return (
				isAssignableFrom(target) &&
				TreeModel.TreeNodeInsertActionButton.isAssignableFrom(button) &&
				target.documentModelRef === button.documentModelRef
			);
		}
	}

	interface BaseTarget {
		readonly type: unknown;
	}
	namespace BaseTarget {
		export function isAssignableFrom(target: unknown): target is BaseTarget {
			return typeof target === "object" && target !== null && "type" in target;
		}
	}

	export enum ModifierKey {
		Alt = "Alt",
		Ctrl = "Ctrl",
		Meta = "Cmd/Win",
		Shift = "Shift"
	}
	export namespace ModifierKey {
		export function toString(modifierKey: ModifierKey): string {
			return modifierKey;
		}
	}

	export interface KeyCombination {
		/**
		 * The list of modifier keys: *Control*, *Alt*, *Shift*, or *Meta*
		 * (on Mac keyboards, the Command ⌘ key; on Windows keyboards, the Windows ⊞ key)
		 * This list will be compared to the corresponding properties: *ctrlKey*, *altKey*,... of
		 * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent|KeyboardEvent}
		 */
		readonly modifierKeys?: ModifierKey[];

		/**
		 * Represent physical key that user presses. This field will be compared to
		 * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code|code}
		 * property of Web API KeyboardEvent
		 *
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values| All KeyboardEvent.code values}
		 */
		readonly eventCode: string;
	}
	export namespace KeyCombination {
		export function toString(keyCombination: KeyCombination): string {
			const { eventCode, modifierKeys = [] } = keyCombination;

			return [...modifierKeys.sort().map(ModifierKey.toString), KeyboardShortcutUtils.formatEventCode(eventCode)].join(
				" + "
			);
		}

		export function areEqual(source: KeyCombination, target: KeyCombination): boolean {
			if (source.eventCode !== target.eventCode) {
				return false;
			}

			const sortedModifierKeys1 = source.modifierKeys?.sort() ?? [];
			const sortedModifierKeys2 = target.modifierKeys?.sort() ?? [];

			return (
				sortedModifierKeys1.length === sortedModifierKeys2.length &&
				sortedModifierKeys1.every((key, index) => key === sortedModifierKeys2[index])
			);
		}
	}
}
