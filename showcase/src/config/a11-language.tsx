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

import * as React from "react";

import { A11YLanguageContext, getA11yResource, type A11yDefinition } from "@com.mgmtp.a12.widgets/widgets-core";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import { addWrapper, type A12ApplicationConfig } from "@com.mgmtp.a12.client/client-core";

export const A11LanguageWrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
	const { locale } = React.useContext(LocalizerContext);

	const a11yResource = React.useMemo<A11yDefinition>(() => {
		const SUPPORTED_LANGUAGES = ["en", "de"];
		return getA11yResource(SUPPORTED_LANGUAGES.includes(locale.language) ? locale.language : "en");
	}, [locale.language]);

	return <A11YLanguageContext.Provider value={a11yResource}>{children}</A11YLanguageContext.Provider>;
};

export const withA11LanguageWrapper = <T extends A12ApplicationConfig>(cfg: T): T =>
	addWrapper<T>(A11LanguageWrapper, "inner")(cfg);
