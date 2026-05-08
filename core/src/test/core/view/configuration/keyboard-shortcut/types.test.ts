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

import { KeyboardShortcut } from "../../../../../core/view/index.js";
import { KeyboardShortcutUtils } from "../../../../../core/view/internal/configuration/keyboard-shortcut/utils.js";
import { mockType } from "../../../../utils/mock-utils.js";

type Event = React.KeyboardEvent<HTMLElement>;

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.keyboard-shortcut.types", () => {
	describe("KeyCombination", () => {
		it("toString", () => {
			const testCases: [KeyboardShortcut.KeyCombination, string][] = [
				[{ eventCode: KeyCode.CODE_C }, "C"],
				[{ modifierKeys: [], eventCode: KeyCode.CODE_SLASH }, "/"],
				[{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl], eventCode: KeyCode.CODE_COMMA }, "Ctrl + ,"],
				[
					{
						modifierKeys: [KeyboardShortcut.ModifierKey.Shift, KeyboardShortcut.ModifierKey.Ctrl],
						eventCode: KeyCode.CODE_BACK_QUOTE
					},
					"Ctrl + Shift + `"
				],
				[
					{
						modifierKeys: [
							KeyboardShortcut.ModifierKey.Shift,
							KeyboardShortcut.ModifierKey.Ctrl,
							KeyboardShortcut.ModifierKey.Alt,
							KeyboardShortcut.ModifierKey.Meta
						],
						eventCode: KeyCode.CODE_F2
					},
					"Alt + Cmd/Win + Ctrl + Shift + F2"
				]
			];

			testCases.forEach(([keyCombination, expected]) => {
				expect(KeyboardShortcut.KeyCombination.toString(keyCombination)).toBe(expected);
			});
		});

		it("areEqual", () => {
			const baseEvent = mockType<Event>({
				altKey: undefined,
				ctrlKey: undefined,
				metaKey: undefined,
				shiftKey: undefined
			});

			const CODE_C = KeyCode.CODE_C;
			const testCases: {
				event: Event;
				matchedKeys: KeyboardShortcut.KeyCombination[];
				nonMatchedKeys: KeyboardShortcut.KeyCombination[];
			}[] = [
				{
					event: mockType<Event>({ code: CODE_C }),
					matchedKeys: [{ eventCode: CODE_C }, { modifierKeys: [], eventCode: CODE_C }],
					nonMatchedKeys: [
						{ eventCode: "c" },
						{ eventCode: "C" },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Meta], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: CODE_C }
					]
				},
				{
					event: mockType<Event>({ shiftKey: true, code: CODE_C }),
					matchedKeys: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: CODE_C }],
					nonMatchedKeys: [
						{ eventCode: CODE_C },
						{ eventCode: "c" },
						{ eventCode: "C" },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: "c" },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: "C" },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift, KeyboardShortcut.ModifierKey.Ctrl], eventCode: CODE_C }
					]
				},
				{
					event: mockType<Event>({ ctrlKey: true, code: CODE_C }),
					matchedKeys: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl], eventCode: CODE_C }],
					nonMatchedKeys: [
						{ eventCode: "c" },
						{ eventCode: "C" },
						{ eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Meta], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl, KeyboardShortcut.ModifierKey.Shift], eventCode: CODE_C }
					]
				},
				{
					event: mockType<Event>({ metaKey: true, code: CODE_C }),
					matchedKeys: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Meta], eventCode: CODE_C }],
					nonMatchedKeys: [
						{ eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: CODE_C }
					]
				},
				{
					event: mockType<Event>({ altKey: true, code: CODE_C }),
					matchedKeys: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: CODE_C }],
					nonMatchedKeys: [
						{ eventCode: CODE_C },
						{ eventCode: "ç" },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Meta], eventCode: CODE_C }
					]
				},
				{
					event: mockType<Event>({ ctrlKey: true, shiftKey: true, code: CODE_C }),
					matchedKeys: [
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl, KeyboardShortcut.ModifierKey.Shift], eventCode: CODE_C }
					],
					nonMatchedKeys: [
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: CODE_C },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl, KeyboardShortcut.ModifierKey.Shift], eventCode: "C" }
					]
				},
				{
					event: mockType<Event>({ code: KeyCode.CODE_DELETE }),
					matchedKeys: [{ eventCode: KeyCode.CODE_DELETE }],
					nonMatchedKeys: [
						{ eventCode: "Del" },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl], eventCode: KeyCode.CODE_DELETE },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Meta], eventCode: KeyCode.CODE_DELETE },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Meta], eventCode: "Del" }
					]
				},
				{
					event: mockType<Event>({ code: KeyCode.CODE_SPACE }),
					matchedKeys: [{ eventCode: KeyCode.CODE_SPACE }],
					nonMatchedKeys: [
						{ eventCode: " " },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl], eventCode: KeyCode.CODE_SPACE },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Meta], eventCode: KeyCode.CODE_SPACE },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: KeyCode.CODE_SPACE }
					]
				},
				{
					event: mockType<Event>({ ctrlKey: true, shiftKey: true, code: KeyCode.CODE_SLASH }),
					matchedKeys: [
						{
							modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl, KeyboardShortcut.ModifierKey.Shift],
							eventCode: KeyCode.CODE_SLASH
						}
					],
					nonMatchedKeys: [
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl, KeyboardShortcut.ModifierKey.Shift], eventCode: "/" },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Ctrl], eventCode: KeyCode.CODE_SLASH },
						{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: KeyCode.CODE_SLASH }
					]
				}
			];

			testCases.forEach(({ event, matchedKeys, nonMatchedKeys }) => {
				const eventKeyCombination = KeyboardShortcutUtils.toKeyCombination({ ...baseEvent, ...event });

				matchedKeys.forEach((keyCombination) => {
					expect(KeyboardShortcut.KeyCombination.areEqual(eventKeyCombination, keyCombination)).toBe(true);
				});
				nonMatchedKeys.forEach((keyCombination) => {
					expect(KeyboardShortcut.KeyCombination.areEqual(eventKeyCombination, keyCombination)).toBe(false);
				});
			});
		});
	});
});
