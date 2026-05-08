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

import { beforeAll, vi } from "vitest";

import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { testHook } from "../../../../utils/test-utils.js";
import {
	ButtonsHooks,
	ExpandAllPopUpHooks,
	KeyboardShortcut,
	OverallCheckboxHooks
} from "../../../../../core/view/index.js";
import {
	useEngineEventActions,
	useEngineBuiltinActionController,
	useEngineEventActionController,
	useEngineInsertActionController
} from "../../../../../core/view/internal/configuration/keyboard-shortcut/engine-controllers.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { TreeEngineState, UIStateSelector } from "../../../../../core/store/index.js";
import { createEngineState } from "../../../../utils/model-utils.js";
import { TreeModel } from "../../../../../core/models/index.js";
import { RowActionHooks } from "../../../../../core/view/internal/components/tree-engine/sub-components/hooks/row-action-hooks.js";
import { MultiSelectionButtonHooks } from "../../../../../core/view/internal/components/content-box/sub-components/multi-selection/multi-selection-button.js";

function assertFunction(object: unknown): object is () => void {
	return typeof object === "function";
}

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.keyboard-shortcut.engine-controllers", () => {
	const basicEngineState = defaultEngineState;

	const nodeBuiltinTarget: KeyboardShortcut.NodeBuiltinActionTarget = {
		type: KeyboardShortcut.TargetType.NODE_BUILTIN_ACTION,
		action: KeyboardShortcut.NodeBuiltinAction.TOGGLE_EXPANSION
	};

	describe("useEngineBuiltinActionController", () => {
		function testUseEngineBuiltinActionController() {
			return testHook(useEngineBuiltinActionController, [], basicEngineState);
		}

		describe("when the target is not a EngineBuiltinActionTarget", () => {
			it("should return undefined", () => {
				const controller = testUseEngineBuiltinActionController();
				const handler = controller.getHandler(nodeBuiltinTarget);

				expect(handler).toBeUndefined();
			});
		});

		describe("when the action is not matched any of declared actions", () => {
			it("should return undefined", () => {
				const controller = testUseEngineBuiltinActionController();
				const handler = controller.getHandler(
					mockType<KeyboardShortcut.EngineBuiltinActionTarget>({
						type: KeyboardShortcut.TargetType.ENGINE_BUILTIN_ACTION
					})
				);

				expect(handler).toBeUndefined();
			});
		});

		describe("when the action is matched a declared action", () => {
			let testState: KeyboardShortcut.EngineBuiltinAction | undefined = undefined;
			beforeAll(() => {
				vi.spyOn(ExpandAllPopUpHooks, "useWholeTreeExpansionHandler").mockImplementation((arg) => {
					if (arg === "expand") {
						return () => (testState = KeyboardShortcut.EngineBuiltinAction.EXPAND_WHOLE_TREE);
					} else if (arg === "collapse") {
						return () => (testState = KeyboardShortcut.EngineBuiltinAction.COLLAPSE_WHOLE_TREE);
					}
					return () => {};
				});
				vi.spyOn(OverallCheckboxHooks, "useOverallCheckboxHandler").mockReturnValue(
					() => (testState = KeyboardShortcut.EngineBuiltinAction.TOGGLE_OVERALL_MULTI_SELECTION)
				);
				vi.spyOn(MultiSelectionButtonHooks, "useMultiSelectionButtonHandler").mockReturnValue(
					() => (testState = KeyboardShortcut.EngineBuiltinAction.TOGGLE_MULTI_SELECTION_PANEL)
				);
			});

			afterEach(() => {
				testState = undefined;
				vi.clearAllMocks();
			});

			it("should return the corresponding handler", () => {
				const controller = testUseEngineBuiltinActionController();

				Object.values(KeyboardShortcut.EngineBuiltinAction).forEach((action) => {
					const handler = controller.getHandler({ type: KeyboardShortcut.TargetType.ENGINE_BUILTIN_ACTION, action });
					assertFunction(handler) && handler?.();

					expect(testState).toBe(action);
				});
			});
		});
	});

	describe("useEngineInsertActionController", () => {
		function testUseEngineInsertActionController(customEngineState?: TreeEngineState) {
			return testHook(useEngineInsertActionController, [], customEngineState ?? basicEngineState);
		}

		describe("when the target is not a EngineInsertActionTarget", () => {
			it("should return undefined", () => {
				const controller = testUseEngineInsertActionController();
				const handler = controller.getHandler(nodeBuiltinTarget);

				expect(handler).toBeUndefined();
			});
		});

		describe("when the target is a EngineInsertActionTarget", () => {
			const insertTeamTarget: KeyboardShortcut.EngineInsertActionTarget = {
				type: KeyboardShortcut.TargetType.ENGINE_INSERT_ACTION,
				documentModelRef: "DomainTeam"
			};

			describe("when virtual root actions does not contains the targeted action", () => {
				it("should return undefined", () => {
					const customEngineState = createEngineState
						.from(basicEngineState)
						.withConfigurations({
							...basicEngineState.models.uiModel.content.configuration,
							virtualRoot: {
								label: [],
								actions: [
									{ type: "insert", documentModelRef: "DomainPerson", position: TreeModel.InsertPosition.AS_CHILD }
								]
							}
						})
						.create();
					const handler = testUseEngineInsertActionController(customEngineState).getHandler(insertTeamTarget);

					expect(handler).toBeUndefined();
				});
			});

			describe("when virtual root contains the targeted action", () => {
				let testState = "unchanged";

				beforeEach(() => {
					vi.spyOn(RowActionHooks, "useHandler").mockReturnValue(() => () => (testState = "changed"));
				});
				afterEach(() => {
					vi.restoreAllMocks();
				});
				it("should return the result from calling useRowActionHandler with that action", () => {
					const customEngineState = createEngineState
						.from(basicEngineState)
						.withConfigurations({
							...basicEngineState.models.uiModel.content.configuration,
							virtualRoot: {
								label: [],
								actions: [
									{ type: "insert", documentModelRef: "DomainTeam", position: TreeModel.InsertPosition.AS_CHILD }
								]
							}
						})
						.create();
					const handler = testUseEngineInsertActionController(customEngineState).getHandler(insertTeamTarget);
					assertFunction(handler) && handler?.();

					expect(!!handler).toBe(true);
					expect(testState).toBe("changed");
				});
			});
		});
	});

	describe("useEngineEventActionController", () => {
		function testUseEngineEventActionController(customEngineState?: TreeEngineState) {
			return testHook(useEngineEventActionController, [], customEngineState ?? basicEngineState);
		}

		describe("when the target is not a EngineEventActionTarget", () => {
			it("should return undefined", () => {
				const controller = testUseEngineEventActionController();
				const handler = controller.getHandler(nodeBuiltinTarget);

				expect(handler).toBeUndefined();
			});
		});

		describe("when the target is a EngineEventActionTarget", () => {
			describe("when no button is targeted from the target", () => {
				it("should return undefined and not call useEngineButtonHandler", () => {
					const handler = testUseEngineEventActionController().getHandler({
						type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION,
						event: "event_test"
					});

					expect(handler).toBeUndefined();
				});
			});

			describe("when a button is targeted from the target", () => {
				let testState = "unchanged";
				beforeAll(() => {
					vi.spyOn(ButtonsHooks, "useEngineButtonHandler").mockReturnValue(() => () => {
						testState = "changed";
					});
				});
				it("should return the result from calling useEngineButtonHandler", () => {
					const handler = testUseEngineEventActionController().getHandler({
						type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION,
						event: "event_renew"
					});
					assertFunction(handler) && handler?.();

					expect(!!handler).toBe(true);
					expect(testState).toBe("changed");
				});
			});

			describe("when a button is targeted from the target but disabled", () => {
				it("should return the target itself", () => {
					const customEngineState = createEngineState
						.from(basicEngineState)
						.withConfigurations({
							...basicEngineState.models.uiModel.content.configuration,
							multiSelection: {
								collapseOption: TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED,
								counterOption: TreeModel.MultiSelectionConfiguration.CounterOption.SIMPLE,
								buttons: [{ id: "0", event: "multi-event" }]
							}
						})
						.create();

					const target: KeyboardShortcut.EngineEventActionTarget = {
						type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION,
						event: "multi-event"
					};
					const handler = testUseEngineEventActionController(customEngineState).getHandler(target);

					expect(handler).toBe(target);
				});
			});
		});
	});

	describe("useAvailableEngineEventActions", () => {
		const customEngineState = createEngineState
			.from(basicEngineState)
			.withSubHeaderBox({
				majorElements: [{ id: "0", event: "subheader-button", type: TreeModel.ElementType.BUTTON }],
				minorElements: []
			})
			.withFooterBox({
				minorElements: [{ id: "1", event: "footer-button-1", type: TreeModel.ElementType.BUTTON }],
				majorElements: [{ id: "2", event: "footer-button-2", type: TreeModel.ElementType.BUTTON }]
			})
			.withConfigurations({
				...basicEngineState.models.uiModel.content.configuration,
				multiSelection: mockType<TreeModel.MultiSelectionConfiguration>({
					buttons: [{ id: "3", event: "multi-selection-button" }]
				}),
				virtualRoot: { label: [], actions: [{ type: "event", event: "virtual-root-button" }] }
			})
			.create();

		afterEach(() => {
			vi.restoreAllMocks();
		});
		describe("when there is no selected node", () => {
			beforeEach(() => {
				vi.spyOn(UIStateSelector, "overallMultiSelection").mockReturnValue(
					() => TreeEngineState.MultiSelectionState.DESELECTED
				);
			});
			it("should gather all buttons from subheader, footer, and virtual root", () => {
				const availableButtons = testHook(useEngineEventActions, [], customEngineState);
				const unavailableButtons = testHook(useEngineEventActions, [false], customEngineState);

				expect(availableButtons).toEqual([
					{
						event: "footer-button-1",
						id: "1",
						isMultiSelectionAction: false,
						type: "button"
					},
					{
						event: "footer-button-2",
						id: "2",
						isMultiSelectionAction: false,
						type: "button"
					},
					{
						event: "subheader-button",
						id: "0",
						isMultiSelectionAction: false,
						type: "button"
					},
					{
						event: "virtual-root-button",
						id: "virtual-root-button",
						isMultiSelectionAction: false,
						type: "event"
					}
				]);

				expect(unavailableButtons).toEqual([
					{ event: "multi-selection-button", id: "3", isMultiSelectionAction: true }
				]);
			});
		});

		describe("when there are some selected nodes", () => {
			beforeEach(() => {
				vi.spyOn(UIStateSelector, "overallMultiSelection").mockReturnValue(
					() => TreeEngineState.MultiSelectionState.PARTLY_SELECTED
				);
			});
			it("should return only multi selection actions", () => {
				const availableButtons = testHook(useEngineEventActions, [], customEngineState);
				const unavailableButtons = testHook(useEngineEventActions, [false], customEngineState);

				expect(availableButtons).toEqual([{ event: "multi-selection-button", id: "3", isMultiSelectionAction: true }]);

				expect(unavailableButtons).toEqual([
					{ event: "footer-button-1", id: "1", isMultiSelectionAction: false, type: "button" },
					{ event: "footer-button-2", id: "2", isMultiSelectionAction: false, type: "button" },
					{ event: "subheader-button", id: "0", isMultiSelectionAction: false, type: "button" },
					{ event: "virtual-root-button", id: "virtual-root-button", isMultiSelectionAction: false, type: "event" }
				]);
			});
		});
	});
});
