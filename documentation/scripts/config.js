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

import Path from "path";

const __dirname = import.meta.dirname;
const srcDir = Path.resolve(__dirname, "..", "src");
const outDir = Path.resolve(__dirname, "..", "build");
const contextProviderDir = Path.resolve(__dirname, "..", "..", "core", "src", "core", "view", "context");
const keyboardShortcutDir = Path.resolve(
	__dirname,
	"..",
	"..",
	"core",
	"src",
	"core",
	"view",
	"configuration",
	"keyboard-shortcut"
);

export default {
	docinfoDir: Path.resolve(__dirname, "..", "resources"),

	srcDir,
	srcAssets: Path.resolve(srcDir, "assets"),
	srcShowcaseDir: Path.resolve(__dirname, "..", "..", "showcase", "src"),
	srcExtensionsDir: Path.resolve(__dirname, "..", "..", "core", "src", "extensions"),
	srcHighlightStyleFile: Path.join(import.meta.dirname, "..", "node_modules", "highlight.js/styles/atom-one-light.css"),

	outDir,
	outAssets: Path.resolve(outDir, "assets"),
	outShowcaseDir: Path.resolve(srcDir, "assets", "generated", "typescript", "showcase"),
	outExtensionsDir: Path.resolve(srcDir, "assets", "generated", "typescript", "extensions"),
	outHighlightStyleFile: Path.resolve(outDir, "styles", "highlightjs-theme.css"),

	contextProviderDir,
	keyboardShortcutDir
};
