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

import { ContentBox } from "@com.mgmtp.a12.widgets/widgets-core";

import { TreeModel } from "../../../../../core/models/index.js";
import type { TreeEngineState } from "../../../../../core/store/index.js";
import {
	TreeEngineContextProvider,
	ContentBoxRenderer,
	SubActionBar,
	FooterBox,
	DefaultComponentMap
} from "../../../../../core/view/index.js";
import { Button } from "../../../../../core/view/components/content-box/sub-components/buttons.js";
import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps
} from "../../../../setup/basic.spec.js";
import { createEngineState } from "../../../../utils/model-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.content-box.content-box-renderer", () => {
	const basicEngineState = defaultEngineState;

	function setupTest(
		customEngineState?: TreeEngineState,
		customContextProps?: Partial<PartialEventHandlerContextProps>
	): Enzyme.ReactWrapper {
		const contextProps = createContextProps(customEngineState, customContextProps);

		return mount(<ContentBoxRenderer />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: contextProps
		});
	}

	describe("padding", () => {
		it("should have no padding", () => {
			const result = setupTest();
			const contentBox = result.find(ContentBox);

			expect(contentBox).toHaveLength(1);
			expect(contentBox.props().padding).toBe(false);
		});
	});

	describe("Heading", () => {
		it("should render Heading", () => {
			const result = setupTest();
			const heading = result.find(DefaultComponentMap.Heading);

			expect(heading.exists()).toBe(true);
		});
	});

	describe("SubActionBar", () => {
		describe("when subHeaderBox button is empty", () => {
			const engineState = createEngineState
				.from(basicEngineState)
				.withSubHeaderBox({ rightSlot: [], leftSlot: [] })
				.create();

			it("should not render SubActionBar", () => {
				const result = setupTest(engineState);
				const subActionBar = result.find(SubActionBar);

				expect(subActionBar).toHaveLength(0);
			});
		});

		describe("given one subHeaderBox button", () => {
			const engineState = createEngineState
				.from(basicEngineState)
				.withSubHeaderBox({
					rightSlot: [{ id: "0", event: "A", type: TreeModel.ElementType.BUTTON }],
					leftSlot: []
				})
				.create();

			it("should render SubActionBar with one button", () => {
				const result = setupTest(engineState);
				const subActionBar = result.find(SubActionBar);
				const buttons = subActionBar.find(Button);

				expect(subActionBar).toHaveLength(1);
				expect(buttons).toHaveLength(1);
			});
		});

		describe("given smallView = true", () => {
			const engineState = createEngineState
				.from(basicEngineState)
				.withSubHeaderBox({
					rightSlot: [{ id: "0", event: "A", type: TreeModel.ElementType.BUTTON }],
					leftSlot: []
				})
				.withConfigurations({
					...basicEngineState.models.uiModel.content.configuration,
					wholeTreeExpansion: true
				})
				.create();

			it("should not render SubActionBar", () => {
				const result = setupTest(engineState, { smallView: true });
				const subActionBar = result.find(SubActionBar);

				expect(subActionBar.exists()).toBe(false);
			});
		});
	});

	describe("FooterBox", () => {
		const testCases: [TreeModel.FooterType, number][] = [
			[{ rightSlot: [], leftSlot: [] }, 0],
			[{ rightSlot: [{ id: "0", event: "A", type: TreeModel.ElementType.BUTTON }], leftSlot: [] }, 1],
			[{ rightSlot: [], leftSlot: [{ id: "0", event: "A", type: TreeModel.ElementType.BUTTON }] }, 1],
			[
				{
					rightSlot: [{ id: "0", event: "A", type: TreeModel.ElementType.BUTTON }],
					leftSlot: [{ id: "1", event: "B", type: TreeModel.ElementType.BUTTON }]
				},
				2
			]
		];

		testCases.forEach(([footerBoxConfig, buttonLength]) => {
			describe(`given footerBox with ${buttonLength} buttons`, () => {
				const engineState = createEngineState.from(basicEngineState).withFooterBox(footerBoxConfig).create();

				it(
					buttonLength === 0 ? "should not render footerBox" : `should render FooterBox with ${buttonLength} buttons`,
					() => {
						const result = setupTest(engineState);
						const footerBox = result.find(FooterBox);
						const buttons = footerBox.find(Button);

						expect(footerBox).toHaveLength(buttonLength === 0 ? 0 : 1);
						expect(buttons).toHaveLength(buttonLength);
					}
				);
			});
		});
	});
});
