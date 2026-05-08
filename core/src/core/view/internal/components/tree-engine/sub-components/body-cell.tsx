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

import { Attachment } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { useTreeTableContext } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/utils.js";
import { type Styleable } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/base-props.js";
import { type Column } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/column.api.js";
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { type FieldInstanceValue, type GroupInstance } from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/api.js";
import { type ModelPath } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";

import { RESOURCE_KEYS, LocalizerHooks } from "../../../../../services/localization/index.js";
import { MultiSelect, MultiSelectGroup } from "../../../../../services/multi-select/index.js";
import { ModelSelector, CellSelector } from "../../../../../store/index.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context-provider.js";
import { useTreeEngineRowContext, useEitherRowOrParentRowState } from "../../../context/row-context.js";
import { DocumentModelUtils, DocumentUtils, TreeModelUtils } from "../../../../../models/internal/shared.js";
import { TreeEngineError } from "../../../../../error/index.js";
import { TreeModel } from "../../../../../models/index.js";

import { type FlattenNodeRow, type TreeEngineDataColumn } from "./types.js";
import { NodeConfigurationHook } from "./hooks/node-configuration-hook.js";

export namespace BodyCell {
	export interface Props extends Styleable {
		readonly columnRef: string;
		readonly row: FlattenNodeRow;
	}
}

/** @internal */
export const BodyCell: React.FC<BodyCell.Props> = React.memo(function BodyCell(props) {
	const { columnRef } = props;

	const linkRelationshipModel = useEitherRowOrParentRowState(props.row, (context) => context.link?.identifier.type);
	const isCircularNode = useTreeEngineRowContext((context) => context.isCircular);
	const uiModel = useTreeEngineState(ModelSelector.uiModel());

	const initialExpansionPrevented = React.useMemo<boolean | undefined>(() => {
		const isHierarchicalColumn = columnRef === uiModel.content.configuration.hierarchicalColumnRef;

		return isHierarchicalColumn ? isCircularNode : undefined;
	}, [columnRef, isCircularNode, uiModel.content.configuration]);

	const isDocumentBodyCell = React.useMemo<boolean>(() => {
		return !!TreeModelUtils.findColumnById(props.row.nodeModel.columns, columnRef);
	}, [columnRef, props.row.nodeModel]);

	const isLinkDocumentBodyCell = React.useMemo<boolean>(() => {
		const parentNodeModel = props.row.parent?.nodeModel;
		const childRelationshipConfiguration = parentNodeModel?.childRelationshipConfigurations.find(
			({ relationshipModelRef }) => linkRelationshipModel === relationshipModelRef
		);
		return !!TreeModelUtils.findColumnById(childRelationshipConfiguration?.columns, columnRef);
	}, [props.row.parent?.nodeModel, linkRelationshipModel, columnRef]);

	const DocumentBodyCellComponent = useTreeEngineContext((context) => context.componentMap.DocumentBodyCell);
	const LinkDocumentBodyCellComponent = useTreeEngineContext((context) => context.componentMap.LinkDocumentBodyCell);
	if (isDocumentBodyCell) {
		return initialExpansionPrevented ? (
			<div className={addPrefix("-u-flex", "-u-items-center")}>
				<DocumentBodyCellComponent {...props} />
				<InitialExpansionPreventionTooltip />
			</div>
		) : (
			<DocumentBodyCellComponent {...props} />
		);
	} else if (isLinkDocumentBodyCell) {
		return <LinkDocumentBodyCellComponent {...props} />;
	}
	return null;
});

/** @internal */
export const DocumentBodyCell: React.FC<BodyCell.Props> = React.memo(function DocumentBodyCell(props) {
	const { columnRef } = props;

	const BodyCellUIValueComponent = useTreeEngineContext((context) => context.componentMap.BodyCellUIValue);

	const documentModelSelector = React.useMemo(
		() => ModelSelector.documentModelByName(props.row.nodeModel.documentModelRef),
		[props.row.nodeModel.documentModelRef]
	);
	const documentModel = useTreeEngineState(documentModelSelector);

	const documentModelPath = React.useMemo(() => {
		return TreeModelUtils.findColumnById(props.row.nodeModel.columns, columnRef)?.elementPath;
	}, [columnRef, props.row.nodeModel.columns]);

	const element = useElement(documentModel, documentModelPath);

	const valueSelector = React.useMemo(() => {
		return CellSelector.instanceValue(props.row.data.nodeIdentifier, documentModelPath, element);
	}, [documentModelPath, element, props.row.data.nodeIdentifier]);
	const value = useTreeEngineState(valueSelector);

	if (!element || value === undefined || !documentModel || !documentModelPath) {
		return null;
	}
	return (
		<BodyCellUIValueComponent
			{...props}
			element={element}
			value={value}
			documentModelName={documentModel.header.id}
			documentModelPath={documentModelPath}
			documentId={props.row.data.nodeIdentifier.id}
		/>
	);
});

