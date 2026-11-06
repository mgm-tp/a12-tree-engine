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

import { defineConfig, devices } from "@playwright/test";

/*
 * `devices["Desktop Chrome"]` hard-codes a Windows user agent. The showcase picks Meta vs Ctrl by
 * sniffing that user agent, while Playwright's "ControlOrMeta" resolves against the host OS, so the
 * two disagree on macOS and every modifier shortcut silently matches nothing. Keep the rest of the
 * descriptor (screen, scale factor) — the pagination tests are layout-sensitive — and drop only the
 * user agent so the real per-host one is reported.
 */
const { userAgent: _emulatedUserAgent, ...desktopChrome } = devices["Desktop Chrome"];

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	timeout: 60000,
	expect: {
		timeout: 10000
	},
	workers: process.env.CI ? 2 : 4,
	reporter: process.env.CI
		? [
				["html", { outputFolder: "playwright-report", open: "never" }],
				["junit", { outputFile: "test-results/junit.xml" }],
				["list"]
			]
		: [["html", { outputFolder: "playwright-report", open: "on-failure" }], ["list"]],
	use: {
		baseURL: process.env.CI ? "http://localhost:15000/app/" : "http://localhost:15000",
		trace: "on-first-retry",
		viewport: { width: 1920, height: 1080 },
		headless: true,
		screenshot: "only-on-failure"
	},
	projects: [
		{
			name: "a12-team",
			use: { ...desktopChrome, viewport: { width: 1920, height: 1080 } },
			testDir: "e2e/a12-team",
			workers: 1
		},
		{
			name: "categories",
			use: { ...desktopChrome, viewport: { width: 1920, height: 1080 } },
			testDir: "e2e/categories",
			workers: 1
		},
		{
			name: "modelEditor-normal",
			use: { ...desktopChrome, viewport: { width: 1920, height: 1080 } },
			testDir: "e2e/model-editor/normal",
			workers: 1
		},
		{
			name: "modelEditor-pagination",
			use: { ...desktopChrome, viewport: { width: 1920, height: 1080 } },
			testDir: "e2e/model-editor/pagination",
			workers: 1
		},
		{
			name: "performance",
			use: { ...desktopChrome, viewport: { width: 1920, height: 1080 } },
			testDir: "e2e/performance",
			workers: 1,
			timeout: 120000 // 2 minutes for performance tests
		}
	]
});
