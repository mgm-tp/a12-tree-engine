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

import { css, styled } from "styled-components";

import { UIStateSelector } from "../../../../store/selectors/ui-state.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";

/**
 * The small-view search row: the search bar on its own line under the heading, revealed by the
 * heading's search toggle. The sub-header's modeled elements are not shown in small view.
 *
 * @internal
 */
export const MobileSearchBar: React.FC = React.memo(function MobileSearchBar() {
	const SubHeading = useTreeEngineContext((context) => context.widgetMap.SubHeading);
	const SubActionBarTpl = useTreeEngineContext((context) => context.widgetMap.SubActionBarTpl);
	const SearchBar = useTreeEngineContext((context) => context.componentMap.SearchBar);
	const SearchResultViewToggle = useTreeEngineContext((context) => context.componentMap.SearchResultViewToggle);

	const showMobileSearchBar = useTreeEngineState(UIStateSelector.showMobileSearchBar());

	return (
		<SubHeading>
			<SubActionBarTpl hidden={!showMobileSearchBar}>
				<StyledMobileSearchRow>
					<SearchBar />
					<SearchResultViewToggle />
				</StyledMobileSearchRow>
			</SubActionBarTpl>
		</SubHeading>
	);
});

/**
 * The search bar fills the small view on its own, so the row has to hand it the leftover width and keep
 * the result-view button beside it instead of letting it wrap onto a line of its own.
 */
const StyledMobileSearchRow = styled.div(
	() => css`
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;

		> *:first-child {
			flex: 1;
			min-width: 0;
		}
	`
);
