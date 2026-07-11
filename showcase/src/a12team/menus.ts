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

import { ActivitySelectors, type DynamicMenu, type Selector } from "@com.mgmtp.a12.client/client-core";

import { onClickFor } from "../utils.js";

import {
	A12_TEAMS_DESCRIPTOR,
	A12_TEAMS_CUSTOM_VIEW_DESCRIPTOR,
	A12_TEAMS_PAGINATION_DESCRIPTOR,
	A12_TEAMS_MULTI_LEVEL_DESCRIPTOR,
	DOMAIN_TEAM_DESCRIPTOR,
	DOMAIN_PERSON_DESCRIPTOR
} from "./descriptors.js";

const onClickA12Teams = onClickFor(A12_TEAMS_DESCRIPTOR);
const onClickA12TeamsCustomView = onClickFor(A12_TEAMS_CUSTOM_VIEW_DESCRIPTOR);
const onClickA12TeamsPagination = onClickFor(A12_TEAMS_PAGINATION_DESCRIPTOR);
const onClickA12TeamsMultiLevel = onClickFor(A12_TEAMS_MULTI_LEVEL_DESCRIPTOR);
const onClickDomainTeam = onClickFor(DOMAIN_TEAM_DESCRIPTOR);
const onClickDomainPerson = onClickFor(DOMAIN_PERSON_DESCRIPTOR);

export const menus: Selector<DynamicMenu[]> = (state) => {
	const a12TeamsActivity = ActivitySelectors.activitiesByDescriptor(A12_TEAMS_DESCRIPTOR)(state).at(0);
	const a12TeamsCustomViewActivity = ActivitySelectors.activitiesByDescriptor(A12_TEAMS_CUSTOM_VIEW_DESCRIPTOR)(
		state
	).at(0);
	const a12TeamsPaginationActivity = ActivitySelectors.activitiesByDescriptor(A12_TEAMS_PAGINATION_DESCRIPTOR)(
		state
	).at(0);
	const a12TeamsMultiLevelActivity = ActivitySelectors.activitiesByDescriptor(A12_TEAMS_MULTI_LEVEL_DESCRIPTOR)(
		state
	).at(0);
	const domainTeamActivity = ActivitySelectors.activitiesByDescriptor(DOMAIN_TEAM_DESCRIPTOR)(state).at(0);
	const domainPersonActivity = ActivitySelectors.activitiesByDescriptor(DOMAIN_PERSON_DESCRIPTOR)(state).at(0);

	return [
		{
			id: "A12Team",
			label: { key: "application.menu.a12team.label" },
			children: [
				{
					id: "A12 Tree",
					label: { key: "application.menu.a12team.tree" },
					selected: a12TeamsActivity !== undefined,
					action: onClickA12Teams
				},
				{
					id: "A12 Tree Custom",
					label: { key: "application.menu.a12team.custom" },
					selected: a12TeamsCustomViewActivity !== undefined,
					action: onClickA12TeamsCustomView
				},
				{
					id: "A12 Tree Pagination",
					label: { key: "application.menu.a12team.pagination" },
					selected: a12TeamsPaginationActivity !== undefined,
					action: onClickA12TeamsPagination
				},
				{
					id: "A12 Tree Multi-Level",
					label: { key: "application.menu.a12team.multiLevel" },
					selected: a12TeamsMultiLevelActivity !== undefined,
					action: onClickA12TeamsMultiLevel
				},
				{
					id: "DomainTeam",
					label: { key: "application.menu.a12team.domainTeam" },
					selected: domainTeamActivity !== undefined,
					action: onClickDomainTeam
				},
				{
					id: "DomainPerson",
					label: { key: "application.menu.a12team.domainPerson" },
					selected: domainPersonActivity !== undefined,
					action: onClickDomainPerson
				}
			]
		}
	];
};
