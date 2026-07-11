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

import { Counter } from "@com.mgmtp.a12.widgets/widgets-core";

import { TreeEngineState } from "../../../../../../../core/store/index.js";
import { MultiSelectionCounter, TreeEngineContextProvider } from "../../../../../../../core/view/index.js";
import { createContextProps, defaultEngineState } from "../../../../../../setup/basic.spec.js";
import { TreeModel } from "../../../../../../../core/models/index.js";
import { createEngineState } from "../../../../../../utils/model-utils.js";
import { testIsNullComponent } from "../../../../../../utils/test-utils.js";

import { defaultMultiSelectionConfig } from "./utils.test.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.content-box.sub-components.multi-selection.multi-selection-counter", () => {
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
		return mount(<MultiSelectionCounter />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps(engineState)
		});
	}

	describe("when counterOption = NONE", () => {
		it("should render nothing", () => {
			const result = setupTest({
				...defaultMultiSelectionConfig,
				counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.NONE
			});
			testIsNullComponent(result);
		});
	});

	describe("when there are no selected nodes", () => {
		it("should has value 0 and default type", () => {
			const result = setupTest(defaultMultiSelectionConfig);
			const counter = result.find(Counter);

			expect(counter.props().value).toBe(0);
			expect(counter.props().type).toBe("default");
		});
	});

	describe("when there are some selected nodes", () => {
		it("should has value which is equal the number of selected nodes and constructive type", () => {
			const result = setupTest(defaultMultiSelectionConfig, {
				multiSelectionNodes: {
					a: TreeEngineState.MultiSelectionState.PARTLY_SELECTED,
					b: TreeEngineState.MultiSelectionState.SELECTED,
					c: TreeEngineState.MultiSelectionState.DESELECTED,
					d: TreeEngineState.MultiSelectionState.SELECTED
				}
			});
			const counter = result.find(Counter);

			expect(counter.props().value).toBe(2);
			expect(counter.props().type).toBe("constructive");
		});
	});
});
