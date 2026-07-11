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

import type { Module, DataProvider } from "@com.mgmtp.a12.client/client-core";

import type { MaybeAsync } from "../client/index.js";

import type { TreeEngineDataLoader } from "./data-loaders/data-loader.js";
import { createTreeEngineDataProvider } from "./data-providers/index.js";
import type { A12DataServicesSetting } from "./data-loaders/a12-data-services-setting.js";
import type { RequestSelectorMap } from "./request-selector-map.js";

export namespace TreeEngineServerConnectorFactories {
	/** These data providers must be defined before @com.mgmtp.a12.client/client-core/lib/extensions/relationship */
	export const createDataProvider: (moduleSettings?: ModuleSettings) => DataProvider = createTreeEngineDataProvider;

	export function createModule(moduleSettings: ModuleSettings = {}): Module {
		return {
			id: "TreeEngineServerConnectorModule",
			dataProviders: () => [createDataProvider(moduleSettings)]
		};
	}

	export interface ModuleSettings {
		dataLoader?: TreeEngineDataLoader;
		dataServicesSetting?: A12DataServicesSetting;
		cancelChildActivity?: boolean;
		preloadChildNodes?: boolean | undefined | ((activityId: string) => MaybeAsync<boolean | undefined>);
		requestSelectorMap?: RequestSelectorMap;
	}
}

export * from "./types.js";
export * from "./utils.js";
export * from "./types.js";
export * from "./data-loaders/data-loader.js";
export * from "./data-loaders/a12-data-services-setting.js";
export * from "./data-loaders/a12-data-loader.js";
export * from "./request-selector-map.js";
