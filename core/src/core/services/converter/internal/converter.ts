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

import { type FieldInstanceValue } from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/api.js";
import { ModelPath } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import { type ValueConversion, type ValueConversionConfig } from "@com.mgmtp.a12.utils/utils-localization";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { DocumentModelUtils, DocumentUtils } from "../../../models/internal/shared.js";

/** @internal */
export interface Converter {
	/**
	 * The method for formatting values in document to UI rendered values
	 */
	formatValue(documentModel: DocumentModel, path: ModelPath, value: FieldInstanceValue | object): string;
}

/** @internal */
export function useConverter(): Converter {
	const { conversion } = React.useContext(LocalizerContext);

	const formatValue = React.useCallback(
		(documentModel: DocumentModel, path: ModelPath, value: FieldInstanceValue | object) => {
			const element = DocumentModelUtils.findByPath(documentModel, path);

			if (element.type === "Field" && DocumentUtils.isFieldInstanceValue(value)) {
				const fieldType = element.fieldType.type;

				if (DocumentModelUtils.isLocalizableFieldType(fieldType)) {
					throw new Error(`The element ${ModelPath.toString(path)} should be formatted by a localizer`);
				}

				if (DocumentModelUtils.isFormattableFieldType(fieldType)) {
					return adaptFormatResult(conversion.formatValue(value, getConversionConfig(documentModel, path)));
				}
			}

			throw new Error(`The element ${ModelPath.toString(path)} is not a valid element to be formatted!`);
		},
		[conversion]
	);

	return React.useMemo(() => ({ formatValue }), [formatValue]);
}

const getConversionConfig = (documentModel: DocumentModel, path: ModelPath): ValueConversionConfig => {
	const field = DocumentModelUtils.findByPath(documentModel, path);
	if (field.type !== "Field") {
		throw new Error("Can not compute value conversion config for non-field model elements");
	}

	return {
		...DocumentModel.extractConversionConfig(
			field.fieldType,
			documentModel.content.modelConfig.timeZone,
			documentModel.content.modelInfo.baseYear
		),
		modelId: documentModel.header.id,
		modelPath: path
	};
};

function adaptFormatResult(result: ReturnType<ValueConversion["formatValue"]>): ReturnType<Converter["formatValue"]> {
	return result ?? "";
}
