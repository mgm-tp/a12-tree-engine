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

import type * as Enzyme from "enzyme";
import { vi } from "vitest";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { TreeTableNodeDropPosition, Button as ButtonWidget, Icon } from "@com.mgmtp.a12.widgets/widgets-core";

import { TreeModelKeys } from "../../../../../../core/services/localization/index.js";
import { DataSelector, ModelSelector, TreeEngineState } from "../../../../../../core/store/index.js";
import {
	type DndConfiguration,
	type EventHandlersDispatchMap,
	FlattenNodeRow,
	TreeEngineContextProvider,
	RootNodeRow,
	KeyboardShortcut
} from "../../../../../../core/view/index.js";
import { Button } from "../../../../../../core/view/components/content-box/sub-components/buttons.js";
import {
	createContextProps,
	defaultEngineState,
	deLocale,
	type PartialEventHandlerContextProps
} from "../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../utils/mock-utils.js";
import type { TreeModel } from "../../../../../../core/models/index.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.content-box.sub-components.buttons", () => {
	const basicEngineState = defaultEngineState;
	const basicButtonProps: Button.Props = {
		element: {
			id: "1024",
			event: "add"
		},
		componentKeys: ["footerBox", "buttons"]
	};

	function setupTest(
		customButtonProps?: Partial<Button.Props>,
		customEngineState?: Partial<TreeEngineState>,
		eventHandlers?: Partial<EventHandlersDispatchMap>,
		dndConfiguration?: DndConfiguration,
		locale?: Locale,
		customContextProps?: Partial<PartialEventHandlerContextProps>
	): Enzyme.ReactWrapper {
		const mergedButtonProps: Button.Props = {
			...basicButtonProps,
			...customButtonProps
		};

		return mount(
			<Button {...mergedButtonProps} />,
			{
				wrappingComponent: TreeEngineContextProvider,
				wrappingComponentProps: createContextProps(
					{ ...basicEngineState, ...customEngineState },
					{ eventHandlers, dndConfiguration, ...customContextProps }
				)
			},
			locale
		);
	}

	describe("id", () => {
		it("should have a proper id", () => {
			const result = setupTest();
			const button = result.find(ButtonWidget);

			expect(button).toHaveLength(1);
			expect(button.props().id).toBe(basicButtonProps.element.id);
		});
	});

	describe("label, description and ariaLabel", () => {
		describe("with locale", () => {
			describe("given english locale", () => {
				it("should have english label and title", () => {
					const result = setupTest({
						...basicButtonProps,
						element: {
							...basicButtonProps.element,
							label: [
								{
									locale: "en",
									text: "A label"
								}
							],
							description: [
								{
									locale: "en",
									text: "A title"
								}
							]
						}
					});
					const button = result.find(ButtonWidget);

					expect(button).toHaveLength(1);
					expect(button.props().label).toBe("A label");
					expect(button.props().title).toBe("A title");
				});
			});

			describe("given german locale", () => {
				it("should have german label and title", () => {
					const result = setupTest(
						{
							...basicButtonProps,
							element: {
								...basicButtonProps.element,
								label: [
									{
										locale: "de",
										text: "A label de"
									}
								],
								description: [
									{
										locale: "de",
										text: "A title de"
									}
								]
							}
						},
						undefined,
						undefined,
						undefined,
						deLocale
					);
					const button = result.find(ButtonWidget);

					expect(button).toHaveLength(1);
					expect(button.props().label).toBe("A label de");
					expect(button.props().title).toBe("A title de");
				});
			});
		});

		describe("with labelHidden", () => {
			type Expected = {
				label?: string;
				title?: string;
				ariaLabel?: string;
			};
			const testButton = (element: TreeModel.ButtonType, expected: Expected) => {
				const result = setupTest({
					...basicButtonProps,
					element
				});
				const button = result.find(ButtonWidget);

				expect(button).toHaveLength(1);
				expect(button.props().label).toBe(expected.label);
				expect(button.props().title).toBe(expected.title);
				expect(button.props().buttonAttributes?.["aria-label"]).toBe(expected.ariaLabel);
			};
			describe("given labelHidden = true", () => {
				it("should not render label, but render title and ariaLabel correctly", () => {
					const basedElement: TreeModel.ButtonType = {
						...basicButtonProps.element,
						labelHidden: true,
						label: [
							{
								locale: "en",
								text: "A label"
							}
						],
						description: [
							{
								locale: "en",
								text: "A title"
							}
						]
					};
					const input: TreeModel.ButtonType[] = [
						{ ...basedElement },
						{ ...basedElement, label: undefined },
						{ ...basedElement, description: undefined },
						{ ...basedElement, label: undefined, description: undefined }
					];
					const expected: Expected[] = [
						{
							label: undefined,
							title: "A title",
							ariaLabel: "A label - A title"
						},
						{
							label: undefined,
							title: "A title",
							ariaLabel: "A title"
						},
						{
							label: undefined,
							title: "A label",
							ariaLabel: "A label"
						},
						{
							label: undefined,
							title: undefined,
							ariaLabel: undefined
						}
					];
					input.forEach((item, index) => {
						testButton(item, expected[index]);
					});
				});
			});

			describe("given labelHidden = undefined", () => {
				it("should render label, title and ariaLabel correctly", () => {
					const basedElement: TreeModel.ButtonType = {
						...basicButtonProps.element,
						labelHidden: undefined,
						label: [
							{
								locale: "en",
								text: "A label"
							}
						],
						description: [
							{
								locale: "en",
								text: "A title"
							}
						]
					};
					const input: TreeModel.ButtonType[] = [
						{ ...basedElement },
						{ ...basedElement, label: undefined },
						{ ...basedElement, description: undefined },
						{ ...basedElement, label: undefined, description: undefined }
					];
					const expected: Expected[] = [
						{
							label: "A label",
							title: "A title",
							ariaLabel: "A label - A title"
						},
						{
							label: undefined,
							title: "A title",
							ariaLabel: "A title"
						},
						{
							label: "A label",
							title: undefined,
							ariaLabel: "A label"
						},
						{
							label: undefined,
							title: undefined,
							ariaLabel: undefined
						}
					];
					input.forEach((item, index) => {
						testButton(item, expected[index]);
					});
				});
			});
		});

		describe("with keyboard shortcut", () => {
			type Expected = {
				title?: string;
				ariaLabel?: string;
			};
			const testButton = (element: TreeModel.ButtonType, expected: Expected) => {
				const result = setupTest(
					{
						...basicButtonProps,
						element
					},
					undefined,
					undefined,
					undefined,
					undefined,
					{
						keyboardShortcuts: [
							{
								keyCombinations: [{ eventCode: "Delete" }],
								target: { type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION, event: "delete" }
							}
						]
					}
				);
				const button = result.find(ButtonWidget);

				expect(button).toHaveLength(1);
				expect(button.props().title).toBe(expected.title);
				expect(button.props().buttonAttributes?.["aria-label"]).toBe(expected.ariaLabel);
			};

			const basedElement: TreeModel.ButtonType = {
				...basicButtonProps.element,
				event: "delete",
				labelHidden: true,
				label: [
					{
						locale: "en",
						text: "A label"
					}
				],
				description: [
					{
						locale: "en",
						text: "A title"
					}
				]
			};

			describe("when labelHidden = true", () => {
				it("should render title and ariaLabel correctly with keyboard shortcut", () => {
					const input: TreeModel.ButtonType[] = [
						{ ...basedElement },
						{ ...basedElement, label: undefined },
						{ ...basedElement, description: undefined },
						{ ...basedElement, label: undefined, description: undefined }
					];
					const expected: Expected[] = [
						{
							title: "A title (Delete)",
							ariaLabel: "A label - A title (Delete)"
						},
						{
							title: "A title (Delete)",
							ariaLabel: "A title (Delete)"
						},
						{
							title: "A label (Delete)",
							ariaLabel: "A label (Delete)"
						},
						{
							title: "(Delete)",
							ariaLabel: "(Delete)"
						}
					];
					input.forEach((item, index) => {
						testButton(item, expected[index]);
					});
				});
			});

			describe("when labelHidden = undefined", () => {
				it("should render title and ariaLabel correctly with keyboard shortcut", () => {
					const input: TreeModel.ButtonType[] = [
						{ ...basedElement, labelHidden: undefined },
						{ ...basedElement, labelHidden: undefined, label: undefined },
						{ ...basedElement, labelHidden: undefined, description: undefined },
						{ ...basedElement, labelHidden: undefined, label: undefined, description: undefined }
					];
					const expected: Expected[] = [
						{
							title: "A title (Delete)",
							ariaLabel: "A label - A title (Delete)"
						},
						{
							title: "A title (Delete)",
							ariaLabel: "A title (Delete)"
						},
						{
							title: "(Delete)",
							ariaLabel: "A label (Delete)"
						},
						{
							title: "(Delete)",
							ariaLabel: "(Delete)"
						}
					];
					input.forEach((item, index) => {
						testButton(item, expected[index]);
					});
				});
			});
		});
	});

	describe("primary and destructive", () => {
		const testCases = [
			[false, false],
			[false, true],
			[false, undefined],
			[true, false],
			[true, true]
		];
		testCases.forEach(([primary, destructive]) => {
			describe(`when primary = ${primary}, destructive = ${destructive}`, () => {
				it(`should render button with primary = ${primary}, destructive = ${destructive}`, () => {
					const result = setupTest({
						...basicButtonProps,
						element: {
							...basicButtonProps.element,
							primary,
							destructive
						}
					}).find(ButtonWidget);

					expect(result).toHaveLength(1);
					expect(result.props().primary).toBe(primary);
					expect(result.props().destructive).toBe(destructive);
				});
			});
		});
	});

	describe("icon", () => {
		describe("given icon is undefined", () => {
			it("should not render icon", () => {
				const result = setupTest();
				const button = result.find(ButtonWidget);

				expect(button.props().icon).toBeUndefined();
			});
		});

		describe("given filled icon whose name is 'add'", () => {
			it("should render icon with theme = 'filled' and text = 'add'", () => {
				const result = setupTest({
					...basicButtonProps,
					element: {
						...basicButtonProps.element,
						icon: {
							theme: "filled",
							name: "add"
						}
					}
				});
				const icon = result.find(Icon);

				expect(icon.props().iconTheme).toBe("filled");
				expect(icon.props().children).toBe("add");
			});
		});
	});

	describe("styles", () => {
		describe("given styles = ['A', 'B', 'C']", () => {
			it("should render button with className = 'A B C'", () => {
				const result = setupTest({
					...basicButtonProps,
					element: {
						...basicButtonProps.element,
						styles: ["A", "B", "C"]
					}
				});
				const button = result.find(ButtonWidget);

				expect(button.props().className).toBe("A B C");
			});
		});
	});

	describe("onClick", () => {
		describe("when componentKey is not multi-selection button", () => {
			it("should call onEventButtonClicked with proper arguments", () => {
				const spy = vi.fn();
				const eventHandlers: Partial<EventHandlersDispatchMap> = { onEventButtonClicked: spy };
				const result = setupTest(undefined, undefined, eventHandlers);
				const button = getInteractiveElement(result.find(ButtonWidget));
				button.simulate("click");

				expect(spy).toHaveBeenCalledOnce();
				expect(spy).toHaveBeenCalledWith({ button: basicButtonProps.element });
			});
		});

		describe("when componentKey is multi-selection button", () => {
			it("should call onMultiSelectionEventButtonClicked with proper arguments", () => {
				const spy = vi.fn();
				const rootNodePath = TreeEngineState.NodePath.toString([basicEngineState.root.children[0]]);
				const eventHandlers: Partial<EventHandlersDispatchMap> = { onMultiSelectionEventButtonClicked: spy };
				const result = setupTest(
					{ componentKeys: TreeModelKeys.getMultiSelectionActionsKey() },
					{ multiSelectionNodes: { [rootNodePath]: TreeEngineState.MultiSelectionState.SELECTED } },
					eventHandlers
				);
				const button = getInteractiveElement(result.find(ButtonWidget));
				button.simulate("click");

				expect(spy).toHaveBeenCalledOnce();
				expect(spy).toHaveBeenCalledWith({ button: basicButtonProps.element });
			});
		});
	});

	describe("disabled", () => {
		const testCases: [ComponentKey: string[], OverallSelected: boolean, ExpectedDisabled: boolean][] = [
			[TreeModelKeys.getFooterBoxButtonsKey(), false, false],
			[TreeModelKeys.getFooterBoxButtonsKey(), true, true],
			[TreeModelKeys.getMultiSelectionActionsKey(), true, false],
			[TreeModelKeys.getMultiSelectionActionsKey(), false, true]
		];

		it("should be disabled regard of the componentKey and overall selected state", () => {
			const rootNodePath = TreeEngineState.NodePath.toString([basicEngineState.root.children[0]]);

			testCases.forEach(([componentKeys, overallSelected, expectedDisabled]) => {
				const result = setupTest(
					{ ...basicButtonProps, componentKeys },
					{
						...basicEngineState,
						multiSelectionNodes: {
							[rootNodePath]: overallSelected
								? TreeEngineState.MultiSelectionState.SELECTED
								: TreeEngineState.MultiSelectionState.DESELECTED
						}
					}
				);

				expect(result.find(ButtonWidget).props().disabled).toBe(expectedDisabled);
			});
		});

		describe("Copy/Cut/Paste event", () => {
			const pasteActionButtonProps: Button.Props = {
				...basicButtonProps,
				element: { ...basicButtonProps.element, event: "event_paste" }
			};
			const copyActionButtonProps: Button.Props = {
				...basicButtonProps,
				element: { ...basicButtonProps.element, event: "event_copy_nodes" }
			};
			const cutActionButtonProps: Button.Props = {
				...basicButtonProps,
				element: { ...basicButtonProps.element, event: "event_cut_nodes" }
			};
			const listActionButtonProps = [copyActionButtonProps, cutActionButtonProps];
			const basicNodeIdentifier = {
				id: "DomainTeam/1",
				type: "DomainTeam"
			};

			describe("Copied/cut nodes are not existed", () => {
				const testCases = [null, { action: TreeEngineState.Clipboard.Action.COPY, nodes: [] }];
				testCases.forEach((testCase) => {
					it("copy/cut button should not be disabled", () => {
						listActionButtonProps.forEach((buttonProps) => {
							const result = setupTest(buttonProps, { clipboard: testCase });
							const button = result.find(ButtonWidget);

							expect(button.props().disabled).toBe(false);
						});
					});

					it("paste button should be disabled", () => {
						const result = setupTest(pasteActionButtonProps, { clipboard: testCase });
						const button = result.find(ButtonWidget);

						expect(button.props().disabled).toBe(true);
					});
				});
			});

			const testCases = [
				{
					action: TreeEngineState.Clipboard.Action.COPY,
					details: "Copied nodes are existed",
					buttonProps: copyActionButtonProps
				},
				{
					action: TreeEngineState.Clipboard.Action.CUT,
					details: "Cut nodes are existed",
					buttonProps: cutActionButtonProps
				}
			];
			const personNodeIdentifier = { id: "DomainPerson/1", type: "DomainPerson" };
			testCases.forEach(({ action, details, buttonProps }) => {
				describe(details, () => {
					const clipboard: TreeEngineState.Clipboard = {
						action,
						nodes: [{ nodePath: [basicNodeIdentifier], nodeIdentifier: basicNodeIdentifier }]
					};

					beforeEach(() => {
						vi.spyOn(DataSelector, "nodesFromNodePath").mockReturnValue(() => [
							basicNodeIdentifier,
							personNodeIdentifier
						]);
						vi.spyOn(ModelSelector, "nodeModel").mockReturnValue(
							() => defaultEngineState.models.uiModel.content.nodes[1]
						);
					});

					afterEach(() => {
						vi.restoreAllMocks();
					});

					it("copy button should not be disabled", () => {
						const result = setupTest(buttonProps, { clipboard });
						const button = result.find(ButtonWidget);

						expect(button.props().disabled).toBe(false);
					});

					it("paste button should call canDrop callback to check the relationship between source and target nodes", () => {
						const canDropSpy = vi.fn();
						const dndConfiguration = mockType<DndConfiguration>({ canDrop: canDropSpy });
						const copiedRow = mockType<FlattenNodeRow>({});

						vi.spyOn(FlattenNodeRow, "createFromClipboardNode").mockReturnValue(copiedRow);

						setupTest(pasteActionButtonProps, { clipboard }, undefined, dndConfiguration);

						expect(canDropSpy).toHaveBeenCalled();
						expect(canDropSpy).toHaveBeenCalledOnce();
						expect(canDropSpy).toHaveBeenCalledWith({
							dragItem: { row: copiedRow, rowIndex: 0 },
							hoveredItem: { row: RootNodeRow.create(), rowIndex: 0, position: TreeTableNodeDropPosition.AS_CHILD }
						});
					});

					it("paste button should be disabled when canDrop return false", () => {
						vi.spyOn(FlattenNodeRow, "createFromClipboardNode").mockReturnValue(mockType<FlattenNodeRow>());
						const dndConfiguration = mockType<DndConfiguration>({ canDrop: () => false });

						const result = setupTest(pasteActionButtonProps, { clipboard }, undefined, dndConfiguration);
						const button = result.find(ButtonWidget);

						expect(button.props().disabled).toBe(true);
					});

					it("paste button should be enabled when canDrop return true", () => {
						vi.spyOn(FlattenNodeRow, "createFromClipboardNode").mockReturnValue(mockType<FlattenNodeRow>());
						const dndConfiguration = mockType<DndConfiguration>({ canDrop: () => true });

						const result = setupTest(pasteActionButtonProps, { clipboard }, undefined, dndConfiguration);
						const button = result.find(ButtonWidget);

						expect(button.props().disabled).toBe(false);
					});

					it("paste button should be disabled when the node is undefined (deleted or moved)", () => {
						vi.spyOn(DataSelector, "node").mockReturnValue(() => undefined);
						const dndConfiguration = mockType<DndConfiguration>({ canDrop: () => true });

						const result = setupTest(pasteActionButtonProps, { clipboard }, undefined, dndConfiguration);
						const button = result.find(ButtonWidget);

						expect(button.props().disabled).toBe(true);
					});
				});
			});
		});
	});
});
