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

import { call, type SagaGenerator } from "typed-redux-saga";

import { type Relationship } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { maybeAsyncFnWrapper } from "../../../client/index.js";

import { type A12DataServicesSetting } from "./a12-data-services-setting.js";

/** @internal */
export function* getNewLinkPosition(params: {
	activityId: string;
	relationshipModel: string;
	dataServicesSetting?: A12DataServicesSetting;
}): SagaGenerator<Relationship.LinkPosition | undefined> {
	const { dataServicesSetting, activityId, relationshipModel } = params;
	let position: Relationship.LinkPosition | undefined;
	const newLinkPositionSetting = dataServicesSetting?.addLink?.newLinkPosition;
	if (typeof newLinkPositionSetting === "function") {
		position = yield* call(maybeAsyncFnWrapper(newLinkPositionSetting), {
			activityId,
			relationshipModelRef: relationshipModel
		});
	} else {
		position = newLinkPositionSetting;
	}
	return position;
}
