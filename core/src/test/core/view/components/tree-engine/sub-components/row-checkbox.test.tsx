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

import { vi } from "vitest";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { Checkbox } from "@com.mgmtp.a12.widgets/widgets-core";

import { Events, TreeEngineState, type UIStateSelector } from "../../../../../../core/store/index.js";
import type { FlattenNodeRow, TreeEngineRowContext } from "../../../../../../core/view/index.js";
import { defaultEngineState, deLocale, type PartialEventHandlerContextProps } from "../../../../../setup/basic.spec.js";
import { en } from "../../../../../../core/services/localization/languages/en.js";
import { de } from "../../../../../../core/services/localization/languages/de.js";
import { mockType } from "../../../../../utils/mock-utils.js";
import { RowCheckbox } from "../../../../../../core/view/index.js";
import { testIsNullComponent } from "../../../../../utils/test-utils.js";

import { BodyCellWrapper, teamIdentifier, teamNodeModel } from "./body-cell/shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.row-checkbox", () => {
	const basicNodeIdentifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};

	const basicNodeRow = mockType<FlattenNodeRow>({
		data: {
			nodeIdentifier: basicNodeIdentifier,
			nodePath: [basicNodeIdentifier]
		},
		parent: mockType<FlattenNodeRow>({ data: { nodePath: [] } })
	});

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
		customComponentProps?: Partial<RowCheckbox.Props>,
		customEngineState?: Partial<TreeEngineState>,
		customEngineContextProps?: Partial<PartialEventHandlerContextProps>,
		locale?: Locale,
		customRowContextProps?: Partial<TreeEngineRowContext.Type>
	) {
		return mount(
			<RowCheckbox row={basicNodeRow} {...customComponentProps} />,
			{
				wrappingComponent: BodyCellWrapper,
				wrappingComponentProps: {
					customEngineState,
					rowContextProps: { ...basicRowContext, ...customRowContextProps },
					customEngineContextProps
				} as BodyCellWrapper.Props
			},
			locale
		);
	}

	describe("rendering", () => {
		const customNodeRow: FlattenNodeRow = {
			...basicNodeRow,
			data: { ...basicNodeRow.data, nodePath: [basicNodeIdentifier, { type: "TeamTeam", id: "TeamTeam/1" }] }
		};

		afterEach(() => vi.restoreAllMocks());

		describe("when the row is a circular node", () => {
			it("should render nothing", () => {
				const result = setupTest({ row: customNodeRow }, undefined, undefined, undefined, { isCircular: true });
				testIsNullComponent(result);
			});
		});

		describe("when the row is not a circular node", () => {
			it("should render as usual", () => {
				const result = setupTest({ row: customNodeRow });
				expect(result.find(Checkbox.Indeterminate)).toHaveLength(1);
			});
		});
	});

	describe("title", () => {
		describe("when given english locale", () => {
			it("should take from english RESOURCE_KEYS", () => {
				const result = setupTest(undefined);

				expect(result.find(Checkbox.Indeterminate).props().title).toBe(en.treeEngine.multiSelection.rowCheckboxTitle);
			});
		});

		describe("when given german locale", () => {
			it("should take from german RESOURCE_KEYS", () => {
				const result = setupTest(undefined, undefined, undefined, deLocale);

				expect(result.find(Checkbox.Indeterminate).props().title).toBe(de.treeEngine.multiSelection.rowCheckboxTitle);
			});
		});
	});

	describe("checked", () => {
		const testCases: [TreeEngineState.MultiSelectionState, boolean | "mixed"][] = [
			[TreeEngineState.MultiSelectionState.SELECTED, true],
			[TreeEngineState.MultiSelectionState.DESELECTED, false],
			[TreeEngineState.MultiSelectionState.PARTLY_SELECTED, "mixed"]
		];

		it("should return expected checked value", () => {
			testCases.forEach(([multiSelectionState, expectedCheck]) => {
				const result = setupTest(undefined, undefined, undefined, undefined, {
					rowState: {
						...basicRowContext.rowState,
						uiState: { ...basicRowContext.rowState.uiState, multiSelection: multiSelectionState }
					}
				});

				expect(result.find(Checkbox.Indeterminate).props().checked).toBe(expectedCheck);
			});
		});
	});

	describe("onChange", () => {
		describe("click", () => {
			it("should call onNodeMultiSelectionClicked", () => {
				const spy = vi.fn();
				const result = setupTest(
					undefined,
					{ expandedMultiSelectionPanel: true },
					{ eventHandlers: { onNodeMultiSelectionClicked: spy } }
				);
				result.find("button").simulate("click");

				expect(
					expect(spy).toHaveBeenCalledWith({
						nodeIdentifier: basicNodeIdentifier,
						nodePath: [basicNodeIdentifier]
					})
				).toBe(true);
			});
		});

		describe("shift-click when there is not any selected node", () => {
			it("should call onNodeRangeSelectionClicked", () => {
				const spy = vi.fn();
				const result = setupTest(
					undefined,
					{ expandedMultiSelectionPanel: true },
					{ eventHandlers: { onNodeRangeSelectionClicked: spy } }
				);
				result.find("button").simulate("click", { shiftKey: true });

				expect(
					expect(spy).toHaveBeenCalledWith({
						nodePath: [basicNodeIdentifier]
					})
				).toBe(true);
			});
		});

		describe("shift-click when there is a selected node", () => {
			it("should call onNodeRangeSelectionClicked", () => {
				const spy = vi.fn();
				const result = setupTest(
					undefined,
					{
						expandedMultiSelectionPanel: true,
						multiSelectionActions: [
							Events.onNodeMultiSelectionClicked({
								nodePath: [{ id: "18", type: "DirectoryFile" }],
								nodeIdentifier: { id: "18", type: "DirectoryFile" }
							})
						]
					},
					{ eventHandlers: { onNodeRangeSelectionClicked: spy } }
				);
				result.find("button").simulate("click", { shiftKey: true });

				expect(spy).toHaveBeenCalledOnce();
				expect(spy).toHaveBeenCalledWith({ nodePath: [basicNodeIdentifier] });
			});
		});
	});

	describe("disabled", () => {
		describe("disability does not depend on props value, in case global state is disabled", () => {
			const customEngineState = { ...defaultEngineState, disabled: true };
			it("should be true if disabled props is true", () => {
				const result = setupTest({ disabled: true }, customEngineState);
				expect(result.find(Checkbox.Indeterminate).props().disabled).toBe(true);
			});

			it("should be true if disabled props is false", () => {
				const result = setupTest({ disabled: false }, customEngineState);
				expect(result.find(Checkbox.Indeterminate).props().disabled).toBe(true);
			});
		});

		describe("disability depends on props value, in case global state is not disabled", () => {
			const customEngineState = { ...defaultEngineState, disabled: false };
			it("should be true if disabled props is true", () => {
				const result = setupTest({ disabled: true }, customEngineState);
				expect(result.find(Checkbox.Indeterminate).props().disabled).toBe(true);
			});

			it("should be false if disabled props is false", () => {
				const result = setupTest({ disabled: false }, customEngineState);
				expect(result.find(Checkbox.Indeterminate).props().disabled).toBe(false);
			});
		});
	});
});
