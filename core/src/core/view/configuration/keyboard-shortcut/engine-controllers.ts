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

import { TreeModel } from "../../../models/tree-model.js";
import { ModelSelector } from "../../../store/selectors/models.js";
import { ButtonsHooks, useEngineButtonDisabilityGetter } from "../../components/content-box/sub-components/buttons.js";
import { useTreeEngineContext, useTreeEngineState } from "../../context/tree-engine-context.js";
import { useMultiSelectionConfig } from "../../components/content-box/sub-components/multi-selection/utils.js";
import { useFlattenRowActions } from "../../components/tree-engine/sub-components/row-actions-group.js";
import { RowActionHooks } from "../../components/tree-engine/sub-components/hooks/row-action-hooks.js";
import { ExpandAllPopUpHooks } from "../../components/content-box/sub-components/expand-all-pop-up.js";
import { MultiSelectionButtonHooks } from "../../components/content-box/sub-components/multi-selection/multi-selection-button.js";
import { OverallCheckboxHooks } from "../../components/tree-engine/sub-components/overall-checkbox.js";

import { KeyboardShortcut } from "./types.js";
import type { Controller } from "./hooks.js";
import { KeyboardShortcutUtils } from "./utils.js";

/** @internal */
export function useEngineBuiltinActionController(): Controller {
	const expandWholeTreeHandler = ExpandAllPopUpHooks.useWholeTreeExpansionHandler("expand");
	const collapseWholeTreeHandler = ExpandAllPopUpHooks.useWholeTreeExpansionHandler("collapse");
	const overallCheckboxHandler = OverallCheckboxHooks.useOverallCheckboxHandler();
	const multiSelectionButtonHandler = MultiSelectionButtonHooks.useMultiSelectionButtonHandler();

	return React.useMemo(() => {
		return {
			getHandler(...targets) {
				const target = targets[0];
				if (!KeyboardShortcut.EngineBuiltinActionTarget.isAssignableFrom(target)) {
					return undefined;
				}

				const { action } = target;
				if (action === KeyboardShortcut.EngineBuiltinAction.EXPAND_WHOLE_TREE) {
					return expandWholeTreeHandler;
				}
				if (action === KeyboardShortcut.EngineBuiltinAction.COLLAPSE_WHOLE_TREE) {
					return collapseWholeTreeHandler;
				}
				if (action === KeyboardShortcut.EngineBuiltinAction.TOGGLE_OVERALL_MULTI_SELECTION) {
					return overallCheckboxHandler;
				}
				if (action === KeyboardShortcut.EngineBuiltinAction.TOGGLE_MULTI_SELECTION_PANEL) {
					return multiSelectionButtonHandler;
				}

				return undefined;
			}
		};
	}, [expandWholeTreeHandler, collapseWholeTreeHandler, overallCheckboxHandler, multiSelectionButtonHandler]);
}

/** @internal */
export function useEngineInsertActionController(): Controller {
	const rowActionHandler = RowActionHooks.useHandler();
	const { virtualRoot } = useTreeEngineState((state) => state.models.uiModel.content.configuration);
	const virtualRootActions = useFlattenRowActions(virtualRoot);

	// This kind of actions is for virtual root node which is, in turn, for engine button.
	// But the rendering logic is in RowAction component
	// This selector is a simple version of RowActionHooks.useDisabilityGetter for root node
	const isDisabledEngineInsertAction = useTreeEngineContext((context) => context.overallMultiSelection);

	return React.useMemo(() => {
		return {
			getHandler(...targets) {
				const matcher = KeyboardShortcut.EngineInsertActionTarget.isTargetFor;
				const matchedTarget = KeyboardShortcutUtils.findMatchedAction(virtualRootActions, targets, matcher);
				if (matchedTarget) {
					if (isDisabledEngineInsertAction) {
						return matchedTarget.target;
					}
					return rowActionHandler(matchedTarget.action);
				}

				return undefined;
			}
		};
	}, [isDisabledEngineInsertAction, rowActionHandler, virtualRootActions]);
}

/** @internal */
export function useEngineEventActionController(): Controller {
	const availableEventActions = useEngineEventActions(true);
	const unavailableEventActions = useEngineEventActions(false);
	const engineEventActionHandler = ButtonsHooks.useEngineButtonHandler();

	return React.useMemo(() => {
		return {
			getHandler(...targets) {
				const matcher = KeyboardShortcut.EngineEventActionTarget.isTargetFor;
				const targetAction = KeyboardShortcutUtils.findMatchedAction(availableEventActions, targets, matcher)?.action;
				if (targetAction) {
					return engineEventActionHandler(targetAction, targetAction.isMultiSelectionAction);
				}

				return KeyboardShortcutUtils.findMatchedAction(unavailableEventActions, targets, matcher)?.target;
			}
		};
	}, [availableEventActions, unavailableEventActions, engineEventActionHandler]);
}

interface EngineEventAction extends TreeModel.ButtonType {
	isMultiSelectionAction: boolean;
}
/** @internal */
export function useEngineEventActions(isAvailable = true): EngineEventAction[] {
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const multiSelectionConfig = useMultiSelectionConfig();
	const disabilityGetter = useEngineButtonDisabilityGetter();

	const { virtualRoot } = useTreeEngineState((state) => state.models.uiModel.content.configuration);
	const virtualRootActions = useFlattenRowActions(virtualRoot);

	return React.useMemo(() => {
		const toEngineButtons = (buttons: TreeModel.ButtonType[], isMultiSelectionAction = false) =>
			buttons
				.filter((button) => isAvailable === !disabilityGetter(button.event, isMultiSelectionAction))
				.map((button) => ({ ...button, isMultiSelectionAction }));

		const { footerBox, subHeaderBox } = uiModel.content;

		const contentBoxButtons: TreeModel.ButtonElement[] = [
			footerBox.leftSlot,
			footerBox.rightSlot,
			subHeaderBox.leftSlot.filter(TreeModel.ButtonElement.isAssignableFrom),
			subHeaderBox.rightSlot.filter(TreeModel.ButtonElement.isAssignableFrom)
		].flat();

		const virtualRootEventActions = virtualRootActions
			.filter(TreeModel.TreeNodeEventActionButton.isAssignableFrom)
			.map((button) => ({ ...button, id: button.event }));

		return [
			toEngineButtons(contentBoxButtons),
			toEngineButtons(virtualRootEventActions),
			toEngineButtons(multiSelectionConfig?.buttons ?? [], true)
		].flat();
	}, [uiModel.content, virtualRootActions, multiSelectionConfig?.buttons, isAvailable, disabilityGetter]);
}
