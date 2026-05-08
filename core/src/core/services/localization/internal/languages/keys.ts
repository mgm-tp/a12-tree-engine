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

import { initializeKeys } from "@com.mgmtp.a12.utils/utils-localization";

// prettier-ignore
export const RESOURCE_KEYS = {
	/** Key of the text used for boolean value true */
	"true": "",
	/** Key of the text used for boolean value false */
	"false": "",
	/** Key of the text used for value null */
	"null": "",
	"attachment-handler": {
		"error": {
			/** Key of an unknown error */
			"unknown": "",
			/** Key of an internal error */
			"internal": "",
			/** Key of an error which occurred during the cancellation of an upload */
			"abort": "",
			/** Key of an error if the attachment cannot be found */
			"not-found": "",
			/** Key of an error if a security issue occurred */
			"security": "",
			/** Key of an error if the preview cannot be found */
			"no-preview": "",
			/** Key of an error if the file is invalid */
			"invalid-file": "",
			/** Key of an error if no handler can be found */
			"no-handler": ""
		}
	},
	"treeEngine": {
		"notification": {
			"title": {
				/** Key of title for notification in case error */
				"error": "",
				/** Key of title for notification in case warning */
				"warning": "",
			},
			"message": {
				/** Key of message for notification in case error about drag a node in a cycle, and make it root */
				"moveFromCycleToRootError": "",
				"reorderRootNodeError": "",
				"unavailableNodeShortcut": "",
				"unavailableEngineShortcut": ""
			}
		},
		"error": {
			"requestLimitExceeded": {
				"title": "",
				"message": ""
			}
		},
		"dialog": {
			"delete":{
				"button": {
					"delete": "",
					"cancel": ""
				}
			},
			"confirmation": {
				"button": {
					/** Key of the text for button confirm */
					"confirm": "",
					/** Key of the text for button close */
					"close": ""
				}
			},
			"insertion": {
				"root": {
					/** Key of heading for root node insertion dialog */
					"heading": "",
				},
				"child": {
					/** Key of heading for child node insertion dialog */
					"heading": "",
				},
				"sibling": {
					/** Key of heading for sibling node insertion dialog */
					"heading": "",
				}
			},
			/** Key of message for making root dialog */
			"makeRootNode": {
				"title": "",
				"message": ""
			},
			"clearMultiSelection": {
				"title": "",
				"message": "",
				"button": {
					"clearSelection": "",
					"cancel": ""
				}
			}
		},
		"wholeTreeExpansion": {
			"expandAll": "",
			"collapseAll": ""
		},
		"multiSelection": {
			"multiSelectionButton": {
				"expandTitle": "",
				"collapseTitle": "",
			},
			"overallCheckboxTitle": "",
			"rowCheckboxTitle": "",
			"summary": ""
		},
		"circularWarning": "",
		"initialView": {
			"message": "",
			"addButton": {
				"label": ""
			}
		},
		"pagination": {
			"loadMore": "",
			"loadMoreTitle": "",
			"loadMoreForRootTitle":"",
			"loadAll": "",
			"loadAllTitle": "",
			"loadAllForRootTitle": "",
			"belongsTo": "",
			"belongsToRoot": ""
		},
	}
};

initializeKeys(RESOURCE_KEYS);
