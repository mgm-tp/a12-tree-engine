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

import { type SagaGenerator, put } from "typed-redux-saga";

import type { Activity, DataProvider } from "@com.mgmtp.a12.client/client-core";

import { TreeEngineError } from "../../../core/error/tree-engine-error.js";

/**
 * This data provider is meant to block the default data provider for form engine.
 * It will omit the server request stage of the Form Engine and directly dispatch the DONE action.
 * @internal
 */
export function createLinkFormEngineDataProvider(): DataProvider {
	return {
		name: "LinkFormEngineDataProvider",
		canHandle(config: DataProvider.CanHandleConfig): boolean {
			return config.operation === "save" && config.dataHolder.descriptor["linkForm"] === "true";
		},
		*provideData(config: DataProvider.ProvideDataConfig): SagaGenerator<void> {
			if (config.operation !== "save") {
				throw TreeEngineError.TypeError("TreeEngine.Operation", {
					expect: `"Save" operation`,
					actual: config.operation
				});
			}
			const { dataHolders, details } = config;

			const documentDataHolder = dataHolders.find(DocumentDataHolder.isAssignableFrom);
			if (!documentDataHolder?.data) {
				throw TreeEngineError.TypeError("DataHolder", { expect: "DocumentDataHolder", actual: documentDataHolder });
			}

			const { document } = documentDataHolder.data;
			const { dirty } = documentDataHolder;
			yield* put(details.saving.done({ document, dirty }));
		}
	};
}

namespace DocumentDataHolder {
	export function isAssignableFrom(
		dataHolder: Activity.DataHolder
	): dataHolder is Activity.DataHolder<{ document: object }> {
		return (
			!!dataHolder.data &&
			typeof dataHolder.data === "object" &&
			typeof (dataHolder.data as Record<string, unknown>)["document"] === "object"
		);
	}
}
