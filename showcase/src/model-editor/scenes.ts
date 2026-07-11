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
	FILES_TREE_DESCRIPTOR,
	MULTI_LEVEL_TREE_DESCRIPTOR,
	PAGINATED_TREE_DESCRIPTOR,
	MULTISELECT_PARENT_TREE_DESCRIPTOR,
	GROUPS_TREE_DESCRIPTOR,
	PRELOAD_ABSTRACT_SUPERTYPE_TREE_DESCRIPTOR
} from "./descriptors.js";

const { TreeCRUD, FormCRUD, FileExplorerTreeEngine, ModelEditorTreeEngine, TreeCRUDTwin } = viewNGComponents;

export const scenes: DynamicScene[] = [
	{
		name: "FileSystemTree",
		matches: (d) => d.model === FILES_TREE_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FileExplorerTreeEngine,
					models: [
						{
							modelType: "tree",
							name: "file-explorer-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "FileSystemForm",
		priorScene: "FileSystemTree",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "form",
							name: "Computer",
							documentModel: "DomainComputer"
						},
						{
							modelType: "form",
							name: "Drive",
							documentModel: "DomainDrive"
						},
						{
							modelType: "form",
							name: "Directory",
							documentModel: "DomainDirectory"
						},
						{
							modelType: "form",
							name: "File",
							documentModel: "DomainFile"
						}
					]
				}
			]
		}
	},
	{
		name: "FileSystemMultiLevelTree",
		matches: (d) => d.model === MULTI_LEVEL_TREE_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FileExplorerTreeEngine,
					models: [
						{
							modelType: "tree",
							name: "file-explorer-multi-level-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "FileSystemFormMultiLevel",
		priorScene: "FileSystemMultiLevelTree",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "form",
							name: "Computer",
							documentModel: "DomainComputer"
						},
						{
							modelType: "form",
							name: "Drive",
							documentModel: "DomainDrive"
						},
						{
							modelType: "form",
							name: "Directory",
							documentModel: "DomainDirectory"
						},
						{
							modelType: "form",
							name: "File",
							documentModel: "DomainFile"
						}
					]
				}
			]
		}
	},
	{
		name: "FileSystemPaginatedTree",
		matches: (d) => d.model === PAGINATED_TREE_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FileExplorerTreeEngine,
					models: [
						{
							modelType: "tree",
							name: "file-explorer-paginated-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "FileSystemPaginatedForm",
		priorScene: "FileSystemPaginatedTree",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "form",
							name: "Computer",
							documentModel: "DomainComputerPagination"
						},
						{
							modelType: "form",
							name: "Drive",
							documentModel: "DomainDrive"
						},
						{
							modelType: "form",
							name: "Directory",
							documentModel: "DomainDirectory"
						},
						{
							modelType: "form",
							name: "File",
							documentModel: "DomainFile"
						}
					]
				}
			]
		}
	},
	{
		name: "FileSystemMultiSelectParentTree",
		matches: (d) => d.model === MULTISELECT_PARENT_TREE_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FileExplorerTreeEngine,
					models: [
						{
							modelType: "tree",
							name: "file-explorer-multiselect-parent-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "FileSystemMultiSelectParentForm",
		priorScene: "FileSystemMultiSelectParentTree",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "form",
							name: "Computer",
							documentModel: "DomainComputerPagination"
						},
						{
							modelType: "form",
							name: "Drive",
							documentModel: "DomainDrive"
						},
						{
							modelType: "form",
							name: "Directory",
							documentModel: "DomainDirectory"
						},
						{
							modelType: "form",
							name: "File",
							documentModel: "DomainFile"
						}
					]
				}
			]
		}
	},
	{
		name: "DocumentModelFileTree",
		matches: (d) => d.model === "data-modeler-tree",
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: ModelEditorTreeEngine,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "tree",
							name: "data-modeler-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "DocumentModelFileMultiLevelTree",
		matches: (d) => d.model === "data-modeler-tree-multi-level",
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: ModelEditorTreeEngine,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "tree",
							name: "data-modeler-tree-multi-level"
						}
					]
				}
			]
		}
	},
	{
		name: "PaginatedDocumentModelFileTree",
		matches: (d) => d.model === "paginated-data-modeler-tree",
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: ModelEditorTreeEngine,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "tree",
							name: "paginated-data-modeler-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "DocumentModelFileForm",
		priorScene: "DocumentModelFileTree",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "form",
							name: "Group",
							documentModel: "DomainGroup"
						},
						{
							modelType: "form",
							name: "AttachmentGroup",
							documentModel: "DomainAttachmentGroup"
						},
						{
							modelType: "form",
							name: "MultiSelectGroup",
							documentModel: "DomainMultiSelectGroup"
						},
						{
							modelType: "form",
							name: "Field",
							documentModel: "DomainField"
						},
						{
							modelType: "form",
							name: "Rule",
							documentModel: "DomainRule"
						}
					]
				}
			]
		}
	},
	{
		name: "GroupManagementTree",
		matches: (d) => d.model === GROUPS_TREE_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "data-modeler-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "GroupManagementForm",
		priorScene: "GroupManagementTree",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "form",
							name: "Group",
							documentModel: "DomainGroup-GM"
						},
						{
							modelType: "form",
							name: "AttachmentGroup",
							documentModel: "DomainAttachmentGroup-GM"
						},
						{
							modelType: "form",
							name: "MultiSelectGroup",
							documentModel: "DomainMultiSelectGroup-GM"
						},
						{
							modelType: "form",
							name: "Field",
							documentModel: "DomainField"
						},
						{
							modelType: "form",
							name: "Rule",
							documentModel: "DomainRule"
						}
					]
				}
			]
		}
	},
	{
		name: "DocumentModelFileTreeNonVirtualRoot",
		matches: (d) => d.model === "non-virtual-root-data-modeler-tree",
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: ModelEditorTreeEngine,
					models: [
						{
							modelType: "tree",
							name: "non-virtual-root-data-modeler-tree"
						}
					],
					constraints: {
						type: "MasterDetail"
					}
				}
			]
		}
	},
	{
		name: "DocumentModelFileTreeNonVirtualRootForm",
		priorScene: "DocumentModelFileTreeNonVirtualRoot",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "Group",
							documentModel: "DomainGroup"
						},
						{
							modelType: "form",
							name: "AttachmentGroup",
							documentModel: "DomainAttachmentGroup"
						},
						{
							modelType: "form",
							name: "MultiSelectGroup",
							documentModel: "DomainMultiSelectGroup"
						},
						{
							modelType: "form",
							name: "Field",
							documentModel: "DomainField"
						},
						{
							modelType: "form",
							name: "Rule",
							documentModel: "DomainRule"
						}
					],
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					}
				}
			]
		}
	},
	{
		name: "FormModelFileTree",
		matches: (d) => d.model === "form-modeler-tree",
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: ModelEditorTreeEngine,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "tree",
							name: "form-modeler-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "FormModelFileForm",
		priorScene: "FormModelFileTree",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "form",
							name: "Screen",
							documentModel: "DomainScreen"
						},
						{
							modelType: "form",
							name: "DetachedRepeat",
							documentModel: "DomainDetachedRepeat"
						},
						{
							modelType: "form",
							name: "InlineRepeat",
							documentModel: "DomainInlineRepeat"
						}
					]
				}
			]
		}
	},
	{
		name: "GroupManagementTreeTwin",
		matches: (d) => d.model === "groups-tree-twin",
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUDTwin,
					models: [
						{
							modelType: "tree",
							name: "data-modeler-tree"
						}
					],
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					}
				}
			]
		}
	},
	{
		name: "GroupManagementTreeTwinForm",
		priorScene: "GroupManagementTreeTwin",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "form",
							name: "Group",
							documentModel: "DomainGroup"
						},
						{
							modelType: "form",
							name: "AttachmentGroup",
							documentModel: "DomainAttachmentGroup"
						},
						{
							modelType: "form",
							name: "MultiSelectGroup",
							documentModel: "DomainMultiSelectGroup"
						},
						{
							modelType: "form",
							name: "Field",
							documentModel: "DomainField"
						},
						{
							modelType: "form",
							name: "Rule",
							documentModel: "DomainRule"
						}
					]
				}
			]
		}
	},
	{
		name: "PaginatedDMElementForm",
		priorScene: "PaginatedDocumentModelFileTree",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					},
					models: [
						{
							modelType: "form",
							name: "Group",
							documentModel: "DomainGroup"
						},
						{
							modelType: "form",
							name: "AttachmentGroup",
							documentModel: "DomainAttachmentGroup"
						},
						{
							modelType: "form",
							name: "MultiSelectGroup",
							documentModel: "DomainMultiSelectGroup"
						},
						{
							modelType: "form",
							name: "Field",
							documentModel: "DomainField"
						},
						{
							modelType: "form",
							name: "Rule",
							documentModel: "DomainRule"
						}
					]
				}
			]
		}
	},
	{
		name: "DocumentModelFileTreeSelectParent",
		matches: (d) => d.model === "data-modeler-select-parent-tree",
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: ModelEditorTreeEngine,
					models: [
						{
							modelType: "tree",
							name: "data-modeler-select-parent-tree"
						}
					],
					constraints: {
						type: "MasterDetail"
					}
				}
			]
		}
	},
	{
		name: "DocumentModelFileTreeSelectParentForm",
		priorScene: "DocumentModelFileTreeSelectParent",
		matches: (d) => !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "Group",
							documentModel: "DomainGroup"
						},
						{
							modelType: "form",
							name: "AttachmentGroup",
							documentModel: "DomainAttachmentGroup"
						},
						{
							modelType: "form",
							name: "MultiSelectGroup",
							documentModel: "DomainMultiSelectGroup"
						},
						{
							modelType: "form",
							name: "Field",
							documentModel: "DomainField"
						},
						{
							modelType: "form",
							name: "Rule",
							documentModel: "DomainRule"
						}
					],
					constraints: {
						type: "MasterDetail",
						preferredWidth: 8
					}
				}
			]
		}
	},
	{
		name: "FileSystemTreeWithPreloadChildNodes",
		matches: (d) => d.model === PRELOAD_ABSTRACT_SUPERTYPE_TREE_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FileExplorerTreeEngine,
					models: [
						{
							modelType: "tree",
							name: "file-explorer-tree-preload-abstract-superType"
						}
					]
				}
			]
		}
	}
];
