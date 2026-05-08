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

import * as KeyCode from "keycode-js";

import {
	TreeEngineState,
	KeyboardShortcut,
	TreeModel,
	type Identifier
} from "@com.mgmtp.a12.treeengine/treeengine-core";

import { SHOWCASE_RESOURCE_KEYS } from "./config/resources.js";

const targetNodes: {
	[type: string]: TreeEngineState.NodePath;
} = {};

export const setTargetNodePath = (type: string, nodePath: TreeEngineState.NodePath) => {
	targetNodes[type] = nodePath;
	window.localStorage.setItem(`Path${type}`, TreeEngineState.NodePath.toString(nodePath));
};

export const getTargetNodePath = (type: string): TreeEngineState.NodePath | undefined => {
	const storedNodePath = window.localStorage.getItem(`Path${type}`);
	return targetNodes[type] ?? (storedNodePath ? TreeEngineState.NodePath.fromString(storedNodePath) : undefined);
};

const nodesFromNodePath: {
	[type: string]: Identifier[] | undefined;
} = {};

export const setNodesFromNodePath = (type: string, nodeIdentifiers: Identifier[] | undefined) => {
	if (nodeIdentifiers) {
		nodesFromNodePath[type] = nodeIdentifiers;
		window.localStorage.setItem(`Nodes${type}`, TreeEngineState.NodePath.toString(nodeIdentifiers));
	}
};

export const getNodesFromNodePath = (type: string): Identifier[] | undefined => {
	const storedNodes = window.localStorage.getItem(`Nodes${type}`);
	return nodesFromNodePath[type] ?? (storedNodes ? TreeEngineState.NodePath.fromString(storedNodes) : undefined);
};

let showcaseDisabled = false;
export const setShowcaseDisabled = (disabled: boolean) => {
	showcaseDisabled = disabled;
};

export const getShowcaseDisabled = () => {
	return showcaseDisabled;
};

export const toCapitalize = (string: string) => string[0].toUpperCase() + string.slice(1).toLowerCase();

const isMac = /(macintosh|macintel|macppc|mac68k|macos)/i.test(window.navigator.userAgent);
const CommandOrCtrlKey = isMac ? KeyboardShortcut.ModifierKey.Meta : KeyboardShortcut.ModifierKey.Ctrl;
const CommandOrCtrlLabel = isMac ? "Cmd" : "Ctrl";

export const nodeShortcuts: KeyboardShortcut[] = [
	{
		keyCombinations: [{ eventCode: KeyCode.CODE_SPACE }],
		target: {
			type: KeyboardShortcut.TargetType.NODE_BUILTIN_ACTION,
			action: KeyboardShortcut.NodeBuiltinAction.TOGGLE_MULTI_SELECTION
		}
	},
	{
		keyCombinations: [{ eventCode: KeyCode.CODE_DELETE }],
		target: { type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: "event_delete_node" }
	},
	{
		keyCombinations: [{ modifierKeys: [CommandOrCtrlKey], eventCode: KeyCode.CODE_C }],
		label: `${CommandOrCtrlLabel} + C`,
		target: { type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: "event_copy_node" }
	},
	{
		keyCombinations: [{ modifierKeys: [CommandOrCtrlKey], eventCode: KeyCode.CODE_X }],
		label: `${CommandOrCtrlLabel} + X`,
		target: { type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: "event_cut_node" }
	},
	{
		keyCombinations: [{ modifierKeys: [CommandOrCtrlKey], eventCode: KeyCode.CODE_V }],
		label: `${CommandOrCtrlLabel} + V`,
		target: { type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: "event_paste" }
	},
	{
		keyCombinations: [
			{
				modifierKeys: [CommandOrCtrlKey, KeyboardShortcut.ModifierKey.Shift],
				eventCode: KeyCode.CODE_I
			}
		],
		label: `${CommandOrCtrlLabel} + Shift + I`,
		target: { type: KeyboardShortcut.TargetType.NODE_INSERT_ACTION, position: TreeModel.InsertPosition.AS_CHILD }
	},
	{
		keyCombinations: [
			{
				modifierKeys: [CommandOrCtrlKey, KeyboardShortcut.ModifierKey.Shift],
				eventCode: KeyCode.CODE_S
			}
		],
		label: `${CommandOrCtrlLabel} + Shift + S`,
		target: {
			type: KeyboardShortcut.TargetType.NODE_INSERT_ACTION,
			position: TreeModel.InsertPosition.BELOW,
			documentModelRef: "DomainRule"
		}
	}
];

export const engineShortcuts: KeyboardShortcut[] = [
	{
		keyCombinations: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: KeyCode.CODE_SPACE }],
		target: {
			type: KeyboardShortcut.TargetType.ENGINE_BUILTIN_ACTION,
			action: KeyboardShortcut.EngineBuiltinAction.TOGGLE_OVERALL_MULTI_SELECTION
		}
	},
	{
		keyCombinations: [{ eventCode: KeyCode.CODE_C }],
		target: {
			type: KeyboardShortcut.TargetType.ENGINE_BUILTIN_ACTION,
			action: KeyboardShortcut.EngineBuiltinAction.COLLAPSE_WHOLE_TREE
		}
	},
	{
		keyCombinations: [{ eventCode: KeyCode.CODE_DELETE }],
		target: { type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION, event: "event_delete_nodes" },
		stopIfUnavailable: true
	},
	{
		keyCombinations: [{ modifierKeys: [CommandOrCtrlKey], eventCode: KeyCode.CODE_C }],
		label: `${CommandOrCtrlLabel} + C`,
		target: { type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION, event: "event_copy_nodes" },
		stopIfUnavailable: { key: SHOWCASE_RESOURCE_KEYS.showcase.keyboardShortcut.engineTarget.eventCopyNodes.unavailable }
	},
	{
		keyCombinations: [{ modifierKeys: [CommandOrCtrlKey], eventCode: KeyCode.CODE_X }],
		label: `${CommandOrCtrlLabel} + X`,
		target: { type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION, event: "event_cut_nodes" }
	},
	{
		keyCombinations: [{ modifierKeys: [CommandOrCtrlKey], eventCode: KeyCode.CODE_V }],
		label: `${CommandOrCtrlLabel} + V`,
		target: { type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION, event: "event_paste" }
	}
];
