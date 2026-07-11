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
import "@com.mgmtp.a12.widgets/widgets-core/styles/basic.css";

import { scan } from "react-scan";
import * as React from "react";
import ReactDOM from "react-dom/client";
import { Provider, useSelector } from "react-redux";

import { ApplicationSelectors, DynamicRegionUi, NotificationViews, ViewViews } from "@com.mgmtp.a12.client/client-core";
import { DirtyHandlingViews } from "@com.mgmtp.a12.client/client-core/dirtyHandling";

import { isReactScanEnabled } from "./config/react-scan.js";
import { setup } from "./appsetup.js";
import { ShowcaseContextProvider } from "./context.js";
import { SizeDetector } from "./config/size-detector.js";
import { ThemeWrapper } from "./config/theme.js";
import { DndWrapper } from "./config/dnd.js";
import { A11LanguageWrapper } from "./config/a11-language.js";

const { config, initialStoreActions } = setup();

scan({ enabled: isReactScanEnabled() });

const Page: React.FC = () => {
	const busyState = useSelector(ApplicationSelectors.busy());

	return (
		<ThemeWrapper>
			<SizeDetector>
				<DndWrapper>
					<A11LanguageWrapper>
						<ViewViews.ProgressIndicator global progress={busyState ? "loading" : "none"}>
							<NotificationViews.Frame>
								<DynamicRegionUi />
							</NotificationViews.Frame>
							<DirtyHandlingViews.VetoDialog />
						</ViewViews.ProgressIndicator>
					</A11LanguageWrapper>
				</DndWrapper>
			</SizeDetector>
		</ThemeWrapper>
	);
};

const mountPoint = document.createElement("div");
mountPoint.classList.add("base");
document.body.appendChild(mountPoint);

ReactDOM.createRoot(mountPoint).render(
	<React.StrictMode>
		<Provider store={config.store}>
			<ShowcaseContextProvider>
				<Page />
			</ShowcaseContextProvider>
		</Provider>
	</React.StrictMode>
);

void initialStoreActions(config.store);
