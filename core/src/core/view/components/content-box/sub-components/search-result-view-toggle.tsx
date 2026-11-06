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

import { TreeModelUtils } from "../../../../models/utils/tree-model-utils.js";
import { LocalizerHooks, RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { SearchSelector } from "../../../../store/selectors/search.js";
import { UIStateSelector } from "../../../../store/selectors/ui-state.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";

export namespace SearchResultViewToggle {
	export interface Props {}
}

/**
 * One button beside the search bar, labelled with the view it switches to: the reduced tree
 * (matches and the rows leading to them) or the complete tree.
 *
 * It shows only while a search is running and the model offers both views — a view picked earlier
 * would be reset by the next search, which always opens reduced.
 *
 * @internal
 */
export const SearchResultViewToggle: React.FC<SearchResultViewToggle.Props> = React.memo(
	function SearchResultViewToggle() {
		const disabled = useTreeEngineState(UIStateSelector.disabled());
		const configuration = useTreeEngineState((state) => state.models.uiModel.content.configuration);
		const searchString = useTreeEngineState(UIStateSelector.searchString());
		const onSearchResultViewChanged = useTreeEngineContext(
			(context) => context.eventHandlers.onSearchResultViewChanged
		);

		const Button = useTreeEngineContext((context) => context.widgetMap.Button);
		const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);

		const views = TreeModelUtils.getSearchResultViews(configuration);
		const currentView = useTreeEngineState(SearchSelector.resultView());
		const nextView = views.find((view) => view !== currentView);

		const localizedResource = LocalizerHooks.useLocalizedResource();
		const title = localizedResource(
			nextView === "complete"
				? RESOURCE_KEYS.treeEngine.search.showCompleteTree
				: RESOURCE_KEYS.treeEngine.search.resultsOnly
		);

		const onClick = React.useCallback(
			() => nextView && onSearchResultViewChanged({ view: nextView }),
			[nextView, onSearchResultViewChanged]
		);

		if (!searchString || !nextView) {
			return undefined;
		}

		return (
			<Button
				title={title}
				icon={<Icon>{nextView === "complete" ? "expand" : "compress"}</Icon>}
				disabled={disabled}
				onClick={onClick}
			/>
		);
	}
);
