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

import { test, type Page } from "@playwright/test";

import { REPETITION } from "./config";
import { type RawRecorder, ExecutionType, SingleTestConfig, type TestConfig } from "./types";
import { PlaywrightUtils } from "./utils";

export function run(testConfig: TestConfig, rawRecorder: RawRecorder) {
	if (SingleTestConfig.isAssignableFrom(testConfig)) {
		return runSingleTest(testConfig, rawRecorder);
	}

	const { id, setup, clean, singleTestConfigs, executionType } = testConfig;

	getDescribeFunction(executionType)(id, () => {
		test.beforeAll(async () => {
			await PlaywrightUtils.cleanDocuments();
			await setup?.();
		});

		test.afterAll(async () => {
			await clean?.();
		});

		singleTestConfigs.forEach((singleTestConfig) => {
			runSingleTest({ repetition: testConfig.repetition, ...singleTestConfig }, rawRecorder, true);
		});
	});
}

export function runSingleTest(testConfig: SingleTestConfig, rawRecorder: RawRecorder, skipClean = false) {
	const { setup, setupEach, clean, cleanEach, actions, repetition, executionType, id } = testConfig;
	let startTime: number;
	const durations: number[] = [];

	getDescribeFunction(executionType)(id, () => {
		test.beforeAll(async () => {
			if (!skipClean) {
				await PlaywrightUtils.cleanDocuments();
			}
			await setup?.();
		});

		test.beforeEach(async ({ page }) => {
			if (setupEach) {
				await setupEach(page);
			} else {
				await page.goto("");
				await PlaywrightUtils.navigate(page);
			}
		});

		test.afterEach(async ({ page }) => {
			await cleanEach?.(page);
		});

		test.afterAll(async () => {
			await clean?.();
			rawRecorder[id] = durations;
		});

		for (let time = 0; time < (repetition ?? REPETITION); time++) {
			getTestFunction(executionType)(`Test ${time}`, async ({ page }) => {
				// Measure performance using Playwright's performance API
				startTime = await measureStart(page);

				await actions(page);

				const duration = await measureEnd(page, startTime);
				durations.push(duration);
			});
		}
	});
}

/**
 * Start performance measurement using performance.now()
 */
async function measureStart(page: Page): Promise<number> {
	return await page.evaluate(() => performance.now());
}

/**
 * End performance measurement and return duration
 */
async function measureEnd(page: Page, startTime: number): Promise<number> {
	return await page.evaluate((start) => {
		const end = performance.now();
		return end - start;
	}, startTime);
}

const getDescribeFunction = (executionType?: ExecutionType) => {
	return executionType === ExecutionType.ONLY
		? test.describe.only
		: executionType === ExecutionType.SKIP
			? test.describe.skip
			: test.describe;
};

const getTestFunction = (executionType?: ExecutionType) => {
	return executionType === ExecutionType.ONLY ? test.only : executionType === ExecutionType.SKIP ? test.skip : test;
};
