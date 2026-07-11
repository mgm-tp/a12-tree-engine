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

import type { RESOURCE_KEYS } from "./keys.js";

// prettier-ignore
export const en: typeof RESOURCE_KEYS = {
	"true": "yes",
	"false": "no",
	"null": "",
	"attachment-handler": {
		"error": {
			"unknown": "An unknown error occurred.",
			"internal": "An internal error occurred.",
			"abort": "An error occurred during the cancellation.",
			"not-found": "The selected file cannot be found any longer.",
			"security": "No access to the selected file.",
			"no-preview": "A preview does not exist.",
			"invalid-file": "The last given file could not be processed.",
			"no-handler": "No AttachmentHandler was defined."
		}
	},
	"treeEngine": {
		"error": {
			"requestLimitExceeded": {
				"title": "Cannot Load Tree",
				"message": "Request limit exceeded. Maximum allowed is $limit$. Increase the maximum number of method calls per RPC request."
			},
			"pageSizeLimitExceeded": {
				"title": "Cannot Load Tree",
				"message": "Maximum number of root nodes exceeded. Maximum allowed is $limit$. Increase the maximum page size limit."
			}
		},
		"notification": {
			"title": {
				"error": "Error",
				"warning": "Warning",
			},
			"message": {
				"moveFromCycleToRootError": "Cannot move a node from a cycle and make it a root",
				"reorderRootNodeError": "Cannot reorder the root nodes.",
				"unavailableNodeShortcut": "This action cannot be executed for this node.",
				"unavailableEngineShortcut": "This action cannot be executed."
			}
		},
		"dialog": {
			"delete":{
				"button": {
					"delete": "Delete",
					"cancel": "Cancel"
				}
			},
			"confirmation": {
				"button": {
					"confirm": "Confirm",
					"close": "Close"
				},
			},
			"insertion": {
				"root": {
					/** Key of heading for root node insertion dialog */
					"heading": "Please select a root document model"
				},
				"child": {
					/** Key of heading for child node insertion dialog */
					"heading": "Please select a child document model",
				},
				"sibling": {
					/** Key of heading for sibling node insertion dialog */
					"heading": "Please select a sibling document model",
				}
			},
			"makeRootNode": {
				"title": "Confirmation",
				"message": `Do you really want to set node "$node$" as a root? This will completely remove $linksCount$ link(s) between this node and its parents.`
			},
			"clearMultiSelection": {
				"title": "Warning",
				"message": "If you collapse the multi-selection panel, all selected documents will be cleared. Do you want to continue?",
				"button": {
					"clearSelection": "Clear selection",
					"cancel": "Cancel"
				}
			},
		},
		"wholeTreeExpansion": {
			"expandAll": "Expand All",
			"collapseAll": "Collapse All"
		},
		"multiSelection": {
			"multiSelectionButton": {
				"expandTitle": "Expand functions for bulk operation",
				"collapseTitle": "Collapse functions for bulk operation",
			},
			"overallCheckboxTitle": "De/Select all",
			"rowCheckboxTitle": "Select",
			"summary": "$amount$ nodes"
		},
		"circularWarning": "Circular link structures detected, certain features will be disabled on repeated nodes.",
		"initialView": {
			"message": "Add a new element to the tree.",
			"addButton": {
				"label": "Add"
			}
		},
		"pagination": {
			"loadMore": "Load more",
			"loadMoreTitle": "Load more for $node$",
			"loadMoreForRootTitle": "Load more for root",
			"loadAll": "Load all $amount$ nodes",
			"loadAllTitle": "Load all for $node$",
			"loadAllForRootTitle": "Load all for root",
			"belongsTo": "Pagination, belongs to $node$",
			"belongsToRoot": "Pagination, belongs to root"
		}
	}
};
