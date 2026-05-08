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

import {
	type A11yDefinition,
	A11YLanguageContext
} from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/a11y-localization/index.js";
import { type Container } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";

import { useBuiltinShortcut } from "../configuration/keyboard-shortcut/hooks.js";
import { KeyboardShortcut } from "../configuration/keyboard-shortcut/index.js";
import { KeyboardShortcutUtils } from "../configuration/keyboard-shortcut/utils.js";

/** @internal */
export const A11YLanguageContextProvider: React.FC<Container> = (props) => {
	const languageContext = React.useContext(A11YLanguageContext);
	const toggleExpansionShortcut = useBuiltinShortcut(KeyboardShortcut.NodeBuiltinAction.TOGGLE_EXPANSION);

	const customContextValue: A11yDefinition = React.useMemo(() => {
		const shortcutTitle = KeyboardShortcutUtils.toTitle(toggleExpansionShortcut);

		return {
			...languageContext,
			treeTitles: {
				...languageContext.treeTitles,
				collapseButton: (languageContext.treeTitles?.collapseButton ?? "") + shortcutTitle,
				expandButton: (languageContext.treeTitles?.expandButton ?? "") + shortcutTitle
			}
		};
	}, [languageContext, toggleExpansionShortcut]);

	return <A11YLanguageContext.Provider value={customContextValue}>{props.children}</A11YLanguageContext.Provider>;
};
