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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import type * as Enzyme from "enzyme";
import * as React from "react";
import { vi } from "vitest";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { ModalNotification, Button } from "@com.mgmtp.a12.widgets/widgets-core";

import type { TreeModel } from "../../../../../../core/models/index.js";
import { de } from "../../../../../../core/services/localization/languages/de.js";
import { en } from "../../../../../../core/services/localization/languages/en.js";
import type { RESOURCE_KEYS } from "../../../../../../core/services/localization/index.js";
import { TreeEngineState, type Identifier } from "../../../../../../core/store/index.js";
import {
	TreeEngineContextProvider,
	ConfirmationDialog,
	type EventHandlersDispatchMap
} from "../../../../../../core/view/index.js";
import { createContextProps, defaultEngineState, deLocale } from "../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../utils/mock-utils.js";
import { getInteractiveElement } from "../../../../../utils/test-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.dialogs.sub-components.confirmation-dialog", () => {
	const basicEngineState = defaultEngineState;
	const basicConfirmation: TreeModel.ConfirmationText = {
		title: [
			{ locale: "en", text: "Title en" },
			{ locale: "de", text: "Title de" }
		],
		message: [
			{ locale: "en", text: "Message en" },
			{ locale: "de", text: "Message de" }
		]
	};

	const basicEventButtonDialogState: TreeEngineState.Dialog.Confirmation.EventButton = {
		type: TreeEngineState.Dialog.Type.CONFIRMATION,
		confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.EVENT_BUTTON,
		button: { id: "0", event: "A" },
		confirmation: basicConfirmation
	};

	const basicNodeEventButtonDialogState: TreeEngineState.Dialog.Confirmation.NodeEventButton = {
		type: TreeEngineState.Dialog.Type.CONFIRMATION,
		confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.NODE_EVENT_BUTTON,
		button: {
			type: "event",
			event: "test_event"
		},
		confirmation: basicConfirmation,
		nodeIdentifier: mockType<Identifier>(),
		nodePath: mockType<TreeEngineState.NodePath>()
	};

	const basicMakeRootNodeDialogState: TreeEngineState.Dialog.Confirmation.MakeRootNode = {
		type: TreeEngineState.Dialog.Type.CONFIRMATION,
		confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.MAKE_ROOT_NODE,
		nodeIdentifier: { id: "DomainTeam/1", type: "DomainTeam" },
		nodeDisplayName: "A12",
		parentLinks: Array.from({ length: 3 }).map(() => mockType<TreeEngineState.Link>())
	};

	const basicDialogStates = [
		basicEventButtonDialogState,
		basicNodeEventButtonDialogState,
		basicMakeRootNodeDialogState
	];

	function setupTest(
		dialogState: TreeEngineState.Dialog.Confirmation,
		customEngineState?: Partial<TreeEngineState>,
		eventHandlers?: Partial<EventHandlersDispatchMap>,
		locale?: Locale
	): Enzyme.ReactWrapper {
		const contextProps = createContextProps(
			{
				...basicEngineState,
				...customEngineState
			},
			{
				eventHandlers
			}
		);

		return mount(
			<ConfirmationDialog dialogState={dialogState} />,
			{
				wrappingComponent: TreeEngineContextProvider,
				wrappingComponentProps: contextProps
			},
			locale
		);
	}

	function getDialogComponents(wrapper: Enzyme.ReactWrapper) {
		const dialog = wrapper.find(ModalNotification);

		const title = dialog.prop("title");
		const message = dialog.find(".contentbox__content").first().text();

		const buttons = dialog.find(Button);
		const closeButton = buttons.filterWhere((button) => button.key() === "close-button");
		const confirmButton = buttons.filterWhere((button) => button.key() === "confirm-button");

		return { title, message, closeButton, confirmButton };
	}

	let onDialogClosedSpy: ReturnType<typeof vi.fn>;
	let onDialogConfirmedSpy: ReturnType<typeof vi.fn>;
	let onEventButtonClickedSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		onDialogClosedSpy = vi.fn();
		onDialogConfirmedSpy = vi.fn();
		onEventButtonClickedSpy = vi.fn();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	basicDialogStates.forEach((dialogState, index) => {
		const isEventButton = index < 2;
		describe(`given a ${dialogState.confirmationType} dialog`, () => {
			describe("title", () => {
				describe("given undefined title", () => {
					it("should take title from RESOURCE_KEYS", () => {
						const result = setupTest({ ...dialogState, confirmation: {} });
						const { title } = getDialogComponents(result);

						expect(title).toBe(isEventButton ? "" : en.treeEngine.dialog.makeRootNode.title);
					});
				});

				describe("given empty title", () => {
					it("should take title from RESOURCE_KEYS", () => {
						const result = setupTest({
							...dialogState,
							confirmation: { title: [{ locale: "en", text: "" }] }
						});
						const { title } = getDialogComponents(result);

						expect(title).toBe(isEventButton ? "" : en.treeEngine.dialog.makeRootNode.title);
					});
				});

				describe("given english locale", () => {
					it("should render english title", () => {
						const result = setupTest(dialogState);
						const { title } = getDialogComponents(result);

						expect(title).toBe(isEventButton ? "Title en" : en.treeEngine.dialog.makeRootNode.title);
					});
				});

				describe("given german locale", () => {
					it("should render german title", () => {
						const result = setupTest(dialogState, undefined, undefined, deLocale);
						const { title } = getDialogComponents(result);

						expect(title).toBe(isEventButton ? "Title de" : de.treeEngine.dialog.makeRootNode.title);
					});
				});
			});

			describe("message", () => {
				const makeRootNodeMessage = (keys: typeof RESOURCE_KEYS) =>
					keys.treeEngine.dialog.makeRootNode.message.replace("$node$", "A12").replace("$linksCount$", "3");

				describe("given undefined message", () => {
					it("should take message from RESOURCE_KEYS", () => {
						const expectedMessage = isEventButton ? "" : makeRootNodeMessage(en);

						const result = setupTest({ ...dialogState, confirmation: {} });
						const { message } = getDialogComponents(result);

						expect(message).to.contain(expectedMessage);
					});
				});

				describe("given empty message", () => {
					it("should take message from RESOURCE_KEYS", () => {
						const expectedMessage = isEventButton ? "" : makeRootNodeMessage(en);

						const result = setupTest({
							...dialogState,
							confirmation: { title: [{ locale: "en", text: "" }] }
						});
						const { message } = getDialogComponents(result);

						expect(message).to.contain(expectedMessage);
					});
				});

				describe("given english locale", () => {
					it("should render english message", () => {
						const expectedMessage = isEventButton ? "Message en" : makeRootNodeMessage(en);

						const result = setupTest(dialogState);
						const { message } = getDialogComponents(result);

						expect(message).to.contain(expectedMessage);
					});
				});

				describe("given german locale", () => {
					it("should render german message", () => {
						const expectedMessage = isEventButton ? "Message de" : makeRootNodeMessage(de);

						const result = setupTest(dialogState, undefined, undefined, deLocale);
						const { message } = getDialogComponents(result);

						expect(message).to.contain(expectedMessage);
					});
				});
			});

			describe("close button", () => {
				describe("primary & destructive", () => {
					it("should be a secondary and no destructive button", () => {
						const result = setupTest(dialogState);
						const { closeButton } = getDialogComponents(result);

						expect(closeButton.props().primary).toBeUndefined();
						expect(closeButton.props().destructive).toBeUndefined();
					});
				});
				describe("given english locale", () => {
					it("should take english label from RESOURCE_KEYS", () => {
						const result = setupTest(dialogState);
						const { closeButton } = getDialogComponents(result);

						expect(closeButton.text()).toBe(en.treeEngine.dialog.confirmation.button.close);
					});
				});

				describe("given german locale", () => {
					it("should take german label from RESOURCE_KEYS", () => {
						const result = setupTest(dialogState, undefined, undefined, deLocale);
						const { closeButton } = getDialogComponents(result);

						expect(closeButton.text()).toBe(de.treeEngine.dialog.confirmation.button.close);
					});
				});

				describe("when click", () => {
					it("should call onDialogClosed event only", () => {
						const result = setupTest(dialogState, undefined, {
							onDialogClosed: onDialogClosedSpy,
							onDialogConfirmed: onDialogConfirmedSpy,
							onEventButtonClicked: onEventButtonClickedSpy
						});
						const { closeButton } = getDialogComponents(result);
						getInteractiveElement(closeButton).simulate("click");

						expect(onDialogClosedSpy).toHaveBeenCalledOnce();
						expect(onDialogConfirmedSpy).not.toHaveBeenCalled();
						expect(onEventButtonClickedSpy).not.toHaveBeenCalled();
					});
				});
			});

			describe("confirm button", () => {
				describe("primary & destructive", () => {
					it("should be a primary and destructive button", () => {
						const result = setupTest(dialogState);
						const { confirmButton } = getDialogComponents(result);

						expect(confirmButton.props().primary).toBe(true);
						expect(confirmButton.props().destructive).toBe(true);
					});
				});
				describe("given english locale", () => {
					it("should have proper english label", () => {
						const result = setupTest(dialogState);
						const { confirmButton } = getDialogComponents(result);

						expect(confirmButton.text()).toBe(en.treeEngine.dialog.confirmation.button.confirm);
					});
				});

				describe("given german", () => {
					it("should have proper german label", () => {
						const result = setupTest(dialogState, undefined, undefined, deLocale);
						const { confirmButton } = getDialogComponents(result);

						expect(confirmButton.text()).toBe(de.treeEngine.dialog.confirmation.button.confirm);
					});
				});

				describe("when click", () => {
					it("should call onDialogConfirmed event only", () => {
						const result = setupTest(dialogState, undefined, {
							onDialogClosed: onDialogClosedSpy,
							onDialogConfirmed: onDialogConfirmedSpy,
							onEventButtonClicked: onEventButtonClickedSpy
						});
						const { confirmButton } = getDialogComponents(result);

						getInteractiveElement(confirmButton).simulate("click");

						const { confirmation, ...expectPayload } =
							index === 0
								? (dialogState as TreeEngineState.Dialog.Confirmation.EventButton)
								: (dialogState as TreeEngineState.Dialog.Confirmation.NodeEventButton);

						expect(
							expect(onDialogConfirmedSpy).toHaveBeenCalledWith({
								payload: expectPayload
							})
						).toBe(true);
						expect(onEventButtonClickedSpy).not.toHaveBeenCalled();
					});
				});
			});
		});
	});

	describe("given collapse multi-selection panel confirmation dialog", () => {
		describe("when no given confirmation field", () => {
			const defaultCollapseMultiSelectionPanelDialogState: TreeEngineState.Dialog.Confirmation.CollapseMultiSelectionPanel =
				{
					type: TreeEngineState.Dialog.Type.CONFIRMATION,
					confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.COLLAPSE_MULTI_SELECTION_PANEL
				};
			describe("when given english locale", () => {
				it("should use the engine en_US default value", () => {
					const result = setupTest(defaultCollapseMultiSelectionPanelDialogState);
					const { title, message, confirmButton, closeButton } = getDialogComponents(result);

					expect(title).toBe(en.treeEngine.dialog.clearMultiSelection.title);
					expect(message).toBe(en.treeEngine.dialog.clearMultiSelection.message);
					expect(confirmButton.text()).toBe(en.treeEngine.dialog.clearMultiSelection.button.clearSelection);
					expect(closeButton.text()).toBe(en.treeEngine.dialog.clearMultiSelection.button.cancel);
				});
			});

			describe("when given german locale", () => {
				it("should use the engine de_DE default value", () => {
					const result = setupTest(defaultCollapseMultiSelectionPanelDialogState, undefined, undefined, deLocale);
					const { title, message, confirmButton, closeButton } = getDialogComponents(result);

					expect(title).toBe(de.treeEngine.dialog.clearMultiSelection.title);
					expect(message).toBe(de.treeEngine.dialog.clearMultiSelection.message);
					expect(confirmButton.text()).toBe(de.treeEngine.dialog.clearMultiSelection.button.clearSelection);
					expect(closeButton.text()).toBe(de.treeEngine.dialog.clearMultiSelection.button.cancel);
				});
			});
		});

		describe("when given confirmation field", () => {
			const customCollapseMultiSelectionPanelDialogState: TreeEngineState.Dialog.Confirmation.CollapseMultiSelectionPanel =
				{
					type: TreeEngineState.Dialog.Type.CONFIRMATION,
					confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.COLLAPSE_MULTI_SELECTION_PANEL,
					confirmation: {
						title: [
							{ locale: "en", text: "Clear Multi-selection Title en" },
							{ locale: "de", text: "Clear Multi-selection Title de" }
						],
						message: [
							{ locale: "en", text: "Clear Multi-selection Message en" },
							{ locale: "de", text: "Clear Multi-selection Message de" }
						]
					}
				};
			describe("when given english locale", () => {
				it("should use the engine en_US default value", () => {
					const result = setupTest(customCollapseMultiSelectionPanelDialogState);
					const { title, message, confirmButton, closeButton } = getDialogComponents(result);

					expect(title).toBe("Clear Multi-selection Title en");
					expect(message).toBe("Clear Multi-selection Message en");
					expect(confirmButton.text()).toBe(en.treeEngine.dialog.clearMultiSelection.button.clearSelection);
					expect(closeButton.text()).toBe(en.treeEngine.dialog.clearMultiSelection.button.cancel);
				});
			});

			describe("when given german locale", () => {
				it("should use the engine de_DE default value", () => {
					const result = setupTest(customCollapseMultiSelectionPanelDialogState, undefined, undefined, deLocale);
					const { title, message, confirmButton, closeButton } = getDialogComponents(result);

					expect(title).toBe("Clear Multi-selection Title de");
					expect(message).toBe("Clear Multi-selection Message de");
					expect(confirmButton.text()).toBe(de.treeEngine.dialog.clearMultiSelection.button.clearSelection);
					expect(closeButton.text()).toBe(de.treeEngine.dialog.clearMultiSelection.button.cancel);
				});
			});
		});
	});
});
