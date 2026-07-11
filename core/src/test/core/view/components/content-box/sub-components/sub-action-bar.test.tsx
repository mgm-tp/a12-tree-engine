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

import { Button } from "@com.mgmtp.a12.widgets/widgets-core";

import { type RuntimeTreeModel, TreeModel } from "../../../../../../core/models/index.js";
import { SubActionBar, TreeEngineContextProvider } from "../../../../../../core/view/index.js";
import { createContextProps, defaultEngineState } from "../../../../../setup/basic.spec.js";
import { createEngineState } from "../../../../../utils/model-utils.js";

import { defaultMultiSelectionConfig } from "./multi-selection/utils.test.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.content-box.sub-components.sub-action-bar", () => {
	const basicEngineState = defaultEngineState;
	const basicConfiguration = basicEngineState.models.uiModel.content.configuration;

	function setupTest(
		subHeaderBox: TreeModel.SubHeaderType,
		configurations?: RuntimeTreeModel.Configuration
	): Enzyme.ReactWrapper {
		const customEngineState = createEngineState
			.from(basicEngineState)
			.withSubHeaderBox(subHeaderBox)
			.withConfigurations(configurations ?? basicConfiguration)
			.create();
		return mount(<SubActionBar />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps(customEngineState)
		});
	}

	function testComponent(params: {
		subHeaderBox: TreeModel.SubHeaderType;
		configurations?: RuntimeTreeModel.Configuration;
		expected: { left: string[]; right: string[] };
	}) {
		const { subHeaderBox, configurations, expected } = params;
		const result = setupTest(subHeaderBox, configurations);

		testPanel("left");
		testPanel("right");

		function testPanel(position: "left" | "right") {
			const buttons = result.find(`[data-role="contentbox-action-bar-group-area-${position}"]`).find(Button);

			expect(buttons).have.length(expected[position].length);
			expected[position].forEach((button, buttonIndex) => {
				expect(buttons.at(buttonIndex).props().title).toBe(expected[position][buttonIndex]);
			});
		}
	}
	const buttonA: TreeModel.ButtonElement = {
		id: "A",
		event: "A",
		description: [{ locale: "en", text: "A" }],
		type: TreeModel.ElementType.BUTTON
	};

	const buttonB: TreeModel.ButtonElement = {
		id: "B",
		event: "B",
		description: [{ locale: "en", text: "B" }],
		type: TreeModel.ElementType.BUTTON
	};

	const TITLES = {
		BUTTON_A: "A",
		BUTTON_B: "B",
		WHOLE_TREE_EXPANSION: "Open menu",
		MULTI_SELECTION: "Expand functions for bulk operation"
	};

	const wholeTreeExpansionConfig: Pick<RuntimeTreeModel.Configuration, "wholeTreeExpansion"> = {
		wholeTreeExpansion: true
	};

	const multiSelectionConfig: Pick<RuntimeTreeModel.Configuration, "multiSelection"> = {
		multiSelection: {
			...defaultMultiSelectionConfig,
			buttons: [
				{ id: "2", event: "C" },
				{ id: "3", event: "D" }
			]
		}
	};

	it("should work with buttons only", () => {
		testComponent({ subHeaderBox: { rightSlot: [], leftSlot: [] }, expected: { left: [], right: [] } });
		testComponent({
			subHeaderBox: { leftSlot: [], rightSlot: [buttonA] },
			expected: { left: [], right: [TITLES.BUTTON_A] }
		});
		testComponent({
			subHeaderBox: { leftSlot: [buttonB], rightSlot: [buttonA] },
			expected: { left: [TITLES.BUTTON_B], right: [TITLES.BUTTON_A] }
		});
	});

	it("should work with WholeTreeExpansion feature", () => {
		testComponent({
			subHeaderBox: { leftSlot: [{ type: TreeModel.ElementType.EXPAND_ALL_POPUP }], rightSlot: [] },
			configurations: { ...basicConfiguration, ...wholeTreeExpansionConfig },
			expected: { left: [TITLES.WHOLE_TREE_EXPANSION], right: [] }
		});

		testComponent({
			subHeaderBox: { leftSlot: [], rightSlot: [{ type: TreeModel.ElementType.EXPAND_ALL_POPUP }] },
			configurations: { ...basicConfiguration, ...wholeTreeExpansionConfig },
			expected: { left: [], right: [TITLES.WHOLE_TREE_EXPANSION] }
		});
	});

	it("should work with MultiSelection feature", () => {
		testComponent({
			subHeaderBox: { leftSlot: [{ type: TreeModel.ElementType.MULTI_SELECTION }], rightSlot: [] },
			configurations: { ...basicConfiguration, ...multiSelectionConfig },
			expected: { left: [TITLES.MULTI_SELECTION], right: [] }
		});

		testComponent({
			subHeaderBox: { leftSlot: [], rightSlot: [{ type: TreeModel.ElementType.MULTI_SELECTION }] },
			configurations: { ...basicConfiguration, ...multiSelectionConfig },
			expected: { left: [], right: [TITLES.MULTI_SELECTION] }
		});
	});

	describe("combination between components", () => {
		describe("when no given wholeTreeExpansion and multiSelection config", () => {
			it("should render only subheader buttons", () => {
				testComponent({
					subHeaderBox: { leftSlot: [buttonA, buttonB], rightSlot: [] },
					expected: { left: [TITLES.BUTTON_A, TITLES.BUTTON_B], right: [] }
				});
			});
		});

		describe("when given wholeTreeExpansion but not multiSelection config", () => {
			it("should render subheader buttons and ExpandAllPopUp", () => {
				testComponent({
					subHeaderBox: {
						leftSlot: [buttonA],
						rightSlot: [{ type: TreeModel.ElementType.EXPAND_ALL_POPUP }, buttonB]
					},
					configurations: { ...basicConfiguration, ...wholeTreeExpansionConfig },
					expected: {
						left: [TITLES.BUTTON_A],
						right: [TITLES.WHOLE_TREE_EXPANSION, TITLES.BUTTON_B]
					}
				});
			});
		});

		describe("when given multiSelection but not wholeTreeExpansion config", () => {
			it("should render subheader buttons and MultiSelectionPanel", () => {
				testComponent({
					subHeaderBox: {
						leftSlot: [buttonA, { type: TreeModel.ElementType.MULTI_SELECTION }],
						rightSlot: [buttonB]
					},
					configurations: { ...basicConfiguration, ...multiSelectionConfig },
					expected: {
						left: [TITLES.BUTTON_A, TITLES.MULTI_SELECTION],
						right: [TITLES.BUTTON_B]
					}
				});
			});
		});

		describe("when given both wholeTreeExpansion and multiSelection config", () => {
			it("should render subheader buttons, ExpandAllPopUp menu and MultiSelectionPanel", () => {
				testComponent({
					subHeaderBox: {
						leftSlot: [buttonB],
						rightSlot: [
							{ type: TreeModel.ElementType.MULTI_SELECTION },
							buttonA,
							{ type: TreeModel.ElementType.EXPAND_ALL_POPUP }
						]
					},
					configurations: {
						...basicConfiguration,
						...wholeTreeExpansionConfig,
						...multiSelectionConfig
					},
					expected: {
						left: [TITLES.BUTTON_B],
						right: [TITLES.MULTI_SELECTION, TITLES.BUTTON_A, TITLES.WHOLE_TREE_EXPANSION]
					}
				});
			});
		});
	});
});
