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

import type { ModelGraph } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { useTreeEngineContext, useTreeEngineState } from "../../../core/view/context/tree-engine-context.js";
import { LocalizerHooks } from "../../../core/services/localization/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../core/services/localization/languages/keys.js";
import { ModelSelector } from "../../../core/store/selectors/models.js";
import { TreeEngineState } from "../../../core/store/store.js";
import type { TreeModel } from "../../../core/models/tree-model.js";

/** @internal */
export function useWidgetMapComponents() {
	const ActionContentBox = useTreeEngineContext((context) => context.widgetMap.ActionContentBox);
	const Title = useTreeEngineContext((context) => context.widgetMap.Title);
	const HeadingAddon = useTreeEngineContext((context) => context.widgetMap.HeadingAddon);
	const ModalOverlay = useTreeEngineContext((context) => context.widgetMap.ModalOverlay);
	const CloseButton = useTreeEngineContext((context) => context.widgetMap.ContentBoxCloseButton);

	return React.useMemo(
		() => ({ ActionContentBox, Title, HeadingAddon, ModalOverlay, CloseButton }),
		[ActionContentBox, Title, HeadingAddon, ModalOverlay, CloseButton]
	);
}

/** @internal */
export function useDialogInsertTitle(type: "root" | "child" | "sibling"): string | undefined {
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return React.useMemo(
		() => localizedResource(RESOURCE_KEYS.treeEngine.dialog.insertion[type].heading),
		[localizedResource, type]
	);
}

/** @internal */
export function useInsertOnSelect(
	options: TreeEngineState.Dialog.Option[],
	insertPosition: TreeEngineState.InsertPosition,
	button: TreeModel.TreeNodeInsertActionButton,
	type: "sibling" | "child" = "child"
) {
	const { documentModels } = useTreeEngineState(ModelSelector.modelGraph());
	const onDialogConfirmed = useTreeEngineContext((context) => context.eventHandlers.onDialogConfirmed);
	const findSuperDocumentModel = React.useCallback(
		(targetId: string): ModelGraph.DocumentModel | undefined =>
			documentModels.find(({ subTypes }) => subTypes?.includes(targetId)),
		[documentModels]
	);

	return React.useCallback(
		(documentModelId: string) => {
			let selectedOption = options.find((option) => option.documentModelId === documentModelId);
			let superDocumentModel = findSuperDocumentModel(documentModelId);
			while (!selectedOption && superDocumentModel) {
				selectedOption = options.find((option) => option.documentModelId === superDocumentModel?.modelId);
				if (!selectedOption) {
					const newSuperDocumentModel = findSuperDocumentModel(superDocumentModel.modelId);
					if (!newSuperDocumentModel) {
						break;
					} else {
						superDocumentModel = newSuperDocumentModel;
					}
				}
			}

			if (!selectedOption) {
				throw new Error(`Could not find selected option with document model ${documentModelId}.`);
			}

			onDialogConfirmed({
				payload: {
					childRelationshipConfiguration: selectedOption.childRelationshipConfiguration,
					type:
						type === "child"
							? TreeEngineState.Dialog.Type.INSERT_CHILD_NODE
							: TreeEngineState.Dialog.Type.INSERT_SIBLING_NODE,
					button,
					insertPosition,
					documentModelId
				}
			});
		},
		[button, findSuperDocumentModel, insertPosition, onDialogConfirmed, options, type]
	);
}
