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

import { type Middleware } from "redux";

import { Commands, Events } from "../../actions.js";
import { DataSelector } from "../../selectors/data.js";
import { UIStateSelector } from "../../selectors/ui-state.js";
import { Identifier, TreeEngineState } from "../../store.js";

/**
 * @internal
 */
export const onRevalidateClipboard: Middleware = (api) => (next) => (action) => {
	const result = next(action);
	if (Events.revalidateClipboard.match(action)) {
		const clipboard = UIStateSelector.clipboard()(api.getState());
		const { removedNodes, addedNodes } = action.payload;

		if (!clipboard) {
			return result;
		}

		if (!removedNodes && !addedNodes) {
			api.dispatch(Commands.resetClipboard({}));
			return result;
		}

		let nextClipboardNodes = clipboard.nodes;
		if (removedNodes) {
			nextClipboardNodes = removeClipboardNodes(nextClipboardNodes, removedNodes);
		}
		if (addedNodes) {
			nextClipboardNodes = addClipboardNodes(nextClipboardNodes, expandAddedNodes(addedNodes, api.getState()));
		}

		if (clipboard.action === TreeEngineState.Clipboard.Action.CUT) {
			api.dispatch(Commands.setCutNodes({ cutNodes: nextClipboardNodes }));
		} else if (clipboard.action === TreeEngineState.Clipboard.Action.COPY) {
			api.dispatch(Commands.setCopiedNodes({ copiedNodes: nextClipboardNodes }));
		}
	}
	return result;
};

function removeClipboardNodes(clipboardNodes: TreeEngineState.Clipboard.Node[], removedNodeIdentifiers: Identifier[]) {
	const result: TreeEngineState.Clipboard.Node[] = [];
	for (const node of clipboardNodes) {
		const isNodeRemoved = removedNodeIdentifiers.find((id) => Identifier.areEqual(id, node.nodeIdentifier));
		if (node.includeChildren || !isNodeRemoved) {
			const newChildren = node.children && removeClipboardNodes(node.children, removedNodeIdentifiers);
			const newNode: TreeEngineState.Clipboard.Node = { ...node, children: newChildren };
			result.push(newNode);
		}
	}
	return result;
}

function addClipboardNodes(
	clipboardNodes: TreeEngineState.Clipboard.Node[],
	addedNodes: Events.RevalidateClipboardPayload.AddedNode[]
) {
	const result: TreeEngineState.Clipboard.Node[] = [];

	for (const node of clipboardNodes) {
		let children = node.children;
		for (const addedNode of addedNodes) {
			const parentPathOfAddedNode = addedNode.nodePath.slice(0, -1);
			if (TreeEngineState.NodePath.areEqual(parentPathOfAddedNode, node.nodePath)) {
				const currentChildren = children ?? [];
				children = [addedNode, ...currentChildren];
			}
		}

		if (children) {
			const newNode = { ...node, children: addClipboardNodes(children, addedNodes) };
			result.push(newNode);
		} else {
			result.push(node);
		}
	}

	return result;
}

function expandAddedNodes(addedNodes: Events.RevalidateClipboardPayload.AddedNode[], state: TreeEngineState) {
	const result: Events.RevalidateClipboardPayload.AddedNode[] = [];
	addedNodes.forEach(function traverse(node) {
		result.push(node);
		const childNodes = DataSelector.childNodes(node)(state);
		childNodes.forEach(traverse);
	});
	return result;
}
