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
import { isBelowMinTokenSize } from "../../../../services/search/search-token-validation.js";
import { UIStateSelector } from "../../../../store/selectors/ui-state.js";
import { useIdGenerator } from "../../../configuration/id-generator.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";
import { useMinSearchTokenSize } from "../../../hooks/use-min-search-token-size.js";

export namespace SearchBar {
	export interface Props {}
}

/** @internal */
export const SearchBar: React.FC<SearchBar.Props> = React.memo(function SearchBar() {
	const storeSearchString = useTreeEngineState(UIStateSelector.searchString());
	const disabled = useTreeEngineState(UIStateSelector.disabled());
	const onSearchQueryChanged = useTreeEngineContext((context) => context.eventHandlers.onSearchQueryChanged);
	const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);
	const Button = useTreeEngineContext((context) => context.widgetMap.Button);
	const TextField = useTreeEngineContext((context) => context.widgetMap.TextField);

	const [searchString, setSearchString] = React.useState(storeSearchString ?? "");
	const searchInputRef = React.useRef<HTMLInputElement | null>(null);

	const minTokenSize = useMinSearchTokenSize();
	const isTooShort = minTokenSize !== undefined && isBelowMinTokenSize(searchString, minTokenSize);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	const searchButtonTitle = React.useMemo(() => {
		if (isTooShort) {
			return localizedResource(RESOURCE_KEYS.treeEngine.search.searchButtonMinLengthTitle, {
				count: { type: "plain", value: String(minTokenSize) }
			});
		}
		return localizedResource(RESOURCE_KEYS.treeEngine.search.searchButton);
	}, [isTooShort, localizedResource, minTokenSize]);

	const searchLabels = React.useMemo(
		() => ({
			placeholder: localizedResource(RESOURCE_KEYS.treeEngine.search.placeholder),
			clearButton: localizedResource(RESOURCE_KEYS.treeEngine.search.clearButton)
		}),
		[localizedResource]
	);

	React.useEffect(() => {
		// Sync the local input with an externally cleared search; setting "" onto "" is a no-op.
		if (storeSearchString === "") {
			setSearchString("");
		}
	}, [storeSearchString]);

	const triggerSearch = React.useCallback(
		(value: string) => onSearchQueryChanged({ searchTerm: value }),
		[onSearchQueryChanged]
	);

	const handleChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchString(event.target.value);
	}, []);

	const handleKeyDown = React.useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter" && !isTooShort) {
				triggerSearch(event.currentTarget.value);
			}
		},
		[isTooShort, triggerSearch]
	);

	const handleClear = React.useCallback(() => {
		setSearchString("");
		triggerSearch("");
		searchInputRef.current?.focus();
	}, [triggerSearch]);

	const generateId = useIdGenerator();
	const id = React.useMemo(() => generateId("search-input"), [generateId]);

	return (
		<TextField
			id={id}
			fitToParent={true}
			disabled={disabled}
			suffixes={[
				searchString && (
					<Button
						title={searchLabels.clearButton}
						destructive={true}
						icon={<Icon>clear</Icon>}
						onClick={handleClear}
						key="reset-search-button"
						disabled={disabled}
					/>
				),
				<Button
					title={searchButtonTitle}
					icon={<Icon>search</Icon>}
					onClick={() => triggerSearch(searchString)}
					key="search-button"
					disabled={disabled || !searchString.trim() || isTooShort}
				/>
			]}
			value={searchString}
			onChange={handleChange}
			onKeyDown={handleKeyDown}
			placeholder={searchLabels.placeholder}
			inputRef={(ref: HTMLInputElement | null) => {
				searchInputRef.current = ref;
			}}
			role="search"
		/>
	);
});
