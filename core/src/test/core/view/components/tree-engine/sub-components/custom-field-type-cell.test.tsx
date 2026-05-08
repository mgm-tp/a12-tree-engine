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

import { TextOutput } from "@com.mgmtp.a12.widgets/widgets-core/lib/text-output/main/text-output.view.js";
import { type Column } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/column.api.js";
import { type Styleable } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/base-props.js";
import { CssEllipsis } from "@com.mgmtp.a12.widgets/widgets-core/lib/css-ellipsis/main/css-ellipsis.view.js";

import { TreeEngineContextProvider } from "../../../../../../core/view/index.js";
import { createContextProps, defaultEngineState } from "../../../../../setup/basic.spec.js";
import { CustomFieldTypeCell } from "../../../../../../core/view/internal/components/tree-engine/sub-components/custom-field-type-cell.js";
import { type TreeEngineState } from "../../../../../../core/store/index.js";
import { type RuntimeTreeModel } from "../../../../../../core/models/index.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.custom-field-type-cell", () => {
	const basicProps: CustomFieldTypeCell.Props = {
		documentModelName: "TestDocumentModel",
		documentModelPath: [{ elementName: "Root" }, { elementName: "CustomFieldType" }],
		value: "CustomFieldValue",
		alignment: "right"
	};

	const basicEngineState = defaultEngineState;

	function setupTest(props?: Partial<CustomFieldTypeCell.Props>, customEngineState?: Partial<TreeEngineState>) {
		return mount(<CustomFieldTypeCell {...basicProps} {...props} />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps({ ...basicEngineState, ...customEngineState })
		});
	}

	describe("value", () => {
		describe("given a null value", () => {
			it("should render TextOutput with null value", () => {
				const result = setupTest({ value: null });
				const textOutput = result.find(TextOutput);
				expect(textOutput.props().children).toBe(null);
			});
		});

		describe("given a string value", () => {
			const mockValue = "MockStringValue:";
			it("should render TextOutput with the string value", () => {
				const result = setupTest({ value: mockValue });
				const textOutput = result.find(TextOutput);
				expect(textOutput.props().children).toBe(mockValue);
			});
		});
	});

	describe("given rowHeight", () => {
		const treeModel: RuntimeTreeModel = {
			...basicEngineState.models.uiModel,
			content: {
				...basicEngineState.models.uiModel.content,
				configuration: {
					...basicEngineState.models.uiModel.content.configuration,
					rowHeight: 120
				}
			}
		};
		const mockValue = "MockStringValue:";
		it("should render TextOutput with the string value", () => {
			const result = setupTest({ value: mockValue }, { models: { ...basicEngineState.models, uiModel: treeModel } });
			const cssEllipsis = result.find(CssEllipsis);
			expect(cssEllipsis.exists()).toBe(true);
			expect(cssEllipsis.props().useTooltip).toBe(true);
			expect(cssEllipsis.text()).toBe(mockValue);
		});
	});

	describe("alignment", () => {
		const alignments: (Column.HorizontalAlignment | undefined)[] = ["left", "right", undefined];

		alignments.forEach((alignment) => {
			describe(`given alignment = ${alignment}`, () => {
				it(`should render TextOutput with the same alignment = ${alignment}`, () => {
					const result = setupTest({ alignment });
					const textOutput = result.find(TextOutput);
					expect(textOutput.props().alignment).toBe(alignment);
				});
			});
		});
	});

	describe("given any styleable props", () => {
		const className = "MockClassName";
		const style = {};

		const styleableProps: Styleable = { className, style };
		it("should pass the props down to TextOutput", () => {
			const result = setupTest({ ...styleableProps });
			const textOutput = result.find(TextOutput);
			expect(textOutput.props()).toContain(styleableProps);
		});
	});
});
