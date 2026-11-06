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

import { act } from "react";

/**
 * React 19 stripped `react-dom/test-utils` down to `act`, dropping the `Simulate` helper the Enzyme
 * adapter uses to back `wrapper.simulate(...)`, and the remaining `act` logs a deprecation notice on
 * first use. The browser test runner pre-bundles the adapter, so patching the real module at runtime
 * would not reach the copy the adapter holds; this module is aliased in its place instead.
 *
 * Dispatching a real bubbling DOM event reaches React's root-level event delegation and invokes the
 * same handlers `Simulate` used to call.
 */
export { act };

export const Simulate = createSimulate();

export default { act, Simulate };

const MOUSE_EVENTS = new Set([
	"click",
	"contextmenu",
	"dblclick",
	"mousedown",
	"mousemove",
	"mouseout",
	"mouseover",
	"mouseup"
]);
const KEYBOARD_EVENTS = new Set(["keydown", "keypress", "keyup"]);

type EventData = Record<string, unknown>;

/**
 * Enzyme looks events up as `Simulate[eventName]`, so a proxy serves every event name rather than
 * enumerating React's full synthetic event list.
 */
function createSimulate(): Record<string, (node: Element, eventData?: EventData) => void> {
	return new Proxy(
		{},
		{
			get(_target, eventName: string) {
				return function simulate(node: Element, eventData: EventData = {}): void {
					node.dispatchEvent(createDomEvent(eventName.toLowerCase(), eventData));
				};
			}
		}
	);
}

function createDomEvent(type: string, eventData: EventData): Event {
	const init = { bubbles: true, cancelable: true, ...eventData };

	if (MOUSE_EVENTS.has(type)) {
		return new MouseEvent(type, init);
	}

	if (KEYBOARD_EVENTS.has(type)) {
		return new KeyboardEvent(type, init);
	}

	return new Event(type, init);
}
