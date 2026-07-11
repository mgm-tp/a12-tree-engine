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

import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";
import { TreeModelKeys } from "../../../../services/localization/tree-model-keys.js";
import { LocalizerHooks } from "../../../../services/localization/localizer-hooks.js";
import { ModelSelector } from "../../../../store/selectors/models.js";
import { TreeModel } from "../../../../models/tree-model.js";

import { ExpandAllPopUpHooks } from "./expand-all-pop-up.js";

export namespace Heading {
	export interface Props {
		readonly ariaLevel?: number;
	}
}

/** @internal */
export const Heading: React.ComponentType<Heading.Props> = React.memo(function Heading({ ariaLevel }) {
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const headerLabels = React.useMemo(() => uiModel.header.labels, [uiModel]);
	const localizedTreeElement = LocalizerHooks.useLocalizedTreeElement();
	const WidgetHeading = useTreeEngineContext((context) => context.widgetMap.Heading);
	const HeadingAddon = useTreeEngineContext((context) => context.widgetMap.HeadingAddon);
	const Title = useTreeEngineContext((context) => context.widgetMap.Title);
	const Subtitle = useTreeEngineContext((context) => context.widgetMap.Subtitle);
	const PopUpMenu = useTreeEngineContext((context) => context.widgetMap.PopUpMenu);
	const HiddenText = useTreeEngineContext((context) => context.widgetMap.HiddenText);
	const labelHidden = React.useMemo<boolean | undefined>(
		() => uiModel.content.configuration.labelHidden,
		[uiModel.content.configuration.labelHidden]
	);
	const hiddenText = React.useMemo<string>(() => {
		if (!labelHidden) {
			return "";
		}

		return localizedTreeElement(TreeModelKeys.getHeaderLabelsKey(), headerLabels);
	}, [localizedTreeElement, labelHidden, headerLabels]);

	const title = React.useMemo(() => {
		if (labelHidden) {
			return "";
		}

		return localizedTreeElement(TreeModelKeys.getHeaderLabelsKey(), headerLabels);
	}, [labelHidden, localizedTreeElement, headerLabels]);

	const subtitle = React.useMemo(() => {
		if (!title) {
			return "";
		}

		return localizedTreeElement(TreeModelKeys.getHeaderSubtitleKey(), uiModel.content.configuration.subtitle);
	}, [localizedTreeElement, title, uiModel.content.configuration.subtitle]);

	const mobilesButtons = useMobileButtons();

	const childrenOnly = React.useMemo(() => {
		return labelHidden && !mobilesButtons.length;
	}, [labelHidden, mobilesButtons.length]);

	return (
		<WidgetHeading
			suffixes={
				mobilesButtons.length > 0 && (
					<HeadingAddon>
						<PopUpMenu>{mobilesButtons}</PopUpMenu>
					</HeadingAddon>
				)
			}
			childrenOnly={childrenOnly}>
			{labelHidden ? (
				<HiddenText role={"heading"} ariaLevel={ariaLevel}>
					{hiddenText}
				</HiddenText>
			) : (
				<>
					<Title ariaLevel={ariaLevel} text={title} />
					<Subtitle text={subtitle} />
				</>
			)}
		</WidgetHeading>
	);
});

function useMobileButtons(): React.ReactElement[] {
	const ComponentButton = useTreeEngineContext((context) => context.componentMap.Button);
	const WidgetButton = useTreeEngineContext((context) => context.widgetMap.Button);
	const smallView = useTreeEngineContext((context) => context.smallView);

	const leftSlot = useTreeEngineState((state) => state.models.uiModel.content.subHeaderBox.leftSlot);
	const rightSlot = useTreeEngineState((state) => state.models.uiModel.content.subHeaderBox.rightSlot);

	const expandAllButtonProps = ExpandAllPopUpHooks.useExpandAllButtonProps("expand");
	const collapseAllButtonProps = ExpandAllPopUpHooks.useExpandAllButtonProps("collapse");

	return React.useMemo(() => {
		const result: React.ReactElement[] = [];

		if (!smallView) {
			return result;
		}

		[...leftSlot, ...rightSlot].forEach((element) => {
			if (TreeModel.ButtonElement.isAssignableFrom(element)) {
				result.push(
					<ComponentButton
						key={element.id}
						element={{ ...element, labelHidden: undefined }} // to show button label in pop up menu in small view only
						componentKeys={TreeModelKeys.getSubHeaderBoxButtonsKey()}
						labelFallback
					/>
				);
			}

			if (TreeModel.ExpandAllPopUpElement.isAssignableFrom(element)) {
				result.push(<WidgetButton {...expandAllButtonProps} />, <WidgetButton {...collapseAllButtonProps} />);
			}
		});

		return result;
	}, [ComponentButton, WidgetButton, collapseAllButtonProps, expandAllButtonProps, leftSlot, rightSlot, smallView]);
}
