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

import path from "node:path";

import { Project } from "ts-morph";

import Config from "./config.js";

const ERROR_LEVEL = "ERROR";

export function handleAsciidoctorErrors(memoryLogger) {
	const messages = memoryLogger.getMessages();
	for (const message of messages) {
		const severity = message.getSeverity();
		console.log(`${severity} ${message.getSourceLocation() || ""}: ${message.getText()}`);

		if (severity === ERROR_LEVEL) {
			process.exit(1);
		}
	}
}

export async function copySources() {
	const project = new Project();

	const TreeEngineNamespace = project
		.addSourceFileAtPath(path.join(Config.contextProviderDir, "tree-engine-context-provider.tsx"))
		.getModule("TreeEngineContextProvider")
		.getInterface("OwnProps");
	if (!TreeEngineNamespace) {
		throw new Error("Could not find TreeEngine namespace");
	}

	const KeyboardShortcutInterface = project
		.addSourceFileAtPath(path.join(Config.keyboardShortcutDir, "types.ts"))
		.getInterface("KeyboardShortcut");
	if (!KeyboardShortcutInterface) {
		throw new Error("Could not find KeyboardShortcut interface");
	}

	const contextProviderPath = path.join(
		Config.srcDir,
		"assets",
		"generated",
		"typescript",
		"tree-engine-context-provider.tsx"
	);

	await project
		.createSourceFile(contextProviderPath, TreeEngineNamespace.getText(), { overwrite: true })
		.indent(0, -1)
		.save();

	await project.getSourceFileOrThrow(contextProviderPath).formatText({ convertTabsToSpaces: false });

	await project.save();

	await project
		.createSourceFile(
			path.join(Config.srcDir, "assets", "generated", "typescript", "keyboard-shortcut.ts"),
			KeyboardShortcutInterface.getText(),
			{ overwrite: true }
		)
		.indent(0, -1)
		.save();
}
