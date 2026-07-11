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

import { KeyboardShortcutUtils } from "../../../../../core/view/configuration/keyboard-shortcut/utils.js";
import { KeyboardShortcut } from "../../../../../core/view/index.js";
import { mockType } from "../../../../utils/mock-utils.js";

type Event = React.KeyboardEvent<HTMLElement>;

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.keyboard-shortcut.utils", () => {
	const basicShortcut: KeyboardShortcut = {
		target: { type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: "dummy-event" },
		keyCombinations: []
	};

	describe("toLabel", () => {
		it("should return empty string when undefined shortcut", () => {
			expect(KeyboardShortcutUtils.toLabel(undefined)).toBe("");
		});

		describe("when define the label", () => {
			it("should return that label", () => {
				expect(KeyboardShortcutUtils.toLabel({ ...basicShortcut, label: "Shortcut label" })).toBe("Shortcut label");
			});
		});

		describe("when not defined the label", () => {
			beforeAll(() => {
				vi.spyOn(KeyboardShortcut.KeyCombination, "toString")
					.mockReturnValueOnce("First label")
					.mockReturnValueOnce("Second label");
			});

			it("should return the joined result from calling KeyCombination.string", () => {
				expect(
					KeyboardShortcutUtils.toLabel({
						...basicShortcut,
						label: undefined,
						keyCombinations: [{ eventCode: KeyCode.CODE_X }, { eventCode: KeyCode.CODE_Y }]
					})
				).toBe("First label, Second label");
			});
		});
	});

	describe("toTitle", () => {
		it("should return empty string when undefined shortcut", () => {
			expect(KeyboardShortcutUtils.toTitle(undefined)).toBe("");
		});

		describe("when define the title", () => {
			it("should return that title", () => {
				expect(KeyboardShortcutUtils.toTitle({ ...basicShortcut, title: "Shortcut title" })).toBe("Shortcut title");
			});
		});

		describe("when not defined the title", () => {
			beforeAll(() => {
				vi.spyOn(KeyboardShortcutUtils, "toLabel").mockReturnValue("Shortcut label");
			});
			afterAll(() => {
				vi.clearAllMocks();
			});

			it("should return the result from calling toLabel wrapped by parentheses", () => {
				expect(
					KeyboardShortcutUtils.toTitle({
						...basicShortcut,
						title: undefined,
						keyCombinations: [{ eventCode: KeyCode.CODE_X }]
					})
				).toBe(" (Shortcut label)");
			});
		});
	});

	describe("toKeyCombination", () => {
		const basicEvent = mockType<Event>({
			altKey: undefined,
			ctrlKey: undefined,
			metaKey: undefined,
			shiftKey: undefined,
			repeat: false
		});

		it("should work properly", () => {
			const testCases: [Event, Required<KeyboardShortcut.KeyCombination>][] = [
				[
					{ ...basicEvent, code: KeyCode.CODE_X },
					{ modifierKeys: [], eventCode: KeyCode.CODE_X }
				],
				[
					{ ...basicEvent, shiftKey: true, code: KeyCode.CODE_X },
					{ modifierKeys: [KeyboardShortcut.ModifierKey.Shift], eventCode: KeyCode.CODE_X }
				],
				[
					{ ...basicEvent, shiftKey: true, ctrlKey: true, metaKey: true, altKey: true, code: KeyCode.CODE_X },
					{
						modifierKeys: [
							KeyboardShortcut.ModifierKey.Alt,
							KeyboardShortcut.ModifierKey.Meta,
							KeyboardShortcut.ModifierKey.Ctrl,
							KeyboardShortcut.ModifierKey.Shift
						],
						eventCode: KeyCode.CODE_X
					}
				]
			];

			testCases.forEach(([event, expectedResult]) => {
				const result = KeyboardShortcutUtils.toKeyCombination(event);

				expect(result.eventCode).toEqual(expectedResult.eventCode);
				expect(result.modifierKeys).toEqual(expect.arrayContaining(expectedResult.modifierKeys));
			});
		});
	});

	describe("formatEventCode", () => {
		it("should work properly", () => {
			const testCases: [EventCode: string, PrettyKeyCode: string][] = [
				["Digit3", "3"],
				["KeyC", "C"],
				["Equal", "="],
				["BracketLeft", "["],
				["Slash", "/"],
				["Period", "."],
				["Numpad7", "Numpad7"],
				["NumpadMultiply", "NumpadMultiply"],
				["F4", "F4"]
			];

			testCases.forEach(([eventCode, expected]) => {
				expect(KeyboardShortcutUtils.formatEventCode(eventCode)).toBe(expected);
			});
		});
	});
});
