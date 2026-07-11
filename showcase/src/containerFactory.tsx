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

import * as React from "react";

import type { View } from "@com.mgmtp.a12.client/client-core";
import { CRUDViews } from "@com.mgmtp.a12.crud/crud-core";
import { DefaultSelectorMap, type SelectorMap } from "@com.mgmtp.a12.treeengine/treeengine-core";

import { CustomA12TeamTreeEngine } from "./views/custom-a12-team-tree-engine.js";
import { ModelEditorTreeEngine } from "./views/model-editor-tree-engine.js";
import { FileExplorerTreeEngine } from "./views/file-explorer-tree-engine.js";
import { CustomTreeEngine } from "./views/custom-tree-engine.js";

// tag::SetupViewProvider[]
export const viewComponents = {
	TreeCRUD: (props) => <CustomTreeEngine {...props} selectorMap={CustomSelectorMap} />,
	TreeCRUDTwin: (props) => <CustomTreeEngine {...props} uiIdPrefix={"Twin"} />,
	FileExplorerTreeEngine: (props) => <FileExplorerTreeEngine {...props} />,
	ModelEditorTreeEngine: (props) => <ModelEditorTreeEngine {...props} />,
	CustomA12TeamTreeEngine: (props) => <CustomA12TeamTreeEngine {...props} dndConfiguration={false} />,
	OverviewCRUD: (props) => <CRUDViews.OverviewEngineView {...props} />,
	FormCRUD: (props) => <CRUDViews.FormEngineWithRelationshipEngineView {...props} />
} satisfies { [name: string]: React.ComponentType<View> };
// end::SetupViewProvider[]

const CustomSelectorMap: SelectorMap = {
	...DefaultSelectorMap,
	attachmentThumbnail: (attachment) => {
		return (state) => {
			return attachment.content?.startsWith("data:image/")
				? attachment.content
				: DefaultSelectorMap.attachmentThumbnail(attachment)(state);
		};
	}
};
