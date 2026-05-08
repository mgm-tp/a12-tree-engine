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

import { type ActionContentboxProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/contentbox/main/action-contentbox/action-contentbox.api.js";
import { type Container } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";

import { useTreeEngineContext, useTreeEngineState } from "../../context/tree-engine-context-provider.js";
import { KeyboardShortcut } from "../../configuration/keyboard-shortcut/types.js";
import {
	useEngineBuiltinActionController,
	useEngineEventActionController,
	useEngineInsertActionController
} from "../../configuration/keyboard-shortcut/engine-controllers.js";
import { useKeyDown } from "../../configuration/keyboard-shortcut/hooks.js";
import { LocalizableFactory, RESOURCE_KEYS } from "../../../../services/localization/index.js";

import { useSubActionBarElements } from "./sub-components/sub-action-bar-hooks.js";

export namespace ContentBoxRenderer {
	export type Props = Container;
}

export const ContentBoxRenderer: React.FC<ContentBoxRenderer.Props> = React.memo(function ContentBoxRenderer(props) {
	const smallView = useTreeEngineContext((context) => context.smallView);
	const ariaLevel = useTreeEngineContext((context) => context.ariaLevel);

	const Heading = useTreeEngineContext((context) => context.componentMap.Heading);
	const SubActionBar = useTreeEngineContext((context) => context.componentMap.SubActionBar);
	const FooterBox = useTreeEngineContext((context) => context.componentMap.FooterBox);
	const ContentBox = useTreeEngineContext((context) => context.widgetMap.ContentBox);

	const { majorElements: headerMajorElements, minorElements: headerMinorElements } = useSubActionBarElements();
	const subActionBar: ActionContentboxProps.Buttons | undefined = React.useMemo(() => {
		if ((headerMajorElements.length || headerMinorElements.length) && !smallView) {
			return <SubActionBar />;
		}

		return undefined;
	}, [headerMajorElements.length, headerMinorElements.length, smallView, SubActionBar]);

	const hasFooterElements = useTreeEngineState(
		(state) =>
			!!state.models.uiModel.content.footerBox.minorElements.length ||
			!!state.models.uiModel.content.footerBox.majorElements.length
	);
	const footerBox = React.useMemo(() => {
		if (hasFooterElements) {
			return <FooterBox ariaLevel={ariaLevel + 1} />;
		}

		return undefined;
	}, [FooterBox, ariaLevel, hasFooterElements]);

	const heading = React.useMemo(() => <Heading ariaLevel={ariaLevel} />, [Heading, ariaLevel]);

	const engineInsertActionController = useEngineInsertActionController();
	const engineEventActionController = useEngineEventActionController();
	const engineBuiltinActionController = useEngineBuiltinActionController();

	const controllers = React.useMemo(
		() => [engineInsertActionController, engineEventActionController, engineBuiltinActionController],
		[engineInsertActionController, engineEventActionController, engineBuiltinActionController]
	);

	const defaultUnavailableEngineShortcutMessage = React.useMemo(() => {
		return LocalizableFactory.createResourceLocalizable(
			RESOURCE_KEYS.treeEngine.notification.message.unavailableEngineShortcut
		);
	}, []);

	const onKeyDown = useKeyDown({
		targetPredicate: KeyboardShortcut.EngineTarget.isAssignableFrom,
		defaultMessage: defaultUnavailableEngineShortcutMessage,
		controllers
	});

	return (
		<ContentBox onKeyDown={onKeyDown} heading={heading} subHeading={subActionBar} footer={footerBox} padding={false}>
			{props.children}
		</ContentBox>
	);
});
