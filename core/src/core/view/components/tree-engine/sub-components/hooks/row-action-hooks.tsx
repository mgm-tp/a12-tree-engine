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

import type { LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core";

import { useTreeEngineRowContext } from "../../../../context/row-context.js";
import { LocalizerHooks } from "../../../../../services/localization/localizer-hooks.js";
import { TreeModelKeys } from "../../../../../services/localization/tree-model-keys.js";
import { TreeModel } from "../../../../../models/tree-model.js";
import { DataSelector } from "../../../../../store/selectors/data.js";
import { ModelSelector } from "../../../../../store/selectors/models.js";
import type { ModelsState } from "../../../../../store/store.js";
import { UIStateSelector } from "../../../../../store/selectors/ui-state.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../../context/tree-engine-context.js";
import { useTreeInternalContext } from "../../../../context/tree-internal-context-provider.js";
import { TreeEngineError } from "../../../../../error/tree-engine-error.js";

import { FlattenNodeRow, RootNodeRow } from "../types.js";
import type { RowAction } from "../row-action.js";
import { RowCheckboxHandler } from "../row-checkbox.js";

/** @internal */
export namespace RowActionHooks {
	function useKeyGetter({ row, displayAsPopupEntry, rowActionModel }: RowAction.Props) {
		const nodeModelId = useTreeEngineRowContext((context) =>
			RootNodeRow.isAssignableFrom(row) ? undefined : context.rowState.nodeModel.id
		);

		const treeModelKeys: string[] = React.useMemo(() => {
			const nodeKeys = nodeModelId ? [TreeModelKeys.getNodesKey(), nodeModelId] : [TreeModelKeys.getVirtualRootKey()];
			return displayAsPopupEntry
				? [...nodeKeys, TreeModelKeys.getContextMenuKey()]
				: [...nodeKeys, TreeModelKeys.getActionKey()];
		}, [nodeModelId, displayAsPopupEntry]);

		return React.useCallback(
			(fieldKey: string) => {
				if (TreeModel.TreeNodeEventActionButton.isAssignableFrom(rowActionModel)) {
					return [...treeModelKeys, rowActionModel.type, rowActionModel.event, fieldKey];
				} else {
					return [...treeModelKeys, rowActionModel.type, fieldKey];
				}
			},
			[rowActionModel, treeModelKeys]
		);
	}

	const EMPTY_LABELS: LocalizedModelText = [];
	export function useLocalizedText(params: RowAction.Props): { label: string; description: string } {
		const { rowActionModel } = params;
		const { documentModelRef, useLabelFromDocumentModel, useTitleFromDocumentModel } =
			RowActionHooks.useInsertActionProperties(rowActionModel);

		const documentModelLabelSelector = React.useMemo<(state: ModelsState) => LocalizedModelText>(() => {
			if (!documentModelRef) {
				return () => EMPTY_LABELS;
			}
			return (state: ModelsState) => {
				const documentModel = ModelSelector.modelGraph()(state).documentModels.find(
					(model) => model.modelId === documentModelRef
				);
				return documentModel?.displayLabels ?? EMPTY_LABELS;
			};
		}, [documentModelRef]);
		const documentModelLabel = useTreeEngineState(documentModelLabelSelector);

		const keyGetter = useKeyGetter(params);

		const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();

		return React.useMemo(() => {
			return {
				label: localizedTreeElement(
					keyGetter(TreeModelKeys.LABEL),
					useLabelFromDocumentModel ? documentModelLabel : rowActionModel.label
				),
				description: localizedTreeElement(
					keyGetter(TreeModelKeys.TITLE),
					useTitleFromDocumentModel ? documentModelLabel : rowActionModel.description
				)
			};
		}, [
			localizedTreeElement,
			rowActionModel,
			documentModelLabel,
			keyGetter,
			useLabelFromDocumentModel,
			useTitleFromDocumentModel
		]);
	}

	const expandCollapseEventNames = ["event_expand_sub_tree", "event_collapse_sub_tree"];

	const expandCollapseExemptEvents = [
		"event_expand_whole_tree",
		"event_collapse_whole_tree",
		"event_expand_sub_tree",
		"event_collapse_sub_tree"
	];

	export function useDisabilityGetter(busy: boolean, isCircular = false) {
		const rowActionStateGetter = useTreeEngineContext((context) => context.rowActionStateGetter);
		const canDrop = useTreeEngineContext((context) => context.dndConfiguration.canDrop);
		const overallMultiSelection = useTreeEngineContext((context) => context.overallMultiSelection);

		const disabled = useTreeEngineState(UIStateSelector.disabled());
		const preloadChildNodes = useTreeEngineState(UIStateSelector.preloadChildNodes());
		const clipboard = useTreeEngineState(UIStateSelector.clipboard());
		const data = useTreeEngineState(DataSelector.data());
		const root = useTreeEngineState(DataSelector.root());
		const models = useTreeEngineState(ModelSelector.models());

		return React.useCallback(
			(row: FlattenNodeRow, rowActionModel: TreeModel.TreeNodeActionButton) => {
				if (
					disabled ||
					busy ||
					rowActionStateGetter?.({ row, action: rowActionModel }).disabled === true ||
					isCircular
				) {
					return true;
				}

				if (
					preloadChildNodes &&
					row.children === undefined &&
					rowActionModel.type === "event" &&
					expandCollapseEventNames.includes(rowActionModel.event)
				) {
					return true;
				}

				if (rowActionModel.type === "event" && Object.values<string>(PasteEvent).includes(rowActionModel.event)) {
					if (!clipboard?.nodes.length) {
						return true;
					}
					const { nodes, action } = clipboard;
					/**
					 * Re-used functionality of canDrop callback and force the position to be AS_CHILD
					 * This would ensure each clipboard node is a valid candidate for the paste operation
					 */
					return nodes?.some((node) => {
						const clipboardNode = FlattenNodeRow.createFromClipboardNode(node, action, { data, root, models });
						if (!clipboardNode) {
							return true;
						}

						let position = TreeTableNodeDropPosition.AS_CHILD;
						if (rowActionModel.event === PasteEvent.ABOVE) {
							position = TreeTableNodeDropPosition.TOP;
						}
						if (rowActionModel.event === PasteEvent.BELOW) {
							position = TreeTableNodeDropPosition.BOTTOM;
						}

						const canPaste = canDrop?.({
							dragItem: { row: clipboardNode, rowIndex: 0 },
							hoveredItem: { row, position, rowIndex: 0 }
						});

						return canPaste !== true;
					});
				}

				if (
					overallMultiSelection &&
					!(rowActionModel.type === "event" && expandCollapseExemptEvents.includes(rowActionModel.event))
				) {
					return true;
				}

				if (TreeModel.TreeNodeInsertActionButton.isInsertSiblingAction(rowActionModel)) {
					const rowDocumentModel = row.nodeModel.documentModelRef;
					const subTypeModels = ModelSelector.subtypeModelsByName(rowDocumentModel)({ models }).map(
						(model) => model.modelId
					);
					const parent = DataSelector.parent(row.data)({ data, root });
					// Hidden root node
					if (parent && parent.nodeIdentifier.type !== root.identifier?.type) {
						return false;
					}

					return ![...subTypeModels, rowDocumentModel].includes(rowActionModel.documentModelRef || "");
				}

				return false;
			},
			[
				disabled,
				busy,
				rowActionStateGetter,
				isCircular,
				preloadChildNodes,
				overallMultiSelection,
				clipboard,
				data,
				root,
				models,
				canDrop
			]
		);
	}

	export function useReadonlyGetter(isCircular = false) {
		const readonly = useTreeEngineState(UIStateSelector.readonly());
		const preloadChildNodes = useTreeEngineState(UIStateSelector.preloadChildNodes());

		return React.useCallback(
			(row: FlattenNodeRow, rowActionModel: TreeModel.TreeNodeActionButton) => {
				if (isCircular) {
					return true;
				}

				if (rowActionModel.type === "event" && expandCollapseEventNames.includes(rowActionModel.event)) {
					return preloadChildNodes && row.children === undefined;
				}

				return readonly;
			},
			[isCircular, preloadChildNodes, readonly]
		);
	}

	export function useVisibilityGetter() {
		const rowActionStateGetter = useTreeEngineContext((context) => context.rowActionStateGetter);

		return React.useCallback(
			(row: FlattenNodeRow, action: TreeModel.TreeNodeActionButton) => !rowActionStateGetter?.({ row, action }).hidden,
			[rowActionStateGetter]
		);
	}

	export function useHandler(row: FlattenNodeRow = RootNodeRow.create()) {
		const onNodeEventButtonClicked = useTreeEngineContext((_) => _.eventHandlers.onNodeEventButtonClicked);
		const onInsertChildNodeButtonClicked = useTreeEngineContext((_) => _.eventHandlers.onInsertChildNodeButtonClicked);
		const closeContextMenuHandler = useTreeInternalContext((context) => context.closeContextMenuHandler);

		return React.useCallback(
			(button: TreeModel.TreeNodeActionButton) => {
				if (TreeModel.TreeNodeInsertActionButton.isAssignableFrom(button)) {
					return () => {
						closeContextMenuHandler.current?.();
						onInsertChildNodeButtonClicked({ ...row.data, button });
					};
				}
				if (TreeModel.TreeNodeEventActionButton.isAssignableFrom(button)) {
					return () => {
						closeContextMenuHandler.current?.();
						onNodeEventButtonClicked({ ...row.data, button });
					};
				}

				throw TreeEngineError.TypeError("TreeEngine.Type", {
					expect: "A TreeModel.TreeNodeActionButton button",
					actual: button
				});
			},
			[closeContextMenuHandler, onInsertChildNodeButtonClicked, row.data, onNodeEventButtonClicked]
		);
	}

	export function useIconGetter(): (props: RowAction.Props) => React.ReactNode {
		const models = useTreeEngineState(ModelSelector.models());
		const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);

		return React.useCallback(
			(rowActionProps) => {
				if (rowActionProps.icon) {
					return rowActionProps.icon;
				}
				const { rowActionModel } = rowActionProps;

				let icon: TreeModel.Icon | undefined = rowActionModel.icon;
				if (TreeModel.TreeNodeInsertActionButton.isAssignableFrom(rowActionModel) && rowActionModel.useGlobalIcon) {
					const { documentModelRef } = rowActionModel;
					const nodeModel = documentModelRef ? ModelSelector.nodeModel(documentModelRef)({ models }) : undefined;
					icon = nodeModel?.icon;
				}
				return icon && <Icon iconTheme={icon.theme}>{icon.name}</Icon>;
			},
			[models, Icon]
		);
	}

	export function useInsertActionProperties(
		button: TreeModel.TreeNodeActionButton
	): Pick<
		TreeModel.TreeNodeInsertActionButton,
		"useTitleFromDocumentModel" | "useLabelFromDocumentModel" | "useGlobalIcon" | "documentModelRef"
	> {
		return React.useMemo(() => (TreeModel.TreeNodeInsertActionButton.isAssignableFrom(button) ? button : {}), [button]);
	}

	export function useRowsSelect() {
		const onNodeRangeSelectionClicked = useTreeEngineContext(
			(context) => context.eventHandlers.onNodeRangeSelectionClicked
		);

		const rowCheckboxHandler = RowCheckboxHandler.useHandler();

		return React.useCallback(
			(event: React.MouseEvent<Element, MouseEvent>, row: FlattenNodeRow) => {
				event.stopPropagation();

				if (event.shiftKey) {
					onNodeRangeSelectionClicked({ nodePath: row.data.nodePath });
					return;
				} else {
					rowCheckboxHandler({ row })?.();
					return;
				}
			},
			[onNodeRangeSelectionClicked, rowCheckboxHandler]
		);
	}
}

