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

import { type RuntimeTreeModel, type TreeModel } from "../../../../../../../core/models/index.js";
import {
	CellSelector,
	type RowState,
	type TreeEngineState,
	type UIStateSelector
} from "../../../../../../../core/store/index.js";
import {
	BodyCell,
	BodyCellUIValue,
	DefaultComponentMap,
	DocumentBodyCell,
	InitialExpansionPreventionTooltip,
	LinkDocumentBodyCell,
	type TreeEngineContextProvider,
	type TreeEngineRowContext
} from "../../../../../../../core/view/index.js";
import { defaultEngineState } from "../../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../../utils/mock-utils.js";
import { createEngineState } from "../../../../../../utils/model-utils.js";
import { testIsNullComponent } from "../../../../../../utils/test-utils.js";

import {
	basicLink,
	basicParentLink,
	BodyCellWrapper,
	CustomWidget,
	personCellProps,
	personIdentifier,
	personNodeModel,
	teamCellProps,
	teamIdentifier,
	teamNodeModel
} from "./shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.body-cell.body-cell", () => {
	const basicComponentMap = DefaultComponentMap;
	const basicEngineState = defaultEngineState;

	const basicRowContextProps: TreeEngineRowContext.Type = {
		rowState: {
			node: mockType<TreeEngineState.Node>({ identifier: personIdentifier }),
			nodeModel: personNodeModel,
			uiState: mockType<UIStateSelector.NodeState>()
		},
		parentRowState: mockType<RowState>({
			node: mockType<TreeEngineState.Node>({ identifier: teamIdentifier }),
			link: basicParentLink,
			nodeModel: teamNodeModel
		}),
		isCircular: false,
		shouldRenderPaginatedBodyRow: false
	};

	function setupTest(
		props: BodyCell.Props,
		customEngineState?: Partial<TreeEngineState>,
		customEngineContextProps?: Partial<TreeEngineContextProvider.Props>,
		customRowContextProps?: Partial<TreeEngineRowContext.Type>
	) {
		const bodyCellWrapperProps: BodyCellWrapper.Props = {
			customEngineState,
			customEngineContextProps,
			rowContextProps: { ...basicRowContextProps, ...customRowContextProps }
		};

		return mount(
			<BodyCellWrapper {...bodyCellWrapperProps}>
				<BodyCell {...props} />
			</BodyCellWrapper>
		);
	}

	describe("given document cell", () => {
		describe("when not found columnRef in nodeModel columns", () => {
			it("should render nothing", () => {
				const result = setupTest({ ...teamCellProps, columnRef: "1024" });

				testIsNullComponent(result);
			});
		});

		describe("when found columnRef in nodeModel columns", () => {
			describe("when given a custom DocumentBodyCell", () => {
				it("should use that custom component", () => {
					const result = setupTest(teamCellProps, undefined, {
						componentMap: {
							...basicComponentMap,
							DocumentBodyCell: () => <CustomWidget />
						}
					});
					const documentBodyCell = result.find(CustomWidget);

					expect(documentBodyCell).toHaveLength(1);
				});
			});

			describe("when not given a custom DocumentBodyCell", () => {
				it("should use the default component", () => {
					const result = setupTest(teamCellProps);
					const documentBodyCell = result.find(DocumentBodyCell);

					expect(documentBodyCell).toHaveLength(1);
					expect(documentBodyCell.props()).toEqual(teamCellProps);
				});
			});
		});
	});

	describe("given link cell", () => {
		describe("when it has no parent", () => {
			it("should render nothing", () => {
				const result = setupTest({
					...personCellProps,
					row: { ...personCellProps.row, parent: undefined }
				});

				testIsNullComponent(result);
			});
		});

		describe("when not found any child relationship of its parent is equal to row.link.identifier.type", () => {
			it("should render nothing", () => {
				const result = setupTest({
					...personCellProps,
					row: {
						...personCellProps.row,
						parent: {
							...personCellProps.row.parent,
							nodeModel: mockType<RuntimeTreeModel.TreeNode>({
								...teamNodeModel,
								childRelationshipConfigurations: []
							})
						}
					}
				});

				testIsNullComponent(result);
			});
		});

		describe("when found a child relationship in its parent, but not found the same columnRef in relationship columns", () => {
			it("should render nothing", () => {
				const result = setupTest({
					...personCellProps,
					columnRef: "1024",
					row: {
						...personCellProps.row,
						parent: {
							...personCellProps.row.parent,
							nodeModel: teamNodeModel
						}
					}
				});

				testIsNullComponent(result);
			});
		});

		describe("when child relationship and corresponding column are found", () => {
			describe("when given a custom DocumentBodyCell", () => {
				it("should use that custom component", () => {
					const result = setupTest(
						{
							...personCellProps,
							row: {
								...personCellProps.row,
								parent: { ...personCellProps.row.parent, nodeModel: teamNodeModel }
							}
						},
						undefined,
						{
							componentMap: { ...basicComponentMap, LinkDocumentBodyCell: () => <CustomWidget /> }
						},
						{
							...basicRowContextProps,
							rowState: { ...basicRowContextProps.rowState, link: basicLink }
						}
					);
					const linkBodyCell = result.find(CustomWidget);

					expect(linkBodyCell).toHaveLength(1);
				});
			});

			describe("when not given a custom LinkDocumentBodyCell", () => {
				it("should use the default component", () => {
					const result = setupTest(
						{
							...personCellProps,
							row: {
								...personCellProps.row,
								parent: { ...personCellProps.row.parent, nodeModel: teamNodeModel }
							}
						},
						undefined,
						undefined,
						{
							...basicRowContextProps,
							rowState: { ...basicRowContextProps.rowState, link: basicLink }
						}
					);
					const linkBodyCell = result.find(LinkDocumentBodyCell);

					expect(linkBodyCell).toHaveLength(1);
					expect(linkBodyCell.props()).toEqual(personCellProps);
				});
			});
		});
	});

	describe("given a hierarchical cell in a looped node row", () => {
		const cellProps = teamCellProps;
		const hierarchicalColumnRef = cellProps.columnRef;

		describe("given initial expansion mode is all_levels", () => {
			const engineState: TreeEngineState = createEngineState
				.from(defaultEngineState)
				.withConfigurations({
					...basicEngineState.models.uiModel.content.configuration,
					hierarchicalColumnRef,
					expansionStrategy: { type: "level_by_level", initialExpansion: { type: "all_levels" } }
				})
				.create();

			it("tooltip to warn circular relationship should be displayed", () => {
				const result = setupTest(cellProps, engineState, undefined, {
					isCircular: true
				});

				const tooltip = result.find(InitialExpansionPreventionTooltip);
				expect(tooltip).toHaveLength(1);
			});
		});

		const otherInitialExpansions: (TreeModel.ExpansionStrategy.LevelByLevel.InitialExpansion | undefined)[] = [
			{ type: "level_limit", level: 2 },
			undefined
		];

		otherInitialExpansions.forEach((initialExpansion) => {
			describe(`given initial expansion mode is ${initialExpansion?.type}`, () => {
				const engineState: TreeEngineState = createEngineState
					.from(defaultEngineState)
					.withConfigurations({
						...basicEngineState.models.uiModel.content.configuration,
						hierarchicalColumnRef,
						expansionStrategy: { type: "level_by_level", initialExpansion }
					})
					.create();

				it("tooltip to warn circular relationship should be not displayed", () => {
					const result = setupTest(cellProps, engineState);

					const tooltip = result.find(InitialExpansionPreventionTooltip);
					expect(tooltip).toHaveLength(0);
				});
			});
		});
	});

	describe("DocumentBodyCell", () => {
		const values = [0, "", false, null];
		values.forEach((value) => {
			describe(`value in DocumentBodyCell is ${value}`, () => {
				beforeEach(() => {
					vi.spyOn(CellSelector, "instanceValue").mockReturnValue(() => value);
				});

				afterEach(() => {
					vi.restoreAllMocks();
				});

				it(`BodyCellUiValue value property should be ${value}`, () => {
					const result = setupTest(teamCellProps);
					const bodyCellUiValue = result.find(BodyCellUIValue);

					expect(bodyCellUiValue.props().value).toBe(value);
				});
			});
		});

		describe("value in DocumentBodyCell is undefined", () => {
			beforeAll(() => {
				vi.spyOn(CellSelector, "instanceValue").mockReturnValue(() => undefined);
			});

			afterAll(() => {
				vi.restoreAllMocks();
			});
			it("should not render BodyCellUiValue", () => {
				const result = setupTest(teamCellProps);

				expect(result.find(BodyCellUIValue).exists()).toBe(false);
			});
		});
	});

	describe("LinkDocumentBodyCell", () => {
		const values = [0, "", false, null];
		values.forEach((value) => {
			describe(`value in LinkDocumentBodyCell is ${value}`, () => {
				beforeEach(() => {
					vi.spyOn(CellSelector, "linkDocumentInstanceValue").mockReturnValue(() => value);
				});

				afterEach(() => {
					vi.restoreAllMocks();
				});

				it(`BodyCellUiValue value property should be ${value}`, () => {
					const result = setupTest(
						{
							...personCellProps,
							row: {
								...personCellProps.row,
								parent: { ...personCellProps.row.parent, nodeModel: teamNodeModel }
							}
						},
						undefined,
						undefined,
						{
							...basicRowContextProps,
							rowState: { ...basicRowContextProps.rowState, link: basicLink }
						}
					);
					const bodyCellUiValue = result.find(BodyCellUIValue);

					expect(bodyCellUiValue.props().value).toBe(value);
				});
			});
		});

		describe("value in LinkDocumentBodyCell is undefined", () => {
			beforeAll(() => {
				vi.spyOn(CellSelector, "linkDocumentInstanceValue").mockReturnValue(() => undefined);
			});

			afterAll(() => {
				vi.restoreAllMocks();
			});
			it("should not render BodyCellUiValue", () => {
				const result = setupTest(
					{
						...personCellProps,
						row: {
							...personCellProps.row,
							parent: { ...personCellProps.row.parent, nodeModel: teamNodeModel }
						}
					},
					undefined,
					undefined,
					{
						...basicRowContextProps,
						rowState: { ...basicRowContextProps.rowState, link: basicLink }
					}
				);

				expect(result.find(BodyCellUIValue).exists()).toBe(false);
			});
		});
	});
});
