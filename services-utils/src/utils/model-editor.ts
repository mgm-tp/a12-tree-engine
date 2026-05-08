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

import {
	type DocumentJsonRpc2Request,
	type JsonRpc2Request,
	Relationship
} from "@com.mgmtp.a12.dataservices/dataservices-access";

import { linkEntities } from "./index.js";

import LinkPosition = Relationship.LinkPosition;

export function addComputer(
	suffix: string,
	document: { [key: string]: object },
	paginated?: boolean
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddComputer${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: `${paginated ? "DomainComputerPagination" : "DomainComputer"}`,
			locale: "en_US"
		}
	};
}

export function addDrive(
	suffix: string,
	document: { [key: string]: object }
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddDrive${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainDrive",
			locale: "en_US"
		}
	};
}

export function addDirectory(
	suffix: string,
	document: { [key: string]: object }
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddDirectory${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainDirectory",
			locale: "en_US"
		}
	};
}

export function generateDirectory(baseName = "Directory", suffix: string) {
	const file = {
		Directory: {
			Basic: {
				Name: `${baseName} ${suffix}`,
				Owner: "admin",
				Group: "admin"
			}
		}
	};
	return addDirectory(suffix, file);
}

export function addFile(
	suffix: string,
	document: { [key: string]: object }
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddFile${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainFile",
			locale: "en_US"
		}
	};
}

export function generateFile(baseName = "File", suffix: string) {
	const file = {
		File: {
			Basic: {
				Name: `${baseName} ${suffix}`,
				Owner: "admin",
				Group: "admin"
			},
			Size: Math.floor(Math.random() * 100000),
			Extension: "exe",
			FileType: "application",
			Readonly: true
		}
	};
	return addFile("FileX" + suffix, file);
}

export function addGroup(
	suffix: string,
	document: { [key: string]: object },
	isGroupManagement = false
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddGroup${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: isGroupManagement ? "DomainGroup-GM" : "DomainGroup",
			locale: "en_US"
		}
	};
}
export function generateGroup(baseName = "Group", suffix: string) {
	const field = {
		Element: {
			Group: { Repeatability: 1 },
			GeneralInformation: { Name: `${baseName} ${suffix}` }
		}
	};

	return addGroup("Group" + suffix, field);
}

export function addAttachmentGroup(
	suffix: string,
	document: { [key: string]: object },
	isGroupManagement = false
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddGroup${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: isGroupManagement ? "DomainAttachmentGroup-GM" : "DomainAttachmentGroup",
			locale: "en_US"
		}
	};
}

export function addField(
	suffix: string,
	document: { [key: string]: object }
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddField${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainField",
			locale: "en_US"
		}
	};
}

export function generateField(baseName = "Field", suffix: string) {
	const field = {
		Element: {
			Field: {
				Type: "STRING",
				Required: true,
				Global: true,
				Transient: true,
				DataTypeSpecification: { DecimalPlaceType: "NONE", Unit: "NONE", LineBreaksPermitted: true }
			},
			GeneralInformation: { Name: `${baseName} ${suffix}` }
		}
	};
	return addField("Field" + suffix, field);
}

export function addRule(
	suffix: string,
	document: { [key: string]: object }
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddRule${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainRule",
			locale: "en_US"
		}
	};
}

export function addScreen(
	suffix: string,
	document: { [key: string]: object }
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddScreen${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainScreen",
			locale: "en_US"
		}
	};
}

export function addInlineRepeat(
	suffix: string,
	document: { [key: string]: object }
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddInlineRepeat${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainInlineRepeat",
			locale: "en_US"
		}
	};
}
export function addDetachedRepeat(
	suffix: string,
	document: { [key: string]: object }
): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddDetachRepeat${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainDetachedRepeat",
			locale: "en_US"
		}
	};
}

export function linkDriveToComputer(
	suffix: string,
	computer: JsonRpc2Request,
	drive: JsonRpc2Request,
	paginated?: boolean
) {
	return linkEntities(suffix, `${paginated ? "ComputerDrivePagination" : "ComputerDrive"}`, [
		{ role: "Computer", docRef: `#{#${computer.id}.metadata.docRef}` },
		{ role: "Drive", docRef: `#{#${drive.id}.metadata.docRef}` }
	]);
}

