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

import { rpcRequest, addPerson, addTeam, linkPersonToTeam, linkTeamToTeam } from "../../../utils/index.js";

import team1Json from "../documents/a12-teams/DomainTeam-1.json" with { type: "json" };
import team2Json from "../documents/a12-teams/DomainTeam-2.json" with { type: "json" };
import team3Json from "../documents/a12-teams/DomainTeam-3.json" with { type: "json" };
import person1Json from "../documents/a12-teams/DomainPerson-1.json" with { type: "json" };
import person2Json from "../documents/a12-teams/DomainPerson-2.json" with { type: "json" };
import person3Json from "../documents/a12-teams/DomainPerson-3.json" with { type: "json" };
import person4Json from "../documents/a12-teams/DomainPerson-4.json" with { type: "json" };
import person5Json from "../documents/a12-teams/DomainPerson-5.json" with { type: "json" };
import person6Json from "../documents/a12-teams/DomainPerson-6.json" with { type: "json" };

export async function main() {
	const team1 = addTeam("Team1", team1Json);
	const team2 = addTeam("Team2", team2Json);
	const team3 = addTeam("Team3", team3Json);
	const person1 = addPerson("Person1", person1Json);
	const person2 = addPerson("Person2", person2Json);
	const person3 = addPerson("Person3", person3Json);
	const person4 = addPerson("Person4", person4Json);
	const person5 = addPerson("Person5", person5Json);
	const person6 = addPerson("Person6", person6Json);

	const requests: JsonRpc2Request[] = [
		team1,
		team2,
		team3,
		person1,
		person2,
		person3,
		person4,
		person5,
		person6,
		linkTeamToTeam("Team1Team2", team1, team2),
		linkTeamToTeam("Team1Team3", team1, team3),
		linkPersonToTeam("Team2Person1", team2, person1, "Leader"),
		linkPersonToTeam("Team2Person2", team2, person2, "Developer", ["1", "2"]),
		linkPersonToTeam("Team2Person3", team2, person3, "Developer", ["1", "3"]),
		linkPersonToTeam("Team2Person4", team2, person4, "Developer", ["1", "2", "3"]),
		linkPersonToTeam("Team2Person5", team2, person5, "Developer", ["2", "3"]),
		linkPersonToTeam("Team2Person6", team2, person6, "QA"),
		linkPersonToTeam("Team3Person1", team3, person1, "Leader", ["2", "3"]),
		linkPersonToTeam("Team3Person2", team3, person2, "QA/Developer", ["2"]),
		linkPersonToTeam("Team3Person3", team3, person3, "QA/Developer")
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
