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

import { defaultEngineState } from "../../../../../setup/basic.spec.js";
import { type RuntimeTreeModel, TreeModel } from "../../../../../../core/models/index.js";
import { type TreeEngineState } from "../../../../../../core/store/index.js";
import { BaseRowActionGroup, RootNodeRow } from "../../../../../../core/view/index.js";
import { VirtualRootRowActionsGroup } from "../../../../../../core/view/internal/components/tree-engine/sub-components/virtual-root-row-actions-group.js";

import { BodyCellWrapper } from "./body-cell/shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.virtual-root-row-actions-group", () => {
	const basicEngineState = defaultEngineState;
	const basicRootNodeRow = RootNodeRow.create();

	const basicRowActionGroupProps: VirtualRootRowActionsGroup.Props = {
		row: basicRootNodeRow
	};

	function setupTest(
		rowActionsGroupProps?: Partial<VirtualRootRowActionsGroup.Props>,
		customEngineState?: Partial<TreeEngineState>
	) {
		return mount(<VirtualRootRowActionsGroup {...basicRowActionGroupProps} {...rowActionsGroupProps} />, {
			wrappingComponent: BodyCellWrapper,
			wrappingComponentProps: { customEngineState } as BodyCellWrapper.Props
		});
	}

	describe("given actions and a context menu in virtual root row", () => {
		const actionA: TreeModel.TreeNodeEventActionButton = {
			type: "event",
			event: "A"
		};
		const actionB: TreeModel.TreeNodeInsertActionButton = {
			type: "insert",
			position: TreeModel.InsertPosition.AS_CHILD
		};
		const actionC: TreeModel.TreeNodeInsertActionButton = {
			type: "insert",
			position: TreeModel.InsertPosition.AS_CHILD
		};

		const contextMenu: TreeModel.TreeNodeContextMenu = {
			groups: [{ type: "add", name: "mock", actions: [actionC] }]
		};
		const basicUiModel = basicEngineState.models.uiModel;
		const uiModel: RuntimeTreeModel = {
			...basicUiModel,
			content: {
				...basicUiModel.content,
				configuration: {
					...basicUiModel.content.configuration,
					virtualRoot: {
						label: [],
						actions: [actionA, actionB],
						contextMenu
					}
				}
			}
		};
		it("should render BaseRowActionGroup", () => {
			const result = setupTest(undefined, { models: { ...basicEngineState.models, uiModel } });
			const baseRowActionGroup = result.find(BaseRowActionGroup);

			expect(baseRowActionGroup.props().row).toEqual(basicRootNodeRow);
			expect(baseRowActionGroup.props().actions).toEqual([actionA, actionB]);
			expect(baseRowActionGroup.props().contextMenu).toEqual(contextMenu);
		});
	});
});
