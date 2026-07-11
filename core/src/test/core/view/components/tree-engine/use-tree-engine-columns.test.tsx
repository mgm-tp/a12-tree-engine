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

import * as Enzyme from "enzyme";
import * as React from "react";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { Icon, HiddenText } from "@com.mgmtp.a12.widgets/widgets-core";

import { type RuntimeTreeModel, TreeModel } from "../../../../../core/models/index.js";
import { type FlattenNodeRow, BodyCell, RowActionsGroup } from "../../../../../core/view/index.js";
import {
	useTreeEngineColumns,
	isNumberTypeColumn
} from "../../../../../core/view/components/tree-engine/use-tree-engine-columns.js";
import { defaultEngineState, deLocale } from "../../../../setup/basic.spec.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { createEngineState } from "../../../../utils/model-utils.js";
import { testHook } from "../../../../utils/test-utils.js";
import type { TreeEngineState } from "../../../../../core/store/index.js";
import { RowCheckbox, OverallCheckbox } from "../../../../../core/view/index.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.use-tree-engine-columns", () => {
	const basicEngineState = defaultEngineState;
	const basicModelColumns = basicEngineState.models.uiModel.content.columns;
	const basicModelNodes = basicEngineState.models.uiModel.content.nodes;
	const basicConfiguration = basicEngineState.models.uiModel.content.configuration;
	const [basicDomainTeamNode, basicDomainPersonNode] = basicModelNodes;
	const COLUMN_INDEX = 0;
	const basicActions: TreeModel.TreeNodeEventActionButton[] = [
		{
			type: "event",
			event: "add_event"
		}
	];

	const basicContextMenu: TreeModel.TreeNodeContextMenu = {
		groups: [
			{
				name: "xyz",
				actions: []
			}
		]
	};

	const numberColumn: TreeModel.Column = {
		id: "column-1024",
		label: [
			{
				locale: "en",
				text: "Test"
			}
		],
		width: 1,
		fixedWidth: false,
		name: "Test Number"
	};

	// From showcase/resources/models/a12-teams/document-models/DomainPerson.json
	const numberNodeColumn: RuntimeTreeModel.TreeNodeColumn = {
		columnRef: "column-1024",
		elementRef: "field_58899",
		elementPath: [
			{
				elementName: "Person"
			},
			{
				elementName: "PersonalData"
			},
			{
				elementName: "Photo"
			},
			{
				elementName: "size"
			}
		]
	};

	function setupTest(params?: {
		columns?: TreeModel.Column[];
		nodes?: RuntimeTreeModel.TreeNode[];
		actionColumnWidth?: TreeModel.Width;
		virtualRoot?: TreeModel.VirtualRootConfiguration;
		enableVirtualScroll?: TreeModel.Configuration["enableVirtualScroll"];
		locale?: Locale;
		columnWidths?: TreeEngineState.ColumnWidths;
		customEngineState?: Partial<TreeEngineState>;
	}) {
		const engineState = createEngineState
			.from({
				...basicEngineState,
				...params?.customEngineState,
				columnWidths: params?.columnWidths
			})
			.withColumns(params?.columns ?? basicModelColumns)
			.withNodes(params?.nodes ?? basicModelNodes)
			.withConfigurations({
				...basicConfiguration,
				virtualRoot: params?.virtualRoot,
				actionColumnWidth: params?.actionColumnWidth,
				enableVirtualScroll: params?.enableVirtualScroll
			})
			.create();

		return testHook(useTreeEngineColumns, [], engineState, undefined, params?.locale);
	}

	describe("Non action column", () => {
		describe("trivial properties", () => {
			it("should work properly", () => {
				const result = setupTest();

				expect(result).to.have.length(basicModelColumns.length);
				result.forEach((column, index) => {
					expect(column).to.be.include({
						type: "data",
						pinning: basicModelColumns[index].pinDirection,
						fixedWidth: basicModelColumns[index].fixedWidth,
						width: basicModelColumns[index].width,
						sortable: false,
						columnModel: basicModelColumns[index]
					});
				});
			});
		});

		describe("label and icon", () => {
			const findColumnIconAndLabel = (columnLabel: React.ReactNode) => {
				const wrapper = mount(columnLabel as React.ReactElement);
				const icon = wrapper.find(Icon);
				let label;
				switch (wrapper.length) {
					case 1:
						if (icon.length === 0) {
							label = wrapper.find("span").text();
						}
						break;
					case 2:
						label = wrapper.find("span").last().text();
						break;
					default:
				}
				return { icon, label };
			};
			describe("label", () => {
				describe("given english locale", () => {
					it("should return english label", () => {
						const result = setupTest();

						result.forEach((column, index) => {
							const { label } = findColumnIconAndLabel(column.label);
							expect(label).to.be.equal(basicModelColumns[index].label[0].text, "Wrong English label");
						});
					});
				});

				describe("given german locale", () => {
					it("should return german label", () => {
						const result = setupTest({ locale: deLocale });

						result.forEach((column, index) => {
							const { label } = findColumnIconAndLabel(column.label);
							expect(label).to.be.equal(basicModelColumns[index].label[1].text, "Wrong German label");
						});
					});
				});

				describe("given no label", () => {
					it("should not render label", () => {
						const columnModels: TreeModel.Column[] = [
							{
								...basicModelColumns[0],
								label: []
							}
						];
						const result = setupTest({ columns: columnModels });

						result.forEach((column) => {
							const { label } = findColumnIconAndLabel(column.label);
							expect(label).to.be.undefined;
						});
					});
				});
			});

			describe("icon", () => {
				describe("given a column with icon", () => {
					it("should render icon correctly", () => {
						const columnModels: TreeModel.Column[] = [
							{
								...basicModelColumns[0],
								icon: {
									name: "photo_camera"
								}
							},
							{
								...basicModelColumns[0],
								icon: {
									name: "location_on",
									theme: "outlined"
								}
							}
						];
						const result = setupTest({ columns: columnModels });
						result.forEach((column, index) => {
							const { icon } = findColumnIconAndLabel(column.label);
							expect(icon.props().children).to.be.equal(columnModels[index].icon?.name, "Wrong icon");
							expect(icon.props().iconTheme).to.be.equal(columnModels[index].icon?.theme, "Wrong theme");
						});
					});
				});
				describe("given a column without icon", () => {
					it("should not render icon", () => {
						const result = setupTest({ columns: [basicModelColumns[0]] });
						const column = result[0];
						const { icon } = findColumnIconAndLabel(column.label);
						expect(icon.length).to.be.equal(0, "Icon should not be rendered in case it is undefined");
					});
				});
			});

			describe("given a column model with icon, label, with/without labelHidden", () => {
				const columnModel: TreeModel.Column = {
					...basicModelColumns[0],
					icon: {
						name: "photo_camera"
					},
					label: [
						{
							locale: "en",
							text: "Photo"
						},
						{
							locale: "de",
							text: "Foto"
						}
					]
				};
				describe("with undefined labelHidden", () => {
					it("should render label", () => {
						const result = setupTest({ columns: [columnModel] });
						const column = result[0];
						const { icon, label } = findColumnIconAndLabel(column.label);
						expect(icon.props().title).to.be.equal(
							undefined,
							"Icon title should not be renderer when labelHidden = undefined"
						);
						expect(label).to.be.equal(columnModel.label[0].text, "Wrong label");
					});
				});
				describe("with labelHidden = true", () => {
					it("should render icon title", () => {
						const columnModelWithLabelHidden: TreeModel.Column = {
							...columnModel,
							labelHidden: true
						};
						const result = setupTest({ columns: [columnModelWithLabelHidden] });
						const column = result[0];
						const { icon, label } = findColumnIconAndLabel(column.label);
						expect(icon.props().title).to.be.equal(columnModel.label[0].text, "Wrong icon title");
						expect(label).to.be.equal(undefined, "Label should not be renderer when labelHidden = true");
					});
				});
			});

			describe("given a column model without icon and label is hidden", () => {
				it("should render label as hidden text", () => {
					const columnModel: TreeModel.Column = {
						...basicModelColumns[0],
						label: [
							{
								locale: "en",
								text: "Photo"
							},
							{
								locale: "de",
								text: "Foto"
							}
						],
						labelHidden: true
					};
					const result = setupTest({ columns: [columnModel] });
					const column = result[0];
					const wrapper = mount(column.label as React.ReactElement);
					expect(wrapper.find(HiddenText).text()).equal("Photo", "Wrong label");
				});
			});
		});

		describe("hierarchical", () => {
			it("hierarchical should be true only when its id is equal to hierarchicalColumnRef", () => {
				const result = setupTest();

				result.forEach((column, index) => {
					expect(column.hierarchical).to.be.equal(index === 1);
				});
			});
		});

		describe("specificHorizontalAlignment", () => {
			const alignments = [
				TreeModel.HorizontalAlignment.LEFT,
				TreeModel.HorizontalAlignment.CENTER,
				TreeModel.HorizontalAlignment.RIGHT,
				undefined
			];

			const columnAlignments = Array.from({ length: 16 }).map((_, index) => {
				return [alignments[Math.floor(index / 4)], alignments[index % 4]];
			});

			function createColumnAlignment(
				headerAlignment: TreeModel.HorizontalAlignment | undefined,
				contentAlignment: TreeModel.HorizontalAlignment | undefined
			): TreeModel.ColumnAlignment {
				return {
					header: {
						horizontal: headerAlignment
					},
					content: {
						horizontal: contentAlignment
					}
				};
			}

			describe("when the column is the hierarchical column", () => {
				columnAlignments.forEach(([headerAlignment, contentAlignment]) => {
					describe(`when headerAlignment =  ${headerAlignment}, contentAlignment = ${contentAlignment}`, () => {
						it("should keep those values", () => {
							const result = setupTest({
								columns: [
									mockType<TreeModel.Column>({
										id: basicEngineState.models.uiModel.content.configuration.hierarchicalColumnRef,
										label: [],
										alignment: createColumnAlignment(headerAlignment, contentAlignment)
									})
								]
							});

							expect(result).to.have.length(1);

							expect(result[0]?.specificHorizontalAlignment?.head).to.be.equal(headerAlignment);
							expect(result[0]?.specificHorizontalAlignment?.body).to.be.equal(contentAlignment);
						});
					});
				});
			});

			describe("when the column is not the hierarchical column", () => {
				describe("when the column is NON-number column", () => {
					columnAlignments.forEach(([headerAlignment, contentAlignment]) => {
						describe(`when headerAlignment =  ${headerAlignment}, contentAlignment = ${contentAlignment}`, () => {
							it("should keep those values", () => {
								const result = setupTest({
									columns: [
										mockType<TreeModel.Column>({
											id: "0",
											label: [],
											alignment: createColumnAlignment(headerAlignment, contentAlignment)
										})
									]
								});

								expect(result).to.have.length(1);

								expect(result[0]?.specificHorizontalAlignment?.head).to.be.equal(headerAlignment);
								expect(result[0]?.specificHorizontalAlignment?.body).to.be.equal(contentAlignment);
							});
						});
					});
				});

				describe("when the column is number column", () => {
					columnAlignments.forEach(([headerAlignment, contentAlignment], index) => {
						describe(`${index}when headerAlignment = ${headerAlignment}, contentAlignment = ${contentAlignment}`, () => {
							const expectedHeaderAlignment = index < 12 ? headerAlignment : TreeModel.HorizontalAlignment.RIGHT;
							const expectedContentAlignment = index % 4 !== 3 ? contentAlignment : TreeModel.HorizontalAlignment.RIGHT;

							it(`headerAlignment should be ${expectedHeaderAlignment}, contentAlignment should be ${expectedContentAlignment}`, () => {
								const result = setupTest({
									columns: [
										mockType<TreeModel.Column>({
											...numberColumn,
											alignment: createColumnAlignment(headerAlignment, contentAlignment)
										})
									],
									nodes: [
										{
											...basicDomainPersonNode,
											columns: [numberNodeColumn]
										}
									]
								});

								expect(result).to.have.length(1);

								expect(result[0]?.specificHorizontalAlignment?.head).to.be.equal(expectedHeaderAlignment);
								expect(result[0]?.specificHorizontalAlignment?.body).to.be.equal(expectedContentAlignment);
							});
						});
					});
				});
			});
		});

		describe("specificVerticalAlignment", () => {
			describe("when model's alignment is undefined", () => {
				it("should be Middle for header and Top for content as default", () => {
					const result = setupTest();

					result.forEach((column) => {
						expect(column.specificVerticalAlignment?.head).to.be.equal(TreeModel.VerticalAlignment.MIDDLE);
						expect(column.specificVerticalAlignment?.body).to.be.equal(TreeModel.VerticalAlignment.TOP);
					});
				});
			});

			describe("when model's alignment is defined", () => {
				it("should take from model's alignment", () => {
					const result = setupTest({
						columns: [
							mockType<TreeModel.Column>({
								id: "0",
								label: [],
								alignment: {
									header: {
										vertical: TreeModel.VerticalAlignment.BOTTOM
									},
									content: {
										vertical: TreeModel.VerticalAlignment.MIDDLE
									}
								}
							})
						]
					});

					expect(result).to.have.length(1);

					expect(result[0]?.specificVerticalAlignment?.head).to.be.equal(TreeModel.VerticalAlignment.BOTTOM);
					expect(result[0]?.specificVerticalAlignment?.body).to.be.equal(TreeModel.VerticalAlignment.MIDDLE);
				});
			});
		});

		describe("dataGetter", () => {
			afterEach(() => {
				Sinon.restore();
			});

			it("should return a BodyCell with proper props", () => {
				const { dataGetter } = setupTest()[COLUMN_INDEX];
				const row = mockType<FlattenNodeRow>();
				const result = Enzyme.shallow(<div>{dataGetter?.({ row, rowIndex: 1 })}</div>);

				const bodyCell = result.find(BodyCell);

				expect(bodyCell).to.have.length(1);
				expect(bodyCell.props().columnRef).to.be.equal(basicModelColumns[COLUMN_INDEX].id);
			});
		});
	});

	describe("Action Column", () => {
		describe("render", () => {
			describe("when no node or virtual root has actions or contextMenu", () => {
				it("should not render action column", () => {
					const result = setupTest({
						virtualRoot: { label: [], actions: [], contextMenu: { groups: [] } },
						nodes: [
							{ ...basicDomainTeamNode, actions: [], contextMenu: { groups: [] } },
							{ ...basicDomainPersonNode, actions: [], contextMenu: undefined }
						]
					});
					expect(result).to.have.length(basicModelColumns.length);
				});
			});

			describe("when one node has action", () => {
				it("should render action column", () => {
					const result = setupTest({ nodes: [{ ...basicDomainTeamNode, actions: basicActions }] });

					expect(result).to.have.length(basicModelColumns.length + 1);

					const lastColumn = result[result.length - 1];
					expect(lastColumn).to.have.property("actionColumn", true);
				});
			});

			describe("when virtual root node has action", () => {
				it("should render action column", () => {
					const result = setupTest({
						virtualRoot: { label: [], actions: [{ type: "event", event: "event" }], contextMenu: { groups: [] } },
						nodes: [{ ...basicDomainTeamNode, actions: [], contextMenu: { groups: [] } }]
					});

					expect(result).to.have.length(basicModelColumns.length + 1);

					const lastColumn = result[result.length - 1];
					expect(lastColumn).to.have.property("actionColumn", true);
				});
			});

			describe("when one node has contextMenu", () => {
				it("should render action column", () => {
					const result = setupTest({
						nodes: [
							{
								...basicDomainTeamNode,
								contextMenu: basicContextMenu
							}
						]
					});

					expect(result).to.have.length(basicModelColumns.length + 1);

					const lastColumn = result[result.length - 1];
					expect(lastColumn).to.have.property("actionColumn", true);
				});
			});
		});

		describe("properties", () => {
			describe("dataGetter", () => {
				it("should return a BodyCell with proper props", () => {
					const row = mockType<FlattenNodeRow>({
						nodeModel: {
							actions: basicActions,
							contextMenu: basicContextMenu
						}
					});
					const columns = setupTest({
						nodes: [
							{
								...basicDomainTeamNode,
								actions: [mockType<TreeModel.TreeNodeActionButton>()]
							}
						]
					});
					const actionColumn = columns[columns.length - 1];
					const { dataGetter } = actionColumn;

					const result = Enzyme.shallow(<div>{dataGetter?.({ row, rowIndex: COLUMN_INDEX })}</div>);
					const rowActionsGroup = result.find(RowActionsGroup);

					expect(actionColumn.type).to.be.equal("action");
					expect(rowActionsGroup).to.have.length(1);
					expect(rowActionsGroup.props()).to.be.deep.equal({ row });
				});
			});

			describe("given actionColumnWidth", () => {
				it("should have specified width", () => {
					const result = setupTest({
						nodes: [{ ...basicDomainTeamNode, actions: basicActions }],
						actionColumnWidth: 1.5
					});
					const actionColumn = result.find((column) => column.type === "action");
					expect(actionColumn).to.include({ width: 1.5 });
				});
			});

			describe("Trivial properties", () => {
				it("should have proper properties", () => {
					const result = setupTest({ nodes: [{ ...basicDomainTeamNode, actions: basicActions }] });
					const actionColumn = result[result.length - 1];

					expect(actionColumn).to.include({
						type: "action",
						actionColumn: true,
						horizontalAlignment: "right",
						verticalAlignment: "middle",
						pinning: "right",
						sortable: false,
						label: null
					});

					expect(result.slice(0, -1).every((column) => column.actionColumn)).to.not.be.true;
				});
			});
		});
	});

	describe("Checkbox Column", () => {
		describe("render", () => {
			describe("when expandedMultiSelectionPanel state = false", () => {
				it("should not render checkbox column", () => {
					const result = setupTest({ customEngineState: { expandedMultiSelectionPanel: false } });

					expect(result).to.have.length(basicModelColumns.length);
				});
			});

			describe("when expandedMultiSelectionPanel state = true", () => {
				it("should render checkbox column", () => {
					const result = setupTest({ customEngineState: { expandedMultiSelectionPanel: true } });

					expect(result).to.have.length(basicModelColumns.length + 1);
				});
			});
		});

		describe("properties", () => {
			describe("label & dataGetter", () => {
				it("should return a RowCheckbox with proper props", () => {
					const row = mockType<FlattenNodeRow>({
						nodeModel: { actions: basicActions, contextMenu: basicContextMenu }
					});

					const { label, dataGetter } = setupTest({ customEngineState: { expandedMultiSelectionPanel: true } })[0];
					const result = Enzyme.shallow(
						<div>
							{label}
							{dataGetter?.({ row, rowIndex: COLUMN_INDEX })}
						</div>
					);
					const overallCheckbox = result.find(OverallCheckbox);
					const rowCheckbox = result.find(RowCheckbox);

					expect(overallCheckbox).to.have.length(1);
					expect(rowCheckbox.props().row).to.be.equal(row);
				});
			});

			describe("width", () => {
				it("should be undefined when virtualScroll is not enabled", () => {
					const result = setupTest({
						customEngineState: { expandedMultiSelectionPanel: true },
						enableVirtualScroll: undefined
					});
					const actionColumn = result[0];

					expect(actionColumn.width).to.be.undefined;
				});
				it("should be 0.3 when virtualScroll is enabled", () => {
					const result = setupTest({
						customEngineState: { expandedMultiSelectionPanel: true },
						enableVirtualScroll: true
					});
					const actionColumn = result[0];

					expect(actionColumn.width).to.be.equal(0.3);
				});
			});

			describe("Trivial properties", () => {
				it("should have proper properties", () => {
					const result = setupTest({ customEngineState: { expandedMultiSelectionPanel: true } });
					const actionColumn = result[0];

					expect(actionColumn).to.include({
						type: "action",
						actionColumn: true,
						horizontalAlignment: "left",
						verticalAlignment: "middle",
						pinning: "left",
						sortable: false
					});
				});
			});
		});
	});

	describe("widths", () => {
		describe("when state does not have columnWidths", () => {
			it("should use the model column widths", () => {
				const result = setupTest().map((column) => column.width);

				expect(result).to.be.deep.equal([0.5, 2.5, 1, 1, 1]);
			});
		});

		describe("when state has columnWidths", () => {
			it("should use the columnWidths in state or fallback to the model widths", () => {
				const [firstColumn, secondColumn] = basicModelColumns;
				const result = setupTest({ columnWidths: { [firstColumn.id]: 4, [secondColumn.id]: 3 } }).map(
					(column) => column.width
				);

				expect(result).to.be.deep.equal([4, 3, 1, 1, 1]);
			});
		});
	});

	describe("isNumberTypeColumn", () => {
		const basicUIModel = basicEngineState.models.uiModel;
		const basicDocumentModels = basicEngineState.models.documentModels;
		const basicRelationshipModels = basicEngineState.models.modelGraph.relationshipModels;

		basicModelColumns.forEach((column) => {
			describe(`given a non-number column, named ${column.name}`, () => {
				it("should return false", () => {
					const result = isNumberTypeColumn(column, basicUIModel, basicDocumentModels, basicRelationshipModels);

					expect(result).to.be.false;
				});
			});
		});

		describe("given a number column", () => {
			it("should return true", () => {
				const result = isNumberTypeColumn(
					numberColumn,
					{
						...basicUIModel,
						content: {
							...basicUIModel.content,
							columns: [numberColumn],
							nodes: [
								{
									...basicDomainPersonNode,
									columns: [numberNodeColumn]
								}
							]
						}
					},
					basicDocumentModels,
					basicRelationshipModels
				);

				expect(result).to.be.true;
			});
		});

		describe("when not found corresponding documentModel", () => {
			it("should throw an error", () => {
				expect(() => isNumberTypeColumn(basicModelColumns[0], basicUIModel, [], basicRelationshipModels)).to.throw();
			});
		});
	});
});
