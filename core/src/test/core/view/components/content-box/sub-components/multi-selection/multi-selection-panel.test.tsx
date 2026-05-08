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
import * as React from "react";

import { ContentBoxElements } from "@com.mgmtp.a12.widgets/widgets-core/lib/contentbox/main/template/contentbox.tpl.view.js";

import { type TreeEngineState } from "../../../../../../../core/store/index.js";
import {
	MultiSelectionActions,
	MultiSelectionButton,
	MultiSelectionCounter,
	MultiSelectionPanel,
	TreeEngineContextProvider
} from "../../../../../../../core/view/index.js";
import { createContextProps, defaultEngineState } from "../../../../../../setup/basic.spec.js";
import { TreeModel } from "../../../../../../../core/models/index.js";
import { createEngineState } from "../../../../../../utils/model-utils.js";

import { defaultMultiSelectionConfig } from "./utils.test.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.content-box.sub-components.multi-selection.multi-selection-panel", () => {
	const basicEngineState = defaultEngineState;
	const basicConfiguration = basicEngineState.models.uiModel.content.configuration;

	function setupTest(
		multiSelection?: TreeModel.MultiSelectionConfiguration,
		customEngineState?: Partial<TreeEngineState>
	): Enzyme.ReactWrapper {
		const engineState = createEngineState
			.from({ ...basicEngineState, ...customEngineState })
			.withConfigurations({ ...basicConfiguration, multiSelection })
			.create();
		return mount(<MultiSelectionPanel />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps(engineState)
		});
	}

	describe("when expandedMultiSelectionPanel state = false", () => {
		it("should render only MultiSelectionButton", () => {
			const result = setupTest(defaultMultiSelectionConfig, { expandedMultiSelectionPanel: false });

			expect(result.find(ContentBoxElements.ActionBarGroup)).toHaveLength(0);
			expect(result.find(MultiSelectionButton)).toHaveLength(1);
			expect(result.find(MultiSelectionCounter)).toHaveLength(0);
			expect(result.find(MultiSelectionActions)).toHaveLength(0);
		});
	});

	describe("when expandedMultiSelectionPanel state = true", () => {
		it("should render all three multi-selection components", () => {
			const result = setupTest(defaultMultiSelectionConfig, { expandedMultiSelectionPanel: true });

			expect(result.find(MultiSelectionButton)).toHaveLength(1);
			expect(result.find(MultiSelectionCounter)).toHaveLength(1);
			expect(result.find(MultiSelectionActions)).toHaveLength(1);
		});
	});

	describe("group divider", () => {
		const basicButtons: TreeModel.ButtonType[] = [
			{ id: "1024", event: "delete" },
			{ id: "1025", event: "copy" }
		];

		describe("when there is no multi-selection button and counter", () => {
			it("should not render the divider", () => {
				const result = setupTest(
					{
						collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE,
						counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.NONE,
						buttons: basicButtons
					},
					{ expandedMultiSelectionPanel: true }
				);

				expect(result.find(ContentBoxElements.ActionBarGroupDivider)).toHaveLength(0);
			});
		});

		describe("where there is no buttons", () => {
			it("should render the divider", () => {
				const result = setupTest(
					{
						collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED,
						counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.SIMPLE,
						buttons: []
					},
					{ expandedMultiSelectionPanel: true }
				);

				expect(result.find(ContentBoxElements.ActionBarGroupDivider)).toHaveLength(0);
			});
		});

		describe("when both above conditions are not true", () => {
			it("should render the divider", () => {
				const result = setupTest(
					{
						collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED,
						counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.SIMPLE,
						buttons: basicButtons
					},
					{ expandedMultiSelectionPanel: true }
				);

				expect(result.find(ContentBoxElements.ActionBarGroupDivider)).toHaveLength(1);
			});
		});
	});
});
