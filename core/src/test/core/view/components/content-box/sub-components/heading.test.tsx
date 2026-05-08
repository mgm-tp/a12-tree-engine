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

import Assert from "node:assert";

import * as React from "react";

import { PopUpMenu } from "@com.mgmtp.a12.widgets/widgets-core/lib/pop-up-menu/index.js";
import { type LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";

import { DefaultWidgetMap, TreeEngineContextProvider } from "../../../../../../core/view/index.js";
import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps,
	enLocale
} from "../../../../../setup/basic.spec.js";
import { Heading } from "../../../../../../core/view/internal/components/content-box/sub-components/heading.js";
import { createEngineState } from "../../../../../utils/model-utils.js";
import { TreeModel } from "../../../../../../core/models/index.js";
import { type TreeEngineState } from "../../../../../../core/store/index.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.content-box.sub-components.heading", () => {
	const basicEngineState = defaultEngineState;
	const button1: TreeModel.ButtonElement = { id: "button-1", event: "event-1", type: TreeModel.ElementType.BUTTON };

	function setupTest(
		customEngineState?: TreeEngineState,
		customContextProps?: Partial<PartialEventHandlerContextProps>
	) {
		return mount(<Heading />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps(customEngineState, customContextProps)
		});
	}

	describe("hidden text rendering", () => {
		const labels: TreeModel.Header["labels"] = [{ locale: enLocale.language, text: "Label Test" }];
		it("should render hidden text when labelHidden is set", () => {
			const engineState = createEngineState
				.from(basicEngineState)
				.withLabels(labels)
				.withConfigurations({ ...basicEngineState.models.uiModel.content.configuration, labelHidden: true })
				.create();
			const result = setupTest(engineState);
			const hiddenText = result.find(DefaultWidgetMap.HiddenText);

			expect(hiddenText.text()).toBe(labels[0].text);
		});

		it("should not render hidden text when labelHidden is not be set", () => {
			const engineState = createEngineState
				.from(basicEngineState)
				.withLabels(labels)
				.withConfigurations({ ...basicEngineState.models.uiModel.content.configuration, labelHidden: undefined })
				.create();
			const result = setupTest(engineState);
			const hiddenText = result.find(DefaultWidgetMap.HiddenText);

			expect(hiddenText).toHaveLength(0);
		});
	});

	describe("title and subtitle rendering", () => {
		const labels: TreeModel.Header["labels"] = [{ locale: enLocale.language, text: "Label Test" }];
		const subtitle: TreeModel.Configuration["subtitle"] = [{ locale: enLocale.language, text: "Subtitle Test" }];

		const cases: {
			labels?: LocalizedModelText;
			subtitle?: LocalizedModelText;
			expectedLabel: string;
			expectedSubtitle: string;
		}[] = [
			{ labels, subtitle, expectedLabel: "Label Test", expectedSubtitle: "Subtitle Test" },
			{ labels, subtitle: undefined, expectedLabel: "Label Test", expectedSubtitle: "" },
			{ labels: undefined, subtitle, expectedLabel: "", expectedSubtitle: "" },
			{ labels: undefined, subtitle: undefined, expectedLabel: "", expectedSubtitle: "" }
		];

		const labelHiddenCases: {
			labels?: LocalizedModelText;
			subtitle?: LocalizedModelText;
			expectedHiddenText: string;
		}[] = [
			{ labels, subtitle, expectedHiddenText: "Label Test" },
			{ labels, subtitle: undefined, expectedHiddenText: "Label Test" },
			{ labels: undefined, subtitle, expectedHiddenText: "" },
			{ labels: undefined, subtitle: undefined, expectedHiddenText: "" }
		];

		describe("when label is not hidden", () => {
			cases.forEach(({ labels, subtitle, expectedLabel, expectedSubtitle }) => {
				it(`should render label: "${expectedLabel}" and subtitle: "${expectedSubtitle}"`, () => {
					const engineState = createEngineState
						.from(basicEngineState)
						.withLabels(labels)
						.withConfigurations({
							...basicEngineState.models.uiModel.content.configuration,
							labelHidden: undefined,
							subtitle
						})
						.create();

					const result = setupTest(engineState);
					const resultLabel = result.find(DefaultWidgetMap.Title);
					const resultSubtitle = result.find(DefaultWidgetMap.Subtitle);

					expect(resultLabel.props().text).toBe(expectedLabel);
					expect(resultSubtitle.props().text).toBe(expectedSubtitle);
				});
			});
		});

		describe("when label is hidden", () => {
			labelHiddenCases.forEach(({ labels, subtitle, expectedHiddenText }) => {
				it("should render a hidden text instead of label and subtitle", () => {
					const engineState = createEngineState
						.from(basicEngineState)
						.withLabels(labels)
						.withConfigurations({
							...basicEngineState.models.uiModel.content.configuration,
							labelHidden: true,
							subtitle
						})
						.create();

					const result = setupTest(engineState);

					expect(result.find(DefaultWidgetMap.Title).exists()).toBe(false);
					expect(result.find(DefaultWidgetMap.Subtitle).exists()).toBe(false);
					Assert(result.find(DefaultWidgetMap.HiddenText).text() === expectedHiddenText);
				});
			});
		});
	});

	describe("smallView", () => {
		describe("given smallView = true", () => {
			const smallView = true;

			describe("given some sub-header buttons", () => {
				const engineState = createEngineState
					.from(basicEngineState)
					.withSubHeaderBox({ majorElements: [button1], minorElements: [] })
					.create();

				it("should render popup menu with the buttons", () => {
					const result = setupTest(engineState, { smallView });
					const popUpMenu = result.find(PopUpMenu);
					const buttons = popUpMenu.prop("children") as React.ReactElement[];

					expect(buttons).toHaveLength(1);
					expect(buttons[0].key).toBe("button-1");
				});
			});

			describe("given wholeTreeExpand is on", () => {
				const engineState = createEngineState
					.from(basicEngineState)
					.withSubHeaderBox({ majorElements: [{ type: TreeModel.ElementType.EXPAND_ALL_POPUP }], minorElements: [] })
					.withConfigurations({
						...basicEngineState.models.uiModel.content.configuration,
						wholeTreeExpansion: true
					})
					.create();

				it("should render a popup menu with two expand/collapse all buttons", () => {
					const result = setupTest(engineState, { smallView: true });
					const popupMenu = result.find(PopUpMenu);
					const buttons: React.ReactElement[] = popupMenu.prop("children") as React.ReactElement[];

					expect(buttons).toHaveLength(2);
					expect(buttons[0].key).toBe("expand");
					expect(buttons[1].key).toBe("collapse");
				});
			});

			describe("given sub-header buttons and wholeTreeExpand is on", () => {
				const engineState = createEngineState
					.from(basicEngineState)
					.withSubHeaderBox({
						majorElements: [{ type: TreeModel.ElementType.EXPAND_ALL_POPUP }, button1],
						minorElements: []
					})
					.withConfigurations({
						...basicEngineState.models.uiModel.content.configuration,
						wholeTreeExpansion: true
					})
					.create();

				it("should render a popup menu with sub-header buttons and two expand/collapse all buttons", () => {
					const result = setupTest(engineState, { smallView: true });
					const popupMenu = result.find(PopUpMenu);
					const buttons: React.ReactElement[] = popupMenu.prop("children") as React.ReactElement[];

					expect(buttons).toHaveLength(3);
					expect(buttons[0].key).toBe("expand");
					expect(buttons[1].key).toBe("collapse");
					expect(buttons[2].key).toBe("button-1");
				});
			});

			describe("given no sub-header buttons and wholeTreeExpand is off", () => {
				const engineState = createEngineState
					.from(basicEngineState)
					.withSubHeaderBox({ majorElements: [], minorElements: [] })
					.withConfigurations({
						...basicEngineState.models.uiModel.content.configuration,
						wholeTreeExpansion: undefined
					})
					.create();

				it("should not render popup menu", () => {
					const result = setupTest(engineState, { smallView });
					const popUpMenu = result.find(PopUpMenu);

					expect(popUpMenu.exists()).toBe(false);
				});
			});
		});

		describe("given smallView = false", () => {
			const smallView = false;

			const cases: { buttons: TreeModel.ButtonElement[]; wholeTreeExpansion?: true }[] = [
				{ buttons: [button1], wholeTreeExpansion: undefined },
				{ buttons: [button1], wholeTreeExpansion: true },
				{ buttons: [], wholeTreeExpansion: true },
				{ buttons: [], wholeTreeExpansion: undefined }
			];

			it("should not render popup menu", () => {
				cases.forEach(({ buttons, wholeTreeExpansion }) => {
					const engineState = createEngineState
						.from(basicEngineState)
						.withSubHeaderBox({ majorElements: buttons, minorElements: [] })
						.withConfigurations({ ...basicEngineState.models.uiModel.content.configuration, wholeTreeExpansion })
						.create();

					const result = setupTest(engineState, { smallView });
					const popUpMenu = result.find(PopUpMenu);

					expect(popUpMenu.exists()).toBe(false);
				});
			});
		});
	});
});
