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

import { fileURLToPath } from "node:url";

import pluginReact from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const cheerioStub = fileURLToPath(new URL("./src/test/setup/cheerio-stub.ts", import.meta.url));
const reactDomTestUtilsShim = fileURLToPath(new URL("./src/test/setup/react-dom-test-utils-shim.ts", import.meta.url));

export default defineConfig({
	test: {
		include: ["src/test/**/*.test.{ts,tsx}"],
		setupFiles: ["./src/test/setup/vitest.ts"],
		reporters: ["default", "junit"],
		outputFile: {
			junit: "./target/TEST-tree-engine.xml"
		},
		maxWorkers: process.env.CI ? 2 : "50%",
		pool: "forks",
		globals: true,
		retry: process.env.CI ? 1 : 0,
		testTimeout: 20000,
		coverage: {
			enabled: true,
			reporter: ["text", "html"],
			reportsDirectory: "./target/coverage"
		},
		browser: {
			enabled: true,
			headless: true,
			screenshotFailures: false,
			provider: playwright(),
			instances: [
				{
					browser: "chromium",
					viewport: { width: 1280, height: 720 }
				}
			]
		}
	},
	/*
	 * Dependencies discovered mid-run make the optimizer restart the browser, which aborts whatever
	 * was in flight. Everything the suite pulls in is listed up front so a cold run stays one pass.
	 */
	optimizeDeps: {
		include: [
			"@cfaester/enzyme-adapter-react-18",
			"@com.mgmtp.a12.base/base-model-api",
			"@com.mgmtp.a12.client/client-core",
			"@com.mgmtp.a12.client/client-core/a12internal",
			"@com.mgmtp.a12.client/client-core/heterogeneity",
			"@com.mgmtp.a12.client/client-core/modelLoader",
			"@com.mgmtp.a12.client/typescript-fsa-redux-5-compat",
			"@com.mgmtp.a12.dataservices/dataservices-access",
			"@com.mgmtp.a12.kernel/kernel-md-facade",
			"@com.mgmtp.a12.relationshipengine/relationshipengine-core",
			"@com.mgmtp.a12.utils/utils-localization",
			"@com.mgmtp.a12.utils/utils-localization-react",
			"@com.mgmtp.a12.utils/utils-logging",
			"@com.mgmtp.a12.widgets/widgets-core",
			"@testing-library/jest-dom/vitest",
			"@testing-library/react",
			"enzyme",
			"keycode-js",
			"react-dnd",
			"react-redux",
			"redux",
			"reselect",
			"styled-components",
			"typed-redux-saga",
			"typemoq"
		]
	},
	resolve: {
		/** Modules the Enzyme stack expects but the browser cannot serve - see each replacement for why. */
		alias: [
			{ find: /^cheerio\/lib\/utils$/, replacement: cheerioStub },
			{ find: /^cheerio$/, replacement: cheerioStub },
			{ find: /^react-dom\/test-utils$/, replacement: reactDomTestUtilsShim }
		]
	},
	define: {
		global: "window",
		SC_DISABLE_SPEEDY: false
	},
	plugins: [pluginReact()]
});
