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

import { TreeModel } from "../../../../models/tree-model.js";
import { LocalizerHooks } from "../../../../services/localization/localizer-hooks.js";
import { TreeModelKeys } from "../../../../services/localization/tree-model-keys.js";
import { ModelSelector } from "../../../../store/selectors/models.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";
import { isColumnVisibilityAvailable } from "../../column-visibility/column-visibility.js";

import { ExpandAllPopUpHooks } from "./expand-all-pop-up.js";
import { useIsSearchEnabled } from "./sub-action-bar-hooks.js";

export namespace Heading {
	export interface Props {
		readonly ariaLevel?: number;
	}
}

/** @internal */
export const Heading: React.ComponentType<Heading.Props> = React.memo(function Heading({ ariaLevel }) {
	const WidgetHeading = useTreeEngineContext((context) => context.widgetMap.Heading);
	const HeadingAddon = useTreeEngineContext((context) => context.widgetMap.HeadingAddon);
	const Title = useTreeEngineContext((context) => context.widgetMap.Title);
	const Subtitle = useTreeEngineContext((context) => context.widgetMap.Subtitle);
	const PopUpMenu = useTreeEngineContext((context) => context.widgetMap.PopUpMenu);
	const HiddenText = useTreeEngineContext((context) => context.widgetMap.HiddenText);
	const SearchButton = useTreeEngineContext((context) => context.componentMap.SearchButton);

	const { labelHidden, label, subtitle } = useHeadingTexts();
	const mobileButtons = useMobileButtons();

	// The sub-header is not rendered in small view, so search gets a toggle beside the pop-up menu
	// (where the Overview Engine puts it) that reveals the search bar below the heading.
	const smallView = useTreeEngineContext((context) => context.smallView);
	const searchEnabled = useIsSearchEnabled();
	const showSearchToggle = !!smallView && searchEnabled;

	const showColumnVisibility = useShowColumnVisibilityInSmallView();
	const ColumnVisibilityButton = useTreeEngineContext((context) => context.componentMap.ColumnVisibilityButton);

	const hasSuffixes = showSearchToggle || showColumnVisibility || mobileButtons.length > 0;

	return (
		<WidgetHeading
			suffixes={
				hasSuffixes && (
					<>
						{showSearchToggle && <SearchButton />}
						{showColumnVisibility && <ColumnVisibilityButton />}
						{mobileButtons.length > 0 && (
							<HeadingAddon>
								<PopUpMenu>{mobileButtons}</PopUpMenu>
							</HeadingAddon>
						)}
					</>
				)
			}
			childrenOnly={labelHidden && !hasSuffixes}>
			{labelHidden ? (
				<HiddenText role="heading" ariaLevel={ariaLevel}>
					{label}
				</HiddenText>
			) : (
				<>
					<Title ariaLevel={ariaLevel} text={label} />
					<Subtitle text={subtitle} />
				</>
			)}
		</WidgetHeading>
	);
});

/**
 * The localized heading texts. `label` is rendered as the title, or as hidden text when the model
 * hides the label; the subtitle is dropped along with an empty label.
 */
function useHeadingTexts(): { labelHidden?: boolean; label: string; subtitle: string } {
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();

	const { labelHidden, subtitle: subtitleModel } = uiModel.content.configuration;
	const headerLabels = uiModel.header.labels;

	const label = React.useMemo(
		() => localizedTreeElement(TreeModelKeys.getHeaderLabelsKey(), headerLabels),
		[localizedTreeElement, headerLabels]
	);

	const subtitle = React.useMemo(
		() => (labelHidden || !label ? "" : localizedTreeElement(TreeModelKeys.getHeaderSubtitleKey(), subtitleModel)),
		[localizedTreeElement, labelHidden, label, subtitleModel]
	);

	return { labelHidden, label, subtitle };
}

/**
 * In small view the sub action bar is not rendered, so the column visibility trigger moves into
 * the heading — as its own icon next to the overflow menu.
 */
function useShowColumnVisibilityInSmallView(): boolean {
	const smallView = useTreeEngineContext((context) => context.smallView);
	const available = useTreeEngineState((state) => isColumnVisibilityAvailable(state.models.uiModel));

	return smallView && available;
}

/**
 * The sub-header elements re-rendered as pop-up menu entries for small view, where the sub-header
 * itself is not shown. Only the element types that work as menu entries are carried over — the
 * search bar is offered through the heading's search toggle instead.
 */
function useMobileButtons(): React.ReactElement[] {
	const ComponentButton = useTreeEngineContext((context) => context.componentMap.Button);
	const WidgetButton = useTreeEngineContext((context) => context.widgetMap.Button);
	const smallView = useTreeEngineContext((context) => context.smallView);

	const leftSlot = useTreeEngineState((state) => state.models.uiModel.content.subHeaderBox.leftSlot);
	const rightSlot = useTreeEngineState((state) => state.models.uiModel.content.subHeaderBox.rightSlot);

	const expandAllButtonProps = ExpandAllPopUpHooks.useExpandAllButtonProps("expand");
	const collapseAllButtonProps = ExpandAllPopUpHooks.useExpandAllButtonProps("collapse");

	return React.useMemo(() => {
		if (!smallView) {
			return [];
		}

		return [...leftSlot, ...rightSlot].flatMap((element) => {
			if (TreeModel.ButtonElement.isAssignableFrom(element)) {
				return [
					<ComponentButton
						key={element.id}
						element={{ ...element, labelHidden: undefined }}
						componentKeys={TreeModelKeys.getSubHeaderBoxButtonsKey()}
						labelFallback
					/>
				];
			}

			if (TreeModel.ExpandAllPopUpElement.isAssignableFrom(element)) {
				return [
					<WidgetButton key="expand" {...expandAllButtonProps} />,
					<WidgetButton key="collapse" {...collapseAllButtonProps} />
				];
			}

			return [];
		});
	}, [ComponentButton, WidgetButton, collapseAllButtonProps, expandAllButtonProps, leftSlot, rightSlot, smallView]);
}
