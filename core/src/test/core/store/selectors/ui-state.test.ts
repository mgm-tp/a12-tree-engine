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

import { type Identifier, TreeEngineState, UIStateSelector } from "../../../../core/store/index.js";
import { TreeModel } from "../../../../core/models/index.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";

describe("@com.mgmtp.a12.tree-engine.core.store.selectors.ui-state", () => {
	const engineState = defaultEngineState;

	describe("selectedNodes", () => {
		it("should return the correct selector", () => {
			const selectedNodes = UIStateSelector.selectedNodes()(engineState);
			expect(selectedNodes).toBe(engineState.selectedNodes);
		});
	});

	describe("expandedNodes", () => {
		it("should return the correct selector", () => {
			const expandedNodes = UIStateSelector.expandedNodes()(engineState);
			expect(expandedNodes).toBe(engineState.expandedNodes);
		});
	});

	describe("query", () => {
		it("should return the correct selector", () => {
			const query = UIStateSelector.query()(engineState);
			expect(query).toBe(engineState.query);
		});
	});

	describe("matchedNodes", () => {
		it("should return the correct selector", () => {
			const matchedNodes = UIStateSelector.matchedNodes()(engineState);
			expect(matchedNodes).toBe(engineState.matchedNodes);
		});
	});

	describe("busyNodes", () => {
		it("should return the correct selector", () => {
			const busyNodes = UIStateSelector.busyNodes()(engineState);
			expect(busyNodes).toBe(engineState.busyNodes);
		});
	});

	describe("expandedMultiSelectionPanel", () => {
		it("should return the correct selector", () => {
			const expandedMultiSelectionPanel = UIStateSelector.expandedMultiSelectionPanel()(engineState);
			expect(expandedMultiSelectionPanel).toBe(engineState.expandedMultiSelectionPanel);
		});
	});

	describe("multiSelectionNodes", () => {
		it("should return the correct selector", () => {
			const multiSelectionNodes = UIStateSelector.multiSelectionNodes()(engineState);
			expect(multiSelectionNodes).toBe(engineState.multiSelectionNodes);
		});
	});

	describe("previousMultiSelectionActions", () => {
		it("should return the correct selector", () => {
			const listMultiSelectionActions = UIStateSelector.previousMultiSelectionActions()(engineState);
			expect(listMultiSelectionActions).toEqual(engineState.multiSelectionActions);
		});
	});

	describe("overallMultiSelection", () => {
		const rootNodePaths = [`DomainTeam[DomainTeam/1]`, `DomainTeam[DomainTeam/2]`, `DomainTeam[DomainTeam/3]`];

		describe("when root has no children", () => {
			it("should return DESELECTED", () => {
				const overallMultiSelection = UIStateSelector.overallMultiSelection()({
					...engineState,
					root: { ...engineState.root, children: [] }
				});

				expect(overallMultiSelection).toBe(TreeEngineState.MultiSelectionState.DESELECTED);
			});
		});

		describe("when there are no selected nodes", () => {
			it("should return DESELECTED", () => {
				const overallMultiSelection = UIStateSelector.overallMultiSelection()({
					...engineState,
					multiSelectionNodes: { [rootNodePaths[0]]: TreeEngineState.MultiSelectionState.DESELECTED }
				});

				expect(overallMultiSelection).toBe(TreeEngineState.MultiSelectionState.DESELECTED);
			});
		});

		describe("when there are some selected nodes", () => {
			it("should return PARTIAL_SELECTED", () => {
				const overallMultiSelection = UIStateSelector.overallMultiSelection()({
					...engineState,
					multiSelectionNodes: { [rootNodePaths[1]]: TreeEngineState.MultiSelectionState.SELECTED }
				});

				expect(overallMultiSelection).toBe(TreeEngineState.MultiSelectionState.PARTLY_SELECTED);
			});
		});

		describe("when all nodes are selected", () => {
			it("should return SELECTED", () => {
				const overallMultiSelection = UIStateSelector.overallMultiSelection()({
					...engineState,
					multiSelectionNodes: {
						[rootNodePaths[0]]: TreeEngineState.MultiSelectionState.SELECTED,
						[rootNodePaths[2]]: TreeEngineState.MultiSelectionState.SELECTED,
						[rootNodePaths[1]]: TreeEngineState.MultiSelectionState.SELECTED
					}
				});

				expect(overallMultiSelection).toBe(TreeEngineState.MultiSelectionState.SELECTED);
			});
		});
	});

	describe("totalMultiSelectionNodeCount", () => {
		const rootNodePaths = [`DomainTeam[DomainTeam/1]`, `DomainTeam[DomainTeam/2]`, `DomainTeam[DomainTeam/3]`];
		const testCases: [TreeEngineState.MultiSelectionNodes, number][] = [
			[{}, 0],
			[{ [rootNodePaths[0]]: TreeEngineState.MultiSelectionState.DESELECTED }, 0],
			[
				{
					[rootNodePaths[0]]: TreeEngineState.MultiSelectionState.DESELECTED,
					[rootNodePaths[1]]: TreeEngineState.MultiSelectionState.DESELECTED
				},
				0
			],
			[
				{
					[rootNodePaths[0]]: TreeEngineState.MultiSelectionState.DESELECTED,
					[rootNodePaths[1]]: TreeEngineState.MultiSelectionState.PARTLY_SELECTED
				},
				0
			],
			[
				{
					[rootNodePaths[0]]: TreeEngineState.MultiSelectionState.SELECTED,
					[rootNodePaths[2]]: TreeEngineState.MultiSelectionState.PARTLY_SELECTED
				},
				1
			],
			[
				{
					[rootNodePaths[0]]: TreeEngineState.MultiSelectionState.SELECTED,
					[rootNodePaths[2]]: TreeEngineState.MultiSelectionState.DESELECTED,
					[rootNodePaths[1]]: TreeEngineState.MultiSelectionState.SELECTED
				},
				2
			]
		];

		it("should return proper value", () => {
			testCases.forEach(([multiSelectionNodes, expectedValue]) => {
				const totalMultiSelectionNodeCount = UIStateSelector.totalMultiSelectionNodeCount()({
					...engineState,
					multiSelectionNodes: multiSelectionNodes
				});
				expect(totalMultiSelectionNodeCount).toBe(expectedValue);
			});
		});
	});

	describe("nodeState", () => {
		const identifier: Identifier = {
			type: "DomainTeam",
			id: "DomainTeam/1"
		};

		const nodePathKey = TreeEngineState.NodePath.toString([identifier]);

		function getEngineState(nodeState: Partial<UIStateSelector.NodeState>): TreeEngineState {
			let result: TreeEngineState = { ...engineState };
			result = nodeState.selected ? { ...result, selectedNodes: { [nodePathKey]: {} } } : result;
			result = nodeState.expanded ? { ...result, expandedNodes: { [nodePathKey]: {} } } : result;
			result = nodeState.busy ? { ...result, busyNodes: { [identifier.type]: { [identifier.id]: {} } } } : result;
			return result;
		}

		const testCases: Omit<UIStateSelector.NodeState, "matchedCount">[] = [
			{ selected: false, expanded: false, busy: false },
			{ selected: true, expanded: false, busy: false },
			{ selected: true, expanded: false, busy: true },
			{ selected: true, expanded: true, busy: false },
			{ selected: true, expanded: true, busy: true },
			{ selected: false, expanded: true, busy: false },
			{ selected: false, expanded: true, busy: true },
			{ selected: false, expanded: false, busy: true }
		];

		describe("given a list of engine states", () => {
			it("the selector should return the valid corresponding node state", () => {
				testCases.forEach((testCase, index) => {
					const customEngineState = getEngineState(testCase);
					const nodeState = UIStateSelector.nodeState(identifier, [identifier])(customEngineState);
					expect(nodeState).to.deep.include(testCase, `Invalid note state at testcase #${index}`);
				});
			});
		});
	});

	describe("dialogState", () => {
		it("should return the correct selector", () => {
			const dialogState = UIStateSelector.dialogState()(engineState);
			expect(dialogState).toBe(engineState.dialog);
		});
	});

	describe("columnWidths", () => {
		it("should return the correct selector", () => {
			const columnWidths = UIStateSelector.columnWidths()(engineState);
			expect(columnWidths).toBe(engineState.columnWidths);
		});
	});

	describe("preloadChildNodes", () => {
		it("should return the correct selector", () => {
			let result = UIStateSelector.preloadChildNodes()({ ...engineState, preloadChildNodes: undefined });
			expect(result).toBe(false);

			result = UIStateSelector.preloadChildNodes()({ ...engineState, preloadChildNodes: false });
			expect(result).toBe(false);

			result = UIStateSelector.preloadChildNodes()({ ...engineState, preloadChildNodes: true });
			expect(result).toBe(true);
		});
	});

	describe("disabled", () => {
		it("should be true/false/undefined if the state value is set respectively", () => {
			const testCases = [true, false, undefined];
			testCases.forEach((testCase) => {
				const customEngineState = { ...engineState, disabled: testCase };
				const disabled = UIStateSelector.disabled()(customEngineState);
				expect(disabled).toBe(customEngineState.disabled);
			});
		});
	});

	describe("isMultiSelectionRowClickActive", () => {
		const { CollapseOption, SelectionArea } = TreeModel.MultiSelectionConfiguration;

		const defaultMultiSelectionConfig: TreeModel.MultiSelectionConfiguration = {
			collapseOption: CollapseOption.COLLAPSIBLE_EXPANDED,
			counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.SIMPLE
		};

		const rootNodePath = `DomainTeam[DomainTeam/1]`;

		function createState(
			opts: { expandedMultiSelectionPanel: boolean; hasSelectedRow: boolean },
			config?: TreeModel.MultiSelectionConfiguration
		): TreeEngineState {
			return {
				...engineState,
				models: {
					...engineState.models,
					uiModel: {
						...engineState.models.uiModel,
						content: {
							...engineState.models.uiModel.content,
							configuration: {
								...engineState.models.uiModel.content.configuration,
								multiSelection: config
							}
						}
					}
				},
				expandedMultiSelectionPanel: opts.expandedMultiSelectionPanel,
				multiSelectionNodes: opts.hasSelectedRow ? { [rootNodePath]: TreeEngineState.MultiSelectionState.SELECTED } : {}
			};
		}

		const panelClosed = { expandedMultiSelectionPanel: false, hasSelectedRow: false };
		const panelOpen = { expandedMultiSelectionPanel: true, hasSelectedRow: false };
		const rowSelected = { expandedMultiSelectionPanel: false, hasSelectedRow: true };
		const bothActive = { expandedMultiSelectionPanel: true, hasSelectedRow: true };

		const testCases: [
			TreeModel.MultiSelectionConfiguration | undefined,
			{ expandedMultiSelectionPanel: boolean; hasSelectedRow: boolean },
			boolean
		][] = [
			// No multi-selection configured
			[undefined, panelClosed, false],
			[undefined, panelOpen, true],

			// CHECKBOX selectionArea — row click never triggers selection
			[{ ...defaultMultiSelectionConfig, selectionArea: SelectionArea.CHECKBOX }, panelOpen, false],
			[{ ...defaultMultiSelectionConfig, selectionArea: SelectionArea.CHECKBOX }, rowSelected, false],

			// COLLAPSIBLE_EXPANDED — active when panel is open
			[{ ...defaultMultiSelectionConfig }, panelClosed, false],
			[{ ...defaultMultiSelectionConfig }, panelOpen, true],
			[{ ...defaultMultiSelectionConfig }, bothActive, true],

			// COLLAPSIBLE_COLLAPSED — same as COLLAPSIBLE_EXPANDED
			[{ ...defaultMultiSelectionConfig, collapseOption: CollapseOption.COLLAPSIBLE_COLLAPSED }, panelClosed, false],
			[{ ...defaultMultiSelectionConfig, collapseOption: CollapseOption.COLLAPSIBLE_COLLAPSED }, panelOpen, true],

			// NON_COLLAPSIBLE — active when at least one row is selected; panel state is irrelevant
			[{ ...defaultMultiSelectionConfig, collapseOption: CollapseOption.NON_COLLAPSIBLE }, panelClosed, false],
			[{ ...defaultMultiSelectionConfig, collapseOption: CollapseOption.NON_COLLAPSIBLE }, rowSelected, true],
			[{ ...defaultMultiSelectionConfig, collapseOption: CollapseOption.NON_COLLAPSIBLE }, panelOpen, false]
		];

		it("should return the expected value", () => {
			testCases.forEach(([config, stateOpts, expectedValue]) => {
				const state = createState(stateOpts, config);
				const result = UIStateSelector.isMultiSelectionRowClickActive()(state);
				expect(result).toBe(expectedValue);
			});
		});
	});
});
