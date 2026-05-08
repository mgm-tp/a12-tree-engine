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

import asciidoctor0 from "asciidoctor";
import highlightJsExt from "asciidoctor-highlight.js";

import PackageJson from "../package.json" with { type: "json" };

import Config from "./config.js";
import { copySources, handleAsciidoctorErrors } from "./utils.js";

const asciidoctor = asciidoctor0();

const loggerManager = asciidoctor.LoggerManager;
const memoryLogger = asciidoctor.MemoryLogger.create();
loggerManager.setLogger(memoryLogger);

const registry = asciidoctor.Extensions.create();
highlightJsExt.register(registry);

export async function compile() {
	await copySources();
	await Fs.cp(Config.srcShowcaseDir, Config.outShowcaseDir, { recursive: true });
	await Fs.cp(Config.srcExtensionsDir, Config.outExtensionsDir, { recursive: true });

	asciidoctor.convertFile(Path.resolve(Config.srcDir, "index.adoc"), {
		to_dir: Config.outDir,
		mkdirs: true,
		safe: 0,
		extension_registry: registry,
		attributes: {
			icons: "font",
			["source-highlighter"]: "highlightjs-ext",
			toclevels: 5,
			["toc-title"]: "Table of Contents",
			docinfo: "shared",
			docinfodir: Config.docinfoDir,
			toc: "left",
			doctype: "article",
			["source-linenums-option"]: true,
			tabsize: 2,
			sectnums: true,
			sectanchors: true,
			sectlinks: true,
			experimental: true,
			sectids: true,
			encoding: "utf-8",
			lang: "en",
			fragment: true,
			xrefstyle: "short",
			standalone: true,
			revnumber: PackageJson.version,
			author: "Tree Engine Product Team"
		}
	});
	handleAsciidoctorErrors(memoryLogger);

	await Fs.cp(Config.srcAssets, Config.outAssets, { recursive: true });
	await Fs.cp(Config.srcHighlightStyleFile, Config.outHighlightStyleFile, { recursive: true });
}

// Only compile the documentation if the script is called directly
// to avoid conflict with start mode
if (process.argv.some((arg) => arg.includes("scripts/compile"))) {
	compile()
		.then(() => console.log("Documentation compiled successfully"))
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}
