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

import { TreeEngineState } from "../../../store/store.js";
import { UIStateSelector } from "../../../store/selectors/ui-state.js";
import { useTreeEngineContext, useTreeEngineState } from "../../context/tree-engine-context.js";

export namespace DialogsRenderer {
	export interface Props {}
}

/** @internal */
export const DialogsRenderer: React.FC<DialogsRenderer.Props> = React.memo(function DialogsRenderer() {
	const ConfirmationDialog = useTreeEngineContext((context) => context.componentMap.ConfirmationDialog);
	const InsertChildNodeDialog = useTreeEngineContext((context) => context.componentMap.InsertChildNodeDialog);
	const InsertSiblingNodeDialog = useTreeEngineContext((context) => context.componentMap.InsertSiblingNodeDialog);
	const InsertRootNodeDialog = useTreeEngineContext((context) => context.componentMap.InsertRootNodeDialog);
	const dialogState = useTreeEngineState(UIStateSelector.dialogState());

	if (dialogState && TreeEngineState.Dialog.Confirmation.isAssignableFrom(dialogState)) {
		return <ConfirmationDialog dialogState={dialogState} />;
	}
	if (dialogState && TreeEngineState.Dialog.InsertChildNode.isAssignableFrom(dialogState)) {
		return <InsertChildNodeDialog dialogState={dialogState} />;
	}
	if (dialogState && TreeEngineState.Dialog.InsertSiblingNode.isAssignableFrom(dialogState)) {
		return <InsertSiblingNodeDialog dialogState={dialogState} />;
	}
	if (dialogState && TreeEngineState.Dialog.InsertRootNode.isAssignableFrom(dialogState)) {
		return <InsertRootNodeDialog dialogState={dialogState} />;
	}
	return null;
});
