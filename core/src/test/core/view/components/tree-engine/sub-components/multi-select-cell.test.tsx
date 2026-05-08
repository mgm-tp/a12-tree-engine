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

import * as React from "react";
import { vi } from "vitest";

import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { BulletList } from "@com.mgmtp.a12.widgets/widgets-core/lib/bullet-list/index.js";
import { TextOutput } from "@com.mgmtp.a12.widgets/widgets-core/lib/text-output/index.js";
import { CssEllipsis } from "@com.mgmtp.a12.widgets/widgets-core/lib/css-ellipsis/main/css-ellipsis.view.js";

import { type Models, type TreeEngineState } from "../../../../../../core/store/index.js";
import { TreeEngineContextProvider, MultiSelectCell } from "../../../../../../core/view/index.js";
import { TreeModel } from "../../../../../../core/models/index.js";
import { createContextProps, defaultEngineState, deLocale, enLocale } from "../../../../../setup/basic.spec.js";
import { createDocumentModel, createEngineState, createMultiSelectGroup } from "../../../../../utils/model-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.multi-select-cell", () => {
	const basicEngineState = defaultEngineState;
	const documentModelName = "TestDocumentModel";

	const basicMultiSelectCellProps: MultiSelectCell.Props = {
		documentModelName,
		documentModelPath: [{ elementName: "root" }, { elementName: "multi-select" }],
		data: [{ value: "2" }, { value: "1" }, { value: "3" }],
		alignment: "left",
		displayMode: TreeModel.MultiSelectDisplayMode.DEFAULT
	};

	const basicColumnRef = "enum";

	interface EngineParam {
		alphabeticalSorting: boolean | undefined;
	}

	function setupTest(
		props?: MultiSelectCell.Props,
		engineParam?: EngineParam,
		engineState?: Partial<TreeEngineState>,
		locale?: Locale
	) {
		const models: Models = {
			...basicEngineState.models,
			...engineState?.models,
			documentModels: [
				createDocumentModel(documentModelName, [createMultiSelectGroup(engineParam?.alphabeticalSorting)])
			]
		};

		return mount(
			<MultiSelectCell {...basicMultiSelectCellProps} {...props} />,
			{
				wrappingComponent: TreeEngineContextProvider,
				wrappingComponentProps: createContextProps(basicEngineState, {
					state: {
						...basicEngineState,
						...engineState,
						models
					}
				})
			},
			locale
		);
	}

	describe("when data is empty", () => {
		it("should not render", () => {
			const result = setupTest({ ...basicMultiSelectCellProps, data: [] });

			expect(result.isEmptyRender()).toBe(true);
		});
	});

	describe("when not found the document model", () => {
		beforeAll(() => {
			vi.spyOn(console, "error").mockImplementation(() => {});
		});
		it("should throw an error", () => {
			expect(() => setupTest({ ...basicMultiSelectCellProps, documentModelName: "DomainDummy" })).toThrow();
		});
	});

	describe("when data has only one value", () => {
		it("should not render BulletList.Unordered", () => {
			const result = setupTest({ ...basicMultiSelectCellProps, data: [{ value: "1" }] });
			const textOutput = result.find(TextOutput);
			const bulletList = result.find(BulletList.Unordered);

			expect(textOutput).toHaveLength(1);
			expect(textOutput.props().alignment).toBe("left");
			expect(textOutput.text()).toBe("One");

			expect(bulletList).toHaveLength(0);
		});
	});

	describe("when data has multiple values", () => {
		it("should render BulletList.Unordered properly", () => {
			const result = setupTest();
			const textOutput = result.find(TextOutput);
			const bulletList = result.find(BulletList.Unordered);
			const items = result.find(BulletList.Item);

			expect(textOutput).toHaveLength(1);
			expect(textOutput.props().alignment).toBe("left");

			expect(bulletList).toHaveLength(1);
			expect(bulletList.props().indent).toBe(false);

			expect(items).toHaveLength(3);

			const expectedLabels: string[] = ["Two", "One", "Three"];
			items.forEach((item, itemIndex) => {
				expect(item.text()).toBe(expectedLabels[itemIndex]);
			});
		});

		describe("ordering", () => {
			function testItems(params: {
				alphabeticalSorting: boolean | undefined;
				expectedLabels: string[];
				locale: Locale;
			}) {
				const { locale, expectedLabels, alphabeticalSorting } = params;
				const result = setupTest(basicMultiSelectCellProps, { alphabeticalSorting }, undefined, locale);
				const items = result.find(BulletList.Item);

				expect(items).toHaveLength(expectedLabels.length);
				items.forEach((item, itemIndex) => {
					expect(item.text()).toBe(expectedLabels[itemIndex]);
				});
			}

			describe("given english locale", () => {
				it("should sort the labels alphabetically only when alphabeticalSorting = true", () => {
					testItems({
						alphabeticalSorting: undefined,
						locale: enLocale,
						expectedLabels: ["Two", "One", "Three"]
					});

					testItems({
						alphabeticalSorting: false,
						locale: enLocale,
						expectedLabels: ["Two", "One", "Three"]
					});

					testItems({
						alphabeticalSorting: true,
						locale: enLocale,
						expectedLabels: ["One", "Three", "Two"]
					});
				});
			});

			describe("given german locale", () => {
				it("should sort the labels alphabetically only when alphabeticalSorting = true", () => {
					testItems({
						alphabeticalSorting: undefined,
						locale: deLocale,
						expectedLabels: ["Zwei", "Einer", "Drei"]
					});

					testItems({
						alphabeticalSorting: false,
						locale: deLocale,
						expectedLabels: ["Zwei", "Einer", "Drei"]
					});

					testItems({
						alphabeticalSorting: true,
						locale: deLocale,
						expectedLabels: ["Drei", "Einer", "Zwei"]
					});
				});
			});
		});
	});

	describe("when display mode is comma separated", () => {
		const multiSelectProps = {
			...basicMultiSelectCellProps,
			columnRef: basicColumnRef,
			displayMode: TreeModel.MultiSelectDisplayMode.COMMA_SEPARATED
		};

		describe("when data has only one value", () => {
			it("should render just text inside TextOutput with no Bulletlist", () => {
				const wrapper = setupTest({ ...multiSelectProps, data: [{ value: "1" }] });

				expect(wrapper.find(TextOutput)).toHaveLength(1);
				expect(wrapper.find(BulletList.Item)).toHaveLength(0);

				expect(wrapper.text()).toContain("One");
			});
		});

		function testItems(params: { alphabeticalSorting: boolean | undefined; expectedResults: string; locale: Locale }) {
			const { expectedResults, alphabeticalSorting, locale } = params;
			const result = setupTest(multiSelectProps, { alphabeticalSorting }, undefined, locale);
			const textOutput = result.find(TextOutput);

			expect(textOutput).toHaveLength(1);
			expect(textOutput.text()).toBe(expectedResults);
		}

		describe("given english language", () => {
			it("should render texts separated by comma and sort by english alphabetically only if enabling alphabeticalSorting", () => {
				testItems({
					expectedResults: "Two, One, Three",
					locale: enLocale,
					alphabeticalSorting: undefined
				});

				testItems({
					expectedResults: "Two, One, Three",
					locale: enLocale,
					alphabeticalSorting: false
				});

				testItems({
					expectedResults: "One, Three, Two",
					locale: enLocale,
					alphabeticalSorting: true
				});
			});
		});

		describe("given german language", () => {
			it("should render texts separated by comma and sort by german alphabetically only if enabling alphabeticalSorting", () => {
				testItems({
					expectedResults: "Zwei, Einer, Drei",
					locale: deLocale,
					alphabeticalSorting: undefined
				});

				testItems({
					expectedResults: "Zwei, Einer, Drei",
					locale: deLocale,
					alphabeticalSorting: false
				});

				testItems({
					expectedResults: "Drei, Einer, Zwei",
					locale: deLocale,
					alphabeticalSorting: true
				});
			});
		});
	});

	describe("given rowHeight", () => {
		const engineState = createEngineState
			.from(basicEngineState)
			.withConfigurations({
				...basicEngineState.models.uiModel.content.configuration,
				rowHeight: 80
			})
			.create();

		it("should render the enumerations separated with comma inside ellipsis component", () => {
			const result = setupTest(undefined, undefined, engineState);
			const ellipsis = result.find(CssEllipsis);

			expect(ellipsis.exists()).toBe(true);
			expect(ellipsis.text()).toBe("Two, One, Three");
		});
	});
});
