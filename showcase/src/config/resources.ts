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

import { cloneDeep } from "lodash-es";

import {
	initializeKeys,
	type LocalizationTree,
	type LocalizationTreeMap
} from "@com.mgmtp.a12.utils/utils-localization";

const enResourceTree = {
	application: {
		title: "Tree Engine Showcase"
	},
	server: {
		connection: {
			failed: "Bad server connection!"
		}
	},
	warning: "Warning",

	treeEngine: {
		dialog: {
			makeRootNode: {
				title: "Move node confirmation"
			}
		}
	},

	showcase: {
		error: {
			server: {
				title: "Error",
				message: "Something went wrong!",
				link_validation: {
					description: "$message$"
				}
			}
		},
		multiSelection: {
			buttonEvent: {
				title: "$eventName$ Event",
				message: "Performed $eventName$ event with $numberOfNodes$ selected node(s)"
			}
		},
		a12Teams: {
			customRowAction: {
				selectPerson: {
					title: "You've just select a Person",
					message:
						'This is a Custom Row Action with event "selectPerson". If you want to edit this person, please click button Edit.'
				}
			}
		},
		button: {
			pasteFromClipboard: "Perform action Paste from Clipboard.",
			eventEngineEdit: {
				title: "You've just triggered an custom engine action",
				message: "Perform the event engine action named 'event_engine_edit'"
			}
		},
		keyboardShortcut: {
			nodeTarget: {
				eventDeleteLink: {
					unavailable: "Can not delete link for this node"
				},
				eventInfo: {
					unavailable: 'Can not reveal information about node "$nodeName$"'
				}
			},
			engineTarget: {
				eventCopyNodes: {
					unavailable: "Please select some nodes before copying"
				},
				eventPaste: {
					unavailable: "$selectedNodes$ selected node(s) are not allowed to paste at root level"
				}
			}
		}
	}
};

const deResourceTree: LocalizationTree = {
	showcase: {
		error: {
			server: {
				title: "Fehler"
			}
		}
	}
};

export const SHOWCASE_RESOURCES: LocalizationTreeMap = { en: enResourceTree, de: deResourceTree };

export const SHOWCASE_RESOURCE_KEYS = cloneDeep(enResourceTree);

initializeKeys(SHOWCASE_RESOURCE_KEYS);
