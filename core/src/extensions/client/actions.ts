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

import { isAction, type UnknownAction } from "redux";

import {
	type Action,
	type ActionCreator,
	actionCreatorFactory as actionCreatorFactory
} from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { Activity, ActivityActions } from "@com.mgmtp.a12.client/client-core";

import { buildInitialUiState } from "../../core/store/reducer/reducer-factory.js";
import type { UiState } from "../../core/store/store.js";

import type { TreeEngineDataHolder } from "./data-holder.js";
import { UI_STATE_SLICE } from "./constants.js";

export namespace TreeEngineActions {
	/**
	 * An action creator that enables specifying initial Tree Engine UI slices
	 * @param createActivityPayload - an object to specify core properties for the new activity
	 * @param initialUiState - to specify the initial Tree Engine UI slices
	 */
	export function createActivity(
		createActivityPayload: ActivityActions.CreatePayload,
		initialUiState?: Pick<UiState, "scrollToNode" | "initialExpansion" | "disabled" | "readonly">
	): Action<ActivityActions.PushPayload> {
		const sourceAction = ActivityActions.create(createActivityPayload);
		const defaultDataHolder = Activity.findDefaultDataHolder(sourceAction.payload.activity);

		if (initialUiState && defaultDataHolder) {
			const uiState = { ...buildInitialUiState(), ...initialUiState };
			const newDefaultDataHolder: Activity.DataHolder = { ...defaultDataHolder, slices: { [UI_STATE_SLICE]: uiState } };

			const newDataHolders = sourceAction.payload.activity.dataHolders?.map((dataHolder) =>
				dataHolder === defaultDataHolder ? newDefaultDataHolder : dataHolder
			);

			return {
				type: sourceAction.type,
				payload: {
					...sourceAction.payload,
					activity: { ...sourceAction.payload.activity, dataHolders: newDataHolders }
				}
			};
		}

		return { type: sourceAction.type, payload: sourceAction.payload };
	}

	const commandActionType = "TreeEngine/COMMAND";
	export const command: ActionCreator<CommandPayload> = Object.assign(
		(payload: CommandPayload): Action<CommandPayload> => {
			const { engineAction } = payload;
			const [, commandType] = isAction(engineAction) ? engineAction.type.split("/") : [];
			if (commandType) {
				return { type: `${commandActionType}/${commandType}`, payload };
			}
			return { type: commandActionType, payload };
		},
		{
			match(action: unknown): action is Action<CommandPayload> {
				return isAction(action) && action.type.includes(commandActionType);
			},
			toString: () => commandActionType,
			type: commandActionType
		}
	);
	export interface CommandPayload<T = UnknownAction> {
		activityId: string;
		engineAction: T;
	}

	const eventActionType = "TreeEngine/EVENT";
	export const event: ActionCreator<EventPayload> = Object.assign(
		(payload: EventPayload): Action<EventPayload> => {
			const { engineAction } = payload;
			const [, eventType] = isAction(engineAction) ? engineAction.type.split("/") : [];
			if (eventType) {
				return { type: `${eventActionType}/${eventType}`, payload };
			}
			return { type: eventActionType, payload };
		},
		{
			match(action: unknown): action is Action<EventPayload> {
				return isAction(action) && action.type.includes(eventActionType);
			},
			toString: () => eventActionType,
			type: eventActionType
		}
	);
	export interface EventPayload<T = UnknownAction> {
		activityId: string;
		engineAction: T;
	}

	const factory = actionCreatorFactory("TreeEngine");

	export const editLinkDocument = {
		started: factory<EditLinkDocumentPayload.Started>("EDIT_LINK_DOCUMENT_STARTED"),
		done: factory<EditLinkDocumentPayload.Done>("EDIT_LINK_DOCUMENT_DONE"),
		cancelled: factory<EditLinkDocumentPayload.Cancelled>("EDIT_LINK_DOCUMENT_CANCELLED")
	};

	export namespace EditLinkDocumentPayload {
		export interface Params {
			readonly activityId: string;
			readonly model: string;
			readonly instance?: string;
		}
		export interface Started extends Params {
			/** Old document instance */
			readonly document?: object;
		}
		export interface Done extends Params {
			readonly document: object;
			readonly dirty: boolean;
		}
		export type Cancelled = Params;
	}

	export const setDataHolders = factory<SetNodesAndOperationsDataHoldersPayload>("SET_DATA_HOLDERS");
	export interface SetNodesAndOperationsDataHoldersPayload {
		activityId: string;
		dataHolders: Activity.DataHolder[];
		removedDataHolderDescriptors?: Activity.DataHolderDescriptor[];
		removeUnusedDataHolders?: boolean;
	}

	/** @internal */
	export const setPageSizes = factory<SetPageSizesPayload>("SET_PAGE_SIZES");
	/** @internal */
	export interface SetPageSizesPayload {
		activityId: string;
		pageSizes: { descriptor: TreeEngineDataHolder["descriptor"]; expectedSize?: number; fullSize?: number }[];
	}

	/** @internal */
	export const addParentNodesDataHolder = factory<AddParentNodesDataHolderPayload>("ADD_PARENT_NODES_DATA_HOLDER");
	/** @internal */
	export interface AddParentNodesDataHolderPayload {
		activityId: string;
		relationshipModel: string;
		relationshipRole: string;
		source: string;
	}
}
