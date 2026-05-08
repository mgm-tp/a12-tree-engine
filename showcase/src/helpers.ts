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

export function assert(condition: unknown, onFailedMessage = "Condition return a falsely value."): asserts condition {
	if (!condition) {
		throw new Error(onFailedMessage);
	}
}

export const BACK_ENGINE_EVENT = "event_engine_back";
export const EDIT_ENGINE_EVENT = "event_engine_edit";
export const RELOAD_NODES_ENGINE_EVENT = "event_engine_reload_nodes";

export const INFO_NODE_EVENT = "event_node_info";
export const EDIT_NODE_EVENT = "event_node_edit";
export const RELOAD_NODE_EVENT = "event_node_reload";
export const OPEN_DM_NODE_EVENT = "event_node_open_dm";
export const OPEN_DM_NODE_MULTI_LEVEL_EVENT = "event_node_open_dm_with_multi_level";
export const OPEN_DM_PAGINATED_NODE_EVENT = "event_node_open_paginated_dm";
export const OPEN_FM_NODE_EVENT = "event_node_open_fm";
export const REVEAL_TARGET_NODE_EVENT = "event_node_reveal_target";
export const REVEAL_TARGET_NODE_EVENT_NO_AUTOFOCUS = "event_node_reveal_target_no_focus";
export const MARK_AS_TARGET_NODE_EVENT = "event_node_mark_as_target";
export const OPEN_DM_WITH_REPLACEMENT_NODE_EVENT = "event_node_open_dm_with_replacement";
export const OPEN_DM_WITH_TEMPORARY_REPLACEMENT_NODE_EVENT = "event_node_open_dm_with_temporary_replacement";
export const OPEN_DM_NODE_NON_VIRTUAL_ROOT_EVENT = "event_node_open_dm_non_virtual_root";
export const OPEN_DM_NODE_SELECT_PARENT = "event_node_open_dm_select_parent";
export const OPEN_DM_NODE_EVENT_TWIN = "event_node_open_dm_twin";

export const RELOAD_LEVEL_0 = "event_reload_level_0";
export const RELOAD_LEVEL_1 = "event_reload_level_1";
export const RELOAD_LEVEL_2 = "event_reload_level_2";
export const RELOAD_WHOLE_TREE = "event_reload_whole_tree";
