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

import { createSelectorCreator, weakMapMemoize, lruMemoize } from "reselect";
import { shallowEqual } from "react-redux";

export interface Selector<ReturnType, State = object> {
	(state: State): ReturnType;
}

type AnySelectorCreator = (...args: any[]) => Selector<any, any>;

/** @internal */
export type PickStateFromSelectorCreator<Selector extends AnySelectorCreator> = Parameters<ReturnType<Selector>>[0];

/** @internal */
export const createSelector = createSelectorCreator({
	memoize: weakMapMemoize,
	argsMemoize: weakMapMemoize,
	memoizeOptions: { resultEqualityCheck: extendedShallowEqual },
	argsMemoizeOptions: { resultEqualityCheck: extendedShallowEqual }
});

/**
 * @internal
 * WARNING: This selector creator uses an LRU cache with a maximum size of 10.
 * DO NOT apply this to selectors that are called frequently with different arguments, e.g. in each row of a table or tree node.
 * There is a risk of memory leaks if the cache grows too large. Therefore, 10 is the safe number and this creator generally
 * should be avoided unless facing strange issues with the default {@link createSelector} implementation via {@link weakMapMemoize}.
 * */
export const createLruSelector = createSelectorCreator({
	memoize: lruMemoize,
	argsMemoize: lruMemoize,
	memoizeOptions: { equalityCheck: extendedShallowEqual, resultEqualityCheck: extendedShallowEqual, maxSize: 10 },
	argsMemoizeOptions: { equalityCheck: extendedShallowEqual, resultEqualityCheck: extendedShallowEqual, maxSize: 10 }
});

function extendedShallowEqual(a: unknown, b: unknown): boolean {
	if (a instanceof Array && b instanceof Array) {
		if (a.length !== b.length) {
			return false;
		}
		return a.every((item, index) => shallowEqualWithDate(item, b[index]));
	}

	return shallowEqualWithDate(a, b);
}

function shallowEqualWithDate(a: unknown, b: unknown): boolean {
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime();
	}

	return shallowEqual(a, b);
}
