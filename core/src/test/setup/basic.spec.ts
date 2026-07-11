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

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { type ModelGraph, Relationship, type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { type RuntimeTreeModel, TreeModel } from "../../core/models/index.js";
import type { TreeEngineState } from "../../core/store/index.js";
import {
	DefaultComponentMap,
	defaultMapDispatchToEventHandlers,
	DefaultWidgetMap,
	type EventHandlersDispatchMap,
	type TreeEngineContextProvider
} from "../../core/view/index.js";

import { mockType } from "../utils/mock-utils.js";

import { createDocumentModel, PATH } from "./utils.js";

export const enLocale: Locale = { language: "en", country: "US" };
export const deLocale: Locale = { language: "de", country: "DE" };

export const defaultRoot: TreeEngineState.Root = {
	children: [
		{
			id: "DomainTeam/1",
			type: "DomainTeam"
		},
		{
			id: "DomainTeam/2",
			type: "DomainTeam"
		},
		{
			id: "DomainTeam/3",
			type: "DomainTeam"
		}
	]
};

export const data: {
	readonly [type: string]: TreeEngineState.NodeMap<TreeEngineState.Node | TreeEngineState.Link> | undefined;
} = {
	DomainTeam: {
		"DomainTeam/1": {
			identifier: {
				id: "DomainTeam/1",
				type: "DomainTeam"
			},
			document: {
				id: "4",
				TeamDetails: {
					TeamName: "A12"
				}
			},
			children: []
		},
		"DomainTeam/2": {
			identifier: {
				id: "DomainTeam/2",
				type: "DomainTeam"
			},
			document: {
				id: "5",
				TeamDetails: {
					TeamName: "Development"
				}
			},
			children: [
				{
					type: "TeamPerson",
					id: "167"
				},
				{
					type: "TeamPerson",
					id: "166"
				}
			]
		},
		"DomainTeam/3": {
			identifier: {
				id: "DomainTeam/3",
				type: "DomainTeam"
			},
			document: {
				id: "6",
				TeamDetails: {
					TeamName: "UP"
				}
			},
			children: []
		}
	},
	DomainPerson: {
		"DomainPerson/166": {
			identifier: {
				id: "DomainPerson/166",
				type: "DomainPerson"
			},
			document: {
				Person: {
					PersonalData: {
						FirstName: "Person 1"
					}
				}
			},
			children: []
		},
		"DomainPerson/164": {
			identifier: {
				id: "DomainPerson/164",
				type: "DomainPerson"
			},
			document: {
				Person: {
					PersonalData: {
						FirstName: "Person 2"
					}
				}
			},
			children: []
		}
	},
	TeamPerson: {
		"166": {
			identifier: {
				type: "TeamPerson",
				id: "166"
			},
			linkRef: {
				linkDescriptor: {
					relationshipModel: "TeamPerson",
					entities: [
						{
							role: "Team",
							docRef: "DomainTeam/2",
							modelName: "DomainTeam"
						},
						{
							role: "Person",
							docRef: "DomainPerson/164",
							modelName: "DomainPerson"
						}
					],
					predecessorLinkRef: null,
					position: Relationship.LinkPosition.TOP
				},
				id: "166"
			}
		},
		"167": {
			identifier: {
				type: "TeamPerson",
				id: "167"
			},
			linkRef: {
				linkDescriptor: {
					relationshipModel: "TeamPerson",
					entities: [
						{
							role: "Team",
							docRef: "DomainTeam/2",
							modelName: "DomainTeam"
						},
						{
							role: "Person",
							docRef: "DomainPerson/166",
							modelName: "DomainPerson"
						}
					],
					predecessorLinkRef: null,
					position: Relationship.LinkPosition.TOP
				},
				id: "167"
			}
		}
	}
};

const DOCUMENT_MODEL_NAMES = ["DomainTeamPerson_AdditionalFieldsModel", "DomainTeam", "DomainPerson"];

export const uiModel: RuntimeTreeModel = {
	header: {
		id: "a12-teams-tree",
		modelType: "tree",
		modelVersion: "2.0.0-alpha.5",
		locales: [
			{
				code: "en"
			},
			{
				code: "de"
			}
		],
		modelReferences: [
			{
				purpose: "document-model-for-tree",
				modelType: "document",
				alias: "DM1",
				reference: "DomainTeam"
			},
			{
				purpose: "document-model-for-tree",
				modelType: "document",
				alias: "DM2",
				reference: "DomainPerson"
			},
			{
				purpose: "relationship-model-for-tree",
				modelType: "relationship",
				alias: "RM1",
				reference: "TeamPerson"
			},
			{
				purpose: "relationship-model-for-tree",
				modelType: "relationship",
				alias: "RM2",
				reference: "TeamTeam"
			}
		]
	},
	content: {
		subHeaderBox: {
			rightSlot: [],
			leftSlot: []
		},
		footerBox: {
			rightSlot: [
				{
					type: TreeModel.ElementType.BUTTON,
					icon: {
						name: "autorenew"
					},
					id: "button-ec3fb",
					event: "event_renew",
					primary: false
				}
			],
			leftSlot: []
		},
		configuration: {
			rootRef: "crc-cfae1d",
			hierarchicalColumnRef: "column-23eade",
			expansionStrategy: { type: "level_by_level" },
			dnd: {
				onDrag: {
					expandHoveredNode: true
				}
			},
			root: {
				parentRole: "Parent",
				relationshipModelRef: "TeamTeam",
				documentModelRef: "DomainTeam"
			}
		},
		columns: [
			{
				id: "column-d29e42",
				name: "Photo",
				label: [
					{
						locale: "en",
						text: "Photo"
					},
					{
						locale: "de",
						text: "Foto"
					}
				],
				width: 0.5,
				fixedWidth: false,
				pinDirection: TreeModel.PinDirection.LEFT
			},
			{
				id: "column-23eade",
				name: "Name",
				label: [
					{
						locale: "en",
						text: "Name"
					},
					{
						locale: "de",
						text: "Name"
					}
				],
				width: 2.5,
				fixedWidth: true
			},
			{
				id: "column-esd312",
				name: "Position",
				label: [
					{
						locale: "en",
						text: "Position"
					},
					{
						locale: "de",
						text: "Position"
					}
				],
				width: 1,
				fixedWidth: false
			},
			{
				id: "column-2d231s",
				name: "Location",
				label: [
					{
						locale: "en",
						text: "Location"
					},
					{
						locale: "de",
						text: "Lage"
					}
				],
				width: 1,
				fixedWidth: false
			},
			{
				label: [
					{
						locale: "en",
						text: "Expertise"
					},
					{
						locale: "de",
						text: "Sachverstand"
					}
				],
				width: 1,
				fixedWidth: false,
				id: "column-def67",
				name: "Expertise"
			}
		],
		nodes: [
			{
				id: "node-12feda",
				documentModelRef: "DomainTeam",
				columns: [
					{
						columnRef: "column-23eade",
						elementRef: "field_c9ad3",
						elementPath: [
							{
								elementName: "TeamDetails"
							},
							{
								elementName: "TeamName"
							}
						]
					},
					{
						columnRef: "column-2d231s",
						elementRef: "field_c2497",
						elementPath: [
							{
								elementName: "TeamDetails"
							},
							{
								elementName: "Location"
							}
						]
					}
				],
				childRelationshipConfigurations: [
					{
						id: "crc-d29e42",
						relationshipModelRef: "TeamPerson",
						parentRole: "Team",
						columns: [
							{
								columnRef: "column-esd312",
								elementRef: "field_04443",
								elementPath: [
									{
										elementName: "grp1"
									},
									{
										elementName: "Position"
									}
								]
							}
						]
					},
					{
						id: "crc-cfae1d",
						relationshipModelRef: "TeamTeam",
						parentRole: "Parent"
					}
				],
				icon: {
					name: "supervisor_account"
				},
				actions: [],
				configuration: {
					dnd: true
				}
			},
			{
				id: "node-3d8f9s",
				documentModelRef: "DomainPerson",
				columns: [
					{
						columnRef: "column-d29e42",
						elementRef: "group_05909",
						elementPath: [
							{
								elementName: "Person"
							},
							{
								elementName: "PersonalData"
							},
							{
								elementName: "Photo"
							}
						]
					},
					{
						columnRef: "column-23eade",
						elementRef: "F3",
						elementPath: [
							{
								elementName: "Person"
							},
							{
								elementName: "PersonalData"
							},
							{
								elementName: "FirstName"
							}
						]
					},
					{
						columnRef: "column-def67",
						elementRef: "group_03437",
						elementPath: [
							{
								elementName: "Person"
							},
							{
								elementName: "PersonalData"
							},
							{
								elementName: "Expertise"
							}
						]
					}
				],
				childRelationshipConfigurations: [],
				actions: [],
				configuration: {
					dnd: true
				}
			}
		]
	}
};

export const defaultRelationshipModels: RelationshipModel[] = [
	{
		header: {
			id: "TeamPerson",
			modelType: "relationship",
			modelVersion: "2.0.0",
			locales: [
				{
					code: "en"
				},
				{
					code: "de"
				}
			],
			labels: [],
			modelReferences: [
				{
					purpose: "Document model",
					modelType: "document",
					alias: "Team",
					reference: "DomainTeam"
				},
				{
					purpose: "Document model",
					modelType: "document",
					alias: "Person",
					reference: "DomainPerson"
				},
				{
					purpose: "Link Document model",
					modelType: "document",
					alias: "Link Model",
					reference: "DomainTeamPerson_AdditionalFieldsModel"
				}
			],
			annotations: [
				{
					name: "roles",
					value: "admin"
				}
			]
		},
		content: {
			labels: [],
			linkDocumentModel: "DomainTeamPerson_AdditionalFieldsModel",
			duplicatesAllowed: false,
			entityCharacteristics: [
				{
					role: "Team",
					labels: [
						{
							locale: "en",
							text: "belongs to teams"
						},
						{
							locale: "de",
							text: "gehört zu Teams"
						}
					],
					documentModel: "DomainTeam",
					ordered: true,
					linkConstraints: {
						multiplicity: {
							unbounded: true,
							upperLimit: null
						}
					}
				},
				{
					role: "Person",
					labels: [
						{
							locale: "en",
							text: "Team members"
						},
						{
							locale: "de",
							text: "Teammitglieder"
						}
					],
					documentModel: "DomainPerson",
					ordered: true,
					linkConstraints: {
						multiplicity: {
							unbounded: true,
							upperLimit: null
						}
					}
				}
			]
		}
	},
	{
		header: {
			id: "TeamTeam",
			modelType: "relationship",
			modelVersion: "2.0.0",
			locales: [
				{
					code: "en"
				},
				{
					code: "de"
				}
			],
			labels: [],
			modelReferences: [
				{
					purpose: "Document model",
					modelType: "document",
					alias: "Parent",
					reference: "DomainTeam"
				},
				{
					purpose: "Document model",
					modelType: "document",
					alias: "Child",
					reference: "DomainTeam"
				}
			],
			annotations: [
				{
					name: "roles",
					value: "admin"
				}
			]
		},
		content: {
			labels: [],
			linkDocumentModel: null,
			duplicatesAllowed: false,
			entityCharacteristics: [
				{
					role: "Parent",
					labels: [
						{
							locale: "en",
							text: "belongs to"
						},
						{
							locale: "de",
							text: "gehört"
						}
					],
					documentModel: "DomainTeam",
					ordered: true,
					linkConstraints: {
						multiplicity: {
							unbounded: false,
							upperLimit: 1
						}
					}
				},
				{
					role: "Child",
					labels: [
						{
							locale: "en",
							text: "Sub teams"
						},
						{
							locale: "de",
							text: "Subteams"
						}
					],
					documentModel: "DomainTeam",
					ordered: true,
					linkConstraints: {
						multiplicity: {
							unbounded: true,
							upperLimit: null
						}
					}
				}
			]
		}
	}
];

export const defaultEngineState: TreeEngineState = {
	root: defaultRoot,
	data,
	models: {
		documentModels: DOCUMENT_MODEL_NAMES.map((modelName) =>
			createDocumentModel(Path.join(PATH.MODELS, "a12-teams", "document-models", modelName))
		),
		uiModel,
		modelGraph: mockType<ModelGraph>({
			documentModels: [
				{
					modelId: "DomainTeam",
					relations: ["TeamPerson", "TeamTeam"],
					subTypes: [],
					abstractModel: false
				},
				{
					modelId: "DomainPerson",
					relations: ["TeamPerson"],
					subTypes: [],
					abstractModel: false
				}
			],
			relationshipModels: defaultRelationshipModels
		})
	},
	expandedNodes: {},
	matchedNodes: {},
	query: "",
	selectedNodes: {},
	busyNodes: {},
	dialog: null,
	expandedMultiSelectionPanel: false,
	multiSelectionNodes: {},
	multiSelectionActions: [],
	pageSizeMap: {},
	clipboard: null,
	disabled: false
};

export interface PartialEventHandlerContextProps extends Omit<TreeEngineContextProvider.Props, "eventHandlers"> {
	eventHandlers: Partial<EventHandlersDispatchMap>;
}

export function createContextProps(
	customEngineState = defaultEngineState,
	customContextProp?: Partial<PartialEventHandlerContextProps>
): TreeEngineContextProvider.Props {
	const eventHandlers = {
		...defaultMapDispatchToEventHandlers((anyAction) => anyAction),
		...customContextProp?.eventHandlers
	};

	return {
		state: customEngineState,

		componentMap: DefaultComponentMap,
		widgetMap: DefaultWidgetMap,

		...customContextProp,
		eventHandlers
	};
}
