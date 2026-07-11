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

import type { DocumentModel, GroupInstance } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { TreeEngineError } from "../../error/tree-engine-error.js";

export interface MultiSelectField extends DocumentModel.Field {
	fieldType: DocumentModel.EnumerationType;
}

export namespace MultiSelectField {
	export function isInstance(element: DocumentModel.Element): element is MultiSelectField {
		return element.type === "Field" && element.fieldType.type === "EnumerationType";
	}
}

export interface MultiSelectGroup extends DocumentModel.Group {
	usageType: "multi-select";
	elements: [MultiSelectField];
}
export namespace MultiSelectGroup {
	export function isInstance(element: DocumentModel.Element): element is MultiSelectGroup {
		return (
			element.type === "Group" &&
			element.usageType === "multi-select" &&
			element.elements.length === 1 &&
			MultiSelectField.isInstance(element.elements[0])
		);
	}

	export function getField(multiSelectGroup: MultiSelectGroup): MultiSelectField {
		return multiSelectGroup.elements[0];
	}
}

export type MultiSelect = ReadonlyArray<{
	/**
	 * @deprecated since 8.3.0. Please use {@link MultiSelect.flatten} instead.
	 */
	readonly value: string;
	readonly [key: string]: string;
}>;

export namespace MultiSelect {
	export function from(objects: ReadonlyArray<GroupInstance>): MultiSelect {
		if (objects.some((object) => Object.keys(object).length !== 1)) {
			throw TreeEngineError.TypeError("TreeEngine.Type", { expect: "MultiSelect type", actual: objects });
		}

		return objects as MultiSelect;
	}

	export function flatten(groupInstances: ReadonlyArray<GroupInstance>, groupModel: MultiSelectGroup): string[] {
		const multiSelectField = MultiSelectGroup.getField(groupModel);

		return groupInstances.map((object) => {
			const value = object[multiSelectField.name];

			if (typeof value !== "string") {
				throw TreeEngineError.TypeError("TreeEngine.Type", { expect: "GroupInstance type", actual: object });
			}

			return value;
		});
	}
}
