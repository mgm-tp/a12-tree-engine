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
import type * as Enzyme from "enzyme";
import { VALUE_ESCAPE } from "keycode-js";

import { AttachedPortal, List } from "@com.mgmtp.a12.widgets/widgets-core";

import { InitialViewRightClickContextMenuProvider } from "../../../../../../core/view/components/tree-engine/sub-components/initial-view-right-click-context-menu-provider.js";
import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps
} from "../../../../../setup/basic.spec.js";
import type { TreeEngineState } from "../../../../../../core/store/index.js";
import { RowAction, TreeEngineContextProvider } from "../../../../../../core/view/index.js";
import { mockType } from "../../../../../utils/mock-utils.js";
import { createEngineState } from "../../../../../utils/model-utils.js";
import { en } from "../../../../../../core/services/localization/languages/en.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.initial-view-right-click-context-menu-provider", () => {
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
							actions: [
								{
									type: "insert",
									documentModelRef: "DomainTeam",
									label: [
										{
											locale: "en",
											text: "Row Action 1"
										}
									]
								},
								{
									type: "insert",
									documentModelRef: "DomainTeam",
									label: [
										{
											locale: "en",
											text: "Row Action 2"
										}
									]
								}
							]
						}
					]
				}
			}
		})
		.create();

	function setupTest(
		customEngineState?: Partial<TreeEngineState>,
		customContextProp?: Partial<PartialEventHandlerContextProps>
	) {
		return mount(<InitialViewRightClickContextMenuProvider />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps(
				{ ...basicEngineState, ...customEngineState },
				{ ...customContextProp }
			)
		});
	}

	describe("when right-click", () => {
		let wrapper: Enzyme.ReactWrapper;
		beforeEach(() => {
			wrapper = setupTest();
			wrapper.simulate("contextmenu", { preventDefault: vi.fn(), clientX: 10, clientY: 20 });
		});

		it("should open context menu", () => {
			expect(wrapper.find(AttachedPortal).exists()).toBe(true);
		});

		it("should render the sub header text which is the same as addButton label", () => {
			const listSubHeader = wrapper.find(List.SubHeader);

			expect(listSubHeader.text()).toBe(en.treeEngine.initialView.addButton.label);
		});

		it("should render a list of actions", () => {
			const menuItems = wrapper.find(RowAction);

			expect(menuItems).have.to.length(2);
		});

		it("should close context menu on outside click", () => {
			wrapper.find(AttachedPortal).props().onClickOutside?.(mockType<Event>());
			wrapper.update();

			expect(wrapper.find(AttachedPortal).exists()).toBe(false);
		});

		it("should close context menu on escape key press", () => {
			wrapper
				.find(AttachedPortal)
				.props()
				.onKeyDown?.(mockType<React.KeyboardEvent<HTMLElement>>({ key: VALUE_ESCAPE }));

			wrapper.update();

			expect(wrapper.find(AttachedPortal).exists()).toBe(false);
		});
	});
});
