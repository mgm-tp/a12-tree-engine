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

import { type Store } from "redux";

import {
	TreeEngineFactories,
	type TreeEngineSaga,
	TreeEngineServerConnectorFactories
} from "@com.mgmtp.a12.treeengine/treeengine-core";
import { DataServicesReducerMap } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { DeepLinkingFactories } from "@com.mgmtp.a12.client/client-core/deepLinking";
import {
	ActivitySelectors,
	ApplicationFactories,
	type ApplicationSetup,
	ModelActions
} from "@com.mgmtp.a12.client/client-core";
import {
	createEmptyDocumentDataProvider,
	createFormEngineMiddlewares,
	formEngineDataReducers,
	formEngineSagas,
	FormModelProcessor,
	platformAttachmentLoader,
	platformSingleDocumentDataProvider
} from "@com.mgmtp.a12.formengine/formengine-core";
import { CRUDFactories } from "@com.mgmtp.a12.crud/crud-core";
import { DirtyHandlingFactories } from "@com.mgmtp.a12.client/client-core/dirtyHandling";
import { RelationshipFactories, RelationshipReducers } from "@com.mgmtp.a12.relationshipengine/relationshipengine-core";
import { OverviewEngineFactories } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
import { createPlatformServerModelLoader } from "@com.mgmtp.a12.client/client-core/modelLoader";

import model from "./appmodel.json" with { type: "json" };
import { appCustomSagas } from "./sagas/index.js";
import { restoreActivityAction } from "./model-editor/activity-suspending/actions.js";
import {
	registerApplicationModules,
	registerCustomFieldTypes,
	isLinkAddedByDetailActivity,
	createCustomSagaRegistrations,
	getNewLinkPosition,
	getPreloadChildNodesSetting
} from "./shared-setup.js";
import { createComposeEnhancer, fetchModelGraph, loadDSConfigurations } from "./config/redux.js";

let config: ApplicationSetup | undefined;

registerCustomFieldTypes();

export function setup(): {
	config: ApplicationSetup;
	initialStoreActions(store: Store): Promise<void>;
} {
	registerApplicationModules();

	const sagaSetting: TreeEngineSaga.Setting = {
		linkCreation: { isLinkAddedByDetailActivity },
		sagaRegistrations: createCustomSagaRegistrations(),
		sagaInitializationMatchers: [restoreActivityAction]
	};
	const teDataProviderSetting: TreeEngineServerConnectorFactories.ModuleSettings = {
		preloadChildNodes: getPreloadChildNodesSetting,
		dataServicesSetting: {
			addLink: { newLinkPosition: getNewLinkPosition },
			maximumPageSize: 1000
		}
	};

	// tag::SetupTreeEngine[]
	const dataHandlers = [
		// Tree Engine data providers
		TreeEngineFactories.createDataProvider(),
		TreeEngineServerConnectorFactories.createDataProvider(teDataProviderSetting),

		createEmptyDocumentDataProvider(),
		RelationshipFactories.createRelationshipDataProvider(),
		...OverviewEngineFactories.createDataProviders(),
		platformSingleDocumentDataProvider
	];

	config = ApplicationFactories.createApplicationSetup({
		model,
		dataHandlers,
		modelLoader: createPlatformServerModelLoader({ modelProcessors: [FormModelProcessor] }),
		dataReducers: [
			// Tree Engine data dataReducers
			...TreeEngineFactories.createDataReducers(),

			...RelationshipReducers.dataReducers,
			...OverviewEngineFactories.createDataReducers(),
			...formEngineDataReducers
		],
		overridePlatformSagas: [
			...OverviewEngineFactories.createApplicationSagas(),
			...DirtyHandlingFactories.createSagas()
		],
		additionalMiddlewares: [
			// Tree Engine middlewares
			...TreeEngineFactories.createMiddlewares(),

			...createFormEngineMiddlewares(),
			...OverviewEngineFactories.createMiddlewares(),
			CRUDFactories.createCRUDMiddleware()
		],
		customSagas: [
			...appCustomSagas,
			// Tree Engine sagas
			...TreeEngineFactories.createSagas(sagaSetting),

			...formEngineSagas({ attachmentLoader: platformAttachmentLoader }),
			...CRUDFactories.createSagas(),
			...RelationshipFactories.createSagas({ dataHandlers }),
			...DeepLinkingFactories.createSagas({
				applyTriggers: [ModelActions.setModelGraph]
			})
		],
		reducerMap: { ...DataServicesReducerMap },
		composeEnhancer: createComposeEnhancer()
	});
	// end::SetupTreeEngine[]

	return {
		config,
		initialStoreActions: async (store) => {
			await loadDSConfigurations(store);
			return fetchModelGraph(store.dispatch);
		}
	};
}

/*
 * Listen to the window.onbeforeunload event to trigger a dialog
 * if there are dirty or locked activities when the application gets closed.
 */
window.onbeforeunload = () => {
	if (!config) {
		throw new Error("Application is not setup yet.");
	}
	const dirtyActivities = ActivitySelectors.allDirtyOrLockedActivities()(config.store.getState());
	if (dirtyActivities.length > 0) {
		return "There are unsaved or locked activities.";
	}

	return undefined;
};
