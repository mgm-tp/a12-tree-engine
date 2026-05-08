import a12Config from "@com.mgmtp.a12.devtools/prettier-config";

/** @type {import("prettier").Config} */
export default {
	...a12Config,
	printWidth: 120,
	semi: true,
	bracketSameLine: true,
	arrowParens: "always"
};
