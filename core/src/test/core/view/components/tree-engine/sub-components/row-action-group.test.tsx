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

import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core";

import { TreeModel } from "../../../../../../core/models/index.js";
import type { Identifier, RowState, UIStateSelector } from "../../../../../../core/store/index.js";
import {
	BaseRowActionGroup,
	ContextMenu,
	type FlattenNodeRow,
	RowAction,
	RowActionsGroup
} from "../../../../../../core/view/index.js";
import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps
} from "../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../utils/mock-utils.js";
import { testIsNullComponent } from "../../../../../utils/test-utils.js";

import { BodyCellWrapper } from "./body-cell/shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.row-action-group", () => {
	const basicEngineState = defaultEngineState;
	const actionA: TreeModel.TreeNodeEventActionButton = {
		type: "event",
		event: "A"
	};

	const actionB: TreeModel.TreeNodeInsertActionButton = { type: "insert", position: TreeModel.InsertPosition.AS_CHILD };

	const basicActions = [actionA, actionB];

	const basicNodeIdentifier: Identifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};

	const basicRowState: RowState = {
		nodeModel: basicEngineState.models.uiModel.content.nodes[0],
		uiState: mockType<UIStateSelector.NodeState>()
	};

	describe("RowActionGroup", () => {
		const basicRowActionGroupProps: RowActionsGroup.Props = {
			row: mockType<FlattenNodeRow>({
				data: {
					nodeIdentifier: basicNodeIdentifier,
					nodePath: [basicNodeIdentifier]
				}
			})
		};

		function setupTest(
			rowActionsGroupProps?: Partial<RowActionsGroup.Props>,
			actions?: TreeModel.TreeNodeActionButton[],
			contextMenu?: TreeModel.TreeNodeContextMenu,
			customContextProp?: Partial<PartialEventHandlerContextProps>
		) {
			return mount(<RowActionsGroup {...basicRowActionGroupProps} {...rowActionsGroupProps} />, {
				wrappingComponent: BodyCellWrapper,
				wrappingComponentProps: {
					customEngineContextProps: createContextProps(basicEngineState, customContextProp),
					rowContextProps: {
						rowState: {
							...basicRowState,
							nodeModel: {
								...basicRowState.nodeModel,
								actions: actions ?? [],
								contextMenu
							}
						}
					}
				} as BodyCellWrapper.Props
			});
		}

		describe("given actions and context menu", () => {
			it("should display BaseRowActionGroup with the defined action and context menu", () => {
				const testCases = [
					{ actions: basicActions, contextMenu: undefined },
					{ actions: [], contextMenu: { groups: [] } },
					{ actions: basicActions, contextMenu: { groups: [] } }
				];
				testCases.forEach(({ actions, contextMenu }) => {
					const result = setupTest(undefined, actions, contextMenu);

					const baseRowActionGroup = result.find(BaseRowActionGroup);

					expect(baseRowActionGroup.props().actions).toEqual(actions);
					expect(baseRowActionGroup.props().contextMenu).toEqual(contextMenu);
				});
			});
		});

		describe("rowActionStateGetter", () => {
			describe("given rowActionStateGetter which return hidden = true for actionB", () => {
				it("should pass only actionA to BaseRowActionGroup", () => {
					const result = setupTest({}, basicActions, undefined, {
						rowActionStateGetter: ({ action }) => {
							return { hidden: action.type === "insert" };
						}
					});

					const baseRowActionGroup = result.find(BaseRowActionGroup);

					expect(baseRowActionGroup.props().actions).toHaveLength(1);
					expect(baseRowActionGroup.props().actions?.[0]).toEqual(actionA);
				});
			});
		});
	});

	describe("BaseRowActionGroup", () => {
		const basicProps: BaseRowActionGroup.Props = {
			row: mockType<FlattenNodeRow>({
				data: {
					nodeIdentifier: basicNodeIdentifier,
					nodePath: [basicNodeIdentifier]
				}
			})
		};

		function setupTest(customProps?: Partial<BaseRowActionGroup.Props>) {
			return mount(<BaseRowActionGroup {...basicProps} {...customProps} />, {
				wrappingComponent: BodyCellWrapper,
				wrappingComponentProps: {
					customEngineContextProps: createContextProps(basicEngineState),
					rowContextProps: { rowState: { ...basicRowState } }
				} as BodyCellWrapper.Props
			});
		}

		describe("when actions and context menu is empty", () => {
			it("should render nothing", () => {
				const result = setupTest({});

				testIsNullComponent(result);
			});
		});

		describe("given three actions and no context menu", () => {
			it("should render three RowAction only", () => {
				const result = setupTest({ actions: basicActions });

				const buttonGroup = result.find(ButtonGroup);
				const rowActions = result.find(RowAction);
				const contextMenu = result.find(ContextMenu);

				expect(buttonGroup).toHaveLength(1);
				expect(rowActions).toHaveLength(2);
				expect(contextMenu).toHaveLength(0);

				basicActions.forEach((action, index) => {
					const actual = rowActions.at(index);

					expect(actual.props().row).toEqual(basicProps.row);
					expect(actual.props().rowActionModel).toEqual(action);
				});
			});
		});

		describe("given context menu and no actions", () => {
			it("should render context menu only", () => {
				const contextMenuModel: TreeModel.TreeNodeContextMenu = { groups: [] };
				const result = setupTest({ contextMenu: contextMenuModel });

				const buttonGroup = result.find(ButtonGroup);
				const rowActions = result.find(RowAction);
				const contextMenu = result.find(ContextMenu);

				expect(buttonGroup).toHaveLength(1);
				expect(rowActions).toHaveLength(0);

				expect(contextMenu).toHaveLength(1);
				expect(contextMenu.props().row).toEqual(basicProps.row);
				expect(contextMenu.props().contextMenuModel).toEqual(contextMenuModel);
			});
		});

		describe("given both actions and context menu", () => {
			it("should render both actions and context menu", () => {
				const contextMenuModel: TreeModel.TreeNodeContextMenu = { groups: [] };
				const result = setupTest({ actions: basicActions, contextMenu: contextMenuModel });

				const buttonGroup = result.find(ButtonGroup);
				const rowActions = result.find(RowAction);
				const contextMenu = result.find(ContextMenu);

				expect(buttonGroup).toHaveLength(1);
				expect(rowActions).toHaveLength(2);
				basicActions.forEach((action, index) => {
					const actual = rowActions.at(index);

					expect(actual.props().row).toEqual(basicProps.row);
					expect(actual.props().rowActionModel).toEqual(action);
				});

				expect(contextMenu).toHaveLength(1);
				expect(contextMenu.props().contextMenuModel).toEqual(contextMenuModel);
			});
		});
	});
});
