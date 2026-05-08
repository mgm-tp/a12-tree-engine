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

import { type TreeEngineBaseError, TreeEngineError } from "../../error/index.js";

/** @internal */
export interface InvalidTreeModelErrorOptions {
	object: object;
	location: string;
	reason?: string;
}

/** @internal */
export function InvalidTreeModelError(options: InvalidTreeModelErrorOptions): TreeEngineBaseError {
	const { location, object, reason } = options;
	const stringifyObject = JSON.stringify(object, undefined, 2);
	const stringifyLocation = location ? `${location} in tree model` : `tree model`;
	const stringifyReason = reason ? `Reason: "${reason}". ` : undefined;

	return new TreeEngineError({
		name: "InvalidTreeModelError",
		errorCode: "INVALID_TREE_MODEL",
		message: `Invalid ${stringifyLocation}. ${stringifyReason}Object:\n${stringifyObject}`
	});
}

/** @internal */
export interface MissingPropertyErrorOptions {
	fields: string | string[];
	object: object;
	location?: string;
}

/** @internal */
export function MissingPropertyError(options: MissingPropertyErrorOptions): TreeEngineBaseError {
	const { fields, location, object } = options;
	const stringifyFields = fields instanceof Array ? fields.map((f) => `"${f}"`).join(", ") : `"${fields}"`;
	const stringifyObject = JSON.stringify(object, undefined, 2);
	const stringifyLocation = location ? `${location} in tree model` : `tree model`;

	return new TreeEngineError({
		name: "InvalidTreeModelError",
		errorCode: "MISSING_PROPERTY_TREE_MODEL",
		message: `Invalid ${stringifyLocation}. Reason: missing ${stringifyFields}. Object:\n${stringifyObject}`
	});
}
