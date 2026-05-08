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

import { type JsonRpc2Request, JsonRpc2Response, Relationship } from "@com.mgmtp.a12.dataservices/dataservices-access";

import {
	addAttachmentGroup,
	addComputer,
	addDetachedRepeat,
	addDirectory,
	addDrive,
	addField,
	addFile,
	addGroup,
	addInlineRepeat,
	addScreen,
	generateDirectory,
	generateField,
	generateFile,
	generateGroup,
	linkDirectoryToDirectory,
	linkDirectoryToDrive,
	linkDriveToComputer,
	linkElementToGroup,
	linkFileToDirectory,
	linkFileToDrive,
	linkGroupToFile,
	linkScreenElementToScreen,
	linkScreenToDetachedRepeat,
	linkScreenToFile,
	rpcRequest
} from "../../../utils/index.js";

import group1Json from "../documents/model-editor/Group-1.json" with { type: "json" };
import group2Json from "../documents/model-editor/Group-2.json" with { type: "json" };
import group3Json from "../documents/model-editor/Group-3.json" with { type: "json" };
import group4Json from "../documents/model-editor/Group-4.json" with { type: "json" };
import group5Json from "../documents/model-editor/Group-5.json" with { type: "json" };
import field1Json from "../documents/model-editor/Field-1.json" with { type: "json" };
import field2Json from "../documents/model-editor/Field-2.json" with { type: "json" };
import field3Json from "../documents/model-editor/Field-3.json" with { type: "json" };
import field4Json from "../documents/model-editor/Field-4.json" with { type: "json" };
import field5Json from "../documents/model-editor/Field-5.json" with { type: "json" };
import field6Json from "../documents/model-editor/Field-6.json" with { type: "json" };
import field7Json from "../documents/model-editor/Field-7.json" with { type: "json" };
import field8Json from "../documents/model-editor/Field-8.json" with { type: "json" };
import field9Json from "../documents/model-editor/Field-9.json" with { type: "json" };
import screen1Json from "../documents/model-editor/Screen-1.json" with { type: "json" };
import screen2Json from "../documents/model-editor/Screen-2.json" with { type: "json" };
import screen3Json from "../documents/model-editor/Screen-3.json" with { type: "json" };
import detachedRepeat1Json from "../documents/model-editor/DetachedRepeat-1.json" with { type: "json" };
import inlineRepeat1Json from "../documents/model-editor/InlineRepeat-1.json" with { type: "json" };
import inlineRepeat2Json from "../documents/model-editor/InlineRepeat-2.json" with { type: "json" };
import inlineRepeat3Json from "../documents/model-editor/InlineRepeat-3.json" with { type: "json" };
import computerJson from "../documents/model-editor/DomainComputer-1.json" with { type: "json" };
import drive1Json from "../documents/model-editor/DomainDrive-1.json" with { type: "json" };
import drive2Json from "../documents/model-editor/DomainDrive-2.json" with { type: "json" };
import drive3Json from "../documents/model-editor/DomainDrive-3.json" with { type: "json" };
import dir1Json from "../documents/model-editor/DomainDirectory-1.json" with { type: "json" };
import dir2Json from "../documents/model-editor/DomainDirectory-2.json" with { type: "json" };
import dir3Json from "../documents/model-editor/DomainDirectory-3.json" with { type: "json" };
import file1Json from "../documents/model-editor/DomainFile-1.json" with { type: "json" };
import file2Json from "../documents/model-editor/DomainFile-2.json" with { type: "json" };
import file3Json from "../documents/model-editor/DomainFile-3.json" with { type: "json" };
import file4Json from "../documents/model-editor/DomainFile-4.json" with { type: "json" };
import file5Json from "../documents/model-editor/DomainFile-5.json" with { type: "json" };
import file6Json from "../documents/model-editor/DomainFile-6.json" with { type: "json" };
import file7Json from "../documents/model-editor/DomainFile-7.json" with { type: "json" };
import file8Json from "../documents/model-editor/DomainFile-8.json" with { type: "json" };

import LinkPosition = Relationship.LinkPosition;

export interface ModelEditorParams {
	variant?: "normal" | "pagination" | "group-management";
	data?: "simple" | "multiple-pages";
}

