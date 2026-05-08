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
import { vi } from "vitest";

import { type ModelGraph } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type Locale, type LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { List } from "@com.mgmtp.a12.widgets/widgets-core/lib/list/index.js";

import {
	DataSelector,
	ModelSelector,
	TreeEngineState,
	type UIStateSelector
} from "../../../../../../core/store/index.js";
import {
	type DndConfiguration,
	FlattenNodeRow,
	RowAction,
	type TreeEngineRowContext
} from "../../../../../../core/view/index.js";
import { defaultEngineState, deLocale, type PartialEventHandlerContextProps } from "../../../../../setup/basic.spec.js";
import { mockType, type Stub } from "../../../../../utils/mock-utils.js";
import { TreeModel } from "../../../../../../core/models/index.js";

import { BodyCellWrapper, teamIdentifier, teamNodeModel } from "./body-cell/shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.row-action", () => {
	const basicEngineState = defaultEngineState;
	const basicNodeIdentifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};
	const NODE_ID = "1024";

	const basicNodeRow = mockType<FlattenNodeRow>({
		data: {
			nodeIdentifier: basicNodeIdentifier,
			nodePath: [basicNodeIdentifier]
		},
		nodeModel: {
			id: NODE_ID
		}
	});

	const onInsertChildNodeButtonClicked = vi.fn();
	const onNodeEventButtonClicked = vi.fn();

	const normalEventActionProps: RowAction.Props = {
		row: basicNodeRow,
		rowActionModel: {
			type: "event",
			event: "A",
			styles: ["style1", "style2"],
			...createLocalizedModelText("Normal Event")
		}
	};

	const normalInsertActionProps: RowAction.Props = {
		row: basicNodeRow,
		rowActionModel: {
			type: "insert",
			position: TreeModel.InsertPosition.AS_CHILD,
			...createLocalizedModelText("Normal Insert")
		}
	};

	const normalInsertSiblingActionProps: RowAction.Props = {
		row: basicNodeRow,
		rowActionModel: {
			type: "insert",
			documentModelRef: "DomainTeam",
			position: TreeModel.InsertPosition.BELOW,
			...createLocalizedModelText("Normal Sibling Insert")
		}
	};

	const contextEventActionProps: RowAction.Props = {
		row: basicNodeRow,
		rowActionModel: {
			type: "event",
			event: "B",
			...createLocalizedModelText("Context Event")
		},
		displayAsPopupEntry: true
	};

	const contextInsertActionProps: RowAction.Props = {
		row: basicNodeRow,
		rowActionModel: {
			type: "insert",
			position: TreeModel.InsertPosition.AS_CHILD,
			styles: ["style3", "style4"],
			...createLocalizedModelText("Context Insert")
		},
		displayAsPopupEntry: true
	};

	const basicRowContext: TreeEngineRowContext.Type = {
		rowState: {
			node: {
				document: {
					TeamDetails: {
						Location: "Munich",
						TeamName: "A12"
					},
					id: "DomainTeam/1"
				},
				identifier: teamIdentifier,
				children: []
			},
			nodeModel: teamNodeModel,
			uiState: mockType<UIStateSelector.NodeState>()
		},
		isCircular: false,
		shouldRenderPaginatedBodyRow: false
	};

	function setupTest(
		props: RowAction.Props,
		customEngineState?: Partial<TreeEngineState>,
		customRowContextProps?: Partial<TreeEngineRowContext.Type>,
		customEngineContextProps?: Partial<PartialEventHandlerContextProps>,
		locale?: Locale
	) {
		return mount(
			<RowAction {...props} />,
			{
				wrappingComponent: BodyCellWrapper,
				wrappingComponentProps: {
					customEngineState,
					rowContextProps: { ...basicRowContext, ...customRowContextProps },
					customEngineContextProps: {
						...customEngineContextProps,
						eventHandlers: {
							onNodeEventButtonClicked,
							onInsertChildNodeButtonClicked
						}
					}
				} as BodyCellWrapper.Props
			},
			locale
		);
	}

	interface TestCase {
		describe: string;
		rowActionProps: RowAction.Props;
		englishLabel: string;
		englishTitle?: string;
		germanLabel: string;
		germanTitle?: string;
		className?: string;
	}

	afterEach(() => {
		onInsertChildNodeButtonClicked.mockClear();
		onNodeEventButtonClicked.mockClear();
	});

	const normalTestCases: TestCase[] = [
		{
			describe: "Normal NodeEventActionButton",
			rowActionProps: normalEventActionProps,
			englishLabel: "Normal Event Label en",
			englishTitle: "Normal Event Title en",
			germanLabel: "Normal Event Label de",
			germanTitle: "Normal Event Title de",
			className: "style1 style2"
		},
		{
			describe: "Normal NodeInsertActionButton",
			rowActionProps: normalInsertActionProps,
			englishLabel: "Normal Insert Label en",
			englishTitle: "Normal Insert Title en",
			germanLabel: "Normal Insert Label de",
			germanTitle: "Normal Insert Title de"
		}
	];

	const priorityDestructiveVariants: Partial<Record<"primary" | "destructive", true | undefined>>[] = [
		{ primary: true },
		{ destructive: true },
		{ primary: true, destructive: true },
		{ primary: undefined, destructive: undefined }
	];

	normalTestCases.forEach((testCase, index) => {
		describe(`given ${testCase.describe}`, () => {
			describe("label", () => {
				describe("given english locale", () => {
					it("should render english label", () => {
						const result = setupTest(testCase.rowActionProps);
						const button = result.find(Button);

						expect(button.props().label).toBe(testCase.englishLabel);
					});
				});

				describe("given german locale", () => {
					it("should render german label", () => {
						const result = setupTest(testCase.rowActionProps, undefined, undefined, undefined, deLocale);
						const button = result.find(Button);

						expect(button.props().label).toBe(testCase.germanLabel);
					});
				});
			});

			describe("title", () => {
				describe("given english locale", () => {
					it("should render english title", () => {
						const result = setupTest(testCase.rowActionProps);
						const button = result.find(Button);

						expect(button).toHaveLength(1);
						expect(button.props().title).toBe(testCase.englishTitle);
					});
				});

				describe("given german locale", () => {
					it("should render german title", () => {
						const result = setupTest(testCase.rowActionProps, undefined, undefined, undefined, deLocale);
						const button = result.find(Button);

						expect(button).toHaveLength(1);
						expect(button.props().title).toBe(testCase.germanTitle);
					});
				});
			});

			describe("primary and destructive properties", () => {
				it("should pass those props into Widgets Button", () => {
					priorityDestructiveVariants.forEach((variant) => {
						const result = setupTest({
							...testCase.rowActionProps,
							rowActionModel: { ...testCase.rowActionProps.rowActionModel, ...variant }
						});
						const button = result.find(Button);

						expect(button.props().primary).toBe(variant.primary);
						expect(button.props().destructive).toBe(variant.destructive);
					});
				});
			});

			describe("labelHidden property", () => {
				it("should pass this property into Widgets Button", () => {
					const variants: (true | undefined)[] = [true, undefined];
					variants.forEach((variant) => {
						const result = setupTest({
							...testCase.rowActionProps,
							rowActionModel: { ...testCase.rowActionProps.rowActionModel, labelHidden: variant }
						});
						const button = result.find(Button);

						expect(button.props().labelHidden).toBe(variant);
					});
				});
			});

			describe("style", () => {
				it("should work properly", () => {
					const result = setupTest(testCase.rowActionProps);
					const button = result.find(Button);

					expect(button).toHaveLength(1);
					expect(button.props().className).toBe(testCase.className);
				});
			});

			describe("onClick", () => {
				const isEventButton = index === 0;

				it("should only call " + (isEventButton ? "onNodeEventButtonClicked" : onInsertChildNodeButtonClicked), () => {
					const result = setupTest(testCase.rowActionProps);
					const button = result.find(Button);

					expect(button).toHaveLength(1);

					button.props()?.onClick?.(mockType<React.MouseEvent<HTMLElement>>());

					if (isEventButton) {
						expect(
							expect(onNodeEventButtonClicked).toHaveBeenCalledWith({
								nodeIdentifier: testCase.rowActionProps.row.data.nodeIdentifier,
								nodePath: testCase.rowActionProps.row.data.nodePath,
								button: testCase.rowActionProps.rowActionModel
							})
						).toBe(true);
					} else {
						expect(
							expect(onInsertChildNodeButtonClicked).toHaveBeenCalledWith({
								nodeIdentifier: testCase.rowActionProps.row.data.nodeIdentifier,
								nodePath: testCase.rowActionProps.row.data.nodePath,
								button: testCase.rowActionProps.rowActionModel
							})
						).toBe(true);
					}
				});
			});
		});
	});

	const contextTestCases: TestCase[] = [
		{
			describe: "Context NodeEventActionButton",
			rowActionProps: contextEventActionProps,
			englishLabel: "Context Event Label en",
			germanLabel: "Context Event Label de"
		},
		{
			describe: "Context NodeInsertActionButton",
			rowActionProps: contextInsertActionProps,
			englishLabel: "Context Insert Label en",
			germanLabel: "Context Insert Label de",
			className: "style3 style4"
		}
	];

	contextTestCases.forEach((testCase, index) => {
		describe(`given ${testCase.describe}`, () => {
			describe("text", () => {
				describe("given english locale", () => {
					it("should render english label", () => {
						const result = setupTest(testCase.rowActionProps);
						const item = result.find(List.Item);

						expect(item.props().text).toBe(testCase.englishLabel);
					});
				});

				describe("given german locale", () => {
					it("should render german label", () => {
						const result = setupTest(testCase.rowActionProps, undefined, undefined, undefined, deLocale);
						const item = result.find(List.Item);

						expect(item.props().text).toBe(testCase.germanLabel);
					});
				});

				describe("style", () => {
					it("should work properly", () => {
						const result = setupTest(testCase.rowActionProps);
						const item = result.find(List.Item);

						expect(item).toHaveLength(1);
						expect(item.props().className).toBe(testCase.className);
					});
				});

				describe("onClick", () => {
					const isEventButton = index === 0;
					it("should call " + (isEventButton ? "onNodeEventButtonClicked" : onInsertChildNodeButtonClicked), () => {
						const result = setupTest(testCase.rowActionProps);
						const item = result.find(List.Item);

						expect(item).toHaveLength(1);

						item.at(0).props()?.onClick?.(mockType<React.MouseEvent<HTMLElement>>());

						if (isEventButton) {
							expect(
								expect(onNodeEventButtonClicked).toHaveBeenCalledWith({
									nodeIdentifier: testCase.rowActionProps.row.data.nodeIdentifier,
									nodePath: testCase.rowActionProps.row.data.nodePath,
									button: testCase.rowActionProps.rowActionModel
								})
							).toBe(true);
						} else {
							expect(
								expect(onInsertChildNodeButtonClicked).toHaveBeenCalledWith({
									nodeIdentifier: testCase.rowActionProps.row.data.nodeIdentifier,
									nodePath: testCase.rowActionProps.row.data.nodePath,
									button: testCase.rowActionProps.rowActionModel
								})
							).toBe(true);
						}
					});
				});
			});
		});
	});

	describe("disabled", () => {
		const getRowUIState: (params: { busy: boolean; isCircular?: boolean }) => TreeEngineRowContext.Type = ({
			busy,
			isCircular = false
		}) => ({
			rowState: {
				uiState: { selected: false, expanded: false, matchedCount: null, busy },
				nodeModel: basicNodeRow.nodeModel
			},
			isCircular,
			isLastPaginatedRow: false,
			shouldRenderPaginatedBodyRow: false
		});
		const rootNodePath = TreeEngineState.NodePath.toString([basicEngineState.root.children[0]]);

		describe("when disabled state is true", () => {
			it("should be disabled", () => {
				const customEngineState = { ...defaultEngineState, disabled: true };
				const result = setupTest(contextEventActionProps, customEngineState);
				const item = result.find(List.Item);
				expect(item.props().disabled).toBe(true);
			});
		});

		describe("Row event button", () => {
			describe("when its row is circular", () => {
				it("should be true", () => {
					const result = setupTest(normalEventActionProps, undefined, getRowUIState({ busy: false, isCircular: true }));
					const button = result.find(Button);

					expect(button.props().disabled).toBe(true);
				});
			});

			describe("when its row is not circular", () => {
				it("should be false", () => {
					const result = setupTest(normalEventActionProps, undefined, getRowUIState({ busy: false }));
					const button = result.find(Button);

					expect(button.props().disabled).toBe(false);
				});
			});

			describe("when it neither be busy nor has rowActionStateGetter nor has no selected nodes", () => {
				it("should be false", () => {
					const result = setupTest(
						normalEventActionProps,
						{ multiSelectionNodes: { [rootNodePath]: TreeEngineState.MultiSelectionState.DESELECTED } },
						getRowUIState({ busy: false })
					);
					const button = result.find(Button);

					expect(button.props().disabled).toBe(false);
				});
			});

			describe("when its busy state is true", () => {
				it("should be true", () => {
					const result = setupTest(normalEventActionProps, undefined, getRowUIState({ busy: true }));
					const button = result.find(Button);

					expect(button.props().disabled).toBe(true);
				});
			});

			describe("when result of rowActionStateGetter has disabled = true", () => {
				it("should be true", () => {
					const result = setupTest(normalEventActionProps, undefined, getRowUIState({ busy: false }), {
						rowActionStateGetter: ({ row }) => ({ disabled: row.data.nodeIdentifier.id === "DomainTeam/1" })
					});
					const button = result.find(Button);

					expect(button.props().disabled).toBe(true);
				});
			});

			describe("when having selected nodes", () => {
				it("should be true", () => {
					const result = setupTest(
						normalEventActionProps,
						{ multiSelectionNodes: { [rootNodePath]: TreeEngineState.MultiSelectionState.SELECTED } },
						getRowUIState({ busy: false })
					);
					const button = result.find(Button);

					expect(button.props().disabled).toBe(true);
				});
			});
		});

		describe("Context event button", () => {
			describe("when its row is circular", () => {
				it("should be true", () => {
					const result = setupTest(
						contextEventActionProps,
						{ multiSelectionNodes: { [rootNodePath]: TreeEngineState.MultiSelectionState.DESELECTED } },
						getRowUIState({ busy: false, isCircular: true })
					);
					const button = result.find(List.Item);

					expect(button.props().disabled).toBe(true);
				});
			});

			describe("when its row is not circular", () => {
				it("should be false", () => {
					const result = setupTest(contextEventActionProps, undefined, getRowUIState({ busy: false }));
					const button = result.find(List.Item);

					expect(button.props().disabled).toBe(false);
				});
			});

			describe("when it neither be busy nor has rowActionStateGetter nor no selected nodes", () => {
				it("should be false", () => {
					const result = setupTest(contextEventActionProps, undefined, getRowUIState({ busy: false }));
					const button = result.find(List.Item);

					expect(button.props().disabled).toBe(false);
				});
			});

			describe("when its busy state is true", () => {
				it("should be true", () => {
					const result = setupTest(contextEventActionProps, undefined, getRowUIState({ busy: true }));
					const button = result.find(List.Item);

					expect(button.props().disabled).toBe(true);
				});
			});

			describe("when result of rowActionStateGetter has disabled = true", () => {
				it("should be true", () => {
					const result = setupTest(contextEventActionProps, undefined, getRowUIState({ busy: false }), {
						rowActionStateGetter: ({ row }) => ({ disabled: row.data.nodeIdentifier.id === "DomainTeam/1" })
					});
					const button = result.find(List.Item);

					expect(button.props().disabled).toBe(true);
				});
			});

			describe("when having selected nodes", () => {
				it("should be true", () => {
					const result = setupTest(
						contextEventActionProps,
						{ multiSelectionNodes: { [rootNodePath]: TreeEngineState.MultiSelectionState.SELECTED } },
						getRowUIState({ busy: true })
					);
					const button = result.find(List.Item);

					expect(button.props().disabled).toBe(true);
				});
			});
		});

		describe("Paste event", () => {
			const pasteActionButtonProps: RowAction.Props = {
				...normalEventActionProps,
				rowActionModel: { ...normalEventActionProps.rowActionModel, type: "event", event: "event_paste" }
			};

			const rowContext = getRowUIState({ busy: false });

			describe("Copied/cut nodes are not existed", () => {
				const testCases = [null, { action: TreeEngineState.Clipboard.Action.COPY, nodes: [] }];
				testCases.forEach((testCase) => {
					it("should be disabled", () => {
						const result = setupTest(pasteActionButtonProps, { clipboard: testCase }, rowContext);
						const button = result.find(Button);

						expect(button.props().disabled).toBe(true);
					});
				});
			});

			const testCases = [
				{
					action: TreeEngineState.Clipboard.Action.COPY,
					details: "Copied nodes are existed"
				},
				{
					action: TreeEngineState.Clipboard.Action.CUT,
					details: "Cut nodes are existed"
				}
			];
			testCases.forEach(({ action, details }) => {
				describe(details, () => {
					const personNodeIdentifier = { id: "DomainPerson/1", type: "DomainPerson" };
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

					it("should call canDrop callback to check the relationship between source and target nodes", () => {
						const canDropSpy = vi.fn();
						const contextProps = { dndConfiguration: mockType<DndConfiguration>({ canDrop: canDropSpy }) };

						const copiedRow = mockType<FlattenNodeRow>({});
						vi.spyOn(FlattenNodeRow, "createFromClipboardNode").mockReturnValue(copiedRow);

						setupTest(pasteActionButtonProps, { clipboard }, rowContext, contextProps);

						expect(canDropSpy).toHaveBeenCalled();
						expect(canDropSpy).toHaveBeenCalledOnce();
						expect(canDropSpy).toHaveBeenCalledWith({
							dragItem: { row: copiedRow, rowIndex: 0 },
							hoveredItem: {
								row: pasteActionButtonProps.row,
								rowIndex: 0,
								position: TreeTableNodeDropPosition.AS_CHILD
							}
						});
					});

					it("should be disabled when canDrop return false", () => {
						const contextProps = { dndConfiguration: mockType<DndConfiguration>({ canDrop: () => false }) };

						const result = setupTest(pasteActionButtonProps, { clipboard }, rowContext, contextProps);
						const button = result.find(Button);

						expect(button.props().disabled).toBe(true);
					});

					it("should be enabled when canDrop return true", () => {
						vi.spyOn(FlattenNodeRow, "createFromClipboardNode").mockReturnValue(mockType<FlattenNodeRow>());
						const contextProps = { dndConfiguration: mockType<DndConfiguration>({ canDrop: () => true }) };

						const result = setupTest(pasteActionButtonProps, { clipboard }, rowContext, contextProps);
						const button = result.find(Button);

						expect(button.props().disabled).toBe(false);
					});

					it("should be disabled when the node is undefined (deleted or moved)", () => {
						vi.spyOn(DataSelector, "node").mockReturnValue(() => undefined);
						const contextProps = { dndConfiguration: mockType<DndConfiguration>({ canDrop: () => true }) };

						const result = setupTest(pasteActionButtonProps, { clipboard }, rowContext, contextProps);
						const button = result.find(Button);

						expect(button.props().disabled).toBe(true);
					});
				});
			});
		});

		describe("insert sibling event", () => {
			beforeEach(() => {
				vi.spyOn(ModelSelector, "subtypeModelsByName").mockReturnValue(() => [
					mockType<ModelGraph.DocumentModel>({ modelId: "DomainTeam" })
				]);
			});

			afterEach(vi.restoreAllMocks);

			describe("when its row is circular", () => {
				it("should be true", () => {
					const result = setupTest(
						normalInsertSiblingActionProps,
						undefined,
						getRowUIState({ busy: false, isCircular: true })
					);
					const button = result.find(Button);

					expect(button.props().disabled).toBe(true);
				});
			});

			describe("when its row is not circular", () => {
				it("should be false", () => {
					const result = setupTest(normalInsertSiblingActionProps, undefined, getRowUIState({ busy: false }));
					const button = result.find(Button);

					expect(button.props().disabled).toBe(false);
				});
			});

			describe("when it neither be busy nor has rowActionStateGetter nor has no selected nodes", () => {
				it("should be false", () => {
					const result = setupTest(
						normalInsertSiblingActionProps,
						{ multiSelectionNodes: { [rootNodePath]: TreeEngineState.MultiSelectionState.DESELECTED } },
						getRowUIState({ busy: false })
					);
					const button = result.find(Button);

					expect(button.props().disabled).toBe(false);
				});
			});

			describe("when its busy state is true", () => {
				it("should be true", () => {
					const result = setupTest(normalInsertSiblingActionProps, undefined, getRowUIState({ busy: true }));
					const button = result.find(Button);

					expect(button.props().disabled).toBe(true);
				});
			});

			describe("when result of rowActionStateGetter has disabled = true", () => {
				it("should be true", () => {
					const result = setupTest(normalInsertSiblingActionProps, undefined, getRowUIState({ busy: false }), {
						rowActionStateGetter: ({ row }) => ({ disabled: row.data.nodeIdentifier.id === "DomainTeam/1" })
					});
					const button = result.find(Button);

					expect(button.props().disabled).toBe(true);
				});
			});

			describe("when having selected nodes", () => {
				it("should be true", () => {
					const result = setupTest(
						normalInsertSiblingActionProps,
						{ multiSelectionNodes: { [rootNodePath]: TreeEngineState.MultiSelectionState.SELECTED } },
						getRowUIState({ busy: false })
					);
					const button = result.find(Button);

					expect(button.props().disabled).toBe(true);
				});
			});
		});
	});

	describe("label and description with labelHidden", () => {
		type Expected = {
			label?: string;
			title?: string;
			ariaLabel?: string;
		};
		const testButton = (rowActionModel: TreeModel.TreeNodeActionButton, expected: Expected) => {
			const result = setupTest({
				row: basicNodeRow,
				rowActionModel
			});
			const button = result.find(Button);

			expect(button).toHaveLength(1);
			expect(button.props().label).toBe(expected.label);
			expect(button.props().title).toBe(expected.title);
			expect(button.props().buttonAttributes?.["aria-label"]).toBe(expected.ariaLabel);
		};
		describe("given labelHidden = true", () => {
			it("should not render label, but render title and ariaLabel correctly", () => {
				it("for NodeEventActionButton", () => {
					const basedElement: TreeModel.TreeNodeActionButton = {
						...normalEventActionProps.rowActionModel,
						labelHidden: true
					};
					const input: TreeModel.TreeNodeActionButton[] = [
						{ ...basedElement },
						{ ...basedElement, label: undefined },
						{ ...basedElement, description: undefined },
						{ ...basedElement, label: undefined, description: undefined }
					];
					const expected: Expected[] = [
						{
							label: undefined,
							title: "Normal Event Title en",
							ariaLabel: "Normal Event Label en - Normal Event Title en"
						},
						{
							label: undefined,
							title: "Normal Event Title en",
							ariaLabel: "Normal Event Title en"
						},
						{
							label: undefined,
							title: "Normal Event Label en",
							ariaLabel: "Normal Event Label en"
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

				it("for NodeInsertActionButton", () => {
					const basedElement: TreeModel.TreeNodeActionButton = {
						...normalInsertActionProps.rowActionModel,
						labelHidden: true
					};
					const input: TreeModel.TreeNodeActionButton[] = [
						{ ...basedElement },
						{ ...basedElement, label: undefined },
						{ ...basedElement, description: undefined },
						{ ...basedElement, label: undefined, description: undefined }
					];
					const expected: Expected[] = [
						{
							label: undefined,
							title: "Normal Insert Title en",
							ariaLabel: "Normal Insert Label en - Normal Insert Title en"
						},
						{
							label: undefined,
							title: "Normal Insert Title en",
							ariaLabel: "Normal Insert Title en"
						},
						{
							label: undefined,
							title: "Normal Insert Label en",
							ariaLabel: "Normal Insert Label en"
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

		describe("given labelHidden = undefined", () => {
			it("should render label, title and ariaLabel correctly", () => {
				const basedElement: TreeModel.TreeNodeActionButton = {
					...normalEventActionProps.rowActionModel,
					labelHidden: undefined
				};
				const input: TreeModel.TreeNodeActionButton[] = [
					{ ...basedElement },
					{ ...basedElement, label: undefined },
					{ ...basedElement, description: undefined },
					{ ...basedElement, label: undefined, description: undefined }
				];
				const expected: Expected[] = [
					{
						label: "Normal Event Label en",
						title: "Normal Event Title en",
						ariaLabel: "Normal Event Label en - Normal Event Title en"
					},
					{
						label: undefined,
						title: "Normal Event Title en",
						ariaLabel: "Normal Event Title en"
					},
					{
						label: "Normal Event Label en",
						title: undefined,
						ariaLabel: "Normal Event Label en"
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

		describe("useLabelFromDocumentModel and useTitleFromDocumentModel", () => {
			let modelGraphStub: Stub<typeof ModelSelector.modelGraph>;

			beforeEach(() => {
				modelGraphStub = vi.spyOn(ModelSelector, "modelGraph").mockReturnValue(() => {
					return {
						documentModels: [
							{
								modelId: "DomainTeam",
								relations: ["TeamPerson", "TeamTeam"],
								subTypes: [],
								abstractModel: false,
								displayLabels: [
									{
										locale: "en",
										text: "DomainTeam - from ModelGraph"
									}
								]
							}
						],
						composeDocumentModels: [],
						relationshipModels: []
					};
				});
			});
			afterEach(() => {
				modelGraphStub.mockRestore();
			});

			it("should get value from displayLabels in modelGraph.documentModels", () => {
				const baseElement: TreeModel.TreeNodeInsertActionButton = {
					...normalEventActionProps.rowActionModel,
					type: "insert",
					documentModelRef: "DomainTeam"
				};
				const input: TreeModel.TreeNodeInsertActionButton[] = [
					{
						...baseElement,
						useLabelFromDocumentModel: true
					},
					{
						...baseElement,
						useTitleFromDocumentModel: true
					}
				];

				const expected: Expected[] = [
					{
						label: "DomainTeam - from ModelGraph",
						title: "Normal Event Title en",
						ariaLabel: "DomainTeam - from ModelGraph - Normal Event Title en"
					},
					{
						label: "Normal Event Label en",
						title: "DomainTeam - from ModelGraph",
						ariaLabel: "Normal Event Label en - DomainTeam - from ModelGraph"
					}
				];

				input.forEach((item, index) => {
					testButton(item, expected[index]);
				});
			});
		});
	});
});

function createLocalizedModelText(prefix: string): Record<"label" | "description", LocalizedModelText> {
	return {
		label: [
			{ locale: "en", text: prefix + " Label en" },
			{ locale: "de", text: prefix + " Label de" }
		],
		description: [
			{ locale: "en", text: prefix + " Title en" },
			{ locale: "de", text: prefix + " Title de" }
		]
	};
}
