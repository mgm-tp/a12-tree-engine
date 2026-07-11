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

import type { DynamicScene } from "@com.mgmtp.a12.client/client-core";

import { viewNGComponents } from "../viewNGComponents.js";

import {
	A12_TEAMS_DESCRIPTOR,
	A12_TEAMS_CUSTOM_VIEW_DESCRIPTOR,
	DOMAIN_TEAM_DESCRIPTOR,
	DOMAIN_PERSON_DESCRIPTOR,
	A12_TEAMS_PAGINATION_DESCRIPTOR,
	A12_TEAMS_MULTI_LEVEL_DESCRIPTOR
} from "./descriptors.js";

const { TreeCRUD, CustomA12TeamTreeEngine, FormCRUD, OverviewCRUD } = viewNGComponents;

export const scenes: DynamicScene[] = [
	{
		name: "a12-teams-tree",
		matches: (d) => d.model === A12_TEAMS_DESCRIPTOR.model && !d.view,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "a12-teams-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "a12-teams-tree-custom",
		matches: (d) =>
			d.model === A12_TEAMS_CUSTOM_VIEW_DESCRIPTOR.model && d.view === A12_TEAMS_CUSTOM_VIEW_DESCRIPTOR.view,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: CustomA12TeamTreeEngine,
					models: [
						{
							modelType: "tree",
							name: "custom-a12-teams-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "a12-team-child-relationship-editor",
		matches: (d) => d.model === DOMAIN_TEAM_DESCRIPTOR.model && d.engine === "relationship" && !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/MODAL",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "A12TeamsStandaloneRelationshipEngine"
						}
					]
				}
			]
		}
	},
	{
		name: "Team-overview",
		matches: (d) => d.model === DOMAIN_TEAM_DESCRIPTOR.model && !d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: OverviewCRUD,
					models: [
						{
							modelType: "overview",
							name: "Team-overview"
						}
					]
				}
			]
		}
	},
	{
		name: "Team",
		matches: (d) => d.model === DOMAIN_TEAM_DESCRIPTOR.model && !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "Team"
						}
					]
				}
			]
		}
	},
	{
		name: "Person-overview",
		matches: (d) => d.model === DOMAIN_PERSON_DESCRIPTOR.model && !d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: OverviewCRUD,
					models: [
						{
							modelType: "overview",
							name: "Person-overview"
						}
					]
				}
			]
		}
	},
	{
		name: "Person",
		matches: (d) => d.model === DOMAIN_PERSON_DESCRIPTOR.model && !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "Person"
						}
					]
				}
			]
		}
	},
	{
		name: "TeamPerson_LinkForm",
		matches: (d) => d.model === "DomainTeamPerson_AdditionalFieldsModel" && !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					component: FormCRUD,
					region: "/MODAL",
					models: [
						{
							modelType: "form",
							name: "TeamPerson_LinkForm"
						}
					]
				}
			]
		}
	},
	{
		name: "a12-teams-tree-pagination",
		matches: (d) => d.model === A12_TEAMS_PAGINATION_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "a12-teams-tree-pagination"
						}
					]
				}
			]
		}
	},
	{
		name: "a12-teams-tree-multi-level",
		matches: (d) => d.model === A12_TEAMS_MULTI_LEVEL_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "a12-teams-tree-multi-level"
						}
					]
				}
			]
		}
	},
	{
		name: "Location",
		matches: (d) => d.model === "DomainLocation" && !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					models: [
						{
							modelType: "form",
							name: "Location"
						}
					],
					component: FormCRUD
				}
			]
		}
	}
];
