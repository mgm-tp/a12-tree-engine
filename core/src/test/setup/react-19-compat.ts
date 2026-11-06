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

import React from "react";
import ReactDOM from "react-dom";

/**
 * React 19 renamed the shared-internals property that `react-shallow-renderer` (a transitive
 * dependency of the Enzyme adapter) reads at import time. Without the legacy alias the module
 * throws while loading and takes every Enzyme-based suite down with it. Only `mount` is used in
 * these tests, so aliasing the object is enough to let the shallow renderer initialise.
 *
 * The alias is written onto the CommonJS export object the default import yields, because the ESM
 * namespace object that `import * as React` gives back is sealed and cannot take new properties.
 */
const LEGACY_INTERNALS_KEY = "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED";
const CLIENT_INTERNALS_KEY = "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE";

const react = React as unknown as Record<string, unknown>;

if (react[LEGACY_INTERNALS_KEY] === undefined) {
	Object.defineProperty(react, LEGACY_INTERNALS_KEY, {
		configurable: true,
		value: react[CLIENT_INTERNALS_KEY] ?? {}
	});
}

/**
 * React 19 removed `ReactDOM.findDOMNode`, which the Enzyme adapter still calls to resolve the host
 * element behind every wrapper node. Restoring it keeps `.simulate()`, `.text()` and host-node
 * lookups working; the implementation mirrors React's own by walking the fiber tree of the given
 * instance down to its first host fiber.
 */
const reactDom = ReactDOM as unknown as Record<string, unknown>;

if (typeof reactDom.findDOMNode !== "function") {
	Object.defineProperty(reactDom, "findDOMNode", { configurable: true, value: findDOMNode });
}

interface Fiber {
	child: Fiber | null;
	sibling: Fiber | null;
	return: Fiber | null;
	stateNode: unknown;
}

function findDOMNode(instance: unknown): Node | null {
	if (isDomNode(instance)) {
		return instance;
	}

	const fiber = getFiber(instance);

	return fiber ? findHostNode(fiber) : null;
}

function isDomNode(candidate: unknown): candidate is Node {
	return typeof (candidate as Node | null)?.nodeType === "number";
}

function getFiber(instance: unknown): Fiber | null {
	const owner = instance as { _reactInternals?: Fiber; _reactInternalFiber?: Fiber } | null;

	return owner?._reactInternals ?? owner?._reactInternalFiber ?? null;
}

/** Depth-first search for the first host (DOM-backed) fiber within the subtree rooted at `root`. */
function findHostNode(root: Fiber): Node | null {
	let current: Fiber | null = root;

	while (current) {
		if (isDomNode(current.stateNode)) {
			return current.stateNode;
		}

		if (current.child) {
			current = current.child;
			continue;
		}

		while (current !== root && !current.sibling) {
			current = current.return as Fiber;
		}

		current = current === root ? null : current.sibling;
	}

	return null;
}
