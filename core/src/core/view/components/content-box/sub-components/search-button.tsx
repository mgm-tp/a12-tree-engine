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

import { LocalizerHooks, RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { UIStateSelector } from "../../../../store/selectors/ui-state.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";

/**
 * Toggles the small-view search bar. Mirrors the Overview Engine's mobile search button: the icon
 * stays active while the bar is open, and carries a dot when a search is active but the bar hidden.
 *
 * @internal
 */
export const SearchButton: React.FC = React.memo(function SearchButton() {
	const disabled = useTreeEngineState(UIStateSelector.disabled());
	const searchString = useTreeEngineState(UIStateSelector.searchString());
	const showMobileSearchBar = useTreeEngineState(UIStateSelector.showMobileSearchBar());
	const onMobileSearchBarToggle = useTreeEngineContext((context) => context.eventHandlers.onMobileSearchBarToggle);

	const Button = useTreeEngineContext((context) => context.widgetMap.Button);
	const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);
	const Badge = useTreeEngineContext((context) => context.widgetMap.Badge);

	const localizedResource = LocalizerHooks.useLocalizedResource();
	const title = React.useMemo(
		() =>
			localizedResource(
				showMobileSearchBar ? RESOURCE_KEYS.treeEngine.search.hideSearch : RESOURCE_KEYS.treeEngine.search.showSearch
			),
		[localizedResource, showMobileSearchBar]
	);

	const onClick = React.useCallback(
		() => onMobileSearchBarToggle({ visible: !showMobileSearchBar }),
		[onMobileSearchBarToggle, showMobileSearchBar]
	);

	// A hidden bar with an active search term would otherwise leave the filtered tree unexplained.
	const showBadge = !showMobileSearchBar && !!searchString;

	return (
		<Button
			title={title}
			icon={<Icon>search</Icon>}
			active={showMobileSearchBar}
			badge={<Badge tiny light variant="info" hidden={!showBadge} />}
			disabled={disabled}
			onClick={onClick}
		/>
	);
});
