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

import * as Fs from "node:fs";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { updateBaseUrl } from "./utils/index.js";
import { main as cleanDocuments, type CleanDocParams } from "./commands/clean-documents.js";
import { main as generate, type GenerateParams } from "./commands/generate.js";
import { main as seed, type WaitOnParams } from "./commands/seed/index.js";
import { main as uploadModels, type UploadParams } from "./commands/model/upload.js";
import { main as waitOn } from "./commands/wait-on.js";

const argv = yargs(hideBin(process.argv))
	.usage("Usage: $0 script [options]")
	.demandCommand(1)
	.command("seed [preset]", "Seed the data to server using a specific preset", (yargs) => {
		yargs
			.positional("preset", {
				default: "default",
				choices: ["default", "a12-teams", "categories", "categories-slim", "model-editor", "circular-nodes"]
			})
			.positional("variant", {
				description: "Mode for model-editor: normal, pagination, group-management. Default: normal.",
				choices: ["normal", "pagination", "group-management"],
				default: "normal"
			})
			.positional("data", {
				description: "Sample data for model-editor: simple or multiple-pages. Default: simple",
				choices: ["simple", "multiple-pages"],
				default: "simple"
			});
	})
	.command("clean-documents [showcases..]", "Clean all documents of certain showcase(s)", (yargs) => {
		yargs
			.positional("showcases", {
				default: "all",
				choices: ["all", "a12-teams", "categories", "model-editor"]
			})
			.positional("variant", {
				description: "Mode for model-editor: normal, pagination, group-management, all. Default: normal.",
				choices: ["normal", "pagination", "group-management", "all"],
				default: "normal"
			});
	})
	.command("generate", "Recursively generate nodes", {
		categories: {
			describe: "Numbers of category nodes in each level",
			demand: true,
			type: "array"
		},
		products: {
			describe: "Number of product nodes that each deepest category contains",
			type: "number"
		}
	})
	.command("upload-models", "Upload all models in certain directory", (yargs) => {
		yargs.positional("path", {
			default: "resources/models",
			description: "ONLY WORK with relative path"
		});
	})
	.command("wait-on", "Wait until the server starts", { timeout: { type: "number" } })
	.option("baseUrl", {
		alias: "url",
		description: "Base url of the Services",
		default: "http://localhost:15001"
	})
	.option("waitOn", {
		description: "Wait until the server is initialized"
	})
	.option("whenDirNotFound", {
		type: "string",
		description: "Only run the script when the target directory is empty.",
		alias: "dnf"
	})
	.help("h")
	.parseSync();

async function main() {
	if (argv.whenDirNotFound && Fs.existsSync(argv.whenDirNotFound)) {
		console.log(`Cancelled because directory "${argv.whenDirNotFound}" is already existed.`);
		process.exit(0);
	}
	if (argv.baseUrl) {
		updateBaseUrl(argv.baseUrl);
	}

	if (argv._.includes("clean-documents")) {
		await cleanDocuments(argv as CleanDocParams);
	} else if (argv._.includes("generate")) {
		await generate(argv as unknown as GenerateParams);
	} else if (argv._.includes("seed")) {
		await seed(argv as unknown as WaitOnParams);
	} else if (argv._.includes("wait-on")) {
		await waitOn(argv as { timeout?: number });
	} else if (argv._.includes("upload-models")) {
		await uploadModels(argv as unknown as UploadParams);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
