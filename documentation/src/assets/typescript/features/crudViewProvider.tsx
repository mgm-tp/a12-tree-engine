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

// tag::SetupViewProvider[]
import type { View } from "@com.mgmtp.a12.client/client-core";
import { CRUDViews } from "@com.mgmtp.a12.crud/crud-core";
import { TreeEngineFactories, type RowStyleGetter } from "@com.mgmtp.a12.treeengine/treeengine-core";

export function createViewProvider(): (componentName: string) => React.ComponentType<View> | undefined {
	const components: { [name: string]: React.ComponentType<View> | undefined } = {
		// CRUD views
		OverviewCRUD: CRUDViews.OverviewEngineView,
		FormCRUD: CRUDViews.FormEngineView,
		// Default Tree Engine view component
		TreeCRUD: TreeEngineFactories.ViewComponent,
		// Customized Tree components
		TeamTree: TeamTree,
		NonDnDTree: (props) => <TreeEngineFactories.ViewComponent {...props} dndConfiguration={false} />
	};

	return function provider(name) {
		return components[name];
	};
}

function TeamTree(props: View) {
	const rowStyling: RowStyleGetter = React.useCallback(({ row }) => {
		return { disabled: row.data.nodeIdentifier.type === "DomainPerson" };
	}, []);
	return <TreeEngineFactories.ViewComponent {...props} rowStyling={rowStyling} />;
}
// end::SetupViewProvider[]