/** @internal */
export const LinkDocumentBodyCell: React.FC<BodyCell.Props> = React.memo(function LinkDocumentBodyCell(props) {
	const { columnRef } = props;

	const linkIdentifier = useEitherRowOrParentRowState(props.row, (context) => context.link?.identifier);
	const relationshipModel = useEitherRowOrParentRowState(
		props.row,
		(context) => context.link?.linkRef.linkDescriptor.relationshipModel
	);
	const parentNodeModel = props.row.parent?.nodeModel;

	const linkDocumentModelPath = React.useMemo<ModelPath | undefined>(() => {
		let path: ModelPath | undefined = undefined;
		parentNodeModel?.childRelationshipConfigurations.forEach(({ columns }) => {
			path ||= TreeModelUtils.findColumnById(columns, columnRef)?.elementPath;
		});
		return path;
	}, [columnRef, parentNodeModel]);

	const linkDocumentModel = useTreeEngineState((state) => {
		return relationshipModel ? ModelSelector.linkDocumentModel(relationshipModel)(state) : undefined;
	});

	const element = useElement(linkDocumentModel, linkDocumentModelPath);

	const valueSelector = React.useMemo(() => {
		if (!linkIdentifier) {
			return () => undefined;
		}
		return CellSelector.linkDocumentInstanceValue(linkIdentifier, linkDocumentModelPath, element);
	}, [element, linkDocumentModelPath, linkIdentifier]);
	const value = useTreeEngineState(valueSelector);

	const BodyCellUIValueComponent = useTreeEngineContext((context) => context.componentMap.BodyCellUIValue);
	if (!linkIdentifier || value === undefined || !element || !linkDocumentModel || !linkDocumentModelPath) {
		return null;
	}

	return (
		<BodyCellUIValueComponent
			{...props}
			element={element}
			value={value}
			documentModelName={linkDocumentModel.header.id}
			documentModelPath={linkDocumentModelPath}
			documentId={linkIdentifier.id}
		/>
	);
});

function useElement(documentModel?: DocumentModel, documentModelPath?: ModelPath): DocumentModel.Element | undefined {
	return React.useMemo(() => {
		if (!documentModel || !documentModelPath) {
			return undefined;
		}
		try {
			return DocumentModelUtils.findByPath(documentModel, documentModelPath);
		} catch (e) {
			return undefined;
		}
	}, [documentModel, documentModelPath]);
}

export namespace BodyCellUIValue {
	export interface Props extends BodyCell.Props {
		readonly element: DocumentModel.Field | DocumentModel.Group;
		readonly value: GroupInstance[] | GroupInstance | FieldInstanceValue;
		readonly documentModelName: string;
		readonly documentModelPath: ModelPath;
		readonly documentId: string;
	}
}

/** @internal */
export const BodyCellUIValue: React.FC<BodyCellUIValue.Props> = React.memo(function BodyCellUIValue(props) {
	const { element, value, documentModelName, documentModelPath, documentId, row, columnRef } = props;

	const AttachmentCell = useTreeEngineContext((context) => context.componentMap.AttachmentCell);
	const MultiSelectCell = useTreeEngineContext((context) => context.componentMap.MultiSelectCell);

	const nodeConfigurationGetter = NodeConfigurationHook.useTreeNodeConfiguration({
		row,
		columnRef
	});

	const columns: TreeEngineDataColumn[] = useTreeTableContext<FlattenNodeRow, TreeEngineDataColumn>(
		(context) => context.columns
	);
	const treeTableColumn = columns.find((col) => col.columnModel?.id === columnRef);
	if (!treeTableColumn) {
		throw new Error(`Couldn't find column ${columnRef}`);
	}
	const alignment = treeTableColumn?.specificHorizontalAlignment?.body;

	if (element.type === "Field") {
		return <FieldCell {...props} alignment={alignment} />;
	}

	if (DocumentModelUtils.isAttachment(element)) {
		const attachment = value ?? {};
		if (DocumentUtils.isGroupInstance(attachment) && Attachment.isInstance(attachment)) {
			const displayMode = nodeConfigurationGetter("attachmentDisplayMode") || TreeModel.AttachmentDisplayMode.PREVIEW;

			return (
				<AttachmentCell
					documentId={documentId}
					attachment={attachment}
					displayMode={displayMode as TreeModel.AttachmentDisplayMode}
					columnRef={columnRef}
					row={props.row}
				/>
			);
		}
		return null;
	}

	if (MultiSelectGroup.isInstance(element)) {
		if (DocumentUtils.isGroupInstanceArray(value)) {
			const displayMode = nodeConfigurationGetter("multiSelectDisplayMode") || TreeModel.MultiSelectDisplayMode.DEFAULT;

			return (
				<MultiSelectCell
					{...props}
					displayMode={displayMode as TreeModel.MultiSelectDisplayMode}
					alignment={alignment}
					data={MultiSelect.from(value)}
					documentModelName={documentModelName}
					documentModelPath={documentModelPath}
				/>
			);
		}
		return null;
	}

	throw TreeEngineError.TypeError("DocumentModel.Element", { expect: "Support element", actual: element });
});

