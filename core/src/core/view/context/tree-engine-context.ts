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

import type { TreeEngineState } from "../../store/store.js";
import type { Selector as BaseSelector } from "../../store/selectors/selector.js";
import type { Converter } from "../../services/converter/shared.js";

import type { RowActionStateGetter, RowStyleGetter } from "../components/tree-engine/sub-components/types.js";
import type { DndConfiguration } from "../configuration/dnd/configuration.js";
import type { SelectorMap } from "../configuration/selector-map.js";
import type { KeyboardShortcut } from "../configuration/keyboard-shortcut/types.js";

import type { TreeEngineContextProvider } from "./tree-engine-context-provider.js";

export namespace TreeEngineContext {
	type OmitTypes =
		| "state"
		| "rowActionStateGetter"
		| "thumbnails"
		| "rowStyling"
		| "localizerService"
		| "busy"
		| "keyboardShortcuts"
		| "dndConfiguration"
		| "uiIdPrefix"
		| "children";
	export interface Type extends Required<Omit<TreeEngineContextProvider.Props, OmitTypes>> {
		readonly state: object;
		readonly rowActionStateGetter?: RowActionStateGetter;
		readonly thumbnails?: Record<string, string>;
		readonly selectorMap: SelectorMap;
		readonly rowStyling?: RowStyleGetter;
		readonly overallMultiSelection?: boolean;
		readonly busy?: boolean;
		readonly keyboardShortcuts?: KeyboardShortcut[];
		readonly uiIdPrefix?: string;
		readonly dndConfiguration: DndConfiguration;
		/** @internal */
		readonly converter: Converter;
		/** @internal */
		readonly disableDnd?: boolean;
	}
}

const DEFAULT_ERROR_MESSAGE = `TreeEngineContext is not initiated, wrap your renderer with TreeEngineContextProvider.`;

/**
 * The default value is an "uninitiated" sentinel: it is only used when a consumer renders without a
 * {@link TreeEngineContextProvider}. In that case the first context read goes through `converter`,
 * which throws. The remaining fields (component/selector/widget maps, dnd, event handlers) are never
 * read on the sentinel, so they are intentionally omitted here — keeping their real default values
 * out of this leaf module avoids an import cycle with the configuration maps.
 *
 * @internal
 */
export const TreeEngineContext = createContext<TreeEngineContext.Type>({
	converter: {
		formatValue() {
			throw new Error(DEFAULT_ERROR_MESSAGE);
		}
	}
} as unknown as TreeEngineContext.Type);
TreeEngineContext.displayName = "TreeEngineContext";

export function useTreeEngineContext<T>(selector: BaseSelector<T, TreeEngineContext.Type>): T {
	return useContextSelector(TreeEngineContext, selector);
}

/**
 * Similar to {@link useRefValue}, the main different is that the cherry-picked state will not trigger any component effect,
 * which means NO re-render shall happen when the selected value get an update.
 * WARN: Ref value is ONLY useful when used within a callback, using it directly as a props value will very likely result in an out-dated updates.
 */
export function useTreeEngineContextRef<T>(
	selector: BaseSelector<T, TreeEngineContext.Type>
): React.MutableRefObject<T | undefined> {
	const valueRef = React.useRef<T>(undefined);
	useContextSelector(TreeEngineContext, (state) => {
		const value = selector(state);
		valueRef.current = value;
		return;
	});
	return valueRef;
}

export function useTreeEngineState<
	State extends TreeEngineState = TreeEngineState,
	Selector extends BaseSelector<any, State> = BaseSelector<any, State>
>(selector: Selector): ReturnType<Selector> {
	return useTreeEngineContext((context) => selector(context.state as State));
}

/**
 * Similar to {@link useTreeEngineContextRef}
 */
export function useTreeEngineStateRef<
	State extends TreeEngineState = TreeEngineState,
	Selector extends BaseSelector<any, State> = BaseSelector<any, State>
>(selector: Selector): React.MutableRefObject<ReturnType<Selector> | undefined> {
	return useTreeEngineContextRef((context) => selector(context.state as State));
}
