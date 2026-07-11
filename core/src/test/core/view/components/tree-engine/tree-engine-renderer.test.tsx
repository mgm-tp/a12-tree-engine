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

import * as React from "react";
import type { DraggableData, DraggableEvent } from "react-draggable";
import type { ReactWrapper } from "enzyme";

import {
	DefaultTreeTableComponentRenderers,
	TreeTable,
	type TreeTableProps,
	type TableRenderPropsType,
	TableTemplate,
	type TableTemplateProps,
	TextOutput,
	BodyRowTpl,
	type FlattenTreeTableNode
} from "@com.mgmtp.a12.widgets/widgets-core";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";

import { type RuntimeTreeModel, TreeModel } from "../../../../../core/models/index.js";
import { type Identifier, TreeEngineState, UIStateSelector } from "../../../../../core/store/index.js";
import {
	BodyRow,
	VirtualRootRow,
	DialogsRenderer,
	type EventHandlersDispatchMap,
	type FlattenNodeRow,
	type RowStyleGetter,
	type TreeEngineColumn,
	TreeEngineContextProvider,
	TreeEngineDataColumn,
	TreeEngineRenderer,
	useCellStyling,
	useEventHandlers,
	useRowStyling,
	RowProgressIndicator
} from "../../../../../core/view/index.js";
import * as TreeEngineColumnNamespace from "../../../../../core/view/components/tree-engine/use-tree-engine-columns.js";
import * as TreeEngineDndNamespace from "../../../../../core/view/configuration/dnd/use-dnd-options.js";
import { FlattenRowHooks } from "../../../../../core/view/components/tree-engine/use-flatten-rows.js";
import { createContextProps, defaultEngineState, deLocale, enLocale } from "../../../../setup/basic.spec.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { cartesianProduct, testHook } from "../../../../utils/test-utils.js";
import { createEngineState } from "../../../../utils/model-utils.js";

