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

import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import {
	type Localizable,
	type LocalizableArgs,
	type LocalizedModelText,
	localizableFromModel,
	segmentsFromLocalizableKey,
	localizableKeyFromSegments,
	localizableFromLocalizationTreeMap
} from "@com.mgmtp.a12.utils/utils-localization";
import { type ModelPath } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";

import { RESOURCE_KEYS } from "./languages/keys.js";
import { DocumentModelKeys } from "./document-model-keys.js";
import { TreeModelKeys } from "./tree-model-keys.js";
import { en } from "./languages/en.js";
import { de } from "./languages/de.js";

export namespace LocalizableFactory {
	export function createResourceLocalizables(resourceKey: string, args?: LocalizableArgs): Localizable[] {
		return [
			createResourceLocalizable(resourceKey, args),
			createSingleTextLocalizable(segmentsFromLocalizableKey(resourceKey), resourceKey)
		];
	}

	export function createTreeElementLocalizables(
		treeModelName: string,
		keys: string[],
		texts: LocalizedModelText | undefined
	): Localizable[] {
		return [createTextsLocalizable([...TreeModelKeys.getPrefixes(treeModelName), ...keys], texts)];
	}

	export function createEnumerationValueLocalizables(
		documentModelName: string,
		path: ModelPath,
		{ value, label }: DocumentModel.EnumValue
	): Localizable[] {
		const keys = DocumentModelKeys.create(documentModelName, DocumentModelKeys.ENUM_VALUE, path, value);

		return [createTextsLocalizable(keys, label)];
	}

	export function createBooleanValueLocalizables(
		documentModelName: string,
		path: ModelPath,
		value: boolean | null
	): Localizable[] {
		const castedValue = String(value) as "true" | "false" | "null";
		const keys = DocumentModelKeys.create(documentModelName, DocumentModelKeys.BOOLEAN, path, castedValue);

		return [
			createResourceLocalizable(localizableKeyFromSegments(keys)),
			createResourceLocalizable(RESOURCE_KEYS[castedValue]),
			createSingleTextLocalizable(keys, castedValue)
		];
	}

	export function createConfirmValueLocalizables(
		documentModelName: string,
		path: ModelPath,
		value: true | null
	): Localizable[] {
		const castedValue = String(value) as "true" | "null";
		const keys = DocumentModelKeys.create(documentModelName, DocumentModelKeys.CONFIRM, path, castedValue);

		return [
			createResourceLocalizable(localizableKeyFromSegments(keys)),
			createResourceLocalizable(RESOURCE_KEYS[castedValue]),
			createSingleTextLocalizable(keys, castedValue)
		];
	}

	/** @internal */
	export function createTextsLocalizable(keys: string[], texts: LocalizedModelText | undefined): Localizable {
		return localizableFromModel(localizableKeyFromSegments(keys), texts);
	}

	/** @internal */
	export function createResourceLocalizable(resourceKey: string, args?: LocalizableArgs): Localizable {
		return localizableFromLocalizationTreeMap(resourceKey, DEFAULT_RESOURCES, args);
	}

	/** @internal */
	export function createSingleTextLocalizable(keys: string[], text: string): Localizable {
		const texts: LocalizedModelText = Object.keys(DEFAULT_RESOURCES).map((locale) => ({ locale, text }));

		return createTextsLocalizable(keys, texts);
	}
}

const DEFAULT_RESOURCES = { en, de };
