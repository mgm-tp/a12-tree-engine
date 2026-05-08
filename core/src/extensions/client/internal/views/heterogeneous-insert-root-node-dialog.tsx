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

import {
	defaultVariantSelectionMapper,
	VariantSelection,
	type VariantSelectionItem
} from "@com.mgmtp.a12.client/client-core/heterogeneity";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

import { type Events, ModelSelector, TreeEngineState } from "../../../../core/store/index.js";
import { type InsertRootNodeDialog, useTreeEngineContext, useTreeEngineState } from "../../../../core/view/index.js";
import { TreeEngineError } from "../../../../core/error/index.js";

import { useDialogInsertTitle, useWidgetMapComponents } from "./utils.js";

export namespace HeterogeneousInsertRootNodeDialog {
	export type Props = InsertRootNodeDialog.Props;
}

export const HeterogeneousInsertRootNodeDialog: React.FC<HeterogeneousInsertRootNodeDialog.Props> = () => {
	const { localizer } = React.useContext(LocalizerContext);
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const modelGraph = useTreeEngineState(ModelSelector.modelGraph());

	const variants = React.useMemo<VariantSelectionItem[]>(() => {
		const mapper = defaultVariantSelectionMapper(modelGraph, localizer);
		const rootDocumentModelRef = uiModel.content.configuration.root.documentModelRef;
		const rootDocumentModel = modelGraph.documentModels.find(({ modelId }) => modelId === rootDocumentModelRef);
		if (!rootDocumentModel) {
			throw TreeEngineError.NotFoundError("DocumentModel", rootDocumentModelRef);
		}
		return mapper(rootDocumentModel);
	}, [modelGraph, localizer, uiModel]);

	const onDialogConfirmed = useTreeEngineContext((context) => context.eventHandlers.onDialogConfirmed);
	const onDialogClosed = useTreeEngineContext((context) => context.eventHandlers.onDialogClosed);

	const onSelect = React.useCallback(
		(documentModelId: string) => {
			const dialogState: Events.DialogConfirmedPayload.InsertRootNode = {
				type: TreeEngineState.Dialog.Type.INSERT_ROOT_NODE,
				documentModelId
			};
			onDialogConfirmed({ payload: dialogState });
		},
		[onDialogConfirmed]
	);

	const { ActionContentBox, Title, HeadingAddon, ModalOverlay, CloseButton } = useWidgetMapComponents();
	const insertTitle = useDialogInsertTitle("root");

	return (
		<ModalOverlay preventScroll onClose={onDialogClosed} closeOnEsc>
			<ActionContentBox
				padding="12px"
				headingElements={<Title text={insertTitle} />}
				headingButtons={[
					<HeadingAddon key="cancel">
						<CloseButton onClick={onDialogClosed} />
					</HeadingAddon>
				]}>
				<VariantSelection variants={variants} onSelect={onSelect} />
			</ActionContentBox>
		</ModalOverlay>
	);
};
