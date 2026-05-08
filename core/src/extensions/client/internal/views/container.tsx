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
import { useDispatch, useSelector } from "react-redux";
import { type Dispatch } from "redux";

import { type View, ViewViews, Activity, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import {
	type ComponentMap,
	ContentBoxRenderer,
	DefaultComponentMap,
	defaultMapDispatchToEventHandlers,
	DefaultWidgetMap,
	type EventHandlersDispatchMap,
	TreeEngineContextProvider,
	TreeEngineRenderer,
	type WidgetMap
} from "../../../../core/view/index.js";

import { TreeEngineActions } from "../actions.js";
import { TreeEngineSelectors } from "../selectors.js";

import { HeterogeneousInsertChildNodeDialog } from "./heterogeneous-insert-child-node-dialog.js";
import { HeterogeneousInsertSiblingNodeDialog } from "./heterogeneous-insert-sibling-node-dialog.js";
import { HeterogeneousInsertRootNodeDialog } from "./heterogeneous-insert-root-node-dialog.js";

/** @internal */
export function treeEngineClientViewComponentProvider(componentName: string): React.ComponentType<View> | undefined {
	if (componentName === "TreeEngine") {
		return TreeEngineClientContainer;
	}
	return undefined;
}

export namespace TreeEngineClientContainer {
	export interface Props extends View, TreeEngineContextProvider.OwnProps {
		readonly eventHandlers?: Partial<EventHandlersDispatchMap>;
	}
}

/**
 * @internal
 * The usage of {@link React.memo} will prevent Tree Engine container from being re-rendered
 * when the Activity Map gets updates due to changes from other containers
 * */
export const TreeEngineClientContainer: React.FC<TreeEngineClientContainer.Props> = React.memo(
	function TreeEngineClientContainer(props) {
		const {
			dndConfiguration,
			rowActionStateGetter,
			rowStyling,
			ariaLevel,
			keyboardShortcuts,
			selectorMap,
			eventHandlers: eventHandlersProps,
			uiIdPrefix,
			activityId
		} = props;

		const bapDispatch = useDispatch();
		const engineDispatch: Dispatch = React.useCallback(
			(action) => {
				bapDispatch(TreeEngineActions.event({ activityId, engineAction: action }));
				return action;
			},
			[bapDispatch, activityId]
		);

		const eventHandlers = React.useMemo(
			() => ({ ...defaultMapDispatchToEventHandlers(engineDispatch), ...eventHandlersProps }),
			[engineDispatch, eventHandlersProps]
		);

		const thumbnails = useSelector(
			ActivitySelectors.activityPropById(
				activityId,
				(activity) => Activity.findDefaultDataHolder(activity)?.slices["thumbnails"]
			)
		);

		const componentMap = React.useMemo<ComponentMap>(() => {
			const result: ComponentMap = {
				...DefaultComponentMap,
				...props.componentMap,
				InsertChildNodeDialog: HeterogeneousInsertChildNodeDialog,
				InsertSiblingNodeDialog: HeterogeneousInsertSiblingNodeDialog,
				InsertRootNodeDialog: HeterogeneousInsertRootNodeDialog
			};
			if (props.componentMap) {
				if (props.componentMap.InsertChildNodeDialog !== DefaultComponentMap.InsertChildNodeDialog) {
					result.InsertChildNodeDialog = props.componentMap.InsertChildNodeDialog;
				}
				if (props.componentMap.InsertRootNodeDialog !== DefaultComponentMap.InsertRootNodeDialog) {
					result.InsertRootNodeDialog = props.componentMap.InsertRootNodeDialog;
				}
				if (props.componentMap.InsertSiblingNodeDialog !== DefaultComponentMap.InsertSiblingNodeDialog) {
					result.InsertSiblingNodeDialog = props.componentMap.InsertSiblingNodeDialog;
				}
			}
			return result;
		}, [props.componentMap]);

		const widgetMap = React.useMemo<WidgetMap>(() => {
			return { ...DefaultWidgetMap, ...props.widgetMap };
		}, [props.widgetMap]);

		const busy = useSelector(ActivitySelectors.busy(activityId));

		const stateSelector = React.useMemo(() => {
			return TreeEngineSelectors.engineState(activityId);
		}, [activityId]);
		const state = useSelector(stateSelector);

		const activityContextValue = React.useMemo(() => {
			return { activityId };
		}, [activityId]);

		if (!state) {
			return null;
		}

		return (
			<ViewViews.ActivityContext.Provider value={activityContextValue}>
				<TreeEngineContextProvider
					key={activityId + `${dndConfiguration === false ? "_non_dnd" : ""}`}
					state={state}
					eventHandlers={eventHandlers}
					componentMap={componentMap}
					widgetMap={widgetMap}
					selectorMap={selectorMap}
					thumbnails={thumbnails}
					rowActionStateGetter={rowActionStateGetter}
					rowStyling={rowStyling}
					dndConfiguration={dndConfiguration}
					busy={busy}
					ariaLevel={ariaLevel}
					keyboardShortcuts={keyboardShortcuts}
					uiIdPrefix={uiIdPrefix}>
					<ContentBoxRenderer>
						<TreeEngineRenderer />
					</ContentBoxRenderer>
				</TreeEngineContextProvider>
			</ViewViews.ActivityContext.Provider>
		);
	}
);
