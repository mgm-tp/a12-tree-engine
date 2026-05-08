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

import * as Path from "node:path";
import * as Fs from "node:fs";
import * as ChildProcess from "node:child_process";

import { describe, test, expect } from "vitest";

const ROOT_DIR = Path.join(import.meta.dirname, "..");
const TEMP_DIR = Path.join(ROOT_DIR, "target", "temp");
const FIXTURES_DIR = Path.join(ROOT_DIR, "test", "__fixtures__");
const BIN_PATH = Path.join(ROOT_DIR, "bin", "tree-model-migration");

// Setup must run synchronously before describe block for dynamic test generation
Fs.rmSync(TEMP_DIR, { recursive: true, force: true });
Fs.cpSync(FIXTURES_DIR, TEMP_DIR, { recursive: true });
ChildProcess.execSync(`${BIN_PATH} ${TEMP_DIR} --next`);

describe("@com.mgmtp.a12.tree-model-migration.steps", () => {
	for (const filePath of Fs.readdirSync(TEMP_DIR)) {
		test(filePath, () => {
			expect(Fs.readFileSync(Path.join(TEMP_DIR, filePath), "utf8")).toMatchSnapshot();
		});
	}
});
