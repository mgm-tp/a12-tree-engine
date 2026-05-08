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

import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { PopUpMenu } from "@com.mgmtp.a12.widgets/widgets-core/lib/pop-up-menu/index.js";
import { List } from "@com.mgmtp.a12.widgets/widgets-core/lib/list/main/list.view.js";

import { ExpandAllPopUp, TreeEngineContextProvider } from "../../../../../../core/view/index.js";
import { createContextProps, defaultEngineState } from "../../../../../setup/basic.spec.js";
import { createEngineState } from "../../../../../utils/model-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.content-box.sub-components.expand-all-popup", () => {
	const basicEngineState = defaultEngineState;
	const onEventButtonClicked = vi.fn();

	function setupTest() {
		return mount(<ExpandAllPopUp />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps(
				createEngineState
					.from(basicEngineState)
					.withConfigurations({ ...basicEngineState.models.uiModel.content.configuration, wholeTreeExpansion: true })
					.create(),
				{ eventHandlers: { onEventButtonClicked } }
			)
		});
	}

	describe("given ExpandAllPopUp", () => {
		it("should render icons properly", () => {
			const wrapper = setupTest();
			const getIconName = (icon: React.ReactNode): React.ReactNode => {
				return mount(icon as React.ReactElement)
					.find(Icon)
					.props().children;
			};
			const popUpMenu = wrapper.find(PopUpMenu);
			expect(getIconName(popUpMenu.props().icon)).toBe("menu");

			popUpMenu.find(Button).simulate("click");
			wrapper.update();

			const updatedPopUpMenu = wrapper.find(PopUpMenu);
			expect(getIconName(updatedPopUpMenu.props().icon)).toBe("clear");

			const buttons = updatedPopUpMenu.find(List.Item);

			const expandWholeTreeButton = buttons.at(0);
			expect(getIconName(expandWholeTreeButton.props().graphic)).equal("unfold_more");

			const collapseWholeTreeButton = buttons.at(1);
			expect(getIconName(collapseWholeTreeButton.props().graphic)).equal("unfold_less");
		});

		it("expand and collapse button should work properly", () => {
			const getTriggeredItem = (index: number) => {
				const wrapper = setupTest();
				const popUpMenu = wrapper.find(PopUpMenu);

				popUpMenu.find(Button).simulate("click");
				wrapper.update();

				const updatedPopUpMenu = wrapper.find(PopUpMenu);
				const listItems = updatedPopUpMenu.find(List.Item);
				expect(listItems).toHaveLength(2);
				return listItems.at(index).find(`[data-role="list-item-content"]`).at(0);
			};

			const expandWholeTreeButton = getTriggeredItem(0);

			expandWholeTreeButton.simulate("click");
			expect(onEventButtonClicked).toHaveBeenCalledOnce();
			expect(onEventButtonClicked).toHaveBeenCalledWith(
				expect.objectContaining({
					button: { event: "event_expand_whole_tree" }
				})
			);

			onEventButtonClicked.mockClear();
			const collapseWholeTreeButton = getTriggeredItem(1);
			collapseWholeTreeButton.simulate("click");
			expect(onEventButtonClicked).toHaveBeenCalledOnce();
			expect(onEventButtonClicked).toHaveBeenCalledWith(
				expect.objectContaining({
					button: { event: "event_collapse_whole_tree" }
				})
			);
		});
	});
});
