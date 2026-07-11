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

import type { Page } from "@playwright/test";
import { PlaywrightCommands } from "playwright-commands";

import { cleanDocumentsData } from "../../../services-utils/src/index.js";

export namespace PlaywrightUtils {
	export async function cleanDocuments() {
		await cleanDocumentsData({
			showcases: ["categories"]
		});
	}

	export async function navigate(page: Page, subMenu = "Products Tree") {
		await page.getByRole("link", { name: "Products Management" }).click();
		await page.getByRole("link", { name: subMenu, exact: true }).click();
		const commands = new PlaywrightCommands(page);
		await commands.waitUntilLoaded();
	}
}

export namespace StringUtils {
	export function createBar(number: number): string {
		const PARTIAL_BLOCKS = Object.values({
			EMPTY_BLOCK: "",
			ONE_EIGHT_BLOCK: "\u258F",
			ONE_QUARTER_BLOCK: "\u258E",
			THREE_EIGHTS_BLOCK: "\u258D",
			HALF_BLOCK: "\u258C",
			FIVE_EIGHTS_BLOCK: "\u258B",
			THREE_QUARTER_BLOCK: "\u258A",
			SEVEN_EIGHTS_BLOCK: "\u2589"
		});

		const FULL_BLOCK = "\u2588";

		const integerPart = Math.floor(number);
		const decimalPart = number - Math.floor(integerPart);
		const partialBlockIndex = Math.floor(decimalPart * 8);

		return FULL_BLOCK.repeat(integerPart) + PARTIAL_BLOCKS[partialBlockIndex];
	}

	export function boxen(string: string, width = 100): string {
		const [HORIZONTAL_LINE, VERTICAL_LINE, TOP_LEFT_CORNER, TOP_RIGHT_CORNER, BOTTOM_LEFT_CORNER, BOTTOM_RIGHT_CORNER] =
			["\u2500", "\u2502", "\u250C", "\u2510", "\u2514", "\u2518"];

		const firstLine = TOP_LEFT_CORNER + HORIZONTAL_LINE.repeat(width - 2) + TOP_RIGHT_CORNER;
		const lastLine = BOTTOM_LEFT_CORNER + HORIZONTAL_LINE.repeat(width - 2) + BOTTOM_RIGHT_CORNER;

		const middleLines = string.split("\n").map((line) => VERTICAL_LINE + " " + line.padEnd(width - 3) + VERTICAL_LINE);

		return [firstLine, ...middleLines, lastLine].join("\n");
	}
}

export namespace NumberUtils {
	export function median(numbers: number[]): number {
		const sortedNumbers = [...numbers].sort();
		const { length } = numbers;
		const middleIndex = Math.floor(length / 2);
		if (length % 2 === 1) {
			return sortedNumbers[middleIndex];
		}

		return (sortedNumbers[middleIndex] + sortedNumbers[middleIndex - 1]) / 2;
	}

	export function sum(numbers: number[]): number {
		return numbers.reduce((result, number) => result + number, 0);
	}

	export function round(number: number, decimal = 2): number {
		return Math.round(number * 10 ** decimal) / 10 ** decimal;
	}

	export function padTrailingZeros(number: number): string {
		const str = String(number);
		if (/^\d+$/.test(str)) {
			return str + ".00";
		}
		if (/^\d+\.\d$/.test(str)) {
			return str + "0";
		}
		return str;
	}
}
