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

import type { Styleable, Column } from "@com.mgmtp.a12.widgets/widgets-core";
import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

import { TreeModel } from "../../../../models/tree-model.js";
import { MultiSelect, MultiSelectGroup } from "../../../../services/multi-select/multi-select.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";
import { ModelSelector } from "../../../../store/selectors/models.js";
import { DocumentModelUtils } from "../../../../models/shared.js";
import { TreeEngineError } from "../../../../error/tree-engine-error.js";
import { LocalizerHooks } from "../../../../services/localization/localizer-hooks.js";

export namespace MultiSelectCell {
	export interface Props extends Styleable {
		readonly documentModelName: string;
		readonly documentModelPath: ModelPath;
		readonly data: MultiSelect;
		readonly displayMode?: TreeModel.MultiSelectDisplayMode;
		readonly alignment?: Column.HorizontalAlignment;
	}
}

const COMMA_WITH_SPACE = ", ";

/** @internal */
export const MultiSelectCell: React.FC<MultiSelectCell.Props> = (props) => {
	const { alignment, displayMode = TreeModel.MultiSelectDisplayMode.DEFAULT } = props;

	const rowHeight = useTreeEngineState((context) => context.models.uiModel.content.configuration.rowHeight);
	const TextOutput = useTreeEngineContext((context) => context.widgetMap.TextOutput);
	const CssEllipsis = useTreeEngineContext((context) => context.widgetMap.CssEllipsis);
	const UnorderedBulletList = useTreeEngineContext((context) => context.widgetMap.UnorderedBulletList);
	const BulletListItem = useTreeEngineContext((context) => context.widgetMap.BulletListItem);
	const labels = useLabels(props);

	const content = React.useMemo(() => {
		const joinedTextLabelsByComma = labels.join(COMMA_WITH_SPACE);

		if (rowHeight) {
			return <CssEllipsis useTooltip>{joinedTextLabelsByComma}</CssEllipsis>;
		}

		if (displayMode === TreeModel.MultiSelectDisplayMode.COMMA_SEPARATED || labels.length === 1) {
			return joinedTextLabelsByComma;
		}

		return (
			<UnorderedBulletList indent={false}>
				{labels.map((label, index) => (
					<BulletListItem key={index}>{label}</BulletListItem>
				))}
			</UnorderedBulletList>
		);
	}, [displayMode, labels, rowHeight, BulletListItem, CssEllipsis, UnorderedBulletList]);

	if (labels.length === 0) {
		return null;
	}

	return (
		<TextOutput {...props} alignment={alignment} disableParagraphWrapping>
			{content}
		</TextOutput>
	);
};

/** @internal */
export function useLabels(params: MultiSelectCell.Props): string[] {
	const { documentModelName, documentModelPath, data } = params;
	const documentModel = useTreeEngineState(ModelSelector.documentModelByName(documentModelName));
	const { locale } = React.useContext(LocalizerContext);
	const localizedEnumerationValue = LocalizerHooks.useLocalizedEnumerationValue();

	if (!documentModel) {
		throw TreeEngineError.NotFoundError("DocumentModel", documentModelName);
	}

	return React.useMemo(() => {
		const group = DocumentModelUtils.findByPath(documentModel, documentModelPath);
		if (!MultiSelectGroup.isInstance(group)) {
			throw TreeEngineError.TypeError("TreeEngine.Type", { expect: "MultiSelectGroup type", actual: group });
		}

		const field = MultiSelectGroup.getField(group);
		const enumFieldPath: ModelPath = [...documentModelPath, { elementName: field.name }];
		const element = DocumentModelUtils.findByPath(documentModel, enumFieldPath);
		if (element.type !== "Field" || element.fieldType.type !== "EnumerationType") {
			throw TreeEngineError.TypeError("DocumentModel.Element", { expect: "EnumerationType Field", actual: element });
		}

		const { values, alphabeticalSorting } = element.fieldType;
		const labels = MultiSelect.flatten(data, group).map((value) => {
			const enumValue = values.find((enumValue) => enumValue.value === value);
			if (!enumValue) {
				throw TreeEngineError.TypeError("Document", { expect: "Valid enum value", actual: value });
			}

			return localizedEnumerationValue(documentModelName, enumFieldPath, enumValue);
		});

		if (!alphabeticalSorting) {
			return labels;
		}

		return labels.sort((label1, label2) => label1.localeCompare(label2, locale.language));
	}, [data, documentModel, documentModelName, documentModelPath, locale.language, localizedEnumerationValue]);
}