import { teamNodeModel } from "./sub-components/body-cell/shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.tree-engine-renderer", () => {
	type TreeTableType = TreeTableProps<FlattenNodeRow, TreeEngineColumn>;
	const basicEngineState = defaultEngineState;

	const basicIdentifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};

	const eventHandlers: { [event in keyof EventHandlersDispatchMap]: Sinon.SinonSpy } = {
		onNodeExpansionChanged: Sinon.spy(),
		onNodeSelectionChanged: Sinon.spy(),
		onEventButtonClicked: Sinon.spy(),
		onNodeEventButtonClicked: Sinon.spy(),
		onInsertChildNodeButtonClicked: Sinon.spy(),
		onDialogClosed: Sinon.spy(),
		onDialogConfirmed: Sinon.spy(),
		onColumnWidthsChanged: Sinon.spy(),
		onDndStarted: Sinon.spy(),
		onDndDone: Sinon.spy(),
		onBulkDndDone: Sinon.spy(),
		onDndHover: Sinon.spy(),
		onRowClicked: Sinon.spy(),
		onMultiSelectionButtonClicked: Sinon.spy(),
		onNodeMultiSelectionClicked: Sinon.spy(),
		onOverallMultiSelectionClicked: Sinon.spy(),
		onNodeRangeSelectionClicked: Sinon.spy(),
		onMultiSelectionEventButtonClicked: Sinon.spy(),
		onScrollToNodeDone: Sinon.spy(),
		onLoadMore: Sinon.spy(),
		onLoadAll: Sinon.spy()
	};

	function setupTest(
		props?: Partial<TreeEngineRenderer.Props>,
		customEngineState?: Partial<TreeEngineState>,
		locale?: Locale,
		dndConfiguration?: false,
		rowStyling?: RowStyleGetter
	) {
		return mount(
			<TreeEngineContextProvider
				{...createContextProps(
					{ ...basicEngineState, ...customEngineState },
					{ eventHandlers, dndConfiguration, rowStyling }
				)}>
				<TreeEngineRenderer {...props} />
			</TreeEngineContextProvider>,
			{},
			locale
		);
	}

	function setupHook<T>(hook: () => T, customEngineState?: TreeEngineState) {
		return testHook(hook, [], customEngineState ?? basicEngineState, { eventHandlers });
	}

	afterEach(() => {
		Object.values(eventHandlers).forEach((spy) => spy.resetHistory());
		vi.restoreAllMocks();
	});

	describe("hideRoot props", () => {
		describe("given virtual root not enabled", () => {
			it("should hide root", () => {
				const result = setupTest();
				const treeTable = result.find(TreeTable);

				expect(treeTable.props().hideRoot).toBe(true);
			});
		});
		describe("given virtual root enabled", () => {
			const engineState = createEngineState
				.from(basicEngineState)
				.withConfigurations({
					...basicEngineState.models.uiModel.content.configuration,
					virtualRoot: { label: [{ locale: "en", text: "Virtual Root" }] }
				})
				.create();

			it("should show root", () => {
				const result = setupTest(undefined, engineState);
				const treeTable = result.find(TreeTable);
				expect(treeTable.props().hideRoot).toBe(false);
			});

			it("should render virtual root row first", () => {
				const result = setupTest(undefined, engineState);
				const treeTable = result.find(TreeTable);
				const rows = treeTable.findWhere((wrapper) => wrapper.type() === VirtualRootRow || wrapper.type() === BodyRow);
				expect(rows.at(0).type()).toBe(VirtualRootRow);
			});
		});
	});

	describe("componentRenderers", () => {
		it("should be exist", () => {
			const { componentRenderers } = setupTest().find<TreeTableType>(TreeTable).props();

			expect(componentRenderers).toBeDefined();
		});

		describe("bodyRowRenderer", () => {
			beforeAll(() => {
				Sinon.stub(UIStateSelector, "nodeState").returns(() => mockType<UIStateSelector.NodeState>());
				Sinon.stub(DefaultTreeTableComponentRenderers, "bodyRowRenderer").returns(<></>);
			});

			afterAll(() => {
				Sinon.restore();
			});

			it("should return BodyRow", () => {
				const params: TableRenderPropsType.BodyRowProps<FlattenNodeRow> = {
					row: {
						id: "mockId",
						data: {
							nodeIdentifier: mockType<Identifier>(),
							nodePath: mockType<TreeEngineState.NodePath>()
						},
						nodeModel: mockType<RuntimeTreeModel.TreeNode>(),
						level: 2,
						childrenCount: 0,
						rowIndex: 0
					},
					rowIndex: 3,
					children: []
				};

				const bodyRowRenderer = setupTest().find<TreeTableType>(TreeTable).props().componentRenderers?.bodyRowRenderer;

				expect((bodyRowRenderer?.(params) as React.ReactElement).type).toBe(BodyRow);
			});
		});

		describe("bodyCellRenderer", () => {
			const testCases = [
				{
					columnType: "TreeEngineDataColumn",
					params: {
						row: mockType<FlattenTreeTableNode<FlattenNodeRow>>(),
						rowIndex: 1,
						column: {
							type: "data",
							id: "columnId",
							label: "sample label",
							columnModel: mockType<TreeModel.Column>()
						},
						relativeWidth: 1
					},
					key: "columnId"
				},
				{
					columnType: "TreeEngineActionColumn",
					params: {
						row: mockType<FlattenTreeTableNode<FlattenNodeRow>>(),
						rowIndex: 1,
						column: {
							type: "action",
							label: "sample label"
						},
						relativeWidth: 1
					},
					key: "action"
				}
			];

			testCases.forEach((testCase) => {
				it(`should use ${testCase.key} as component key for the ${testCase.columnType}`, () => {
					const bodyCellRenderer = setupTest().find<TreeTableType>(TreeTable).props()
						.componentRenderers?.bodyCellRenderer;
					expect((bodyCellRenderer?.(testCase.params) as React.ReactElement).key).toBe(testCase.key);
				});
			});

			it("should throw error for invalid column type", () => {
				const bodyCellRenderer = setupTest().find<TreeTableType>(TreeTable).props()
					.componentRenderers?.bodyCellRenderer;
				const params = {
					row: mockType<FlattenTreeTableNode<FlattenNodeRow>>(),
					rowIndex: 1,
					column: {
						label: "sample label"
					},
					relativeWidth: 1
				};
				expect(() => bodyCellRenderer?.(params)).toThrow("Invalid column type");
			});
		});

		describe("additionalContentRenderer", () => {
			it("should return RowProgressIndicator", () => {
				const params: TableRenderPropsType.BodyRowProps<FlattenNodeRow> = {
					row: {
						id: "mockId",
						data: {
							nodeIdentifier: mockType<Identifier>(),
							nodePath: mockType<TreeEngineState.NodePath>()
						},
						nodeModel: mockType<RuntimeTreeModel.TreeNode>(),
						level: 2,
						childrenCount: 0,
						rowIndex: 0
					},
					rowIndex: 3,
					children: []
				};

				const additionalContentRenderer = setupTest().find<TreeTableType>(TreeTable).props()
					.componentRenderers?.additionalContentRenderer;

				expect((additionalContentRenderer?.(params) as React.ReactElement).type).toBe(RowProgressIndicator);
			});
		});

		describe("headCellRenderer", () => {
			it("should be exist", () => {
				const headCellRenderer = setupTest().find<TreeTableType>(TreeTable).props()
					.componentRenderers?.headCellRenderer;

				expect(headCellRenderer).toBeDefined();
			});

			describe("when the column is not instance of TreeEngineDataColumn", () => {
				it("should pass undefined to className", () => {
					const props = {
						row: mockType<FlattenTreeTableNode<FlattenNodeRow>>(),
						rowIndex: 1,
						column: {
							type: "action",
							label: "sample label"
						},
						relativeWidth: 1
					};
					const headCellRenderer = setupTest().find<TreeTableType>(TreeTable).props()
						.componentRenderers?.headCellRenderer;

					const headCellProps = (headCellRenderer?.(props) as React.ReactElement).props as any;
					expect(headCellProps.className).toBeUndefined();
				});
			});

			describe("when the column is instance of TreeEngineDataColumn, and column has header styles", () => {
				beforeAll(() => {
					vi.spyOn(TreeEngineDataColumn, "isInstance").mockReturnValue(true);
				});

				it("should use the style of column header as className", () => {
					const props = mockType<TableRenderPropsType.HeadCellProps<TreeEngineDataColumn>>({
						column: {
							columnModel: {
								styles: {
									header: ["s1", "s2"],
									content: ["s3", "s4"]
								}
							}
						}
					});

					const headCellRenderer = setupTest().find<TreeTableType>(TreeTable).props()
						.componentRenderers?.headCellRenderer;

					const headCellProps = (headCellRenderer?.(props) as React.ReactElement).props as any;
					expect(headCellProps.className).toBe("s1 s2");
				});
			});
		});
	});

	describe("data", () => {
		let useFlattenRowsSpy: Sinon.SinonSpy<Parameters<typeof FlattenRowHooks.useFlattenRows>>;

		beforeEach(() => {
			useFlattenRowsSpy = Sinon.spy(FlattenRowHooks, "useFlattenRows");
		});

		it("should call useFlattenRows", () => {
			const { data } = setupTest().find(TreeTable).props();

			expect(data).toBeDefined();
			expect(useFlattenRowsSpy.called).toBe(true);
		});
	});

	describe("columns", () => {
		const modelColumns = basicEngineState.models.uiModel.content.columns;
		const customColumnWidths: TreeEngineState.ColumnWidths = modelColumns.reduce(
			(mapping, column) => ({ ...mapping, [column.id]: column.width }),
			{}
		);
		it("should call useTreeEngineColumns", () => {
			const useTreeEngineColumnsSpy = Sinon.spy(TreeEngineColumnNamespace, "useTreeEngineColumns");
			const { columns } = setupTest({ busy: true }).find(TreeTable).props();

			expect(columns).toBeDefined();
			expect(useTreeEngineColumnsSpy.called).toBe(true);

			useTreeEngineColumnsSpy.restore();
		});

		describe("resizable columns", () => {
			const customEngineState = createEngineState
				.from(basicEngineState)
				.withConfigurations({ ...basicEngineState.models.uiModel.content.configuration, enableColumnsResize: true })
				.create();

			it("should use model column widths initially", () => {
				const result = setupTest(undefined, customEngineState);
				const { columns } = result.find<TreeTableType>(TreeTable).props();

				expect(eventHandlers.onColumnWidthsChanged?.notCalled).toBe(true);
				expect(columns.map(({ width }) => width)).toEqual([0.5, 2.5, 1, 1, 1]);
			});

			describe("when nothing changes after resizing", () => {
				it("should not call onColumnWidthsChanged", () => {
					const result = setupTest(undefined, {
						...customEngineState,
						columnWidths: customColumnWidths
					});

					const { columns, columnResizingOptions } = result.find<TreeTableType>(TreeTable).props();
					const firstColumn = columns[0];

					columnResizingOptions?.onEndResize?.({
						resizedColumn: firstColumn,
						resizedWidthsGetter: (column) => {
							if (column === firstColumn) {
								return 0.5 as TreeModel.Width;
							}
							return undefined;
						},
						event: mockType<DraggableEvent>(),
						data: mockType<DraggableData>()
					});
					result.update();

					expect(eventHandlers.onColumnWidthsChanged?.notCalled).toBe(true);
				});
			});

			describe("when some columns change their widths after resizing", () => {
				it("should call onColumnWidthsChanged with proper widths", () => {
					const result = setupTest(undefined, {
						...customEngineState,
						columnWidths: customColumnWidths
					});
					const { columns, columnResizingOptions } = result.find<TreeTableType>(TreeTable).props();
					const firstColumn = columns[0];

					columnResizingOptions?.onEndResize?.({
						resizedColumn: firstColumn,
						resizedWidthsGetter: (column) => {
							if (column === firstColumn) {
								return 2 as TreeModel.Width;
							}
							return undefined;
						},
						event: mockType<DraggableEvent>(),
						data: mockType<DraggableData>()
					});
					result.update();

					expect(
						eventHandlers.onColumnWidthsChanged?.calledOnceWithExactly({
							changedColumnWidths: { [modelColumns[0].id]: 2 }
						})
					).be.true;
				});
			});
		});
	});

	describe("rowEventHandlers", () => {
		const basicNodeRow = mockType<FlattenNodeRow>({
			data: { nodeIdentifier: basicIdentifier, nodePath: [basicIdentifier] },
			nodeModel: teamNodeModel
		});

		it("should be existent", () => {
			const { rowEventHandlers } = setupTest().find(TreeTable).props();

			expect(rowEventHandlers).toBeDefined();
		});

		describe("when onArrowClick is called", () => {
			it("should call onNodeExpansionChanged only with proper arguments", () => {
				const rowEventHandlers = setupHook(useEventHandlers);
				rowEventHandlers?.({ row: { ...basicNodeRow, parent: undefined }, rowIndex: 0 })?.onArrowClick?.();

				Object.entries(eventHandlers).forEach(([eventName, spy]) => {
					expect(spy?.callCount).toBe(eventName === "onNodeExpansionChanged" ? 1 : 0);
				});

				expect(eventHandlers.onNodeExpansionChanged.callCount).toBe(1);
				expect(eventHandlers.onNodeExpansionChanged.calledOnceWithExactly({ ...basicNodeRow.data })).toBe(true);
			});
		});

		describe("when onClick is called", () => {
			describe("when tree engine is disabled", () => {
				it("should not call any callbacks", () => {
					const customEngineState = { ...basicEngineState, disabled: true };
					const { rowEventHandlers } = setupTest(undefined, customEngineState).find(TreeTable).props();
					rowEventHandlers?.({ row: { ...basicNodeRow, parent: undefined }, rowIndex: 0 }).onClick?.();

					Object.values(eventHandlers).forEach((eventHandler) => {
						expect(eventHandler.notCalled).toBe(true);
					});
				});
			});
			describe("when a row is non-interactive", () => {
				it("should not call any callbacks", () => {
					const rowStyling = () => ({ interactive: false });
					const { rowEventHandlers } = setupTest(undefined, basicEngineState, undefined, undefined, rowStyling)
						.find(TreeTable)
						.props();
					rowEventHandlers?.({ row: { ...basicNodeRow, parent: undefined }, rowIndex: 0 }).onClick?.();

					Object.values(eventHandlers).forEach((eventHandler) => {
						expect(eventHandler.notCalled).toBe(true);
					});
				});
			});
			describe("when a node is circular", () => {
				it("should not call any callbacks", () => {
					const row = {
						...mockType<FlattenNodeRow>(),
						data: {
							nodeIdentifier: { type: "DomainTeam", id: "1" },
							nodePath: [
								{ type: "DomainTeam", id: "1" },
								{ type: "TeamTeam", id: "11" },
								{ type: "TeamTeam", id: "12" }
							]
						},
						level: 2,
						parent: {
							id: "sampleId1",
							nodeModel: mockType<RuntimeTreeModel.TreeNode>(),
							level: 1,
							data: {
								nodeIdentifier: { type: "DomainTeam", id: "2" },
								nodePath: [
									{ type: "DomainTeam", id: "1" },
									{ type: "TeamTeam", id: "11" }
								]
							},
							parent: {
								id: "sampleId2",
								nodeModel: mockType<RuntimeTreeModel.TreeNode>(),
								level: 0,
								data: { nodeIdentifier: { type: "DomainTeam", id: "1" }, nodePath: [{ type: "DomainTeam", id: "1" }] }
							}
						}
					};
					const { rowEventHandlers } = setupTest().find(TreeTable).props();
					rowEventHandlers?.({
						row,
						rowIndex: 0
					}).onClick?.();

					Object.values(eventHandlers).forEach((eventHandler) => {
						expect(eventHandler.notCalled).toBe(true);
					});
				});
			});

			it("should call onRowClicked only with proper arguments", () => {
				const rowEventHandlers = setupHook(useEventHandlers);
				rowEventHandlers?.({ row: { ...basicNodeRow, parent: undefined }, rowIndex: 0 }).onClick?.();

				Object.entries(eventHandlers).forEach(([eventName, spy]) => {
					expect(spy.callCount).toBe(eventName === "onRowClicked" ? 1 : 0);
				});

				expect(
					eventHandlers.onRowClicked.calledOnceWithExactly({ ...basicNodeRow.data, nodeModel: basicNodeRow.nodeModel })
				).toBe(true);
			});

			describe("in multi selection", () => {
				let result: ReactWrapper;

				function clickRow(index: number) {
					result.find(BodyRowTpl).at(index).find('[data-role="table-body-row"]').at(0).simulate("click");
				}

				interface TestCase {
					readonly expandedMultiSelectionPanel: boolean;
					readonly collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption;
					readonly selectionArea: TreeModel.MultiSelectionConfiguration.SelectionArea;
					readonly hasSelectedRow: boolean;
					readonly expectedTriggerEvent: "onRowClick" | "onNodeMultiSelectionClicked";
				}

				function customEngineStateMultiSelection(testCase: TestCase) {
					const { expandedMultiSelectionPanel, collapseOption, selectionArea, hasSelectedRow } = testCase;
					return createEngineState
						.from({
							...basicEngineState,
							expandedMultiSelectionPanel,
							multiSelectionNodes: hasSelectedRow
								? { "DomainTeam[DomainTeam/1]": TreeEngineState.MultiSelectionState.SELECTED }
								: {}
						})
						.withConfigurations({
							...basicEngineState.models.uiModel.content.configuration,
							multiSelection: {
								counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.SIMPLE,
								collapseOption,
								selectionArea
							}
						})
						.create();
				}

				const testCases: TestCase[] = [
					// When selectionArea is the checkbox, onRowClick is always triggered
					...cartesianProduct<TestCase>(
						[{ selectionArea: TreeModel.MultiSelectionConfiguration.SelectionArea.CHECKBOX }],
						[{ expandedMultiSelectionPanel: true }, { expandedMultiSelectionPanel: false }],
						[
							{ collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_COLLAPSED },
							{ collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED }
						],
						[{ hasSelectedRow: true }, { hasSelectedRow: false }],
						[{ expectedTriggerEvent: "onRowClick" }]
					),
					...cartesianProduct<TestCase>(
						[
							{
								selectionArea: TreeModel.MultiSelectionConfiguration.SelectionArea.CHECKBOX,
								expandedMultiSelectionPanel: true,
								collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE
							}
						],
						[{ hasSelectedRow: true }, { hasSelectedRow: false }],
						[{ expectedTriggerEvent: "onRowClick" }]
					),
					// When multi-selection is turn-off and, selectionArea is the checkbox and row, onRowClick is always triggered
					...cartesianProduct<TestCase>(
						[
							{
								expandedMultiSelectionPanel: false,
								hasSelectedRow: false,
								selectionArea: TreeModel.MultiSelectionConfiguration.SelectionArea.CHECKBOX_AND_ROW
							}
						],
						[
							{ collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_COLLAPSED },
							{ collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED }
						],
						[{ expectedTriggerEvent: "onRowClick" }]
					),
					// When multi-selection is turned-on and can be collapsed, selectionArea is the checkbox and row, onRowsSelect is always triggered
					...cartesianProduct<TestCase>(
						[
							{
								expandedMultiSelectionPanel: true,
								selectionArea: TreeModel.MultiSelectionConfiguration.SelectionArea.CHECKBOX_AND_ROW
							}
						],
						[
							{ collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_COLLAPSED },
							{ collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED }
						],
						[{ hasSelectedRow: true }, { hasSelectedRow: false }],
						[{ expectedTriggerEvent: "onNodeMultiSelectionClicked" }]
					),
					// When multi-selection is turned-on and cannot be collapsed, selectionArea is the checkbox and row, onRowClick is triggered when no row is selected, otherwise onRowsSelect is triggered
					...cartesianProduct<TestCase>(
						[
							{
								expandedMultiSelectionPanel: true,
								selectionArea: TreeModel.MultiSelectionConfiguration.SelectionArea.CHECKBOX_AND_ROW,
								collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE
							}
						],
						[
							{ hasSelectedRow: true, expectedTriggerEvent: "onNodeMultiSelectionClicked" },
							{ hasSelectedRow: false, expectedTriggerEvent: "onRowClick" }
						]
					)
				];

				for (const testCase of testCases) {
					const { expandedMultiSelectionPanel, collapseOption, selectionArea, hasSelectedRow, expectedTriggerEvent } =
						testCase;
					describe(`When expandedMultiSelection = ${expandedMultiSelectionPanel}, collapseOption = ${collapseOption}, selectionArea = ${selectionArea}, hasSelectedRow = ${hasSelectedRow}`, () => {
						it("should trigger " + expectedTriggerEvent + " on row click", () => {
							result = setupTest(undefined, customEngineStateMultiSelection(testCase));

							clickRow(0);

							if (expectedTriggerEvent === "onRowClick") {
								expect(eventHandlers.onRowClicked.called).toBe(true);
								expect(eventHandlers.onNodeMultiSelectionClicked.notCalled).toBe(true);
							} else if (expectedTriggerEvent === "onNodeMultiSelectionClicked") {
								expect(eventHandlers.onRowClicked.notCalled).toBe(true);
								expect(eventHandlers.onNodeMultiSelectionClicked.called).toBe(true);
							} else {
								throw new Error("Unexpected expectedTriggerEvent value");
							}
						});
					});
				}
			});
		});
	});

	describe("dragDropOptions", () => {
		describe("when dnd is enable", () => {
			it("should call useTreeEngineDndConfiguration", () => {
				const useTreeEngineDndConfigurationSpy = Sinon.spy(TreeEngineDndNamespace, "useDndOptions");
				const { dragDropOptions } = setupTest().find(TreeTable).props();

				expect(dragDropOptions).toBeDefined();
				expect(useTreeEngineDndConfigurationSpy.called).toBe(true);

				useTreeEngineDndConfigurationSpy.restore();
			});
		});
		describe("when dnd is disable by tree engine context", () => {
			it("should be undefined", () => {
				const { dragDropOptions } = setupTest(undefined, undefined, undefined, false).find(TreeTable).props();
				expect(dragDropOptions).toBeUndefined();
			});
		});
		describe("when dnd is disable by modeling", () => {
			it("should be undefined", () => {
				const customEngineState = createEngineState
					.from(basicEngineState)
					.withConfigurations({ ...basicEngineState.models.uiModel.content.configuration, dnd: undefined })
					.create();
				const { dragDropOptions } = setupTest(undefined, customEngineState).find(TreeTable).props();
				expect(dragDropOptions).toBeUndefined();
			});
		});
	});

	describe("columnResizingOptions", () => {
		describe("when not enable resizable columns", () => {
			it("Widget Table should receive undefined columnResizingOptions", () => {
				const result = setupTest(
					undefined,
					createEngineState
						.from(basicEngineState)
						.withConfigurations({
							...basicEngineState.models.uiModel.content.configuration,
							enableColumnsResize: undefined
						})
						.create()
				);
				const { columnResizingOptions } = result.find<TreeTableType>(TreeTable).props();

				expect(columnResizingOptions).toBeUndefined();
			});
		});

		describe("when enable resizable columns", () => {
			it("Widget Table should receive defined columnResizingOptions", () => {
				const result = setupTest(
					undefined,
					createEngineState
						.from(basicEngineState)
						.withConfigurations({ ...basicEngineState.models.uiModel.content.configuration, enableColumnsResize: true })
						.create()
				);
				const { columnResizingOptions } = result.find<TreeTableType>(TreeTable).props();

				expect(columnResizingOptions).not.toBeUndefined();
			});
		});
	});

	describe("rowStyling", () => {
		const basicNodeRow = mockType<FlattenNodeRow>({
			data: { nodeIdentifier: basicIdentifier }
		});

		it("should be existent", () => {
			const { rowStyling } = setupTest().find(TreeTable).props();

			expect(rowStyling).toBeDefined();
		});

		describe("selected", () => {
			describe("when row is selected", () => {
				beforeAll(() => {
					Sinon.stub(UIStateSelector, "nodeState").returns(() =>
						mockType<UIStateSelector.NodeState>({ selected: true })
					);
				});

				it("rowStyling.selected should be true", () => {
					const rowStyling = setupHook(useRowStyling);

					expect(rowStyling({ row: basicNodeRow, rowIndex: 0 }).selected).toBe(true);
				});
			});

			describe("when row is not selected", () => {
				beforeAll(() => {
					Sinon.stub(UIStateSelector, "nodeState").returns(() =>
						mockType<UIStateSelector.NodeState>({ selected: false })
					);
				});

				it("rowStyling.selected should be false", () => {
					const rowStyling = setupHook(useRowStyling);

					expect(rowStyling({ row: basicNodeRow, rowIndex: 0 }).selected).toBe(false);
				});
			});
		});

		describe("collapsed", () => {
			describe("when row is expanded", () => {
				beforeAll(() => {
					Sinon.stub(UIStateSelector, "nodeState").returns(() =>
						mockType<UIStateSelector.NodeState>({ expanded: true })
					);
				});

				it("rowStyling.collapsed should be false", () => {
					const rowStyling = setupHook(useRowStyling);

					expect(rowStyling({ row: basicNodeRow, rowIndex: 0 }).collapsed).toBe(false);
				});
			});

			describe("when row is collapsed", () => {
				beforeAll(() => {
					Sinon.stub(UIStateSelector, "nodeState").returns(() =>
						mockType<UIStateSelector.NodeState>({ expanded: false })
					);
				});

				it("rowStyling.collapsed should be true", () => {
					const rowStyling = setupHook(useRowStyling);

					expect(rowStyling({ row: basicNodeRow, rowIndex: 0 }).collapsed).toBe(true);
				});
			});
		});

		describe("interactive", () => {
			const testCases = [
				[true, false],
				[false, true]
			];

			testCases.forEach(([rowBusy, expectedBusy]) => {
				describe(`when row.busy is ${rowBusy}`, () => {
					beforeEach(() => {
						Sinon.stub(UIStateSelector, "nodeState").returns(() =>
							mockType<UIStateSelector.NodeState>({ busy: rowBusy })
						);
					});

					it("rowStyling.interactive should be " + expectedBusy, () => {
						const rowStyling = setupHook(useRowStyling);

						expect(rowStyling({ row: basicNodeRow, rowIndex: 0 }).interactive).toBe(expectedBusy);
					});
				});
			});
		});

		describe("highlighted", () => {
			const testCases: [TreeEngineState.MultiSelectionState | undefined, boolean][] = [
				[undefined, false],
				[TreeEngineState.MultiSelectionState.DESELECTED, false],
				[TreeEngineState.MultiSelectionState.PARTLY_SELECTED, false],
				[TreeEngineState.MultiSelectionState.SELECTED, true]
			];

			testCases.forEach(([multiSelection, expectedHighlight]) => {
				describe(`when row.multiSelection is ${multiSelection}`, () => {
					beforeEach(() => {
						Sinon.stub(UIStateSelector, "nodeState").returns(() =>
							mockType<UIStateSelector.NodeState>({ multiSelection })
						);
					});

					it("rowStyling.highlighted should be " + expectedHighlight, () => {
						const rowStyling = setupHook(useRowStyling);

						expect(rowStyling({ row: basicNodeRow, rowIndex: 0 }).highlighted).toBe(expectedHighlight);
					});
				});
			});
		});

		describe("className", () => {
			const testCases: [TreeModel.Styles | undefined, number, string][] = [
				[undefined, 0, "treeEngine__node--level-0"],
				[["s1"], 1, "s1 treeEngine__node--level-1"],
				[["s2", "s3"], 2, "s2 s3 treeEngine__node--level-2"]
			];

			testCases.forEach(([styles, level, expectedClassName]) => {
				describe(`when node styles are ${styles}, row.level is ${level}`, () => {
					beforeEach(() => {
						Sinon.stub(UIStateSelector, "nodeState").returns(() => mockType<UIStateSelector.NodeState>());
					});

					it("rowStyling.className should be '" + expectedClassName + "'", () => {
						const rowStyling = setupHook(useRowStyling);

						expect(
							rowStyling({
								rowIndex: 0,
								row: mockType<FlattenNodeRow>({
									...basicNodeRow,
									level,
									nodeModel: { styles }
								})
							}).className
						).toBe(expectedClassName);
					});
				});
			});
		});

		describe("style", () => {
			describe("when rowHeight is set", () => {});
			it("should be applicable for virtual root", () => {
				const customEngineState = {
					...basicEngineState,
					models: {
						...basicEngineState.models,
						uiModel: {
							...basicEngineState.models.uiModel,
							content: {
								...basicEngineState.models.uiModel.content,
								configuration: { ...basicEngineState.models.uiModel.content.configuration, rowHeight: 50 }
							}
						}
					}
				};
				const rowStyling = setupHook(useRowStyling, customEngineState);
				const rootNodeRow = mockType<FlattenNodeRow>({
					data: { nodeIdentifier: { id: "ROOT", type: "ROOT" }, nodePath: [] }
				});

				expect(rowStyling({ row: rootNodeRow, rowIndex: 0 }).style?.height).equal(50);
			});
		});
	});

	describe("cellStyling", () => {
		it("should be existent", () => {
			const { cellStyling } = setupTest().find(TreeTable).props();

			expect(cellStyling).toBeDefined();
		});

		describe("when column is not an instance of TreeEngineDataColumn", () => {
			beforeAll(() => {
				Sinon.stub(TreeEngineDataColumn, "isInstance").returns(false);
			});

			it("the classname should be undefined", () => {
				const column = mockType<TreeEngineColumn>();
				const row = mockType<FlattenNodeRow>();
				const cellStyling = setupHook(useCellStyling);

				expect(cellStyling({ column, row, rowIndex: 0 }).className).toBeUndefined();
			});
		});

		describe("when column is an instance of TreeEngineDataColumn", () => {
			beforeAll(() => {
				Sinon.stub(TreeEngineDataColumn, "isInstance").returns(true);
			});

			it("the className should be taken from content styles of column", () => {
				const column = mockType<TreeEngineDataColumn>({
					columnModel: { styles: { header: ["s1", "s2"], content: ["s3", "s4"] } }
				});
				const row = mockType<FlattenNodeRow>();
				const cellStyling = setupHook(useCellStyling);

				expect(cellStyling({ column, row, rowIndex: 0 }).className).toBe("s3 s4");
			});
		});
	});

	describe("DialogsRenderer", () => {
		it("should be called", () => {
			const dialogRenderer = setupTest().find(DialogsRenderer);

			expect(dialogRenderer).toHaveLength(1);
		});
	});

	describe("virtualScroll", () => {
		describe("no given virtual scroll in model", () => {
			const engineState = createEngineState
				.from(basicEngineState)
				.withConfigurations({
					...basicEngineState.models.uiModel.content.configuration,
					enableVirtualScroll: undefined
				})
				.create();

			it("should render Tree Table without virtual scroll", () => {
				const result = setupTest(undefined, engineState);
				const treeTable = result.find(TreeTable);
				expect(treeTable.props().virtualScrollOptions).toBeUndefined();
			});
		});

		describe("given virtual scroll enabled in model", () => {
			const engineState = createEngineState
				.from(basicEngineState)
				.withConfigurations({
					...basicEngineState.models.uiModel.content.configuration,
					enableVirtualScroll: true,
					rowHeight: 80,
					actionColumnWidth: 0.5
				})
				.create();

			it("should render Tree Table with virtual scroll enabled", () => {
				const result = setupTest(undefined, engineState);
				const treeTable = result.find(TreeTable);
				expect(treeTable.props().virtualScrollOptions).toContain({ rowHeight: 80 });
			});

			it("should use the row height in model instead of row style", () => {
				const result = setupTest(undefined, engineState);
				const treeTable = result.find(TreeTable);
				expect(treeTable.props().virtualScrollOptions).toContain({ rowHeight: 80 });

				const tableRows = result.find(TableTemplate.BodyRow);
				tableRows.forEach((tableRow) => {
					expect(tableRow.props().style?.height).toBeUndefined();
				});
			});
		});
	});

	describe("rowHeight", () => {
		describe("when the tree model does not has rowHeight", () => {
			it("row style should not have height", () => {
				const result = setupTest();
				const tableRows = result.find(TableTemplate.BodyRow);
				tableRows.forEach((tableRow) => {
					expect(tableRow.props().style?.height).toBeUndefined();
				});
			});
		});

		describe("when the tree model has rowHeight", () => {
			it("row style should have configured height", () => {
				const engineState = createEngineState
					.from(basicEngineState)
					.withConfigurations({
						...basicEngineState.models.uiModel.content.configuration,
						rowHeight: 50
					})
					.create();
				const result = setupTest(undefined, engineState);
				const tableRows = result.find(TableTemplate.BodyRow);

				tableRows.forEach((tableRow) => {
					expect(tableRow.props().style?.height).toBe(50);
				});
			});
		});
	});

	describe("Disabled", () => {
		it("should be disabled if state disabled value is true", () => {
			const customEngineState = { ...basicEngineState, disabled: true };
			const result = setupTest(undefined, customEngineState);
			expect(result.find(TreeTable).props().disabled).toBe(true);
		});
	});

	describe("rowTitle", () => {
		describe("when tree model has no config for rowTitle", () => {
			it("rows should not have title", () => {
				const result = setupTest(undefined, basicEngineState);
				const tableRows = result.find(TableTemplate.BodyRow);
				tableRows.forEach((tableRow) => {
					expect(tableRow.props().title).toBeUndefined();
				});
			});
		});
		describe("when the tree model has rowTitle", () => {
			const rowTitle = [
				{
					locale: enLocale.language,
					text: "Select this row to see Person details"
				},
				{
					locale: deLocale.language,
					text: "Select this row to see Person details [de]"
				}
			];
			const nodes: RuntimeTreeModel.TreeNode[] = [
				basicEngineState.models.uiModel.content.nodes[0],
				{
					...basicEngineState.models.uiModel.content.nodes[1],
					rowTitle
				}
			];

			const runtimeEngineState = {
				...basicEngineState,
				expandedNodes: {
					"DomainTeam[DomainTeam/2]": {}
				}
			};

			const findRowWithNodeName = (
				tableRows: ReactWrapper<TableTemplateProps.BodyRowProps>,
				nodeName: string
			): ReactWrapper<TableTemplateProps.BodyRowProps> | undefined => {
				for (let i = 0; i < tableRows.length; i++) {
					const tableRow = tableRows.at(i);
					const textOutput = tableRow.find(TextOutput);
					if (textOutput.exists() && textOutput.at(0).text() === nodeName) {
						return tableRow;
					}
				}
				return undefined;
			};

			describe("interactive row should have configured title", () => {
				const engineState = createEngineState.from(runtimeEngineState).withNodes(nodes).create();
				it("locale = en", () => {
					const result = setupTest(undefined, engineState, enLocale);
					const tableRows = result.find(TableTemplate.BodyRow);
					expect(findRowWithNodeName(tableRows, "A12")?.props().title).toBeUndefined();
					expect(findRowWithNodeName(tableRows, "Development")?.props().title).toBeUndefined();
					expect(findRowWithNodeName(tableRows, "Person 1")?.props().title).toBe(rowTitle[0].text);
					expect(findRowWithNodeName(tableRows, "Person 2")?.props().title).toBe(rowTitle[0].text);
					expect(findRowWithNodeName(tableRows, "UP")?.props().title).toBeUndefined();
				});
				it("locale = de", () => {
					const result = setupTest(undefined, engineState, deLocale);
					const tableRows = result.find(TableTemplate.BodyRow);

					expect(findRowWithNodeName(tableRows, "A12")?.props().title).toBeUndefined();
					expect(findRowWithNodeName(tableRows, "Development")?.props().title).toBeUndefined();
					expect(findRowWithNodeName(tableRows, "Person 1")?.props().title).toBe(rowTitle[1].text);
					expect(findRowWithNodeName(tableRows, "Person 2")?.props().title).toBe(rowTitle[1].text);
					expect(findRowWithNodeName(tableRows, "UP")?.props().title).toBeUndefined();
				});
			});

			describe("non-interactive row should not have title", () => {
				it("when tree engine is disabled", () => {
					const engineState = createEngineState
						.from({
							...runtimeEngineState,
							disabled: true
						})
						.withNodes(nodes)
						.create();
					const result = setupTest(undefined, engineState);
					const tableRows = result.find(TableTemplate.BodyRow);

					tableRows.forEach((tableRow) => {
						expect(tableRow.props().title).toBeUndefined();
					});
				});
				it("when a node is busy", () => {
					const engineState = createEngineState
						.from({
							...runtimeEngineState,
							busyNodes: {
								DomainPerson: {
									"DomainPerson/166": {}
								}
							}
						})
						.withNodes(nodes)
						.create();
					const result = setupTest(undefined, engineState);
					const tableRows = result.find(TableTemplate.BodyRow);

					expect(findRowWithNodeName(tableRows, "Person 1")?.props().title).toBeUndefined();
					expect(findRowWithNodeName(tableRows, "Person 2")?.props().title).toBe(rowTitle[0].text);
				});
			});
		});
	});
});
