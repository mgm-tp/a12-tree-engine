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

import { defaultEngineState, type PartialEventHandlerContextProps } from "../../../../setup/basic.spec.js";
import { testHook, testRowHook } from "../../../../utils/test-utils.js";
import {
	type FlattenNodeRow,
	KeyboardShortcut,
	RowCheckboxHandler,
	type TreeEngineRowContext
} from "../../../../../core/view/index.js";
import { mockType, type Stub } from "../../../../utils/mock-utils.js";
import {
	useRowActions,
	useNodeActionController,
	useNodeBuiltinActionController
} from "../../../../../core/view/configuration/keyboard-shortcut/node-controllers.js";
import { TreeModel } from "../../../../../core/models/index.js";
import type { RowState } from "../../../../../core/store/index.js";
import { RowActionHooks } from "../../../../../core/view/components/tree-engine/sub-components/hooks/row-action-hooks.js";

function assertFunction(object: unknown): object is () => void {
	return typeof object === "function";
}

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.keyboard-shortcut.node-controllers", () => {
	const basicEngineState = defaultEngineState;

	const engineBuiltinTarget: KeyboardShortcut.EngineBuiltinActionTarget = {
		type: KeyboardShortcut.TargetType.ENGINE_BUILTIN_ACTION,
		action: KeyboardShortcut.EngineBuiltinAction.EXPAND_WHOLE_TREE
	};

	const basicRow = mockType<FlattenNodeRow>({
		data: {
			nodeIdentifier: { id: "1", type: "DomainTeam" },
			nodePath: [{ id: "1", type: "DomainTeam" }]
		}
	});

	const customEventAction: TreeModel.TreeNodeActionButton = { type: "event", event: "event-test" };
	const customInsertAction: TreeModel.TreeNodeActionButton = {
		type: "insert",
		documentModelRef: "DomainPerson",
		position: TreeModel.InsertPosition.AS_CHILD
	};

	const basicTeamNodeModel = mockType<TreeModel.TreeNode>({
		actions: [customInsertAction],
		contextMenu: { groups: [{ name: "test", actions: [customEventAction] }] }
	});
	const basicRowState = mockType<RowState>({ nodeModel: basicTeamNodeModel });
	const basicRowContext = mockType<TreeEngineRowContext.Type>({ rowState: basicRowState, isCircular: false });

	describe("useNodeBuiltinActionController", () => {
		function testUseNodeBuiltinActionController(customContextProps?: Partial<PartialEventHandlerContextProps>) {
			return testHook(useNodeBuiltinActionController, [basicRow], basicEngineState, customContextProps);
		}

		describe("when the target is not a EngineBuiltinActionTarget", () => {
			it("should return undefined", () => {
				const controller = testUseNodeBuiltinActionController();
				const handler = controller.getHandler(engineBuiltinTarget);

				expect(handler).toBeUndefined();
			});
		});

		describe("when the action is not matched any of declared actions", () => {
			it("should return undefined", () => {
				const controller = testUseNodeBuiltinActionController();
				const handler = controller.getHandler(
					mockType<KeyboardShortcut.EngineBuiltinActionTarget>({
						type: KeyboardShortcut.TargetType.ENGINE_BUILTIN_ACTION
					})
				);

				expect(handler).toBeUndefined();
			});
		});

		describe("when the action is TOGGLE_MULTI_SELECTION", () => {
			let useRowCheckboxHandlerStub: Stub<typeof RowCheckboxHandler.useHandler>;

			let testState = "unchanged";
			beforeEach(() => {
				useRowCheckboxHandlerStub = vi
					.spyOn(RowCheckboxHandler, "useHandler")
					.mockReturnValue(() => () => (testState = "changed"));
			});

			afterEach(() => {
				useRowCheckboxHandlerStub.mockReset();
			});

			it("should return the result from calling useRowCheckboxHandler", () => {
				const controller = testUseNodeBuiltinActionController();
				const handler = controller.getHandler({
					type: KeyboardShortcut.TargetType.NODE_BUILTIN_ACTION,
					action: KeyboardShortcut.NodeBuiltinAction.TOGGLE_MULTI_SELECTION
				});
				assertFunction(handler) && handler?.();

				expect(testState).be.equal("changed");
			});
		});

		describe("when the action is TOGGLE_EXPANSION", () => {
			it("should call onNodeExpansionChanged with row.data", () => {
				const onNodeExpansionChangedSpy = vi.fn();
				const controller = testUseNodeBuiltinActionController({
					eventHandlers: { onNodeExpansionChanged: onNodeExpansionChangedSpy }
				});
				const handler = controller.getHandler({
					type: KeyboardShortcut.TargetType.NODE_BUILTIN_ACTION,
					action: KeyboardShortcut.NodeBuiltinAction.TOGGLE_EXPANSION
				});

				expect(onNodeExpansionChangedSpy).not.toHaveBeenCalled();
				assertFunction(handler) && handler?.();

				expect(onNodeExpansionChangedSpy).toHaveBeenCalledOnce();
				expect(onNodeExpansionChangedSpy).toHaveBeenCalledWith(basicRow.data);
			});
		});
	});

	describe("useNodeActionController", () => {
		function testUseNodeActionController(
			customRowActions?: TreeModel.TreeNodeActionButton[],
			customEngineContextProps?: Partial<PartialEventHandlerContextProps>
		) {
			const rowState = mockType<RowState>({
				nodeModel: {
					...basicRowState.nodeModel,
					actions: customRowActions ?? basicRowState.nodeModel.actions
				}
			});
			const contextState = mockType<TreeEngineRowContext.Type>({ ...basicRowContext, rowState });
			return testRowHook(useNodeActionController, [basicRow], basicEngineState, contextState, customEngineContextProps);
		}

		describe("when the target is a NodeEventActionTarget", () => {
			let testState = "unchanged";
			let rowActionUseHandler: Stub<typeof RowActionHooks.useHandler>;
			const rowActionHandlerStub = vi.fn().mockReturnValue(() => (testState = "changed"));

			beforeEach(() => {
				rowActionUseHandler = vi.spyOn(RowActionHooks, "useHandler").mockReturnValue(rowActionHandlerStub);
			});

			afterEach(() => {
				testState = "unchanged";
				rowActionUseHandler.mockRestore();
				rowActionHandlerStub.mockClear();
			});

			describe("when the action does not exists on the node model", () => {
				it("should return undefined and rowActionHandler does not be called", () => {
					const controller = testUseNodeActionController();
					const handler = controller.getHandler({
						type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION,
						event: "event-dummy"
					});

					expect(handler).toBeUndefined();
					expect(rowActionHandlerStub).not.toHaveBeenCalled();
				});
			});

			describe("when the event action is included in the model", () => {
				it("should return the result from calling useRowActionHandler's result", () => {
					const controller = testUseNodeActionController();
					const handler = controller.getHandler({
						type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION,
						event: "event-test"
					});
					assertFunction(handler) && handler?.();

					expect(!!handler).toBe(true);
					expect(testState).toBe("changed");
					expect(rowActionHandlerStub).toHaveBeenCalledOnce();
					expect(rowActionHandlerStub).toHaveBeenCalledWith(customEventAction);
				});
			});

			describe("when the event action is included in the model but disabled", () => {
				it("should return the target itself", () => {
					const controller = testUseNodeActionController(undefined, {
						rowActionStateGetter: ({ action }) => {
							return {
								disabled: TreeModel.TreeNodeEventActionButton.isAssignableFrom(action) && action.event === "event-test"
							};
						}
					});
					const target: KeyboardShortcut.NodeEventActionTarget = {
						type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION,
						event: "event-test"
					};
					const handler = controller.getHandler(target);

					expect(handler).toBe(target);
					expect(rowActionHandlerStub).not.toHaveBeenCalled();
				});
			});

			describe("when the insert action is included in the model", () => {
				it("should return the result from calling useRowActionHandler's result", () => {
					const controller = testUseNodeActionController();
					const handler = controller.getHandler({
						type: KeyboardShortcut.TargetType.NODE_INSERT_ACTION,
						documentModelRef: "DomainPerson",
						position: TreeModel.InsertPosition.AS_CHILD
					});
					assertFunction(handler) && handler?.();

					expect(!!handler).toBe(true);
					expect(testState).toBe("changed");
					expect(rowActionHandlerStub).toHaveBeenCalledOnce();
					expect(rowActionHandlerStub).toHaveBeenCalledWith(customInsertAction);
				});
			});

			describe("when given multiple matched targets", () => {
				it("should handle the first available matched action", () => {
					const targets: KeyboardShortcut.Target[] = [
						{ type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: "copy" },
						{ type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: "copy-with-children" }
					];
					const copyAction: TreeModel.TreeNodeActionButton = { type: "event", event: "copy" };
					const copyWithChildrenAction: TreeModel.TreeNodeActionButton = { type: "event", event: "copy-with-children" };

					const testCases: [
						modelRowActions: TreeModel.TreeNodeEventActionButton[],
						expectedHandledAction: TreeModel.TreeNodeEventActionButton
					][] = [
						[[copyAction], copyAction],
						[[copyWithChildrenAction], copyWithChildrenAction],
						[[copyAction, copyWithChildrenAction], copyAction],
						[[copyWithChildrenAction, copyAction], copyWithChildrenAction]
					];

					testCases.forEach(([modeledRowActions, expectedHandledAction], index) => {
						const controller = testUseNodeActionController(modeledRowActions);
						const handler = controller.getHandler(...targets);
						assertFunction(handler) && handler?.();

						expect(!!handler).toBe(true);
						expect(testState).toBe("changed");
						expect(rowActionHandlerStub.mock.calls[index][0].event).toBe(expectedHandledAction.event);
					});
				});
			});
		});
	});

	describe("useRowActions", () => {
		function testUseRowActions(isAvailable: boolean) {
			return testRowHook(useRowActions, [basicRow, isAvailable], basicEngineState, basicRowContext);
		}

		describe("when there is no hidden or disabled action", () => {
			it("should return all actions from node model", () => {
				expect(testUseRowActions(true)).toEqual([customInsertAction, customEventAction]);
				expect(testUseRowActions(false)).toEqual([]);
			});
		});

		describe("when a action is hidden", () => {
			let useRowActionVisibilityGetterStub: Stub<typeof RowActionHooks.useVisibilityGetter>;

			beforeEach(() => {
				useRowActionVisibilityGetterStub = vi
					.spyOn(RowActionHooks, "useVisibilityGetter")
					.mockReturnValue((_row, action) => {
						return action !== customInsertAction;
					});
			});
			afterEach(() => {
				useRowActionVisibilityGetterStub.mockRestore();
			});

			it("should not include it", () => {
				expect(testUseRowActions(true)).toEqual([customEventAction]);
				expect(testUseRowActions(false)).toEqual([customInsertAction]);
			});
		});

		describe("when a action is disabled", () => {
			let useRowActionDisabilityGetter: Stub<typeof RowActionHooks.useDisabilityGetter>;

			beforeEach(() => {
				useRowActionDisabilityGetter = vi
					.spyOn(RowActionHooks, "useDisabilityGetter")
					.mockReturnValue((_row, action) => {
						return action === customEventAction;
					});
			});
			afterEach(() => {
				useRowActionDisabilityGetter.mockRestore();
			});

			it("should not include it", () => {
				expect(testUseRowActions(true)).toEqual([customInsertAction]);
				expect(testUseRowActions(false)).toEqual([customEventAction]);
			});
		});
	});
});