const FieldCell: React.FC<BodyCellUIValue.Props & { alignment?: Column.HorizontalAlignment }> = React.memo(
	function FieldCell(props) {
		const { element, value, documentModelName, documentModelPath, alignment } = props;

		const localizedEnumerationValue = LocalizerHooks.useLocalizedEnumerationValue();
		const localizedBooleanValue = LocalizerHooks.useLocalizedBooleanValue();
		const localizedConfirmValue = LocalizerHooks.useLocalizedConfirmValue();

		const converter = useTreeEngineContext((context) => context.converter);
		const rowHeight = useTreeEngineState((state) => state.models.uiModel.content.configuration.rowHeight);
		const CustomFieldTypeCell = useTreeEngineContext((context) => context.componentMap.CustomFieldTypeCell);
		const TextOutput = useTreeEngineContext((context) => context.widgetMap.TextOutput);
		const CssEllipsis = useTreeEngineContext((context) => context.widgetMap.CssEllipsis);

		const documentModelSelector = React.useMemo(
			() => ModelSelector.documentModelByName(props.documentModelName),
			[props.documentModelName]
		);
		const documentModel = useTreeEngineState(documentModelSelector);

		if (element.type !== "Field" || !DocumentUtils.isFieldInstanceValue(value)) {
			throw TreeEngineError.TypeError("DocumentModel.Element", { expect: "Field element", actual: element });
		}

		let uiValue: React.ReactNode = null;
		try {
			switch (element.fieldType.type) {
				case "EnumerationType": {
					if (typeof value === "string") {
						const enumValue = element.fieldType.values.find((enumValue) => enumValue.value === value);
						if (enumValue) {
							uiValue = localizedEnumerationValue(documentModelName, documentModelPath, enumValue) || value;
						}
					}
					break;
				}
				case "BooleanType":
					uiValue = localizedBooleanValue(documentModelName, documentModelPath, value);
					break;
				case "ConfirmType":
					uiValue = localizedConfirmValue(documentModelName, documentModelPath, value);
					break;
				case "StringType": {
					if (!documentModel) {
						throw TreeEngineError.NotFoundError("DocumentModel", documentModelName);
					}
					const formattedValue = converter.formatValue(documentModel, documentModelPath, value);
					if (formattedValue && element.fieldType.lineBreaksPermitted) {
						uiValue = formattedValue.split("\n").map((text, index) => (
							<React.Fragment key={index}>
								{text}
								<br />
							</React.Fragment>
						));
					} else {
						uiValue = formattedValue;
					}
					break;
				}
				case "CustomFieldType":
					if (typeof value === "string" || value === null) {
						return <CustomFieldTypeCell {...props} value={value} alignment={alignment} />;
					}
					break;
				default: {
					if (!documentModel) {
						throw TreeEngineError.NotFoundError("DocumentModel", documentModelName);
					}
					uiValue = converter.formatValue(documentModel, documentModelPath, value);
				}
			}
		} catch (e) {
			// This try-catch is placed to catch any error caused by stale props
			return uiValue;
		}

		return (
			<TextOutput {...props} alignment={alignment} disableParagraphWrapping>
				{rowHeight ? <CssEllipsis useTooltip>{uiValue}</CssEllipsis> : uiValue}
			</TextOutput>
		);
	}
);

/** @internal */
export const InitialExpansionPreventionTooltip: React.ComponentType = () => {
	const Tooltip = useTreeEngineContext((context) => context.widgetMap.Tooltip);
	const Button = useTreeEngineContext((context) => context.widgetMap.Button);
	const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	return (
		<Tooltip
			className={addPrefix("-u-margin-1-base")}
			text={localizedResource(RESOURCE_KEYS.treeEngine.circularWarning)}>
			<Button
				icon={
					<Icon showTitleAsTooltip={false} variant="warning">
						loop
					</Icon>
				}
			/>
		</Tooltip>
	);
};
