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

import { DefaultTreeTableComponentRenderers } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/main/button.view.js";

import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps
} from "../../../../../setup/basic.spec.js";
import { type TreeEngineState } from "../../../../../../core/store/index.js";
import { ContextMenu, RootNodeRow, TreeEngineContextProvider } from "../../../../../../core/view/index.js";
import {
	Body,
	InitialViewBody
} from "../../../../../../core/view/internal/components/tree-engine/sub-components/body.js";
import { type RuntimeTreeModel } from "../../../../../../core/models/index.js";
import { en } from "../../../../../../core/services/localization/internal/languages/en.js";
import { createEngineState } from "../../../../../utils/model-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.body", () => {
	const basicEngineState = defaultEngineState;
	const basicProps: Body.Props = { data: [] };

	function setupTest(
		customProps?: Partial<Body.Props>,
		customEngineState?: Partial<TreeEngineState>,
		customContextProp?: Partial<PartialEventHandlerContextProps>
	) {
		return mount(<Body {...basicProps} {...customProps} />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps(
				{ ...basicEngineState, ...customEngineState },
				{ ...customContextProp }
			)
		});
	}

	describe("given virtual root mode is enabled", () => {
		const basicUiModel = basicEngineState.models.uiModel;
		const uiModel: RuntimeTreeModel = {
			...basicUiModel,
			content: {
				...basicUiModel.content,
				configuration: {
					...basicUiModel.content.configuration,
					virtualRoot: {
						label: []
					}
				}
			}
		};

		describe("given there is only virtual root row", () => {
			const data = [RootNodeRow.create()];

			describe("given engine is busy", () => {
				it("should render empty", () => {
					const result = setupTest({ data }, { models: { ...basicEngineState.models, uiModel } }, { busy: true });
					expect(result.isEmptyRender()).toBe(true);
				});
			});

			describe("given engine is not busy", () => {
				it("should render InitialViewBody", () => {
					const result = setupTest({ data }, { models: { ...basicEngineState.models, uiModel } });
					const initialViewBody = result.find(InitialViewBody);
					expect(initialViewBody.exists()).toBe(true);
				});
			});
		});
	});

	describe("given virtual root mode is not enabled", () => {
		let stub: ReturnType<typeof vi.spyOn>;
		beforeAll(() => {
			stub = vi.spyOn(DefaultTreeTableComponentRenderers, "bodyRenderer").mockReturnValue("mock body");
		});

		afterAll(() => {
			stub.mockReset();
		});

		it("should render using the default renderer", () => {
			const result = setupTest();
			expect(stub).toHaveBeenCalledWith(basicProps);
			expect(result.text() === "mock body").toBe(true);
		});
	});
});

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.body.InitialViewBody", () => {
	const basicEngineState = createEngineState
		.from(defaultEngineState)
		.withConfigurations({
			...defaultEngineState.models.uiModel.content.configuration,
			virtualRoot: {
				label: [],
				contextMenu: {
					groups: [
						{
							name: "first",
							type: "add",
							title: [{ locale: "en", text: "text" }],
							actions: [{ type: "insert", documentModelRef: "DomainTeam" }]
						}
					]
				}
			}
		})
		.create();

	function setupTest() {
		return mount(<InitialViewBody />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps(basicEngineState)
		});
	}

	describe("given context menu defined in model", () => {
		it("should render message correctly", () => {
			const result = setupTest();
			expect(result.contains(en.treeEngine.initialView.message)).toBe(true);
		});

		it("should render button add", () => {
			const result = setupTest();
			const addButton = result.find(Button);
			expect(addButton.length === 1).toBe(true);
			expect(addButton.props().label).toBe(en.treeEngine.initialView.addButton.label);
		});

		describe("context menu", () => {
			it("should receive root node row", () => {
				const result = setupTest();
				const contextMenu = result.find(ContextMenu);
				expect(RootNodeRow.isAssignableFrom(contextMenu.props().row)).toBe(true);
			});
		});
	});
});
