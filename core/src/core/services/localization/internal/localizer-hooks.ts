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

import React from "react";

import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { type LocalizableArgs, type LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";
import { type ModelPath } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import { type FieldInstanceValue } from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/api.js";

import { useTreeEngineState } from "../../../view/index.js";

import { LocalizableFactory } from "./localizable-factory.js";

export namespace LocalizerHooks {
	export function useLocalizedResource() {
		const { localizer } = React.useContext(LocalizerContext);

		return React.useCallback(
			(resourceKey: string, args?: LocalizableArgs): string => {
				const localizables = LocalizableFactory.createResourceLocalizables(resourceKey, args);

				return localizer(...localizables) || "";
			},
			[localizer]
		);
	}

	export function useLocalizedTreeElement() {
		const { localizer } = React.useContext(LocalizerContext);
		const treeModelId = useTreeEngineState((state) => state.models.uiModel.header.id);

		return React.useCallback(
			(keys: string[], texts: LocalizedModelText | undefined): string => {
				const localizables = LocalizableFactory.createTreeElementLocalizables(treeModelId, keys, texts);

				return localizer(...localizables) || "";
			},
			[localizer, treeModelId]
		);
	}

	export function useLocalizedEnumerationValue() {
		const { localizer } = React.useContext(LocalizerContext);

		return React.useCallback(
			(documentModelName: string, path: ModelPath, value: DocumentModel.EnumValue): string => {
				const localizables = LocalizableFactory.createEnumerationValueLocalizables(documentModelName, path, value);

				return localizer(...localizables) || "";
			},
			[localizer]
		);
	}

	export function useLocalizedBooleanValue() {
		const { localizer } = React.useContext(LocalizerContext);

		return React.useCallback(
			(documentModelName: string, path: ModelPath, value: FieldInstanceValue): string => {
				if (typeof value !== "boolean" && value !== null) {
					throw new Error("Boolean values must be either true, false or null");
				}
				const localizables = LocalizableFactory.createBooleanValueLocalizables(documentModelName, path, value);

				return localizer(...localizables) || "";
			},
			[localizer]
		);
	}

	export function useLocalizedConfirmValue() {
		const { localizer } = React.useContext(LocalizerContext);

		return React.useCallback(
			(documentModelName: string, path: ModelPath, value: FieldInstanceValue): string => {
				if (value !== true && value !== null) {
					throw new Error("Confirm values must be either true or null");
				}
				const localizables = LocalizableFactory.createConfirmValueLocalizables(documentModelName, path, value);

				return localizer(...localizables) || "";
			},
			[localizer]
		);
	}
}
