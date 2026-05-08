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

import { ButtonGroupContainer } from "@com.mgmtp.a12.widgets/widgets-core/lib/layout/button-group-container/index.js";

import { TreeModel } from "../../../../../../core/models/index.js";
import { TreeModelKeys } from "../../../../../../core/services/localization/internal/tree-model-keys.js";
import { TreeEngineContextProvider, FooterBox } from "../../../../../../core/view/index.js";
import { Button } from "../../../../../../core/view/internal/components/content-box/sub-components/buttons.js";
import { createContextProps, defaultEngineState } from "../../../../../setup/basic.spec.js";
import { createEngineState } from "../../../../../utils/model-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.content-box.sub-components.footer-box", () => {
	const basicEngineState = defaultEngineState;
	const customMajorElements: TreeModel.ButtonElement[] = [
		{ id: "0", event: "A", type: TreeModel.ElementType.BUTTON },
		{ id: "1", event: "B", type: TreeModel.ElementType.BUTTON },
		{ id: "2", event: "C", type: TreeModel.ElementType.BUTTON }
	];

	const customMinorElements: TreeModel.ButtonElement[] = [
		{ id: "3", event: "D", type: TreeModel.ElementType.BUTTON },
		{ id: "4", event: "E", type: TreeModel.ElementType.BUTTON }
	];

	function setupTest(footerType: TreeModel.FooterType): Enzyme.ReactWrapper {
		const contextProps = createContextProps(
			createEngineState.from(basicEngineState).withFooterBox(footerType).create()
		);

		return mount(<FooterBox />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: contextProps
		});
	}

	describe("given various footer type", () => {
		const testCases: [TreeModel.FooterType, number, number][] = [
			[{ majorElements: [], minorElements: [] }, 0, 0],
			[{ majorElements: customMajorElements, minorElements: [] }, 3, 0],
			[{ majorElements: [], minorElements: customMinorElements }, 0, 2],
			[{ majorElements: customMajorElements, minorElements: customMinorElements }, 3, 2]
		];

		testCases.forEach(([footerType, rightButtonLength, leftButtonLength]) => {
			const description = `${rightButtonLength} majorButtons and ${leftButtonLength} minorButtons`;
			describe("given footerBox with " + description, () => {
				it("should render footerBox properly with " + description, () => {
					const result = setupTest(footerType);
					const container = result.find(ButtonGroupContainer);

					const rightButtons = container.props().rightSlot;
					const leftButtons = container.props().leftSlot;
					const buttons = container.find(Button);

					expect(rightButtons).toHaveLength(rightButtonLength);
					expect(leftButtons).toHaveLength(leftButtonLength);
					expect(buttons).toHaveLength(rightButtonLength + leftButtonLength);
				});
			});
		});
	});

	describe("element & componentKey", () => {
		it("should pass element & componentKey props to Button properly", () => {
			const buttonProps: TreeModel.ButtonElement = { id: "1024", event: "test", type: TreeModel.ElementType.BUTTON };
			const result = setupTest({
				majorElements: [buttonProps],
				minorElements: []
			});

			const button = result.find(Button);
			expect(button.props().element).toEqual(buttonProps);
			expect(button.props().componentKeys).toEqual(TreeModelKeys.getFooterBoxButtonsKey());
		});
	});
});