/** @internal */
export namespace RowActionGroupHooks {
	export function useVisibilityFilter() {
		const visibilityGetter = RowActionHooks.useVisibilityGetter();

		return React.useCallback(
			(
				row: FlattenNodeRow,
				actionGroups: (TreeModel.TreeNodeActionGroup | TreeModel.TreeNodeAddGroup)[]
			): TreeModel.TreeNodeActionGroup[] => {
				return actionGroups
					.map((group) => ({ ...group, actions: group.actions.filter((action) => visibilityGetter(row, action)) }))
					.filter((group) => group.actions.length > 0);
			},
			[visibilityGetter]
		);
	}

	export function useRightClickGroupsGetter() {
		const virtualRoot = useTreeEngineState((state) => state.models.uiModel.content.configuration.virtualRoot);

		return React.useCallback(
			(row: FlattenNodeRow): TreeModel.TreeNodeActionGroup[] => {
				const isRootNode = RootNodeRow.isAssignableFrom(row);

				const rowActions = (isRootNode ? virtualRoot : row.nodeModel)?.actions ?? [];
				const rowActionGroup: TreeModel.TreeNodeActionGroup = {
					name: "rowActions",
					actions: rowActions.map((action) => ({ ...action, label: action.label ?? action.description }))
				};

				const contextMenuGroups = (isRootNode ? virtualRoot?.contextMenu : row.nodeModel.contextMenu)?.groups ?? [];

				return [rowActionGroup, ...contextMenuGroups];
			},
			[virtualRoot]
		);
	}
}

/** @internal */
export enum PasteEvent {
	AS_CHILD = "event_paste",
	ABOVE = "event_paste_above",
	BELOW = "event_paste_below"
}
