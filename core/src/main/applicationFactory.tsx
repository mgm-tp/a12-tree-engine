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

import {
	type View,
	addView,
	modifyView,
	setConfigured,
	addDataReducers,
	combineFeatures,
	type RequireFeatures,
	addAdditionalMiddlewares,
	type A12ApplicationConfig,
	type ApplicationWithConfiguredFeature,
	addCustomSagas
} from "@com.mgmtp.a12.client/client-core";
import { addSupportedModelVersion } from "@com.mgmtp.a12.client/client-core/modelLoader";

import { TreeEngineServerConnectorFactories } from "../extensions/server-connector/index.js";
import type { TreeEngineSaga } from "../extensions/client/sagas/saga-setting.js";
import { TreeEngineFactories } from "../extensions/client/index.js";

/** @internal */
export const SUPPORTED_MODEL_VERSIONS = "^11.0.0";
const MODEL_TYPE = "tree";

/**
 * We use module augmentation to extend the A12ApplicationConfig type with more options
 * for users, this is applied once they import anything from this file
 * we must use the "internal" path as TS does not support module augmentation for re-exported types
 * See https://github.com/microsoft/TypeScript/issues/12607
 */
declare module "@com.mgmtp.a12.client/client-core" {
	interface A12ApplicationConfig {
		readonly treeEngine?: {
			readonly saga?: TreeEngineSaga.Setting;
			readonly serverConnector?: TreeEngineServerConnectorFactories.ModuleSettings;
			readonly viewConfig?: Partial<Omit<TreeEngineFactories.ViewComponentProps, keyof View>>;
		};
	}
}

/**
 * This describes the treeEngine must not but exist yet.
 * @experimental
 */
export type ApplicationWithTreeEngineConfig = RequireFeatures<
	A12ApplicationConfig,
	{ treeEngine?: never; modelLoader?: never; relationshipEngine: true }
>;

/**
 * @experimental
 */
export const withTreeEngineDataHandlers = <T extends ApplicationWithTreeEngineConfig>(cfg: T): T =>
	({
		...cfg,
		config: {
			...cfg.config,
			// Prepend to prioritized Tree Engine link form to "win" Form Engine & Relationship Engine data providers
			dataHandlers: [
				TreeEngineFactories.createDataProvider(),
				TreeEngineServerConnectorFactories.createDataProvider(cfg.treeEngine?.serverConnector),
				...(cfg.config?.dataHandlers ?? [])
			]
		}
	}) satisfies T;

/**
 * @experimental
 */
export const withTreeEngineDataReducers = <T extends ApplicationWithTreeEngineConfig>(cfg: T) =>
	addDataReducers<T>(...TreeEngineFactories.createDataReducers())(cfg);

/**
 * @experimental
 */
export const withTreeEngineSagas = <T extends ApplicationWithTreeEngineConfig>(cfg: T) => {
	const sagaSetting: TreeEngineSaga.Setting = {
		...cfg.treeEngine?.saga,
		newRelationshipEngine: cfg.configured?.newRelationshipEngine
	};
	return addCustomSagas<T>(...TreeEngineFactories.createSagas(sagaSetting))(cfg);
};

/**
 * @experimental
 */
export const withTreeEngineMiddlewares = <T extends ApplicationWithTreeEngineConfig>(cfg: T) =>
	addAdditionalMiddlewares<T>(...TreeEngineFactories.createMiddlewares())(cfg);
/**
 * @experimental
 */
export const withTreeEngineView = <T extends ApplicationWithTreeEngineConfig>(cfg: T) => {
	return addView<T>("TreeEngine", TreeEngineFactories.ViewComponent)(cfg);
};

/**
 * @experimental
 */
export const withConfiguredTreeEngine = <T extends ApplicationWithTreeEngineConfig>(cfg: T) =>
	modifyView<T>("TreeEngine", (Component) => (props) => <Component {...props} {...cfg.treeEngine?.viewConfig} />)(cfg);

/**
 * @experimental
 */
export const withTreeModelSupport = <T extends ApplicationWithTreeEngineConfig>(cfg: T) =>
	combineFeatures(addSupportedModelVersion(MODEL_TYPE, SUPPORTED_MODEL_VERSIONS))(cfg);

/**
 * @experimental
 */
export const withTreeEngine = <T extends ApplicationWithTreeEngineConfig>(
	cfg: T
): ApplicationWithConfiguredFeature<T, "treeEngine"> =>
	setConfigured<T, "treeEngine">("treeEngine")(
		combineFeatures(
			withTreeEngineDataHandlers,
			withTreeEngineDataReducers,
			withTreeEngineMiddlewares,
			withTreeEngineSagas,

			withTreeEngineView,
			withConfiguredTreeEngine,
			withTreeModelSupport
		)(cfg)
	);