export async function main(params?: ModelEditorParams) {
	const requests = await createRequest(params);
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

async function sampleDataForDataModeler(variant: ModelEditorParams["variant"]): Promise<{
	requests: JsonRpc2Request[];
	roots: { groups: JsonRpc2Request[]; screens: JsonRpc2Request[] };
}> {
	const isGroupManagement = variant === "group-management";

	const group1 = addGroup("Group1", group1Json, isGroupManagement);
	const group2 = addGroup("Group2", group2Json, isGroupManagement);
	const group3 = addGroup("Group3", group3Json, isGroupManagement);
	const group4 = addAttachmentGroup("Group4", group4Json, isGroupManagement);
	const group5 = addGroup("Group5", group5Json, isGroupManagement);
	const field1 = addField("Field1", field1Json);
	const field2 = addField("Field2", field2Json);
	const field3 = addField("Field3", field3Json);
	const field4 = addField("Field4", field4Json);
	const field5 = addField("Field5", field5Json);
	const field6 = addField("Field6", field6Json);
	const field7 = addField("Field7", field7Json);
	const field8 = addField("Field8", field8Json);
	const field9 = addField("Field9", field9Json);

	const screen1 = addScreen("Screen1", screen1Json);
	const screen2 = addScreen("Screen2", screen2Json);
	const screen3 = addScreen("Screen3", screen3Json);
	const detachedRepeat1 = addDetachedRepeat("DR1", detachedRepeat1Json);
	const inlineRepeat1 = addInlineRepeat("InlineRepeat1", inlineRepeat1Json);
	const inlineRepeat2 = addInlineRepeat("InlineRepeat2", inlineRepeat2Json);
	const inlineRepeat3 = addInlineRepeat("InlineRepeat3", inlineRepeat3Json);

	const requests: JsonRpc2Request[] = [
		group1,
		group2,
		group3,
		group4,
		group5,
		field1,
		field2,
		field3,
		field4,
		field5,
		field6,
		field7,
		field8,
		field9,
		screen1,
		screen2,
		screen3,
		detachedRepeat1,
		inlineRepeat1,
		inlineRepeat2,
		inlineRepeat3,
		linkElementToGroup("Group1Group2", group1, group2, undefined, isGroupManagement),
		linkElementToGroup("Group1Group3", group1, group3, undefined, isGroupManagement),
		linkElementToGroup("Group1Group4", group1, group4, undefined, isGroupManagement),
		linkElementToGroup("Group2Field1", group2, field1, undefined, isGroupManagement),
		linkElementToGroup("Group2Field2", group2, field2, undefined, isGroupManagement),
		linkElementToGroup("Group3Field3", group3, field3, undefined, isGroupManagement),
		linkElementToGroup("Group3Field4", group3, field4, undefined, isGroupManagement),
		linkElementToGroup("Group4Field5", group4, field5, undefined, isGroupManagement),
		linkElementToGroup("Group4Field6", group4, field6, undefined, isGroupManagement),
		linkElementToGroup("Group4Field7", group4, field7, undefined, isGroupManagement),
		linkElementToGroup("Group5Field8", group5, field8, undefined, isGroupManagement),
		linkElementToGroup("Group5Field9", group5, field9, undefined, isGroupManagement),
		linkScreenElementToScreen("InlineRepeat1Screen1", inlineRepeat1, screen1),
		linkScreenElementToScreen("InlineRepeat2Screen2", inlineRepeat2, screen2),
		linkScreenElementToScreen("InlineRepeat3Screen3", inlineRepeat3, screen3),
		linkScreenElementToScreen("DetachedRepeat1Screen3", detachedRepeat1, screen1),
		linkScreenToDetachedRepeat("Screen2DetachedRepeat1", screen2, detachedRepeat1)
	];

	return {
		requests,
		roots: {
			groups: [group1, group5],
			screens: [screen1, screen3]
		}
	};
}

async function createRequest(params?: ModelEditorParams): Promise<JsonRpc2Request[]> {
	const {
		requests: groupExampleRequest,
		roots: { groups, screens }
	} = await sampleDataForDataModeler(params?.variant);

	if (params?.variant === "group-management") {
		return groupExampleRequest;
	}

	const paginated = params?.variant === "pagination";

	const computer = addComputer("Computer", computerJson, paginated);
	const drive1 = addDrive("Drive1", drive1Json);
	const drive2 = addDrive("Drive2", drive2Json);
	const drive3 = addDrive("Drive3", drive3Json);
	const dir1 = addDirectory("Directory1", dir1Json);
	const dir2 = addDirectory("Directory2", dir2Json);
	const dir3 = addDirectory("Directory3", dir3Json);
	const file1 = addFile("File1", file1Json);
	const file2 = addFile("File2", file2Json);
	const file3 = addFile("File3", file3Json);
	const file4 = addFile("File4", file4Json);
	const file5 = addFile("File5", file5Json);
	const file6 = addFile("File6", file6Json);
	const file7 = addFile("File7", file7Json);
	const file8 = addFile("File8", file8Json);

	const requests: JsonRpc2Request[] = [
		computer,
		drive1,
		drive2,
		drive3,
		dir1,
		dir2,
		dir3,
		file1,
		file2,
		file3,
		file4,
		file5,
		file6,
		file7,
		file8,
		...groupExampleRequest,
		linkDriveToComputer("ComputerDrive3", computer, drive3, paginated),
		linkDriveToComputer("ComputerDrive2", computer, drive2, paginated),
		linkDriveToComputer("ComputerDrive1", computer, drive1, paginated),
		linkDirectoryToDrive("Drive1Dir1", drive1, dir1),
		linkDirectoryToDirectory("Dir1Dir2", dir1, dir2),
		linkDirectoryToDirectory("Dir1Dir3", dir1, dir3),
		linkFileToDirectory("Dir2File1", dir2, file1),
		linkFileToDirectory("Dir2File2", dir2, file2),
		linkFileToDirectory("Dir3File3", dir3, file3),
		linkFileToDirectory("Dir3File4", dir3, file4),
		linkFileToDrive("Drive2File5", drive2, file5),
		linkFileToDrive("Drive3File6", drive3, file6),
		linkFileToDrive("Drive3File7", drive3, file7),
		linkFileToDrive("Drive3File8", drive3, file8),
		linkGroupToFile("File6Group1", file6, groups[0]),
		linkGroupToFile("File8Group5", file8, groups[1]),
		linkScreenToFile("Screen1File7", screens[0], file7),
		linkScreenToFile("Screen3File7", screens[1], file7)
	];

	if (paginated && params?.data === "multiple-pages") {
		const nodeFolders = Array.from({ length: 10 }).map((_, index) => generateDirectory("Node Folder", `${index}`));
		const nodeFiles = Array.from({ length: 50 }).map((_, index) => generateFile("Node", `${index}`));
		const javaFiles = Array.from({ length: 50 }).map((_, index) => generateFile("Java", `${index}`));
		const programFiles = Array.from({ length: 15 }).map((_, index) => generateFile("Program", `${index}`));

		const rootGroups = Array.from({ length: 20 }).map((_, index) => generateGroup("RootGroup", `${index}`));
		const groupA = generateGroup("Group", "A");
		const groupAFields = Array.from({ length: 50 }).map((_, index) => generateField("FieldA", `${index}`));
		const groupB = generateGroup("Group", "B");
		const groupBFields = Array.from({ length: 50 }).map((_, index) => generateField("FieldB", `${index}`));

		requests.push(
			...nodeFolders,
			...nodeFolders.map((dir, index) => linkDirectoryToDirectory("Dir3DirX" + index, dir3, dir)),
			...nodeFiles,
			...nodeFiles.map((file, index) => linkFileToDirectory("Dir3FileX" + index, dir3, file)),
			...javaFiles,
			...javaFiles.map((file, index) => linkFileToDirectory("Dir2FileX" + index, dir2, file)),
			...programFiles,
			...programFiles.map((file, index) => linkFileToDirectory("Dir1FileX" + index, dir1, file)),
			groupA,
			linkElementToGroup("Group1GroupA", groups[0], groupA, LinkPosition.BOTTOM),
			groupB,
			linkElementToGroup("Group1GroupB", groups[0], groupB, LinkPosition.BOTTOM),
			...groupAFields,
			...groupAFields.map((field, index) => linkElementToGroup("GroupAField" + index, groupA, field)),
			...groupBFields,
			...groupBFields.map((field, index) => linkElementToGroup("GroupBField" + index, groupB, field)),
			...rootGroups,
			...rootGroups.map((group, index) => linkGroupToFile("File6RootGroup" + index, file6, group, LinkPosition.BOTTOM))
		);
	}

	return requests;
}
