import Path from "node:path";
import Fs from "node:fs/promises";

import notice from "eslint-plugin-notice";
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
			notice,
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
			"react-hooks/static-components": "off",
			"react-hooks/refs": "off",
			"react-hooks/immutability": "off",
			"react-hooks/preserve-manual-memoization": "off",
			"react-hooks/use-memo": "off",
			"notice/notice": ["error", { template: license, onNonMatchingHeader: "replace", chars: license.length }],
			"no-console": "error",
			"import/no-extraneous-dependencies": "error",
			"unused-imports/no-unused-imports": "error",
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						"../**/internal/*",
						"!../**/internal/shared.js",
						"@com.mgmtp.a12*/**/internal/**",
						"@com.mgmtp.a12*/**/src/**"
					]
				}
			],
			"typed-redux-saga/delegate-effects": "error",
			"typed-redux-saga/use-typed-effects": "error",
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{ prefer: "type-imports", fixStyle: "inline-type-imports" }
			]
		}
	},
	{
		name: "core/test",
		files: ["**/test/**", "playwright/e2e/**/*.ts"],
		rules: {
			"import/no-extraneous-dependencies": ["error", { devDependencies: true }],
			"no-console": "warn",
			"@typescript-eslint/no-floating-promises": "off",
			"@typescript-eslint/no-unused-expressions": ["off"],
			"no-restricted-imports": ["error", { patterns: ["@com.mgmtp.a12*/**/internal/**", "@com.mgmtp.a12*/**/src/**"] }]
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
