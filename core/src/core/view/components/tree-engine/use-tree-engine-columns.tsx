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

import type { RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { type RuntimeTreeModel, TreeModel } from "../../../models/tree-model.js";
import { DocumentModelUtils, TreeModelUtils } from "../../../models/shared.js";
import { LocalizerHooks } from "../../../services/localization/localizer-hooks.js";
import { TreeModelKeys } from "../../../services/localization/tree-model-keys.js";
import { ModelSelector } from "../../../store/selectors/models.js";
import { UIStateSelector } from "../../../store/selectors/ui-state.js";
import { useTreeEngineContext, useTreeEngineState } from "../../context/tree-engine-context.js";
import { TreeEngineError } from "../../../error/tree-engine-error.js";

import {
	RootNodeRow,
	type TreeEngineActionColumn,
	type TreeEngineColumn,
	type TreeEngineDataColumn
} from "./sub-components/types.js";

/** @internal **/
export function useTreeEngineColumns(): TreeEngineColumn[] {
	const RowActionsGroup = useTreeEngineContext((context) => context.componentMap.RowActionsGroup);
	const BodyCell = useTreeEngineContext((context) => context.componentMap.BodyCell);
	const OverallCheckbox = useTreeEngineContext((context) => context.componentMap.OverallCheckbox);
	const RowCheckbox = useTreeEngineContext((context) => context.componentMap.RowCheckbox);
	const VirtualRootBodyCell = useTreeEngineContext((context) => context.componentMap.VirtualRootBodyCell);
	const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);
	const HiddenText = useTreeEngineContext((context) => context.widgetMap.HiddenText);
	const VirtualRootRowActionsGroup = useTreeEngineContext((context) => context.componentMap.VirtualRootRowActionsGroup);

	const columnWidths = useTreeEngineState(UIStateSelector.columnWidths());
	const uiModel = useTreeEngineState(ModelSelector.uiModel());

	const expandedMultiSelectionPanel = useTreeEngineState(UIStateSelector.expandedMultiSelectionPanel());
	const {
		documentModels,
		modelGraph: { relationshipModels }
	} = useTreeEngineState(ModelSelector.models());

	const hierarchicalColumnIndex = React.useMemo(() => {
		return uiModel.content.columns.findIndex(({ id }) => uiModel.content.configuration.hierarchicalColumnRef === id);
	}, [uiModel]);

	const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();

	return React.useMemo(() => {
		const columns: TreeEngineColumn[] = uiModel.content.columns.map<TreeEngineDataColumn>((column, index) => {
			let headerHorizontalAlignment = column.alignment?.header?.horizontal;
			let contentHorizontalAlignment = column.alignment?.content?.horizontal;
			if (
				(!headerHorizontalAlignment || !contentHorizontalAlignment) &&
				index !== hierarchicalColumnIndex &&
				isNumberTypeColumn(column, uiModel, documentModels, relationshipModels)
			) {
				headerHorizontalAlignment ??= TreeModel.HorizontalAlignment.RIGHT;
				contentHorizontalAlignment ??= TreeModel.HorizontalAlignment.RIGHT;
			}

			const specificHorizontalAlignment: TreeEngineColumn["specificHorizontalAlignment"] = {
				head: headerHorizontalAlignment,
				body: contentHorizontalAlignment
			};

			const specificVerticalAlignment: TreeEngineColumn["specificVerticalAlignment"] = {
				head: column.alignment?.header?.vertical || TreeModel.VerticalAlignment.MIDDLE,
				body: column.alignment?.content?.vertical || TreeModel.VerticalAlignment.TOP
			};

			const labelText = localizedTreeElement([TreeModelKeys.getColumnsKey(), column.id], column.label);
			const showLabel = () => {
				if (!labelText) {
					return undefined;
				}
				if (!column.labelHidden) {
					return <span>{labelText}</span>;
				}
				if (!column.icon) {
					return <HiddenText>{labelText}</HiddenText>;
				}
				return undefined;
			};

			const label = (
				<React.Fragment>
					{column.icon && (
						<Icon iconTheme={column.icon.theme} title={column.labelHidden ? labelText : undefined}>
							{column.icon.name}
						</Icon>
					)}
					{showLabel()}
				</React.Fragment>
			);

			return {
				id: column.id,
				type: "data",
				label,
				hierarchical: index === hierarchicalColumnIndex,
				pinning: column.pinDirection,
				specificHorizontalAlignment,
				specificVerticalAlignment,
				fixedWidth: column.fixedWidth,
				width: columnWidths?.[column.id] ?? column.width,
				sortable: false,
				dataGetter: ({ row }) =>
					RootNodeRow.isAssignableFrom(row) ? (
						<VirtualRootBodyCell columnRef={column.id} row={row} />
					) : (
						<BodyCell columnRef={column.id} row={row} />
					),
				columnModel: column
			};
		});

		const nodeModels = uiModel.content.nodes;
		const { virtualRoot: virtualRootModel, actionColumnWidth, enableVirtualScroll } = uiModel.content.configuration;
		const hasAction =
			nodeModels.some((node) => node.actions.length || node.contextMenu?.groups.length) ||
			!!virtualRootModel?.actions?.length ||
			!!virtualRootModel?.contextMenu?.groups.length;

		if (hasAction) {
			const actionColumn: TreeEngineActionColumn = {
				type: "action",
				actionColumn: true,
				dataGetter: ({ row }) =>
					RootNodeRow.isAssignableFrom(row) ? <VirtualRootRowActionsGroup row={row} /> : <RowActionsGroup row={row} />,
				horizontalAlignment: "right",
				verticalAlignment: "middle",
				pinning: "right",
				sortable: false,
				label: null,
				width: actionColumnWidth
			};

			columns.push(actionColumn);
		}

		if (expandedMultiSelectionPanel) {
			const checkboxColumn: TreeEngineActionColumn = {
				type: "action",
				actionColumn: true,
				label: !virtualRootModel ? <OverallCheckbox /> : undefined,
				dataGetter: ({ row }) => (RootNodeRow.isAssignableFrom(row) ? <OverallCheckbox /> : <RowCheckbox row={row} />),
				horizontalAlignment: "left",
				verticalAlignment: "middle",
				pinning: "left",
				sortable: false,
				width: enableVirtualScroll ? 0.3 : undefined
			};

			columns.unshift(checkboxColumn);
		}
		return columns;
	}, [
		uiModel,
		expandedMultiSelectionPanel,
		hierarchicalColumnIndex,
		documentModels,
		relationshipModels,
		localizedTreeElement,
		Icon,
		columnWidths,
		HiddenText,
		VirtualRootBodyCell,
		BodyCell,
		VirtualRootRowActionsGroup,
		RowActionsGroup,
		OverallCheckbox,
		RowCheckbox
	]);
}

