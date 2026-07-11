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
import Path from "node:path";
import Fs from "node:fs/promises";

import notice from "eslint-plugin-notice";
import { fixupPluginRules } from "@eslint/compat";
import unusedImports from "eslint-plugin-unused-imports";
import typedReduxSaga from "@jambit/eslint-plugin-typed-redux-saga";
import { reactStrict } from "@com.mgmtp.a12.devtools/eslint-config";

const license = await Fs.readFile(Path.join(import.meta.dirname, "license_header.txt"), "utf-8");

/** @type { import("eslint").Linter.Config[] } */
export default [
	...reactStrict,
	{
		name: "core/ignores",
		ignores: [
			"**/lib/",
			"**/dist/",
			"**/build/",
			"**/target/",
			"**/coverage/",
			"**/resources/",
			"**/generated/",
			"**/playwright-report/",
			"**/.mocharc.cjs",
			"**/*.skip-test.*",
			"migration-tool/src/internal/steps/index.ts"
		]
	},
	{
		name: "core/general",
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["*/*.config.{js,cjs,mjs,ts}"]
				},
				tsconfigRootDir: import.meta.dirname
			}
		},
		linterOptions: {
			reportUnusedDisableDirectives: "error"
		},
		plugins: {
			notice: fixupPluginRules(notice),
			"unused-imports": unusedImports,
			"typed-redux-saga": typedReduxSaga
		},
		rules: {
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/no-empty-function": "warn",
			"@typescript-eslint/no-empty-interface": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
			curly: "error",
			"no-inner-declarations": "off",
			"react/display-name": "off",
			"react/prop-types": "off",
			"react/react-in-jsx-scope": "off",
			"react-hooks/refs": "warn",
			"react-hooks/static-components": "warn",
			"react-hooks/immutability": "warn",
			"react-hooks/preserve-manual-memoization": "warn",
			"react-hooks/error-boundaries": "warn",
			"react-hooks/use-memo": "warn",
			"notice/notice": ["error", { template: license, onNonMatchingHeader: "replace", chars: license.length }],
			"no-console": "error",
			"import/no-extraneous-dependencies": "error",
			"unused-imports/no-unused-imports": "error",
			"no-restricted-imports": [
				"error",
				{
					paths: [
						{
							name: "redux",
							importNames: ["AnyAction"],
							message: "AnyAction is deprecated in Redux 5. Use 'UnknownAction' instead."
						},
						{
							name: "typescript-fsa",
							message: "Use '@com.mgmtp.a12.client/typescript-fsa-redux-5-compat' instead."
						}
					]
				}
			],
			"typed-redux-saga/delegate-effects": "error",
			"typed-redux-saga/use-typed-effects": "error",
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{ prefer: "type-imports", fixStyle: "separate-type-imports" }
			],
			"@typescript-eslint/no-import-type-side-effects": "error"
		}
	},
	{
		name: "core/test",
		files: ["**/test/**", "playwright/e2e/**/*.ts"],
		rules: {
			"import/no-extraneous-dependencies": ["error", { devDependencies: true }],
			"no-console": "warn",
			"@typescript-eslint/no-floating-promises": "off",
			"@typescript-eslint/no-unused-expressions": ["off"]
		}
	},
	{
		name: "documentation",
		files: ["documentation/**"],
		rules: {
			"import/no-extraneous-dependencies": "off",
			"no-console": "warn"
		}
	},
	{
		name: "scripts",
		files: ["**/scripts/**", "services-utils/**"],
		rules: {
			"@typescript-eslint/no-require-imports": ["off"],
			"no-console": "off"
		}
	}
];
