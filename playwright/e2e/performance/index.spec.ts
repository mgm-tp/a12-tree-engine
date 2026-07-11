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

import * as fs from "fs";
import * as path from "path";

import { test } from "@playwright/test";

import { testConfigs } from "./test-configs/index.js";
import { run } from "./run.js";
import type { RawRecorder } from "./types.js";
import { convert } from "./convert.js";
import { REPORT_FILE_NAME, REPORT_JSON_FILE_NAME } from "./config.js";

test.describe("Performance test", () => {
	const rawRecorder: RawRecorder = {};

	test.afterAll(async () => {
		// Write XML report
		const xmlReport = convert(rawRecorder, "xml") as string;
		fs.writeFileSync(path.join(process.cwd(), REPORT_FILE_NAME), xmlReport);

		// Write JSON report
		const jsonReport = convert(rawRecorder, "json") as string;
		fs.writeFileSync(path.join(process.cwd(), REPORT_JSON_FILE_NAME), jsonReport);

		// Log chart visualization
		console.log("\n" + "=".repeat(100));
		console.log("Result Visualization");
		console.log("=".repeat(100));
		console.log(convert(rawRecorder, "chart"));

		// Log statistics table
		console.log("\n" + "=".repeat(100));
		console.log("Result Summary");
		console.log("=".repeat(100));
		const stats = convert(rawRecorder, "stat");
		console.table(stats);
	});

	test.describe("main", () => {
		testConfigs.forEach((testConfig) => run(testConfig, rawRecorder));
	});
});
