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

import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { List } from "@com.mgmtp.a12.widgets/widgets-core/lib/list/index.js";
import { PopUpMenu } from "@com.mgmtp.a12.widgets/widgets-core/lib/pop-up-menu/index.js";

import { TreeModel } from "../../../../../../core/models/index.js";
import { type TreeEngineState, type UIStateSelector } from "../../../../../../core/store/index.js";
import {
	ContextMenu,
	type FlattenNodeRow,
	RowAction,
	type TreeEngineRowContext
} from "../../../../../../core/view/index.js";
import { deLocale, type PartialEventHandlerContextProps } from "../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../utils/mock-utils.js";
import { testIsNullComponent } from "../../../../../utils/test-utils.js";

import { BodyCellWrapper, teamIdentifier, teamNodeModel } from "./body-cell/shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.context-menu", () => {
	const basicNodeIdentifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};
	const NODE_ID = "1024";

	function createEventAction(params?: { event?: string; hasIcon?: boolean }): TreeModel.TreeNodeEventActionButton {
		return {
			type: "event",
			event: params?.event ?? "event_name",
			icon: params?.hasIcon
				? {
						name: "icon" + params.event
					}
				: undefined
		};
	}

	function createInsertAction(params?: { hasIcon?: boolean }): TreeModel.TreeNodeInsertActionButton {
		return {
			type: "insert",
			position: TreeModel.InsertPosition.AS_CHILD,
			icon: params?.hasIcon ? { name: "icon_AS_CHILD" } : undefined
		};
	}

	function createGroup(params: {
		name?: string;
		actions?: TreeModel.TreeNodeActionButton[];
		hasTitle?: boolean;
	}): TreeModel.TreeNodeActionGroup {
		return {
			name: params?.name ?? "GroupName",
			actions: params?.actions ?? [],
			title: params.hasTitle
				? [
						{
							locale: "en",
							text: params.name + " en"
						},
						{
							locale: "de",
							text: params.name + " de"
						}
					]
				: undefined
		};
	}

	const basicNodeRow = mockType<FlattenNodeRow>({
		data: {
			nodeIdentifier: basicNodeIdentifier,
			nodePath: [basicNodeIdentifier]
		},
		nodeModel: {
			id: NODE_ID
		}
	});

	const basicRowContext: TreeEngineRowContext.Type = {
		rowState: {
			node: {
				document: {
					TeamDetails: {
						Location: "Munich",
						TeamName: "A12"
					},
					id: "DomainTeam/1"
				},
				identifier: teamIdentifier,
				children: []
			},
			nodeModel: teamNodeModel,
			uiState: mockType<UIStateSelector.NodeState>()
		},
		isCircular: false,
		shouldRenderPaginatedBodyRow: false
	};

	const basicProps: ContextMenu.Props = { row: basicNodeRow, contextMenuModel: { groups: [] } };

	function setupTest(
		props?: Partial<ContextMenu.Props>,
		customEngineState?: Partial<TreeEngineState>,
		customEngineContextProps?: Partial<PartialEventHandlerContextProps>,
		clickMenu?: boolean,
		locale?: Locale
	) {
		const result = mount(
			<ContextMenu {...basicProps} {...props} />,
			{
				wrappingComponent: BodyCellWrapper,
				wrappingComponentProps: {
					customEngineState,
					rowContextProps: basicRowContext,
					customEngineContextProps
				}
			},
			locale
		);

		if (clickMenu ?? true) {
			const button = result.find(Button);
			button.simulate("click");
			result.update();
		}

		return result;
	}

	describe("paddedLeft", () => {
		const groupsWithoutIconActions = [
			createGroup({
				name: "A",
				actions: [createEventAction({ hasIcon: false }), createInsertAction({ hasIcon: false })]
			}),
			createGroup({
				name: "B",
				actions: [createEventAction({ hasIcon: false })]
			})
		];

		const groupsWithOneIconAction = [
			createGroup({
				name: "A",
				actions: [createEventAction({ hasIcon: false }), createInsertAction({ hasIcon: false })]
			}),
			createGroup({
				name: "B",
				actions: [createEventAction({ hasIcon: true })]
			})
		];

		describe("given groups without icon actions", () => {
			it("should have paddedLeft = false", () => {
				const result = setupTest({ contextMenuModel: { groups: groupsWithoutIconActions } });
				const list = result.find(List);

				expect(list.props().paddedLeft).toBe(false);
			});
		});

		describe("given groups with one action has icon", () => {
			it("should have paddedLeft = false", () => {
				const result = setupTest({ contextMenuModel: { groups: groupsWithOneIconAction } });
				const list = result.find(List);

				expect(list.props().paddedLeft).toBe(true);
			});
		});

		describe("given paddedLeft passed to props", () => {
			describe("given paddedLeft = true", () => {
				it("should always render paddedLeft = true", () => {
					[true, false].forEach((withIconAction) => {
						const result = setupTest({
							contextMenuModel: { groups: withIconAction ? groupsWithOneIconAction : groupsWithoutIconActions },
							paddedLeft: true
						});
						const list = result.find(List);

						expect(list.props().paddedLeft).toBe(true);
					});
				});
			});

			describe("given paddedLeft=false", () => {
				it("should always render paddedLeft = true", () => {
					[true, false].forEach((withIconAction) => {
						const result = setupTest({
							contextMenuModel: { groups: withIconAction ? groupsWithOneIconAction : groupsWithoutIconActions },
							paddedLeft: false
						});
						const list = result.find(List);

						expect(list.props().paddedLeft).toBe(false);
					});
				});
			});
		});
	});

	describe("title", () => {
		describe("given groups without any titles", () => {
			it("should not have List.SubHeader", () => {
				const result = setupTest({
					contextMenuModel: {
						groups: [
							createGroup({
								name: "A",
								hasTitle: false,
								actions: [createEventAction({ hasIcon: false })]
							}),
							createGroup({
								name: "B",
								hasTitle: false,
								actions: [createEventAction({ hasIcon: true })]
							})
						]
					}
				});
				const subHeader = result.find(List.SubHeader);

				expect(subHeader).toHaveLength(0);
			});
		});

		describe("given groups with one title", () => {
			it("should have one List.SubHeader with proper title", () => {
				const result = setupTest({
					contextMenuModel: {
						groups: [
							createGroup({
								name: "A",
								hasTitle: true,
								actions: [createEventAction({ hasIcon: false })]
							}),
							createGroup({
								name: "B",
								hasTitle: false,
								actions: [createEventAction({ hasIcon: true })]
							})
						]
					}
				});
				const subHeader = result.find(List.SubHeader);

				expect(subHeader).toHaveLength(1);
				expect(subHeader.text()).toBe("A en");
			});
		});

		describe("given groups with two titles", () => {
			it("should have two List.SubHeaders with proper titles", () => {
				const result = setupTest({
					contextMenuModel: {
						groups: [
							createGroup({
								name: "A",
								hasTitle: true,
								actions: [createEventAction({ hasIcon: false })]
							}),
							createGroup({
								name: "B",
								hasTitle: true,
								actions: [createEventAction({ hasIcon: true })]
							})
						]
					}
				});
				const subHeaders = result.find(List.SubHeader);

				expect(subHeaders).toHaveLength(2);
				expect(subHeaders.at(0).text()).toBe("A en");
				expect(subHeaders.at(1).text()).toBe("B en");
			});
		});

		describe("given groups with two titles in german locale", () => {
			it("should have two List.SubHeaders with proper german titles", () => {
				const result = setupTest(
					{
						contextMenuModel: {
							groups: [
								createGroup({
									name: "A",
									hasTitle: true,
									actions: [createEventAction({ hasIcon: false })]
								}),
								createGroup({
									name: "B",
									hasTitle: true,
									actions: [createEventAction({ hasIcon: true })]
								})
							]
						}
					},
					undefined,
					undefined,
					undefined,
					deLocale
				);
				const subHeaders = result.find(List.SubHeader);

				expect(subHeaders).toHaveLength(2);
				expect(subHeaders.at(0).text()).toBe("A de");
				expect(subHeaders.at(1).text()).toBe("B de");
			});
		});
	});

	describe("Divider", () => {
		describe("given a group with a title", () => {
			it("should have no dividers", () => {
				const result = setupTest({
					contextMenuModel: { groups: [createGroup({ hasTitle: true, actions: [createEventAction()] })] }
				});
				const dividers = result.findWhere((item) => item.props().divider === true);

				expect(dividers).toHaveLength(0);
			});
		});

		describe("given a group without title", () => {
			it("should have no dividers", () => {
				const result = setupTest({
					contextMenuModel: { groups: [createGroup({ hasTitle: false, actions: [createEventAction()] })] }
				});
				const dividers = result.findWhere((item) => item.props().divider === true);

				expect(dividers).toHaveLength(0);
			});
		});

		describe("given two groups and second group has a title", () => {
			it("should have no dividers", () => {
				const result = setupTest({
					contextMenuModel: {
						groups: [
							createGroup({ hasTitle: false, actions: [createEventAction()] }),
							createGroup({ hasTitle: true, actions: [createEventAction()] })
						]
					}
				});
				const dividers = result.findWhere((item) => item.props().divider === true);

				expect(dividers).toHaveLength(0);
			});
		});

		describe("given two groups and second group has no title", () => {
			it("should have one divider", () => {
				const result = setupTest({
					contextMenuModel: {
						groups: [
							createGroup({ hasTitle: true, actions: [createEventAction()] }),
							createGroup({ hasTitle: false, actions: [createEventAction()] })
						]
					}
				});
				const dividers = result.find(List.Item).findWhere((item) => item.props().divider === true);

				expect(dividers).toHaveLength(1);
			});
		});

		describe("given three groups without any titles", () => {
			it("should have two dividers", () => {
				const result = setupTest({
					contextMenuModel: {
						groups: [
							createGroup({ hasTitle: false, actions: [createEventAction()] }),
							createGroup({ hasTitle: false, actions: [createEventAction()] }),
							createGroup({ hasTitle: false, actions: [createEventAction()] })
						]
					}
				});
				const dividers = result.find(List.Item).findWhere((item) => item.props().divider === true);

				expect(dividers).toHaveLength(2);
			});
		});
	});

	describe("RowAction", () => {
		it("should render RowAction properly", () => {
			const actions = [createEventAction({ event: "A" }), createEventAction({ event: "B" }), createInsertAction({})];

			const result = setupTest({
				contextMenuModel: {
					groups: [createGroup({ actions: [actions[0]] }), createGroup({ actions: [actions[1], actions[2]] })]
				}
			});
			const rowActions = result.find(RowAction);

			expect(rowActions).toHaveLength(3);
			actions.forEach((action, index) => {
				const actualActions = rowActions.at(index);

				expect(actualActions.props().displayAsPopupEntry).toBe(true);
				expect(actualActions.props().row).toEqual(basicNodeRow);
				expect(actualActions.props().rowActionModel).toEqual(action);
			});
		});
	});

	describe("rowActionStateGetter", () => {
		const actionA0 = createEventAction({ event: "A0" });
		const actionA1 = createEventAction({ event: "A1" });
		const actionB0 = createEventAction({ event: "B0" });
		const actionB1 = createEventAction({ event: "B1", hasIcon: true });

		const groupA = createGroup({
			name: "GroupA",
			hasTitle: true,
			actions: [actionA0, actionA1]
		});
		const groupB = createGroup({
			name: "GroupB",
			hasTitle: true,
			actions: [actionB0, actionB1]
		});

		describe("hidden", () => {
			describe("when the model has empty groups", () => {
				it("should render nothing", () => {
					const result = setupTest({ contextMenuModel: { groups: [] } }, undefined, undefined, false);

					testIsNullComponent(result);
				});
			});

			describe("when all actions are hidden", () => {
				it("should render nothing", () => {
					const result = setupTest(
						{ contextMenuModel: { groups: [groupA] } },
						undefined,
						{ rowActionStateGetter: () => ({ hidden: true }) },
						false
					);

					testIsNullComponent(result);
				});
			});

			describe("when all actions in a group are hidden", () => {
				it("should not render that group completely", () => {
					const result = setupTest({ contextMenuModel: { groups: [groupA, groupB] } }, undefined, {
						rowActionStateGetter: ({ action }) => ({
							hidden: action.type === "event" && action.event.startsWith("A")
						})
					});

					const list = result.find(List);
					expect(list).toHaveLength(1);
					expect(list.props().paddedLeft).toBe(true);

					const subheaders = result.find(List.SubHeader);
					expect(subheaders).toHaveLength(1);
					expect(subheaders.text()).toBe("GroupB en");

					const dividers = result.findWhere((item) => item.props().divider === true);
					expect(dividers).toHaveLength(0);

					const actions = result.find(RowAction);
					expect(actions).toHaveLength(2);
					expect(actions.at(0).props().rowActionModel).toBe(actionB0);
					expect(actions.at(1).props().rowActionModel).toBe(actionB1);
				});
			});

			describe("when some actions are hidden in each group", () => {
				it("should not render those actions", () => {
					const result = setupTest(
						{
							contextMenuModel: { groups: [groupA, { ...groupB, title: undefined }] }
						},
						undefined,
						{
							rowActionStateGetter: ({ action }) => ({
								hidden: action.type === "event" && (action.event === "A0" || action.event === "B1")
							})
						}
					);

					const list = result.find(List);
					expect(list).toHaveLength(1);
					expect(list.props().paddedLeft).toBe(false);

					const subheaders = result.find(List.SubHeader);
					expect(subheaders).toHaveLength(1);
					expect(subheaders.at(0).text()).toBe("GroupA en");

					const dividers = result.find(List.Item).findWhere((item) => item.props().divider === true);
					expect(dividers).toHaveLength(1);

					const actions = result.find(RowAction);
					expect(actions).toHaveLength(2);
					expect(actions.at(0).props().rowActionModel).toBe(actionA1);
					expect(actions.at(1).props().rowActionModel).toBe(actionB0);
				});
			});
		});

		// Disability will be tested in row-action.test.tsx
	});

	describe("triggerElement", () => {
		const contextMenuModel = {
			groups: [
				createGroup({
					name: "A",
					actions: [createEventAction({ hasIcon: false }), createInsertAction({ hasIcon: false })]
				})
			]
		};
		describe("given undefined triggerElement", () => {
			it("should render PopupMenu without trigger element", () => {
				const result = setupTest({ contextMenuModel, triggerElement: undefined });
				const popUpMenu = result.find(PopUpMenu);
				expect(popUpMenu.props().triggerElement).toBeUndefined();
			});
		});

		describe("given a triggerElement", () => {
			const triggerElement = <Button>abc</Button>;
			it("should render PopupMenu with the trigger element", () => {
				const result = setupTest({ contextMenuModel, triggerElement });
				const popupMenu = result.find(PopUpMenu);
				expect(popupMenu.props().triggerElement).toBe(triggerElement);
			});
		});
	});
});