export function linkDirectoryToDrive(suffix: string, drive: JsonRpc2Request, directory: JsonRpc2Request) {
	return linkEntities(suffix, "DriveDirectory", [
		{ role: "Drive", docRef: `#{#${drive.id}.metadata.docRef}` },
		{ role: "Directory", docRef: `#{#${directory.id}.metadata.docRef}` }
	]);
}
export function linkFileToDrive(suffix: string, drive: JsonRpc2Request, file: JsonRpc2Request) {
	return linkEntities(suffix, "DriveFile", [
		{ role: "Drive", docRef: `#{#${drive.id}.metadata.docRef}` },
		{ role: "File", docRef: `#{#${file.id}.metadata.docRef}` }
	]);
}

export function linkDirectoryToDirectory(suffix: string, parent: JsonRpc2Request, child: JsonRpc2Request) {
	return linkEntities(suffix, "DirectoryDirectory", [
		{ role: "Parent", docRef: `#{#${parent.id}.metadata.docRef}` },
		{ role: "Child", docRef: `#{#${child.id}.metadata.docRef}` }
	]);
}

export function linkFileToDirectory(suffix: string, directory: JsonRpc2Request, file: JsonRpc2Request) {
	return linkEntities(suffix, "DirectoryFile", [
		{ role: "Directory", docRef: `#{#${directory.id}.metadata.docRef}` },
		{ role: "File", docRef: `#{#${file.id}.metadata.docRef}` }
	]);
}

export function linkGroupToFile(
	suffix: string,
	file: JsonRpc2Request,
	group: JsonRpc2Request,
	posision?: LinkPosition
) {
	return linkEntities(
		suffix,
		"DocumentModelFileGroup",
		[
			{ role: "File", docRef: `#{#${file.id}.metadata.docRef}` },
			{ role: "RootGroup", docRef: `#{#${group.id}.metadata.docRef}` }
		],
		undefined,
		posision
	);
}

export function linkElementToGroup(
	suffix: string,
	group: JsonRpc2Request,
	element: JsonRpc2Request,
	position?: LinkPosition,
	isGroupManagement = false
) {
	return linkEntities(
		suffix,
		isGroupManagement ? "GroupElement-GM" : "GroupElement",
		[
			{ role: "Group", docRef: `#{#${group.id}.metadata.docRef}` },
			{ role: "Element", docRef: `#{#${element.id}.metadata.docRef}` }
		],
		undefined,
		position
	);
}

export function linkScreenToFile(suffix: string, screen: JsonRpc2Request, file: JsonRpc2Request) {
	return linkEntities(
		suffix,
		"FormModelFileScreen",
		[
			{ role: "File", docRef: `#{#${file.id}.metadata.docRef}` },
			{ role: "RootScreen", docRef: `#{#${screen.id}.metadata.docRef}` }
		],
		undefined,
		Relationship.LinkPosition.BOTTOM
	);
}

export function linkScreenElementToScreen(suffix: string, screenElement: JsonRpc2Request, screen: JsonRpc2Request) {
	return linkEntities(
		suffix,
		"ScreenScreenElement",
		[
			{ role: "Screen", docRef: `#{#${screen.id}.metadata.docRef}` },
			{ role: "ScreenElement", docRef: `#{#${screenElement.id}.metadata.docRef}` }
		],
		undefined,
		Relationship.LinkPosition.BOTTOM
	);
}

export function linkScreenToDetachedRepeat(suffix: string, screen: JsonRpc2Request, detachedRepeat: JsonRpc2Request) {
	return linkEntities(
		suffix,
		"DetachedRepeatScreen",
		[
			{ role: "DetachedRepeat", docRef: `#{#${detachedRepeat.id}.metadata.docRef}` },
			{ role: "Screen", docRef: `#{#${screen.id}.metadata.docRef}` }
		],
		undefined,
		Relationship.LinkPosition.BOTTOM
	);
}
