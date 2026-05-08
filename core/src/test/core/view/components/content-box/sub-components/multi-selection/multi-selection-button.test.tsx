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
import type * as Enzyme from "enzyme";
import * as React from "react";

import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/main/button.view.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/main/icon.view.js";

import { type TreeEngineState } from "../../../../../../../core/store/index.js";
import { MultiSelectionButton, TreeEngineContextProvider } from "../../../../../../../core/view/index.js";
import {
	createContextProps,
	defaultEngineState,
	deLocale,
	type PartialEventHandlerContextProps,
	enLocale
} from "../../../../../../setup/basic.spec.js";
import { TreeModel } from "../../../../../../../core/models/index.js";
import { createEngineState } from "../../../../../../utils/model-utils.js";
import { testIsNullComponent } from "../../../../../../utils/test-utils.js";
import { en } from "../../../../../../../core/services/localization/internal/languages/en.js";
import { de } from "../../../../../../../core/services/localization/internal/languages/de.js";

import { defaultMultiSelectionConfig } from "./utils.test.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.content-box.sub-components.multi-selection.multi-selection-button", () => {
	const basicEngineState = defaultEngineState;
	const basicConfiguration = basicEngineState.models.uiModel.content.configuration;

	function setupTest(
		multiSelection?: TreeModel.MultiSelectionConfiguration,
		customEngineState?: Partial<TreeEngineState>,
		customContextProp?: Partial<PartialEventHandlerContextProps>,
		locale?: Locale
	): Enzyme.ReactWrapper {
		const engineState = createEngineState
			.from({ ...basicEngineState, ...customEngineState })
			.withConfigurations({ ...basicConfiguration, multiSelection })
			.create();
		return mount(
			<MultiSelectionButton />,
			{
				wrappingComponent: TreeEngineContextProvider,
				wrappingComponentProps: createContextProps(engineState, customContextProp)
			},
			locale
		);
	}

	describe("when collapseOption = NON_COLLAPSIBLE", () => {
		it("should render nothing", () => {
			const result = setupTest({
				...defaultMultiSelectionConfig,
				collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE
			});

			testIsNullComponent(result);
		});
	});

	describe("title", () => {
		const testCases: [boolean, Locale, string][] = [
			[true, enLocale, en.treeEngine.multiSelection.multiSelectionButton.collapseTitle],
			[true, deLocale, de.treeEngine.multiSelection.multiSelectionButton.collapseTitle],
			[false, enLocale, en.treeEngine.multiSelection.multiSelectionButton.expandTitle],
			[false, deLocale, de.treeEngine.multiSelection.multiSelectionButton.expandTitle]
		];

		it("should render proper title with locale and panel state", () => {
			testCases.forEach(([expandedPanel, locale, expectedTitle]) => {
				const result = setupTest(
					defaultMultiSelectionConfig,
					{ expandedMultiSelectionPanel: expandedPanel },
					undefined,
					locale
				);
				const title = result.find(Button).props().title;

				expect(title).toBe(expectedTitle);
			});
		});
	});

	describe("onClick", () => {
		it("should call onMultiSelectionButtonClicked handler", () => {
			const onClickSpy = vi.fn();
			const result = setupTest(defaultMultiSelectionConfig, undefined, {
				eventHandlers: { onMultiSelectionButtonClicked: onClickSpy }
			});
			getInteractiveElement(result.find(Button)).simulate("click");

			expect(onClickSpy).toHaveBeenCalledOnce();
		});
	});

	describe("other props", () => {
		it("should be passed properly", () => {
			const result = setupTest(defaultMultiSelectionConfig);
			const button = result.find(Button);
			const buttonIcon = button.find(Icon);

			expect(button.props().secondary).toBe(true);
			expect(buttonIcon.props().children).toBe("library_add");
		});
	});
});