/** @internal */
export function isNumberTypeColumn(
	column: TreeModel.Column,
	uiModel: RuntimeTreeModel,
	documentModels: DocumentModel[],
	relationshipModels: RelationshipModel[]
): boolean {
	const listElementInfo: { elementPath: ModelPath; modelName: string }[] = [];
	for (const node of uiModel.content.nodes) {
		let matchedColumn = TreeModelUtils.findColumnById(node.columns, column.id);
		if (matchedColumn) {
			listElementInfo.push({
				elementPath: matchedColumn.elementPath,
				modelName: node.documentModelRef
			});
		}

		for (const { columns = [], relationshipModelRef } of node.childRelationshipConfigurations) {
			matchedColumn = TreeModelUtils.findColumnById(columns, column.id);
			const relationshipModel = relationshipModels.find((model) => model.header.id === relationshipModelRef);
			const modelName = relationshipModel?.content.linkDocumentModel;
			if (modelName && matchedColumn) {
				listElementInfo.push({ elementPath: matchedColumn.elementPath, modelName });
			}
		}
	}

	if (listElementInfo.length === 0) {
		return false;
	}

	return listElementInfo.every(({ elementPath, modelName }) => {
		const documentModel = documentModels.find((model) => model.header.id === modelName);
		if (!documentModel) {
			throw TreeEngineError.NotFoundError("DocumentModel", modelName);
		}

		const element = DocumentModelUtils.findByPath(documentModel, elementPath);
		return element.type === "Field" && element.fieldType.type === "NumberType";
	});
}
