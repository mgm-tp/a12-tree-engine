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

import type * as React from "react";
import type { Middleware } from "redux";
import type { SagaGenerator } from "typed-redux-saga";

import type { ActivityReducers, Module, DataProvider, View } from "@com.mgmtp.a12.client/client-core";

import { createTreeEngineClientDataReducers } from "./data-reducers/index.js";
import { createLinkFormEngineDataProvider } from "./data-providers/link-form-engine-data-provider.js";
import { createTreeEngineClientMiddlewares } from "./middlewares/index.js";
import { createTreeEngineSagas } from "./sagas/index.js";
import type { TreeEngineSaga } from "./sagas/saga-setting.js";
import { TreeEngineClientContainer, treeEngineClientViewComponentProvider } from "./views/container.js";

export namespace TreeEngineFactories {
	export const createDataReducers: () => ActivityReducers.DataReducer[] = createTreeEngineClientDataReducers;

	export const createMiddlewares: () => Middleware[] = createTreeEngineClientMiddlewares;

	export const createDataProvider: () => DataProvider = createLinkFormEngineDataProvider;

	export const createSagas: (config: TreeEngineSaga.Setting) => (() => SagaGenerator<void>)[] = createTreeEngineSagas;

	export type ViewComponentProps = TreeEngineClientContainer.Props;
	export const ViewComponent: React.ComponentType<ViewComponentProps> = TreeEngineClientContainer;
	export const viewComponentProvider: (componentName: string) => React.ComponentType<View> | undefined =
		treeEngineClientViewComponentProvider;

	export function createModule(moduleSettings: ModuleSettings = {}): Module {
		return {
			id: "TreeEngineClientModule",
			dataProviders: () => [createDataProvider()],
			dataReducers: () => createDataReducers(),
			sagas: () => createSagas(moduleSettings.sagaSetting ?? {}),
			middlewares: () => createMiddlewares(),
			views: () => viewComponentProvider
		};
	}

	export interface ModuleSettings {
		sagaSetting?: TreeEngineSaga.Setting;
	}
}

export * from "./operation.js";
export * from "./data-holder.js";
export * from "./actions.js";
export * from "./selectors.js";
export * from "./views/container.js";
export * from "./views/heterogeneous-insert-child-node-dialog.js";
export * from "./views/heterogeneous-insert-root-node-dialog.js";
export * from "./sagas/saga-registration.js";
export * from "./sagas/saga-setting.js";

export type { MaybeAsync } from "./utils.js";
export { maybeAsyncFnWrapper } from "./utils.js";
