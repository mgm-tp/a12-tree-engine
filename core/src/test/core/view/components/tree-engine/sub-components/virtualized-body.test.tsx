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

import { DefaultTreeTableComponentRenderers } from "@com.mgmtp.a12.widgets/widgets-core";

import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps
} from "../../../../../setup/basic.spec.js";
import type { TreeEngineState } from "../../../../../../core/store/index.js";
import { RootNodeRow, TreeEngineContextProvider, VirtualizedBody } from "../../../../../../core/view/index.js";
import { InitialViewBody } from "../../../../../../core/view/components/tree-engine/sub-components/body.js";
import type { RuntimeTreeModel } from "../../../../../../core/models/index.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.virtualized-body", () => {
	const basicEngineState = defaultEngineState;
	const basicProps: VirtualizedBody.Props = {
		data: [],
		virtualScrollOptions: {
			rowHeight: 100
		}
	};

	function setupTest(
		customProps?: Partial<VirtualizedBody.Props>,
		customEngineState?: Partial<TreeEngineState>,
		customContextProp?: Partial<PartialEventHandlerContextProps>
	) {
		return mount(<VirtualizedBody {...basicProps} {...customProps} />, {
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
				it("should not render InitialViewBody", () => {
					const result = setupTest({ data }, { models: { ...basicEngineState.models, uiModel } }, { busy: true });
					const initialViewBody = result.find(InitialViewBody);

					expect(initialViewBody.exists()).toBe(false);
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
			stub = vi.spyOn(DefaultTreeTableComponentRenderers, "virtualizedBodyRenderer").mockReturnValue("mock body");
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
