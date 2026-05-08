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

import type * as React from "react";
import * as KeyCode from "keycode-js";
import { vi } from "vitest";

import { type Localizable } from "@com.mgmtp.a12.utils/utils-localization";

import { defaultEngineState, type PartialEventHandlerContextProps } from "../../../../setup/basic.spec.js";
import { testHook } from "../../../../utils/test-utils.js";
import { KeyboardShortcut } from "../../../../../core/view/index.js";
import { mockType } from "../../../../utils/mock-utils.js";
import {
	type Controller,
	useBuiltinShortcut,
	useKeyDown,
	useRowActionShortcut
} from "../../../../../core/view/internal/configuration/keyboard-shortcut/hooks.js";
import { TreeModel } from "../../../../../core/models/index.js";
import { type TreeEngineState } from "../../../../../core/store/index.js";

import InsertPosition = TreeModel.InsertPosition;

type Event = React.KeyboardEvent<HTMLElement>;

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.keyboard-shortcut.hooks", () => {
	const basicEngineState = defaultEngineState;

	describe("useKeyDown", () => {
		function testUseKeyDown(
			params: Parameters<typeof useKeyDown>[0],
			customContextProps?: Partial<PartialEventHandlerContextProps>
		) {
			return testHook(useKeyDown, [params], basicEngineState, customContextProps);
		}

		const nodeBuiltinTarget: KeyboardShortcut.NodeBuiltinActionTarget = {
			type: KeyboardShortcut.TargetType.NODE_BUILTIN_ACTION,
			action: KeyboardShortcut.NodeBuiltinAction.TOGGLE_EXPANSION
		};
		const nodeEventTarget: KeyboardShortcut.NodeEventActionTarget = {
			type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION,
			event: "dummy-event"
		};

		const keyboardShortcuts: KeyboardShortcut[] = [
			{ keyCombinations: [{ eventCode: KeyCode.CODE_0 }], target: nodeBuiltinTarget },
			{ keyCombinations: [{ eventCode: KeyCode.CODE_1 }], target: nodeEventTarget }
		];

		const basicEvent = mockType<Event>({
			altKey: undefined,
			ctrlKey: undefined,
			metaKey: undefined,
			shiftKey: undefined,
			repeat: false,
			preventDefault() {}
		});

		let state = "unchanged";
		const nodeBuiltinActionController: Controller = {
			getHandler(target) {
				if (KeyboardShortcut.NodeBuiltinActionTarget.isAssignableFrom(target)) {
					return () => {
						state = "NodeBuiltinAction has been handled";
					};
				}
				return undefined;
			}
		};
		const nodeEventActionController: Controller = {
			getHandler() {
				return undefined;
			}
		};
		const basicControllers = [nodeBuiltinActionController, nodeEventActionController];

		let nodeBuiltinActionControllerGetHandler: ReturnType<typeof vi.fn>;

		let nodeEventActionControllerGetHandler: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			nodeBuiltinActionControllerGetHandler = vi.spyOn(nodeBuiltinActionController, "getHandler");
			nodeEventActionControllerGetHandler = vi.spyOn(nodeEventActionController, "getHandler");
		});

		afterEach(() => {
			state = "unchanged";
			vi.restoreAllMocks();
		});

		describe("when not define any shortcuts", () => {
			it("should always return onKeyDown", () => {
				const result = testUseKeyDown(
					{
						targetPredicate: KeyboardShortcut.Target.isAssignableFrom,
						defaultMessage: { key: "key" },
						controllers: basicControllers
					},
					{ keyboardShortcuts: undefined }
				);

				expect(result).to.exist;
			});
		});

		describe("when define some shortcuts", () => {
			const onKeyDown = testUseKeyDown(
				{
					targetPredicate: KeyboardShortcut.Target.isAssignableFrom,
					defaultMessage: { key: "key" },
					controllers: basicControllers
				},
				{ keyboardShortcuts }
			);

			it("should return a onKeyDown handler", () => {
				expect(!!onKeyDown).toBe(true);
			});

			describe("when the event is repeat", () => {
				it("should not call any controller's getHandler", () => {
					onKeyDown?.(mockType<Event>({ repeat: true }));

					expect(nodeBuiltinActionControllerGetHandler).not.toHaveBeenCalled();
					expect(nodeEventActionControllerGetHandler).not.toHaveBeenCalled();
					expect(state).toBe("unchanged");
				});
			});

			describe("when the pressed keyCombination does not match the registered shortcuts", () => {
				it("should not call any controllers", () => {
					onKeyDown?.({ ...basicEvent, code: KeyCode.CODE_X });

					expect(nodeBuiltinActionControllerGetHandler).not.toHaveBeenCalled();
					expect(nodeEventActionControllerGetHandler).not.toHaveBeenCalled();
					expect(state).toBe("unchanged");
				});
			});

			describe("when the pressed keyCombination matched a registered shortcut, but no controller can handle the corresponding target", () => {
				it("should call all the controller's getHandlers but the event does not stop", () => {
					const stopPropagation = vi.fn();

					testUseKeyDown(
						{
							targetPredicate: KeyboardShortcut.Target.isAssignableFrom,
							defaultMessage: { key: "key" },
							controllers: basicControllers
						},
						{ keyboardShortcuts }
					)?.({ ...basicEvent, code: KeyCode.CODE_1, stopPropagation });

					expect(nodeBuiltinActionControllerGetHandler).toHaveBeenCalledOnce();
					expect(nodeBuiltinActionControllerGetHandler).toHaveBeenCalledWith(nodeEventTarget);
					expect(nodeEventActionControllerGetHandler).toHaveBeenCalledOnce();
					expect(nodeEventActionControllerGetHandler).toHaveBeenCalledWith(nodeEventTarget);
					expect(stopPropagation).not.toHaveBeenCalled();
					expect(state).toBe("unchanged");
				});
			});

			describe("when a controller can handle the target", () => {
				it("should stop at that controller and the corresponding handler should be called", () => {
					const stopPropagation = vi.fn();
					const preventDefault = vi.fn();

					onKeyDown?.({ ...basicEvent, code: KeyCode.CODE_0, stopPropagation, preventDefault });

					expect(nodeBuiltinActionControllerGetHandler).toHaveBeenCalledWith(nodeBuiltinTarget);
					expect(nodeEventActionControllerGetHandler).not.toHaveBeenCalled();

					expect(state).toBe("NodeBuiltinAction has been handled");
					expect(stopPropagation).toHaveBeenCalledOnce();
					expect(preventDefault).toHaveBeenCalledOnce();
				});
			});

			describe("when a controller return a target", () => {
				const defaultMessage: Localizable = { key: "key", defaults: { en: "A default message" } };
				const node: TreeEngineState.Node = {
					document: { name: "A12 Team" },
					children: [],
					identifier: { type: "DomainTeam", id: "1" }
				};
				const onKeyDownParams: Parameters<typeof useKeyDown>[0] = {
					targetPredicate: KeyboardShortcut.Target.isAssignableFrom,
					row: { node },
					defaultMessage,
					controllers: [
						{
							getHandler(...targets) {
								return targets[0];
							}
						}
					]
				};

				const stopPropagation = vi.fn();
				const onAddWarning = vi.fn();
				const event: Event = { ...basicEvent, code: KeyCode.CODE_1, stopPropagation };

				beforeEach(() => {
					vi.resetAllMocks();
				});

				describe("when the corresponding shortcut has stopIfUnavailable = undefined", () => {
					it("should not stop the event", () => {
						const customShortcut = keyboardShortcuts[1];
						const onKeyDown = testUseKeyDown(onKeyDownParams, {
							keyboardShortcuts: [customShortcut]
						});

						onKeyDown?.(event);

						expect(stopPropagation).not.toHaveBeenCalled();
					});
				});

				describe("when the corresponding shortcut has stopIfUnavailable = true", () => {
					it("should stop the event and call onAddNotification with the default message", () => {
						const customShortcut: KeyboardShortcut = { ...keyboardShortcuts[1], stopIfUnavailable: true };
						const onKeyDown = testUseKeyDown(onKeyDownParams, {
							keyboardShortcuts: [customShortcut],
							eventHandlers: { onAddWarning }
						});

						onKeyDown?.(event);

						expect(stopPropagation).toHaveBeenCalledOnce();
						expect(onAddWarning).toHaveBeenCalledWith({ message: defaultMessage });
					});
				});

				describe("when the corresponding shortcut has stopIfUnavailable is a LocalizableDescriptor", () => {
					it("should stop the event and call onAddNotification with the descriptor", () => {
						const customStaticMessage: Localizable = {
							key: "custom.key",
							defaults: { en: "Custom static warning message" }
						};
						const customShortcut: KeyboardShortcut = {
							...keyboardShortcuts[1],
							stopIfUnavailable: customStaticMessage
						};
						const onKeyDown = testUseKeyDown(onKeyDownParams, {
							keyboardShortcuts: [customShortcut],
							eventHandlers: { onAddWarning }
						});

						onKeyDown?.(event);

						expect(stopPropagation).toHaveBeenCalledOnce();
						expect(onAddWarning).toHaveBeenCalledWith({ message: customStaticMessage });
					});
				});

				describe("when the corresponding shortcut has stopIfUnavailable is a callback", () => {
					it("should stop the event and call onAddNotification with the callback's result", () => {
						const callbackResult: Localizable = {
							key: "custom.dynamic.key",
							defaults: { en: "Custom dynamic warning message" }
						};
						const callbackStub = vi.fn().mockReturnValue(callbackResult);

						const customShortcut: KeyboardShortcut = {
							...keyboardShortcuts[1],
							stopIfUnavailable: callbackStub
						};

						const onKeyDown = testUseKeyDown(onKeyDownParams, {
							keyboardShortcuts: [customShortcut],
							eventHandlers: { onAddWarning }
						});

						onKeyDown?.(event);

						expect(stopPropagation).toHaveBeenCalledOnce();
						expect(onAddWarning).toHaveBeenCalledWith({ message: callbackResult });

						expect(callbackStub).toHaveBeenCalledOnce();
						expect(callbackStub).toHaveBeenCalledWith({ node });
					});
				});
			});
		});
	});

	describe("useBuiltinShortcut", () => {
		describe("when not define keyboardShortcuts", () => {
			it("should return undefined", () => {
				const result = testHook(
					useBuiltinShortcut,
					[KeyboardShortcut.NodeBuiltinAction.TOGGLE_EXPANSION],
					basicEngineState
				);

				expect(result).toBeUndefined();
			});
		});

		describe("when defined keyboardShortcuts", () => {
			const nodeShortcut: KeyboardShortcut = {
				keyCombinations: [],
				target: {
					type: KeyboardShortcut.TargetType.NODE_BUILTIN_ACTION,
					action: KeyboardShortcut.NodeBuiltinAction.TOGGLE_EXPANSION
				}
			};
			const engineShortcut: KeyboardShortcut = {
				keyCombinations: [],
				target: {
					type: KeyboardShortcut.TargetType.ENGINE_BUILTIN_ACTION,
					action: KeyboardShortcut.EngineBuiltinAction.TOGGLE_MULTI_SELECTION_PANEL
				}
			};

			const keyboardShortcuts: KeyboardShortcut[] = [nodeShortcut, engineShortcut];

			it("should return the corresponding builtin shortcut in the context if exist", () => {
				const testCases: [
					KeyboardShortcut.EngineBuiltinAction | KeyboardShortcut.NodeBuiltinAction,
					KeyboardShortcut | undefined
				][] = [
					[KeyboardShortcut.NodeBuiltinAction.TOGGLE_MULTI_SELECTION, undefined],
					[KeyboardShortcut.NodeBuiltinAction.TOGGLE_EXPANSION, nodeShortcut],
					[KeyboardShortcut.EngineBuiltinAction.EXPAND_WHOLE_TREE, undefined],
					[KeyboardShortcut.EngineBuiltinAction.TOGGLE_MULTI_SELECTION_PANEL, engineShortcut]
				];

				testCases.forEach(([action, expected]) => {
					const result = testHook(useBuiltinShortcut, [action], basicEngineState, { keyboardShortcuts });
					expect(result).toBe(expected);
				});
			});
		});
	});

	describe("useRowActionShortcut", () => {
		describe("when not define keyboardShortcuts", () => {
			it("should return undefined", () => {
				const result = testHook(useRowActionShortcut, [{ type: "event", event: "event-0" }, false], basicEngineState);

				expect(result).toBeUndefined();
			});
		});

		describe("when defined keyboardShortcuts", () => {
			const nodeEventAction: TreeModel.TreeNodeEventActionButton = { type: "event", event: "event-1" };
			const engineEventAction: TreeModel.TreeNodeEventActionButton = { type: "event", event: "event-2" };
			const nodeInsertAction: TreeModel.TreeNodeInsertActionButton = {
				type: "insert",
				documentModelRef: "dm1",
				position: InsertPosition.AS_CHILD
			};
			const engineInsertAction: TreeModel.TreeNodeInsertActionButton = {
				type: "insert",
				documentModelRef: "dm2",
				position: InsertPosition.AS_CHILD
			};

			const nodeEventShortcut: KeyboardShortcut = {
				keyCombinations: [],
				target: { type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: nodeEventAction.event }
			};
			const nodeInsertShortcut: KeyboardShortcut = {
				keyCombinations: [],
				target: {
					type: KeyboardShortcut.TargetType.NODE_INSERT_ACTION,
					documentModelRef: nodeInsertAction.documentModelRef,
					position: TreeModel.InsertPosition.AS_CHILD
				}
			};
			const engineEventShortcut: KeyboardShortcut = {
				keyCombinations: [],
				target: { type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION, event: engineEventAction.event }
			};
			const engineInsertShortcut: KeyboardShortcut = {
				keyCombinations: [],
				target: {
					type: KeyboardShortcut.TargetType.ENGINE_INSERT_ACTION,
					documentModelRef: engineInsertAction.documentModelRef
				}
			};

			const keyboardShortcuts: KeyboardShortcut[] = [
				nodeEventShortcut,
				engineEventShortcut,
				nodeInsertShortcut,
				engineInsertShortcut
			];

			it("should work with various parameter", () => {
				const testCases: [Parameters<typeof useRowActionShortcut>, KeyboardShortcut | undefined][] = [
					[[mockType<TreeModel.TreeNodeActionButton>(), true], undefined],

					[[nodeEventAction, true], undefined],
					[[nodeEventAction, false], nodeEventShortcut],

					[[engineEventAction, true], engineEventShortcut],
					[[engineEventAction, false], undefined],

					[[nodeInsertAction, true], undefined],
					[[nodeInsertAction, false], nodeInsertShortcut],

					[[engineInsertAction, true], engineInsertShortcut],
					[[engineInsertAction, false], undefined]
				];

				testCases.forEach(([params, expected]) => {
					const result = testHook(useRowActionShortcut, params, basicEngineState, { keyboardShortcuts });
					expect(result).toBe(expected);
				});
			});
		});
	});
});
