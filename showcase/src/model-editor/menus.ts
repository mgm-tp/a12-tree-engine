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
	FILES_TREE_DESCRIPTOR,
	PAGINATED_TREE_DESCRIPTOR,
	MULTISELECT_PARENT_TREE_DESCRIPTOR,
	MULTI_LEVEL_TREE_DESCRIPTOR,
	GROUPS_TREE_DESCRIPTOR,
	PRELOAD_ABSTRACT_SUPERTYPE_TREE_DESCRIPTOR
} from "./descriptors.js";

const onClickFilesTree = onClickFor(FILES_TREE_DESCRIPTOR);
const onClickPaginatedTree = onClickFor(PAGINATED_TREE_DESCRIPTOR);
const onClickMultiselectParentTree = onClickFor(MULTISELECT_PARENT_TREE_DESCRIPTOR);
const onClickMultiLevelTree = onClickFor(MULTI_LEVEL_TREE_DESCRIPTOR);
const onClickGroupsTree = onClickFor(GROUPS_TREE_DESCRIPTOR);
const onClickPreloadAbstractSuperTypeTree = onClickFor(PRELOAD_ABSTRACT_SUPERTYPE_TREE_DESCRIPTOR);

export const menus: Selector<DynamicMenu[]> = (state) => {
	const filesTreeActivity = ActivitySelectors.activitiesByDescriptor(FILES_TREE_DESCRIPTOR)(state).at(0);
	const paginatedTreeActivity = ActivitySelectors.activitiesByDescriptor(PAGINATED_TREE_DESCRIPTOR)(state).at(0);
	const multiselectParentTreeActivity = ActivitySelectors.activitiesByDescriptor(MULTISELECT_PARENT_TREE_DESCRIPTOR)(
		state
	).at(0);
	const multiLevelTreeActivity = ActivitySelectors.activitiesByDescriptor(MULTI_LEVEL_TREE_DESCRIPTOR)(state).at(0);
	const groupsTreeActivity = ActivitySelectors.activitiesByDescriptor(GROUPS_TREE_DESCRIPTOR)(state).at(0);
	const preloadAbstractSuperTypeTreeActivity = ActivitySelectors.activitiesByDescriptor(
		PRELOAD_ABSTRACT_SUPERTYPE_TREE_DESCRIPTOR
	)(state).at(0);

	return [
		{
			id: "ModelEditor",
			label: { key: "application.menu.modelEditor.label" },
			children: [
				{
					id: "FileExplorer",
					label: { key: "application.menu.modelEditor.fileExplorer" },
					selected: filesTreeActivity !== undefined,
					action: onClickFilesTree
				},
				{
					id: "PaginatedFileExplorer",
					label: { key: "application.menu.modelEditor.paginatedFileExplorer" },
					selected: paginatedTreeActivity !== undefined,
					action: onClickPaginatedTree
				},
				{
					id: "MultiSelectParentFileExplorer",
					label: { key: "application.menu.modelEditor.multiSelectParentFileExplorer" },
					selected: multiselectParentTreeActivity !== undefined,
					action: onClickMultiselectParentTree
				},
				{
					id: "FileExplorerMultiLevelTree",
					label: { key: "application.menu.modelEditor.fileExplorerMultiLevelTree" },
					selected: multiLevelTreeActivity !== undefined,
					action: onClickMultiLevelTree
				},
				{
					id: "GroupManagement",
					label: { key: "application.menu.modelEditor.groupManagement" },
					selected: groupsTreeActivity !== undefined,
					action: onClickGroupsTree
				},
				{
					id: "FileExplorerWithPreloadChildNodes",
					label: { key: "application.menu.modelEditor.fileExplorerWithPreloadChildNodes" },
					selected: preloadAbstractSuperTypeTreeActivity !== undefined,
					action: onClickPreloadAbstractSuperTypeTree
				}
			]
		}
	];
};
