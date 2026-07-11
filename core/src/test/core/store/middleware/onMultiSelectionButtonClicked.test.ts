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

import { Commands, Events, TreeEngineState } from "../../../../core/store/index.js";
import { onMultiSelectionButtonClickedMiddleware } from "../../../../core/store/middleware/events/onMultiSelectionButtonClicked.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { setupMiddleware } from "../../../utils/store-utils.js";
import { createEngineState } from "../../../utils/model-utils.js";
import { TreeModel } from "../../../../core/models/index.js";

import { nonMatchedAction, shouldCallNextMiddlewareAndReturnResultedAction } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.store.middleware.events.onMultiSelectionButtonClicked", () => {
	const basicEngineState = defaultEngineState;
	const basicTreeConfiguration = basicEngineState.models.uiModel.content.configuration;
	const basicMultiSelectionConfig: TreeModel.MultiSelectionConfiguration = {
		collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED,
		counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.SIMPLE
	};

	const basicTopNodeIdentifier = basicEngineState.root.children[0];

	function setupTest(initialEngineState = basicEngineState) {
		return setupMiddleware(onMultiSelectionButtonClickedMiddleware, initialEngineState);
	}

	describe("given a matched action", () => {
		const action = Events.onMultiSelectionButtonClicked({});

		describe("when the multi-selection panel is collapsed", () => {
			const engineState: TreeEngineState = { ...basicEngineState, expandedMultiSelectionPanel: false };

			it("should open the panel", () => {
				const { invoke, store } = setupTest(engineState);
				invoke(action);
				expect(store.dispatch).toHaveBeenCalledOnce();
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setExpandedMultiSelectionPanel({ expanded: true }));
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("when the multi-selection panel is expanded", () => {
			describe("when there are selected nodes and enabled clear confirmation", () => {
				const nodePathString = TreeEngineState.NodePath.toString([basicTopNodeIdentifier]);
				const engineState = createEngineState
					.from({
						...basicEngineState,
						expandedMultiSelectionPanel: true,
						multiSelectionNodes: { [nodePathString]: TreeEngineState.MultiSelectionState.SELECTED }
					})
					.withConfigurations({
						...basicTreeConfiguration,
						multiSelection: { ...basicMultiSelectionConfig, clearConfirmation: { enabled: true } }
					})
					.create();

				it("should open the collapse multi-selection panel confirmation dialog", () => {
					const { invoke, store } = setupTest(engineState);
					invoke(action);
					expect(store.dispatch).toHaveBeenCalledOnce();
					expect(store.dispatch).toHaveBeenCalledWith(
						Commands.setDialogState({
							state: {
								type: TreeEngineState.Dialog.Type.CONFIRMATION,
								confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.COLLAPSE_MULTI_SELECTION_PANEL
							}
						})
					);
				});

				shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
			});

			describe("when there is no selected nodes", () => {
				const engineState: TreeEngineState = { ...basicEngineState, expandedMultiSelectionPanel: true };

				it("should dispatch a Commands.setExpandedMultiSelectionPanel action", () => {
					const { invoke, store } = setupTest(engineState);
					invoke(action);
					expect(store.dispatch).toHaveBeenCalledOnce();
					expect(store.dispatch).toHaveBeenCalledWith(Commands.setExpandedMultiSelectionPanel({ expanded: false }));
				});

				shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
			});

			describe("when there are selected nodes and disabled clear confirmation", () => {
				const nodePathString = TreeEngineState.NodePath.toString([basicTopNodeIdentifier]);
				const engineState = createEngineState
					.from({
						...basicEngineState,
						expandedMultiSelectionPanel: true,
						multiSelectionNodes: {
							[nodePathString]: TreeEngineState.MultiSelectionState.SELECTED
						}
					})
					.withConfigurations({
						...basicTreeConfiguration,
						multiSelection: { ...basicMultiSelectionConfig, clearConfirmation: undefined }
					})
					.create();

				it("should dispatch a Commands.setDisabledMultiSelection", () => {
					const { invoke, store } = setupTest(engineState);
					invoke(action);
					expect(store.dispatch).toHaveBeenCalledOnce();
					expect(store.dispatch).toHaveBeenCalledWith(Commands.setExpandedMultiSelectionPanel({ expanded: false }));
				});

				shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
			});
		});
	});

	describe("given a non-matched action", () => {
		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, nonMatchedAction);
	});
});
