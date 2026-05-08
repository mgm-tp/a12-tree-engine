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

import { createContext, useContextSelector } from "@com.mgmtp.a12.widgets/widgets-core/lib/context/index.js";
import { useWindowSize } from "@com.mgmtp.a12.widgets/widgets-core/lib/layout/size-detector/main/size-detector.view.js";
import { type Container } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";

import {
	type DataState,
	ModelSelector,
	type ModelsState,
	type Selector as BaseSelector,
	TreeEngineState,
	UIStateSelector
} from "../../../store/index.js";
import { type Converter, useConverter } from "../../../services/converter/internal/shared.js";

import { type RowActionStateGetter, type RowStyleGetter } from "../components/tree-engine/sub-components/types.js";
import { type ComponentMap, DefaultComponentMap } from "../configuration/component-map.js";
import { defaultDndConfiguration, type DndConfiguration } from "../configuration/dnd/index.js";
import {
	defaultMapDispatchToEventHandlers,
	type EventHandlersDispatchMap
} from "../configuration/event-handlers-dispatch-map.js";
import { DefaultSelectorMap, type SelectorMap } from "../configuration/selector-map.js";
import { DefaultWidgetMap, type WidgetMap } from "../configuration/widget-map.js";
import { type KeyboardShortcut } from "../configuration/keyboard-shortcut/index.js";

import { A11YLanguageContextProvider } from "./a11y-language-context-provider.js";
import { TreeInternalContextProvider } from "./tree-internal-context-provider.js";

export namespace TreeEngineContextProvider {
	export interface Props extends StateProps, DispatchProps, OwnProps, Container {}

	export interface StateProps {
		readonly state: TreeEngineState;
	}

	export interface DispatchProps {
		readonly eventHandlers: EventHandlersDispatchMap;
	}

	export interface OwnProps {
		/**
		 * A map of components is used to override the components in Tree Engine.
		 * The components are expected to have rendering logic based on the Tree model, Tree Engine state and so on.
		 */
		readonly componentMap?: ComponentMap;

		/**
		 * A map of Widgets components used in Tree Engine.
		 * These components are expected to focus on the UI.
		 * Therefore, they are recommended when some UI customizations need to be applied.
		 */
		readonly widgetMap?: WidgetMap;

		/**
		 * Map of selectors that can be customized.
		 * Note that this map will only be expanded as needed
		 */
		readonly selectorMap?: SelectorMap;

		/**
		 * A configurable object that configures the drag and drop feature.
		 */
		readonly dndConfiguration?: DndConfiguration | false;

		/**
		 * Thumbnails map
		 */
		readonly thumbnails?: Record<string, string>;

		/**
		 * The callback controls the state (e.g: visibility,...) of node action buttons.
		 */
		readonly rowActionStateGetter?: RowActionStateGetter;

		/**
		 * The callback controls the style (e.g: interactive,...) of a node.
		 */
		readonly rowStyling?: RowStyleGetter;

		/**
		 * An array of key combinations and target configurations which supports keyboard shortcuts for certain common actions.
		 */
		readonly keyboardShortcuts?: KeyboardShortcut[];

		/**
		 * A property which defines the window size for Tree Engine renderers.
		 */
		readonly smallView?: boolean;

		/**
		 * A property which defines the busy state for Tree Engine application.
		 */
		readonly busy?: boolean;

		/**
		 * A property which defines the `aria-level` attribute for Tree Engine components.
		 */
		readonly ariaLevel?: number;

		/**
		 * A property which defines the id prefix for Tree Engine component.
		 */
		readonly uiIdPrefix?: string;
	}
}

export const TreeEngineContextProvider: React.FC<TreeEngineContextProvider.Props> = (props) => {
	const {
		componentMap = DefaultComponentMap,
		widgetMap = DefaultWidgetMap,
		selectorMap = DefaultSelectorMap,
		rowActionStateGetter,
		rowStyling,
		thumbnails,
		eventHandlers,
		keyboardShortcuts,
		state,
		children,
		busy,
		uiIdPrefix
	} = props;

	const models = ModelSelector.models()(state);

	const converter = useConverter();

	const dataAndModels: DataState & ModelsState = React.useMemo(
		() => ({ root: state.root, data: state.data, models: state.models }),
		[state.data, state.models, state.root]
	);

	const disableDnd = React.useMemo(
		() => props.dndConfiguration === false || !models.uiModel.content.configuration.dnd,
		[models.uiModel.content.configuration.dnd, props.dndConfiguration]
	);

	const dndConfiguration: DndConfiguration = React.useMemo(() => {
		return {
			...defaultDndConfiguration(dataAndModels),
			...props.dndConfiguration
		};
	}, [props.dndConfiguration, dataAndModels]);

	const { breakPoint } = useWindowSize();

	const overallMultiSelection = React.useMemo(() => {
		return UIStateSelector.overallMultiSelection()(state) !== TreeEngineState.MultiSelectionState.DESELECTED;
	}, [state]);

	return (
		<TreeEngineContext.Provider
			value={{
				state,
				converter,
				selectorMap,
				widgetMap,
				componentMap,
				thumbnails,
				eventHandlers,
				dndConfiguration,
				disableDnd,
				rowActionStateGetter,
				rowStyling,
				overallMultiSelection,
				smallView: props?.smallView ?? (breakPoint?.size === "sm" || breakPoint?.size === "xs"),
				busy,
				ariaLevel: props.ariaLevel ?? 1,
				keyboardShortcuts,
				uiIdPrefix
			}}>
			<TreeInternalContextProvider>
				<A11YLanguageContextProvider>{children}</A11YLanguageContextProvider>
			</TreeInternalContextProvider>
		</TreeEngineContext.Provider>
	);
};

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

const TreeEngineContext = createContext<TreeEngineContext.Type>({
	state: {},
	dndConfiguration: defaultDndConfiguration({} as DataState & ModelsState),
	eventHandlers: defaultMapDispatchToEventHandlers((anyAction) => anyAction),
	converter: {
		formatValue() {
			throw new Error(DEFAULT_ERROR_MESSAGE);
		}
	},
	selectorMap: DefaultSelectorMap,
	componentMap: DefaultComponentMap,
	widgetMap: DefaultWidgetMap,
	smallView: false,
	ariaLevel: 1
});
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
