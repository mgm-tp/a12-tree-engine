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

import { TreeEngineError } from "../../../../../error/index.js";
import { TreeModelKeys } from "../../../../../services/localization/index.js";
import { TreeModel } from "../../../../../models/index.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context-provider.js";

import { hasMultiSelectionComponents } from "./multi-selection/utils.js";

/** @internal */
export function useSubActionBarElements(): Record<"majorElements" | "minorElements", React.ReactNode[]> {
	const majorElements = useTreeEngineState((state) => state.models.uiModel.content.subHeaderBox.majorElements);
	const minorElements = useTreeEngineState((state) => state.models.uiModel.content.subHeaderBox.minorElements);

	const groupRender = useGroupRenderer();

	return React.useMemo(
		() => ({
			majorElements: groupRender([...majorElements]),
			minorElements: groupRender([...minorElements])
		}),
		[groupRender, majorElements, minorElements]
	);
}

function useGroupRenderer() {
	const treeModelConfiguration = useTreeEngineState((_) => _.models.uiModel.content.configuration);
	const ButtonGroup = useTreeEngineContext((context) => context.widgetMap.ButtonGroup);
	const ActionBarGroup = useTreeEngineContext((context) => context.widgetMap.ActionBarGroup);
	const ActionBarGroupDivider = useTreeEngineContext((context) => context.widgetMap.ActionBarGroupDivider);

	const elementRender = useElementRenderer();

	return React.useCallback(
		(elements: TreeModel.Element[]) => {
			const visibleElements = visibilityFilter(elements, treeModelConfiguration);
			return groupBySimilarType(visibleElements).map((group, groupIndex) => {
				const GroupContainer = isExpandAllPopUpOrButton(group[0]) ? ButtonGroup : ActionBarGroup;

				return (
					<React.Fragment key={groupIndex}>
						{groupIndex > 0 && <ActionBarGroupDivider />}
						<GroupContainer>{group.map(elementRender)}</GroupContainer>
					</React.Fragment>
				);
			});
		},
		[ActionBarGroup, ActionBarGroupDivider, ButtonGroup, elementRender, treeModelConfiguration]
	);
}

const subHeaderBoxButtonKey = TreeModelKeys.getSubHeaderBoxButtonsKey();

function useElementRenderer() {
	const ExpandAllPopUp = useTreeEngineContext((context) => context.componentMap.ExpandAllPopUp);
	const MultiSelectionPanel = useTreeEngineContext((context) => context.componentMap.MultiSelectionPanel);
	const Button = useTreeEngineContext((context) => context.componentMap.Button);

	return React.useCallback(
		(element: TreeModel.Element): React.ReactNode => {
			if (TreeModel.MultiSelectionElement.isAssignableFrom(element)) {
				return <MultiSelectionPanel key="multi-selection-panel" />;
			}

			if (TreeModel.ExpandAllPopUpElement.isAssignableFrom(element)) {
				return <ExpandAllPopUp key="expand-all-popup" />;
			}

			if (TreeModel.ButtonElement.isAssignableFrom(element)) {
				return <Button key={element.id} element={element} componentKeys={subHeaderBoxButtonKey} />;
			}

			throw TreeEngineError.TypeError("TreeEngine.Model", { expect: "TreeModel.Element", actual: element });
		},
		[Button, ExpandAllPopUp, MultiSelectionPanel]
	);
}

function visibilityFilter(elements: TreeModel.Element[], configuration: TreeModel.Configuration): TreeModel.Element[] {
	return elements.filter((element) => {
		if (
			TreeModel.MultiSelectionElement.isAssignableFrom(element) &&
			!hasMultiSelectionComponents(configuration.multiSelection)
		) {
			return false;
		}
		return true;
	});
}

function groupBySimilarType(elements: TreeModel.Element[]): TreeModel.Element[][] {
	const result: TreeModel.Element[][] = [];

	elements.forEach((element) => {
		if (result.length === 0) {
			result.push([element]);
			return;
		}

		const lastGroup = result[result.length - 1];
		const lastElement = lastGroup[lastGroup.length - 1];
		if (!isSimilarType(lastElement, element)) {
			result.push([element]);
			return;
		}

		lastGroup.push(element);
	});

	return result;
}

function isSimilarType(first: TreeModel.Element, second: TreeModel.Element): boolean {
	return first.type === second.type || (isExpandAllPopUpOrButton(first) && isExpandAllPopUpOrButton(second));
}

function isExpandAllPopUpOrButton(element: TreeModel.Element): boolean {
	return TreeModel.ExpandAllPopUpElement.isAssignableFrom(element) || TreeModel.ButtonElement.isAssignableFrom(element);
}
