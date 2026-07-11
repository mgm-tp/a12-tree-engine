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

// These imports must stay at the top because they define globals
import "./config/wdyr.js";
import "./config/reselect.js";
import "./config/logging.js";
import "./config/server-connector.js";

import { scan } from "react-scan";
import * as React from "react";
import type { Store } from "redux";
import { Provider } from "react-redux";
import ReactDOM from "react-dom/client";

import "@com.mgmtp.a12.widgets/widgets-core/styles/basic.css";

import { withOverviewEngine } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
import { withTreeEngine } from "@com.mgmtp.a12.treeengine/treeengine-core";
import { withRelationshipEngine } from "@com.mgmtp.a12.relationshipengine/relationshipengine-core";
import {
	addCustomSagas,
	addWrapper,
	APPLICATION_MODEL_PLACEHOLDER,
	combineFeatures,
	createA12ApplicationSetup,
	ModelActions,
	NotificationViews,
	withDynamicConfig,
	withModel,
	type A12ApplicationConfig
} from "@com.mgmtp.a12.client/client-core";
import { withCRUD } from "@com.mgmtp.a12.crud/crud-core";
import { withPlatformModelLoader } from "@com.mgmtp.a12.client/client-core/modelLoader";
import { withDataServicesConfiguration } from "@com.mgmtp.a12.client/client-core/dataServicesAdapter";
import { withLocalization } from "@com.mgmtp.a12.client/client-core/localization";
import { withDirtyHandling } from "@com.mgmtp.a12.client/client-core/dirtyHandling";
import { addDeepLinkingSagas } from "@com.mgmtp.a12.client/client-core/deepLinking";
import { DataServicesReducerMap } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { platformAttachmentLoader, withFormEngine } from "@com.mgmtp.a12.formengine/formengine-core";

import { isReactScanEnabled } from "./config/react-scan.js";
import { appCustomSagas } from "./sagas/index.js";
import {
	registerApplicationModules,
	// registerCustomFieldTypes,
	isLinkAddedByDetailActivity,
	createCustomSagaRegistrations,
	getNewLinkPosition,
	getPreloadChildNodesSetting
} from "./shared-setup.js";
import { restoreActivityAction } from "./model-editor/activity-suspending/actions.js";
import { SHOWCASE_RESOURCES } from "./config/resources.js";
import { fetchModelGraph, loadDSConfigurations, withReduxDevtool } from "./config/redux.js";
import { withTheme } from "./config/theme.js";
import { withSizeDetector } from "./config/size-detector.js";
import { withShowCaseContext } from "./context.js";
import { withDndWrapper } from "./config/dnd.js";
import { withA11LanguageWrapper } from "./config/a11-language.js";

// Register custom field types and modules
// registerCustomFieldTypes();
registerApplicationModules();

scan({ enabled: isReactScanEnabled() });

const withNotification = <T extends A12ApplicationConfig>(cfg: T) =>
	addWrapper<T>(NotificationViews.Frame, "outer")(cfg);

const initialConfig: A12ApplicationConfig = {
	config: {
		reducerMap: DataServicesReducerMap
	},
	initialActions: async (store: Store) => {
		await loadDSConfigurations(store);
		return fetchModelGraph(store.dispatch);
	},
	localization: {
		supportedLocales: [
			{ language: "en", country: "US" },
			{ language: "de", country: "DE" }
		],
		translationSource: SHOWCASE_RESOURCES,
		addLocaleChooser: "never"
	},
	deepLinking: { config: { applyTriggers: [ModelActions.setModelGraph] } },
	formEngine: { sagas: { attachmentLoader: platformAttachmentLoader } },
	treeEngine: {
		saga: {
			linkCreation: { isLinkAddedByDetailActivity },
			sagaRegistrations: createCustomSagaRegistrations(),
			sagaInitializationMatchers: [restoreActivityAction]
		},
		serverConnector: {
			preloadChildNodes: getPreloadChildNodesSetting,
			dataServicesSetting: { addLink: { newLinkPosition: getNewLinkPosition }, maximumPageSize: 1000 }
		}
	}
};

const { store, initialActions, Component } = createA12ApplicationSetup(
	combineFeatures(
		combineFeatures(
			withModel(APPLICATION_MODEL_PLACEHOLDER), // not used
			withDynamicConfig()
		),
		combineFeatures(
			withDataServicesConfiguration,
			withFormEngine,
			withOverviewEngine,
			withRelationshipEngine,
			withTreeEngine,
			withCRUD,
			withPlatformModelLoader,

			// Add custom sagas and middlewares
			addCustomSagas(...appCustomSagas)
		),

		// Extensions
		combineFeatures(
			withNotification,
			withShowCaseContext,
			withA11LanguageWrapper,
			withDndWrapper,
			withSizeDetector,
			withTheme,
			withLocalization
		),

		combineFeatures(withDirtyHandling, addDeepLinkingSagas, withReduxDevtool)
	)(initialConfig)
);

initialActions().then(() => {
	const mountPoint = document.createElement("div");
	mountPoint.classList.add("base");
	document.body.appendChild(mountPoint);

	ReactDOM.createRoot(mountPoint).render(
		<React.StrictMode>
			<Provider store={store}>{Component}</Provider>
		</React.StrictMode>
	);
});
