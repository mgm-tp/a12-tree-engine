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

import { TreeEngineState, UIStateSelector } from "../../../../../../core/store/index.js";
import { TreeEngineContextProvider } from "../../../../../../core/view/index.js";
import {
	createContextProps,
	defaultEngineState,
	deLocale,
	enLocale,
	type PartialEventHandlerContextProps
} from "../../../../../setup/basic.spec.js";
import { en } from "../../../../../../core/services/localization/languages/en.js";
import { de } from "../../../../../../core/services/localization/languages/de.js";
import { OverallCheckbox } from "../../../../../../core/view/index.js";
import type { Stub } from "../../../../../utils/mock-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.overall-checkbox", () => {
	const basicEngineState = defaultEngineState;

	function setupTest(
		customEngineState?: Partial<TreeEngineState>,
		customEngineContextProps?: Partial<PartialEventHandlerContextProps>,
		locale?: Locale
	) {
		return mount(
			<OverallCheckbox />,
			{
				wrappingComponent: TreeEngineContextProvider,
				wrappingComponentProps: createContextProps(
					{ ...basicEngineState, ...customEngineState },
					customEngineContextProps
				)
			},
			locale
		);
	}

	describe("title", () => {
		describe("when given english locale", () => {
			it("should take from english RESOURCE_KEYS", () => {
				const result = setupTest(undefined, undefined, enLocale);

				expect(result.find(Checkbox.Indeterminate).props().title).toBe(
					en.treeEngine.multiSelection.overallCheckboxTitle
				);
			});
		});

		describe("when given german locale", () => {
			it("should take from german RESOURCE_KEYS", () => {
				const result = setupTest(undefined, undefined, deLocale);

				expect(result.find(Checkbox.Indeterminate).props().title).toBe(
					de.treeEngine.multiSelection.overallCheckboxTitle
				);
			});
		});
	});

	describe("checked", () => {
		const testCases: [TreeEngineState.MultiSelectionState, boolean | "mixed"][] = [
			[TreeEngineState.MultiSelectionState.SELECTED, true],
			[TreeEngineState.MultiSelectionState.DESELECTED, false],
			[TreeEngineState.MultiSelectionState.PARTLY_SELECTED, "mixed"]
		];

		let overallMultiSelectionStub: Stub<typeof UIStateSelector.overallMultiSelection>;

		it("should return expected checked value", () => {
			testCases.forEach(([overallMultiSelection, expectedCheck]) => {
				overallMultiSelectionStub = vi
					.spyOn(UIStateSelector, "overallMultiSelection")
					.mockReturnValue(() => overallMultiSelection);
				const result = setupTest();

				expect(result.find(Checkbox.Indeterminate).props().checked).toBe(expectedCheck);

				overallMultiSelectionStub.mockRestore();
			});
		});
	});

	describe("onChange", () => {
		it("should call onOverallMultiSelectionChanged", () => {
			const spy = vi.fn();
			const result = setupTest(
				{ expandedMultiSelectionPanel: true },
				{ eventHandlers: { onOverallMultiSelectionClicked: spy } }
			);

			result.find("button").simulate("click");

			expect(spy).toHaveBeenCalledOnce();
		});
	});

	describe("Disabled", () => {
		it("should be disabled if state disabled value is true", () => {
			const result = setupTest({ disabled: true });
			expect(result.find(Checkbox.Indeterminate).props().disabled).toBe(true);
		});
	});
});
