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

import { RESOURCE_KEYS } from "../../../../services/localization/languages/keys.js";
import { LocalizerHooks } from "../../../../services/localization/localizer-hooks.js";
import { TreeModelKeys } from "../../../../services/localization/tree-model-keys.js";
import { TreeEngineState } from "../../../../store/store.js";
import { useTreeEngineContext } from "../../../context/tree-engine-context.js";

export namespace ConfirmationDialog {
	export interface Props {
		readonly dialogState: TreeEngineState.Dialog.Confirmation;
	}
}

/** @internal */
export const ConfirmationDialog: React.FC<ConfirmationDialog.Props> = (props) => {
	const ButtonGroup = useTreeEngineContext((context) => context.widgetMap.ButtonGroup);
	const Button = useTreeEngineContext((context) => context.widgetMap.Button);
	const ModalNotification = useTreeEngineContext((context) => context.widgetMap.ModalNotification);
	const onDialogConfirmed = useTreeEngineContext((context) => context.eventHandlers.onDialogConfirmed);
	const onClose = useTreeEngineContext((context) => context.eventHandlers.onDialogClosed);

	const { dialogState } = props;

	const onConfirm = React.useCallback(() => {
		const { confirmation, ...payload } = dialogState;
		onDialogConfirmed({ payload });
	}, [dialogState, onDialogConfirmed]);

	const [title, message] = useTitleAndMessage(dialogState);
	const [closeButtonLabel, confirmButtonLabel] = useButtonLabels(dialogState);

	return (
		<ModalNotification
			preventScroll
			padding={24}
			variant="warning"
			title={title}
			closeOnEsc
			onClose={onClose}
			footer={
				<ButtonGroup alignment="right">
					<Button key="close-button" onClick={onClose}>
						{closeButtonLabel}
					</Button>
					<Button key="confirm-button" onClick={onConfirm} primary destructive>
						{confirmButtonLabel}
					</Button>
				</ButtonGroup>
			}>
			{message}
		</ModalNotification>
	);
};

function useTitleAndMessage(dialogState: TreeEngineState.Dialog.Confirmation): string[] {
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();

	return React.useMemo<string[]>(() => {
		if (TreeEngineState.Dialog.Confirmation.MakeRootNode.isAssignableFrom(dialogState)) {
			const { nodeDisplayName } = dialogState;

			return [
				localizedResource(RESOURCE_KEYS.treeEngine.dialog.makeRootNode.title),
				localizedResource(RESOURCE_KEYS.treeEngine.dialog.makeRootNode.message, {
					node: { type: "plain", value: nodeDisplayName },
					linksCount: { type: "plain", value: String(dialogState.parentLinks.length) }
				})
			];
		}

		if (TreeEngineState.Dialog.Confirmation.CollapseMultiSelectionPanel.isAssignableFrom(dialogState)) {
			if (dialogState.confirmation) {
				return [
					localizedTreeElement(TreeModelKeys.getMultiSelectionClearConfirmationKey(), dialogState.confirmation?.title),
					localizedTreeElement(TreeModelKeys.getActionsEventConfirmationKey(), dialogState.confirmation?.message)
				];
			}

			return [
				localizedResource(RESOURCE_KEYS.treeEngine.dialog.clearMultiSelection.title),
				localizedResource(RESOURCE_KEYS.treeEngine.dialog.clearMultiSelection.message)
			];
		}

		return [
			localizedTreeElement(
				[...TreeModelKeys.getActionsEventConfirmationKey(), dialogState.button.event],
				dialogState?.confirmation?.title
			),
			localizedTreeElement(
				[...TreeModelKeys.getActionsEventConfirmationKey(), dialogState.button.event],
				dialogState?.confirmation?.message
			)
		];
	}, [dialogState, localizedResource, localizedTreeElement]);
}

function useButtonLabels(dialogState: TreeEngineState.Dialog.Confirmation): string[] {
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return React.useMemo<string[]>(() => {
		if (TreeEngineState.Dialog.Confirmation.CollapseMultiSelectionPanel.isAssignableFrom(dialogState)) {
			return [
				localizedResource(RESOURCE_KEYS.treeEngine.dialog.clearMultiSelection.button.cancel),
				localizedResource(RESOURCE_KEYS.treeEngine.dialog.clearMultiSelection.button.clearSelection)
			];
		}

		const deleteNodeEvents = ["event_delete_node", "event_delete_link", "event_delete_nodes"];
		if (
			!TreeEngineState.Dialog.Confirmation.MakeRootNode.isAssignableFrom(dialogState) &&
			deleteNodeEvents.includes(dialogState?.button?.event)
		) {
			return [
				localizedResource(RESOURCE_KEYS.treeEngine.dialog.delete.button.cancel),
				localizedResource(RESOURCE_KEYS.treeEngine.dialog.delete.button.delete)
			];
		}

		return [
			localizedResource(RESOURCE_KEYS.treeEngine.dialog.confirmation.button.close),
			localizedResource(RESOURCE_KEYS.treeEngine.dialog.confirmation.button.confirm)
		];
	}, [dialogState, localizedResource]);
}
