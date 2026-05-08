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
import * as KeyCode from "keycode-js";

import { type Annotation } from "@com.mgmtp.a12.base/base-model-api/lib/main/header/index.js";
import {
	TreeEngineState,
	type Events,
	ModelSelector,
	type ComponentMap,
	DefaultComponentMap,
	KeyboardShortcut,
	useTreeEngineContext,
	useTreeEngineState,
	TreeEngineFactories
} from "@com.mgmtp.a12.treeengine/treeengine-core";
import {
	defaultVariantSelectionMapper,
	VariantSelection,
	type VariantSelectionItem
} from "@com.mgmtp.a12.client/client-core/heterogeneity";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

import { assert } from "../helpers.js";
import { engineShortcuts, nodeShortcuts } from "../utils.js";
import { useShowcaseContext } from "../context.js";

namespace ModelEditorTreeEngine {
	export type Props = TreeEngineFactories.ViewComponentProps;
}

export const ModelEditorTreeEngine: React.FC<ModelEditorTreeEngine.Props> = (props) => {
	const customComponentMap = React.useMemo<ComponentMap>(() => {
		return {
			...DefaultComponentMap,
			InsertRootNodeDialog: ({ dialogState }) => {
				const variants = useVariants(dialogState.button.annotations);
				const eventHandlers = useTreeEngineContext((context) => context.eventHandlers);

				return (
					<InsertionDialog
						variants={variants}
						onSelect={(documentModelId) => {
							const payload: Events.DialogConfirmedPayload.InsertRootNode = {
								type: TreeEngineState.Dialog.Type.INSERT_ROOT_NODE,
								documentModelId
							};
							eventHandlers.onDialogConfirmed({ payload });
						}}
						onClose={eventHandlers.onDialogClosed}
					/>
				);
			},

			InsertChildNodeDialog: ({ dialogState }) => {
				const { options, button, insertPosition } = dialogState;
				const variants = useVariants(button.annotations);
				const eventHandlers = useTreeEngineContext((context) => context.eventHandlers);

				return (
					<InsertionDialog
						variants={variants}
						onSelect={(documentModelId) => {
							const selectedOption = options.find((option) => option.documentModelId === "DomainElement");
							assert(selectedOption, "Could not find selected option with DomainElement.");

							eventHandlers.onDialogConfirmed({
								payload: {
									type: TreeEngineState.Dialog.Type.INSERT_CHILD_NODE,
									childRelationshipConfiguration: selectedOption.childRelationshipConfiguration,
									documentModelId,
									insertPosition,
									button
								}
							});
						}}
						onClose={eventHandlers.onDialogClosed}
					/>
				);
			}
		};
	}, []);

	const keyboardShortcuts: KeyboardShortcut[] = React.useMemo(() => {
		return [...nodeShortcuts, ...engineShortcuts, ...showcaseShortcuts];
	}, []);

	const enableDnd = useShowcaseContext((context) => (context.enableDnd ? undefined : false));

	return (
		<TreeEngineFactories.ViewComponent
			{...props}
			componentMap={customComponentMap}
			keyboardShortcuts={keyboardShortcuts}
			dndConfiguration={enableDnd}
		/>
	);
};

const useVariants = (annotations?: ReadonlyArray<Annotation>) => {
	const { localizer } = React.useContext(LocalizerContext);
	const modelGraph = useTreeEngineState(ModelSelector.modelGraph());
	const mapper = defaultVariantSelectionMapper(modelGraph, localizer);

	const documentIds = annotations?.find(({ name }) => name === "documents")?.value?.split(",") ?? ["DomainElement"];
	const result: VariantSelectionItem[] = [];

	for (const documentId of documentIds) {
		const documentModel = modelGraph.documentModels.find(({ modelId }) => modelId === documentId);
		assert(documentModel, `Could not find document model ${documentId} in model graph.`);

		result.push(...mapper(documentModel));
	}

	return result;
};

const InsertionDialog: React.FC<InsertionDialogProps> = (props) => {
	const widgetMap = useTreeEngineContext((context) => context.widgetMap);
	const { ActionContentBox, Title, HeadingAddon, ModalOverlay, Icon, Button } = widgetMap;

	return (
		<ModalOverlay onClose={props.onClose} closeOnEsc>
			<ActionContentBox
				padding="12px"
				headingElements={<Title text="Please choose a document model to insert" />}
				headingButtons={[
					<HeadingAddon key="cancel">
						<Button onClick={props.onClose} icon={<Icon>close</Icon>} invert />
					</HeadingAddon>
				]}>
				<VariantSelection {...props} />
			</ActionContentBox>
		</ModalOverlay>
	);
};

interface InsertionDialogProps {
	variants: VariantSelectionItem[];
	onClose(): void;
	onSelect(documentId: string): void;
}

const showcaseShortcuts: KeyboardShortcut[] = [
	{
		keyCombinations: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: KeyCode.CODE_G }],
		target: {
			type: KeyboardShortcut.TargetType.ENGINE_INSERT_ACTION,
			documentModelRef: "DomainGroup"
		},
		stopIfUnavailable: true
	},
	{
		keyCombinations: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: KeyCode.CODE_A }],
		target: {
			type: KeyboardShortcut.TargetType.ENGINE_INSERT_ACTION,
			documentModelRef: "DomainAttachmentGroup"
		}
	},
	{
		keyCombinations: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: KeyCode.CODE_S }],
		target: {
			type: KeyboardShortcut.TargetType.ENGINE_INSERT_ACTION,
			documentModelRef: "DomainMultiSelectGroup"
		}
	}
];
