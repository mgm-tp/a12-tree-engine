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

import { faker } from "@faker-js/faker";

import { type TreeModel, type RuntimeTreeModel } from "../../../../core/models/index.js";
import { Commands, Events, TreeEngineState, type Identifier } from "../../../../core/store/index.js";
import { onDialogConfirmedMiddleware } from "../../../../core/store/internal/middleware/events/onDialogConfirmed.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";
import { setupMiddleware } from "../../../utils/store-utils.js";

import { nonMatchedAction, shouldCallNextMiddlewareAndReturnResultedAction } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.store.middleware.events.onDialogConfirmed", () => {
	const basicEngineState = defaultEngineState;

	function setupTest(initialState = basicEngineState) {
		return setupMiddleware(onDialogConfirmedMiddleware, initialState);
	}

	describe("given a matched action", () => {
		describe("given dialog state is null", () => {
			const action = Events.onDialogConfirmed(mockType<Events.DialogConfirmedPayload>());
			const engineState: TreeEngineState = { ...basicEngineState, dialog: null };

			it("should not dispatch any action", () => {
				const { store, invoke } = setupTest(engineState);
				invoke(action);

				expect(store.dispatch).not.toHaveBeenCalled();
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given dialog state is of type InsertChildNode", () => {
			const options = mockType<TreeEngineState.Dialog.Option[]>();
			const insertPosition = mockType<TreeEngineState.InsertPosition>();
			const button = mockType<TreeModel.TreeNodeInsertActionButton>();
			const childRelationshipConfiguration = mockType<RuntimeTreeModel.ChildRelationshipConfiguration>();
			const documentModelId = faker.string.uuid();

			const dialog: TreeEngineState.Dialog.InsertChildNode = {
				type: TreeEngineState.Dialog.Type.INSERT_CHILD_NODE,
				options,
				insertPosition,
				button
			};

			const action = Events.onDialogConfirmed({
				type: TreeEngineState.Dialog.Type.INSERT_CHILD_NODE,
				button,
				insertPosition,
				documentModelId,
				childRelationshipConfiguration
			});

			const engineState: TreeEngineState = { ...basicEngineState, dialog };

			it("should close the dialog and dispatch an Events.onInsertChildNodeRequest.done action", () => {
				const { store, invoke } = setupTest(engineState);
				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onInsertChildNodeRequest.done({
						params: { insertPosition, button },
						result: { childRelationshipConfiguration, documentModelId }
					})
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given dialog state is of type InsertRootNode", () => {
			const documentModelId = faker.string.uuid();
			const button = mockType<TreeModel.ButtonType>();
			const dialog: TreeEngineState.Dialog.InsertRootNode = {
				type: TreeEngineState.Dialog.Type.INSERT_ROOT_NODE,
				button
			};

			const action = Events.onDialogConfirmed({
				type: TreeEngineState.Dialog.Type.INSERT_ROOT_NODE,
				documentModelId
			});

			const engineState: TreeEngineState = { ...basicEngineState, dialog };

			it("should close the dialog and dispatch an Events.onInsertRootNodeRequest.done action", () => {
				const { store, invoke } = setupTest(engineState);
				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onInsertRootNodeRequest.done({ params: { button }, result: { documentModelId } })
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given dialog is a confirmation dialog for event button", () => {
			const button = mockType<TreeModel.ButtonType>();
			const confirmation = mockType<TreeModel.ConfirmationText>();

			const dialog: TreeEngineState.Dialog.Confirmation.EventButton = {
				type: TreeEngineState.Dialog.Type.CONFIRMATION,
				confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.EVENT_BUTTON,
				button,
				confirmation
			};

			const action = Events.onDialogConfirmed(dialog);

			const engineState: TreeEngineState = { ...basicEngineState, dialog };

			it("should close the dialog and dispatch an Events.onEventButtonClicked action", () => {
				const { store, invoke } = setupTest(engineState);
				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(Events.onEventButtonClicked({ button }));
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given dialog is a confirmation dialog for node event button", () => {
			const button = mockType<TreeModel.TreeNodeEventActionButton>();
			const confirmation = mockType<TreeModel.ConfirmationText>();
			const nodeIdentifier = mockType<Identifier>();
			const nodePath = mockType<TreeEngineState.NodePath>();

			const dialog: TreeEngineState.Dialog.Confirmation.NodeEventButton = {
				type: TreeEngineState.Dialog.Type.CONFIRMATION,
				confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.NODE_EVENT_BUTTON,
				nodeIdentifier,
				nodePath,
				button,
				confirmation
			};

			const action = Events.onDialogConfirmed(dialog);

			const engineState: TreeEngineState = { ...basicEngineState, dialog };
			it("should close the dialog and dispatch an Events.onNodeEventButtonClicked action", () => {
				const { store, invoke } = setupTest(engineState);
				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onNodeEventButtonClicked({ nodeIdentifier, nodePath, button })
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given dialog is a confirmation dialog for make root node action", () => {
			const parentLinks = Array.from({ length: 3 }).map(() => mockType<TreeEngineState.Link>());
			const nodeIdentifier: Identifier = { id: "DomainTeam/1", type: "DomainTeam" };

			const dialog: TreeEngineState.Dialog.Confirmation.MakeRootNode = {
				type: TreeEngineState.Dialog.Type.CONFIRMATION,
				confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.MAKE_ROOT_NODE,
				nodeIdentifier,
				nodeDisplayName: "A12",
				parentLinks
			};
			const action = Events.onDialogConfirmed(dialog);

			const engineState: TreeEngineState = { ...basicEngineState, dialog };

			it("should close the dialog and dispatch an onMakeRootNodeRequest.done action", () => {
				const { store, invoke } = setupTest(engineState);

				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onMakeRootNodeRequest.done({ params: { nodeIdentifier, parentLinks }, result: {} })
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given dialog is a confirmation dialog for collapse multi-selection panel", () => {
			const dialog: TreeEngineState.Dialog.Confirmation.CollapseMultiSelectionPanel = {
				type: TreeEngineState.Dialog.Type.CONFIRMATION,
				confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.COLLAPSE_MULTI_SELECTION_PANEL
			};
			const action = Events.onDialogConfirmed(dialog);

			const engineState: TreeEngineState = { ...basicEngineState, dialog };

			it("should close the dialog and dispatch a Commands.setExpandedMultiSelectionPanel action", () => {
				const { store, invoke } = setupTest(engineState);

				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setExpandedMultiSelectionPanel({ expanded: false }));
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});

		describe("given dialog is a confirmation dialog for multi-selection event button", () => {
			const dialog: TreeEngineState.Dialog.Confirmation.MultiSelectionEventButton = {
				type: TreeEngineState.Dialog.Type.CONFIRMATION,
				confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.MULTI_SELECTION_EVENT_BUTTON,
				button: mockType<TreeModel.ButtonType>()
			};
			const action = Events.onDialogConfirmed(dialog);

			const engineState: TreeEngineState = { ...basicEngineState, dialog };

			it("should close the dialog and dispatch an Events.onMultiSelectionEventButtonClicked action", () => {
				const { store, invoke } = setupTest(engineState);

				invoke(action);

				expect(store.dispatch).toHaveBeenCalledTimes(2);
				expect(store.dispatch).toHaveBeenCalledWith(Commands.setDialogState({ state: null }));
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onMultiSelectionEventButtonClicked({ button: dialog.button })
				);
			});

			shouldCallNextMiddlewareAndReturnResultedAction(() => setupTest(engineState), action);
		});
	});

	describe("given a non-matched action", () => {
		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, nonMatchedAction);
	});
});
