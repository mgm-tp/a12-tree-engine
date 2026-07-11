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

import { createContext, useContextSelector } from "@com.mgmtp.a12.widgets/widgets-core";

import { DataSelector } from "../../store/selectors/data.js";
import { Identifier } from "../../store/store.js";
import { type RowState, RowStateSelector } from "../../store/selectors/row-state.js";
import type { Selector as BaseSelector } from "../../store/selectors/selector.js";

import { type FlattenNodeRow, RootNodeRow } from "../components/tree-engine/sub-components/types.js";

import { useTreeEngineState } from "./tree-engine-context.js";

export namespace TreeEngineRowContext {
	export interface Type {
		rowState: RowState;
		parentRowState?: RowState;
		isCircular: boolean;
		/**
		 * This property is deprecated because it is now can be controlled by the flattenNodeRows list.
		 * @deprecated since version 9.0.2
		 */
		shouldRenderPaginatedBodyRow: boolean;
	}
}

const TreeEngineRowContext = createContext<TreeEngineRowContext.Type>({
	rowState: {} as unknown as RowState,
	isCircular: false,
	shouldRenderPaginatedBodyRow: false
});
TreeEngineRowContext.displayName = "TreeEngineRowContext";

export const TreeEngineRowContextProvider = TreeEngineRowContext.Provider;

export function useTreeEngineRowContext<T>(selector: BaseSelector<T, TreeEngineRowContext.Type>): T {
	return useContextSelector(TreeEngineRowContext, selector);
}

/**
 * @internal
 * Depend on given row parameter, the context will return the state of the current row or its parent.
 * This especially is useful in a case where the child row request its parent state to render "belongs to" text for A11y.
 * */
export function useEitherRowOrParentRowState<T>(
	row: FlattenNodeRow,
	selector: BaseSelector<T, RowState>
): T | undefined {
	return useContextSelector(TreeEngineRowContext, (state) => {
		if (
			state.rowState.node?.identifier &&
			Identifier.areEqual(state.rowState.node.identifier, row.data.nodeIdentifier)
		) {
			return selector(state.rowState);
		}
		return state.parentRowState && selector(state.parentRowState);
	});
}

/** @internal */
export function useTreeEngineRowContextProvider(row: FlattenNodeRow): TreeEngineRowContext.Type | undefined {
	const rowStateSelector = React.useMemo(() => RowStateSelector.rowState(row.data), [row.data]);
	const rowState = useTreeEngineState(rowStateSelector);

	const parentRowStateSelector = React.useMemo(() => {
		if (!row.parent || RootNodeRow.isAssignableFrom(row.parent)) {
			return () => undefined;
		}
		return RowStateSelector.rowState(row.parent.data);
	}, [row.parent]);
	const parentRowState = useTreeEngineState(parentRowStateSelector);

	const isCircularSelector = React.useMemo(() => DataSelector.isCircularPath(row.data.nodePath), [row.data.nodePath]);
	const isCircular = useTreeEngineState(isCircularSelector);

	return React.useMemo(
		() => rowState && { rowState, parentRowState, isCircular, shouldRenderPaginatedBodyRow: false },
		[isCircular, parentRowState, rowState]
	);
}
