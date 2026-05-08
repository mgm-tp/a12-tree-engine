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

import { inspect } from "node:util";

import { type JsonRpc2Request, JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

import {
	rpcRequest,
	addFile,
	addDrive,
	addComputer,
	addDirectory,
	linkFileToDrive,
	linkDriveToComputer,
	linkFileToDirectory,
	linkDirectoryToDrive,
	linkDirectoryToDirectory
} from "../../../utils/index.js";

import drive1Json from "../documents/model-editor/DomainDrive-1.json" with { type: "json" };
import drive2Json from "../documents/model-editor/DomainDrive-2.json" with { type: "json" };
import computerJson from "../documents/model-editor/DomainComputer-1.json" with { type: "json" };
import dir1Json from "../documents/model-editor/DomainDirectory-1.json" with { type: "json" };
import dir2Json from "../documents/model-editor/DomainDirectory-2.json" with { type: "json" };
import dir3Json from "../documents/model-editor/DomainDirectory-3.json" with { type: "json" };
import file1Json from "../documents/model-editor/DomainFile-1.json" with { type: "json" };
import file2Json from "../documents/model-editor/DomainFile-2.json" with { type: "json" };
import file3Json from "../documents/model-editor/DomainFile-3.json" with { type: "json" };
import file4Json from "../documents/model-editor/DomainFile-4.json" with { type: "json" };

export async function main() {
	const computer = addComputer("Computer", computerJson);
	const drive1 = addDrive("Drive1", drive1Json);
	const drive2 = addDrive("Drive2", drive2Json);

	const dir1 = addDirectory("Directory1", dir1Json);
	const dir2 = addDirectory("Directory2", dir2Json);
	const dir3 = addDirectory("Directory3", dir3Json);

	const file1 = addFile("File1", file1Json);
	const file2 = addFile("File2", file2Json);
	const file3 = addFile("File3", file3Json);
	const file4 = addFile("File4", file4Json);

	const requests: JsonRpc2Request[] = [
		computer,
		drive1,
		drive2,
		dir1,
		dir2,
		dir3,
		file1,
		file2,
		file3,
		file4,
		linkDriveToComputer("ComputerDrive2", computer, drive2),
		linkDriveToComputer("ComputerDrive1", computer, drive1),
		linkDirectoryToDrive("Drive1Dir1", drive1, dir1),
		linkDirectoryToDirectory("Dir1Dir2", dir1, dir2),
		linkDirectoryToDirectory("Dir2Dir1", dir2, dir1),
		linkDirectoryToDirectory("Dir2Dir3", dir2, dir3),
		linkFileToDirectory("Dir3File3", dir3, file1),
		linkFileToDirectory("Dir3File4", dir3, file2),
		linkDirectoryToDrive("Drive2Dir3", drive2, dir3),
		linkFileToDrive("Drive2File5", drive2, file3)
	];

	const responses = await rpcRequest(requests);
	if (JsonRpc2Response.hasErrors(responses)) {
		console.error(
			inspect(
				responses.filter((res) => !!res.error),
				{ depth: 10 }
			)
		);
		process.exit(1);
	}
}
