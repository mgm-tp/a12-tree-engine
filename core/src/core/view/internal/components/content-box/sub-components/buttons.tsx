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

import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";
import { localizableKeyFromSegments } from "@com.mgmtp.a12.utils/utils-localization";
import { type ButtonProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";

import { type TreeModel } from "../../../../../models/index.js";
import { LocalizerHooks, TreeModelKeys } from "../../../../../services/localization/index.js";
import { DataSelector, ModelSelector, UIStateSelector } from "../../../../../store/index.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context-provider.js";
import { FlattenNodeRow, RootNodeRow } from "../../tree-engine/sub-components/types.js";
import { KeyboardShortcut } from "../../../configuration/keyboard-shortcut/types.js";
import { KeyboardShortcutUtils } from "../../../configuration/keyboard-shortcut/utils.js";
import { useIdGenerator } from "../../../configuration/id-generator.js";

export namespace Button {
	export interface Props {
		readonly element: TreeModel.ButtonType;
		readonly componentKeys: string[];
		readonly labelFallback?: boolean;
	}
}

/**
 * @internal
 */
export const Button: React.FC<Button.Props> = React.memo(function Button(props) {
	const { element, componentKeys, labelFallback } = props;
	const { labelHidden, primary, destructive, icon, styles } = element;

	const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();

	const description = React.useMemo(() => {
		return localizedTreeElement([...componentKeys, TreeModelKeys.TITLE, element.id], element.description);
	}, [componentKeys, element.id, element.description, localizedTreeElement]);

	const modelLabel = React.useMemo(() => {
		const localizedLabel = localizedTreeElement([...componentKeys, TreeModelKeys.LABEL, element.id], element.label);
		if (!localizedLabel && labelFallback) {
			return description;
		}
		return localizedLabel;
	}, [componentKeys, element.id, element.label, localizedTreeElement, description, labelFallback]);

	const isMultiSelectionAction = React.useMemo(
		() =>
			localizableKeyFromSegments(componentKeys) ===
			localizableKeyFromSegments(TreeModelKeys.getMultiSelectionActionsKey()),
		[componentKeys]
	);
	const engineButtonHandler = ButtonsHooks.useEngineButtonHandler();
	const onClick = React.useMemo(
		() => engineButtonHandler(element, isMultiSelectionAction),
		[element, engineButtonHandler, isMultiSelectionAction]
	);

	const disabilityGetter = useEngineButtonDisabilityGetter();
	const disabled = React.useMemo(
		() => disabilityGetter(props.element.event, isMultiSelectionAction),
		[disabilityGetter, isMultiSelectionAction, props.element]
	);

	const keyboardShortcuts = useTreeEngineContext((context) => context.keyboardShortcuts);
	const shortcut = React.useMemo(() => {
		return keyboardShortcuts?.find(({ target }) =>
			KeyboardShortcut.EngineEventActionTarget.isTargetFor(target, element)
		);
	}, [element, keyboardShortcuts]);

	const { label, title, buttonAttributes } = useButtonA11YProps({ modelLabel, description, labelHidden, shortcut });

	const ButtonComponent = useTreeEngineContext((context) => context.widgetMap.Button);
	const IconComponent = useTreeEngineContext((context) => context.widgetMap.Icon);
	const generateId = useIdGenerator();
	const id = React.useMemo(() => generateId(element.id), [generateId, element.id]);

	return (
		<ButtonComponent
			id={id}
			label={label}
			title={title}
			buttonAttributes={buttonAttributes}
			disabled={disabled}
			primary={primary}
			destructive={destructive}
			icon={icon && <IconComponent iconTheme={icon.theme}>{icon.name}</IconComponent>}
			onClick={onClick}
			className={styles?.join(" ") ?? undefined}
		/>
	);
});

/** @internal */
export function useEngineButtonDisabilityGetter() {
	const canDrop = useTreeEngineContext((context) => context.dndConfiguration.canDrop);
	const overallMultiSelection = useTreeEngineContext((context) => context.overallMultiSelection);
	const disabled = useTreeEngineState(UIStateSelector.disabled());
	const readonly = useTreeEngineState(UIStateSelector.readonly());
	const clipboard = useTreeEngineState(UIStateSelector.clipboard());
	const data = useTreeEngineState(DataSelector.data());
	const root = useTreeEngineState(DataSelector.root());
	const models = useTreeEngineState(ModelSelector.models());

	return React.useCallback(
		(event: string, isMultiSelectionAction: boolean) => {
			if (disabled || readonly) {
				return true;
			}
			if (event === "event_copy_nodes" && !isMultiSelectionAction) {
				return false;
			}
			if (event === "event_paste") {
				if (!clipboard?.nodes.length) {
					return true;
				}
				const { nodes, action } = clipboard;
				/**
				 * Re-used functionality of canDrop callback and force the position to be AS_CHILD
				 * This would ensure each clipboard node is a valid candidate for the paste operation
				 */
				return !nodes?.every((node) => {
					const clipboardNode = FlattenNodeRow.createFromClipboardNode(node, action, { data, root, models });
					if (!clipboardNode) {
						return false;
					}
					return (
						canDrop?.({
							dragItem: { row: clipboardNode, rowIndex: 0 },
							hoveredItem: { row: RootNodeRow.create(), rowIndex: 0, position: TreeTableNodeDropPosition.AS_CHILD }
						}) === true
					);
				});
			}

			return isMultiSelectionAction ? !overallMultiSelection : !!overallMultiSelection;
		},
		[disabled, readonly, overallMultiSelection, clipboard, data, root, models, canDrop]
	);
}

/** @internal */
export namespace ButtonsHooks {
	export function useEngineButtonHandler() {
		const onEventButtonClicked = useTreeEngineContext((context) => context.eventHandlers.onEventButtonClicked);
		const onMultiSelectionEventButtonClicked = useTreeEngineContext(
			(context) => context.eventHandlers.onMultiSelectionEventButtonClicked
		);

		return React.useCallback(
			(button: TreeModel.ButtonType, isMultiSelectionButton: boolean) => {
				if (isMultiSelectionButton) {
					return () => onMultiSelectionEventButtonClicked({ button });
				} else {
					return () => onEventButtonClicked({ button });
				}
			},
			[onEventButtonClicked, onMultiSelectionEventButtonClicked]
		);
	}
}

interface A11YParams {
	modelLabel: string;
	description: string;
	labelHidden?: true;
	shortcut: KeyboardShortcut | undefined;
	ariaLabelledBy?: string;
}

interface A11YProps {
	label?: string;
	title?: string;
	buttonAttributes?: ButtonProps["buttonAttributes"];
}

/** @internal */
export function useButtonA11YProps(params: A11YParams): A11YProps {
	const { modelLabel, description, labelHidden, shortcut, ariaLabelledBy } = params;
	const label = React.useMemo<string | undefined>(() => {
		if (labelHidden || !modelLabel) {
			return undefined;
		}
		return modelLabel;
	}, [labelHidden, modelLabel]);

	const titleWithoutShortcut = React.useMemo<string>(() => {
		if (description) {
			return description;
		}
		return labelHidden && modelLabel ? modelLabel : "";
	}, [description, labelHidden, modelLabel]);

	const shortCutText = React.useMemo(() => KeyboardShortcutUtils.toTitle(shortcut), [shortcut]);

	const title = React.useMemo<string | undefined>(() => {
		if (!titleWithoutShortcut && !shortCutText) {
			return undefined;
		}
		return titleWithoutShortcut + shortCutText;
	}, [shortCutText, titleWithoutShortcut]);

	const ariaLabelWithoutShortcut = React.useMemo<string>(() => {
		if (modelLabel && description) {
			return `${modelLabel} - ${description}`;
		}
		return modelLabel || description || "";
	}, [description, modelLabel]);

	const ariaLabel = React.useMemo<string | undefined>(() => {
		if (!ariaLabelWithoutShortcut && !shortCutText) {
			return undefined;
		}
		return ariaLabelWithoutShortcut + shortCutText;
	}, [ariaLabelWithoutShortcut, shortCutText]);

	const buttonAttributes = React.useMemo<ButtonProps["buttonAttributes"]>(
		() => ({
			"aria-labelledby": ariaLabelledBy,
			"aria-label": ariaLabel?.trim()
		}),
		[ariaLabel, ariaLabelledBy]
	);

	return React.useMemo(
		() => ({ label: label?.trim(), title: title?.trim(), buttonAttributes }),
		[buttonAttributes, label, title]
	);
}
