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

import type { DocumentJsonRpc2Request, JsonRpc2Request } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { linkEntities } from "./index.js";

export function addTeam(suffix: string, document: object): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddTeam${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainTeam",
			locale: "en_US"
		}
	};
}

export function addPerson(suffix: string, document: object): DocumentJsonRpc2Request.AddJsonRpc2Request {
	return {
		jsonrpc: "2.0",
		id: `AddPerson${suffix}`,
		method: "ADD_DOCUMENT",
		params: {
			document,
			documentModelName: "DomainPerson",
			locale: "en_US"
		}
	};
}

export function linkTeamToTeam(suffix: string, parent: JsonRpc2Request, child: JsonRpc2Request) {
	return linkEntities(suffix, "TeamTeam", [
		{ role: "Parent", docRef: `#{#${parent.id}.metadata.docRef}` },
		{ role: "Child", docRef: `#{#${child.id}.metadata.docRef}` }
	]);
}

export function linkPersonToTeam(
	suffix: string,
	team: JsonRpc2Request,
	person: JsonRpc2Request,
	position: string,
	skillValues?: string[]
) {
	return linkEntities(
		suffix,
		"TeamPerson",
		[
			{ role: "Team", docRef: `#{#${team.id}.metadata.docRef}` },
			{ role: "Person", docRef: `#{#${person.id}.metadata.docRef}` }
		],
		{ grp1: { Position: position, Skill: skillValues?.map((value) => ({ value })) } }
	);
}
