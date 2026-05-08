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

import { defaultVariantSelectionMapper, VariantSelection } from "@com.mgmtp.a12.client/client-core/heterogeneity";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

import { ModelSelector } from "../../../../core/store/index.js";
import { type InsertChildNodeDialog, useTreeEngineContext, useTreeEngineState } from "../../../../core/view/index.js";
import { TreeEngineError } from "../../../../core/error/index.js";

import { useDialogInsertTitle, useInsertOnSelect, useWidgetMapComponents } from "./utils.js";

export namespace HeterogeneousInsertChildNodeDialog {
	export type Props = InsertChildNodeDialog.Props;
}

export const HeterogeneousInsertChildNodeDialog: React.FC<HeterogeneousInsertChildNodeDialog.Props> = (props) => {
	const { options, insertPosition, button } = props.dialogState;
	const modelGraph = useTreeEngineState(ModelSelector.modelGraph());
	const onDialogClosed = useTreeEngineContext((context) => context.eventHandlers.onDialogClosed);
	const { localizer } = React.useContext(LocalizerContext);

	const variants = React.useMemo(() => {
		const mapper = defaultVariantSelectionMapper(modelGraph, localizer);
		return options
			.map(({ documentModelId }) => {
				const documentModel = modelGraph.documentModels.find(({ modelId }) => modelId === documentModelId);
				if (!documentModel) {
					throw TreeEngineError.NotFoundError("DocumentModel", documentModelId);
				}
				return mapper(documentModel);
			})
			.flat();
	}, [modelGraph, localizer, options]);

	const onSelect = useInsertOnSelect(options, insertPosition, button);
	const { ActionContentBox, Title, HeadingAddon, ModalOverlay, CloseButton } = useWidgetMapComponents();
	const insertTitle = useDialogInsertTitle("child");

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
