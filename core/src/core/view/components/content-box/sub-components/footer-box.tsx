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

import { TreeModelKeys } from "../../../../services/localization/tree-model-keys.js";
import { ModelSelector } from "../../../../store/selectors/models.js";
import { useTreeEngineContext, useTreeEngineState } from "../../../context/tree-engine-context.js";

export namespace FooterBox {
	export interface Props {
		readonly ariaLevel?: number;
	}
}

/** @internal */
export const FooterBox: React.FC<FooterBox.Props> = React.memo(function FooterBox({ ariaLevel }) {
	const uiModel = useTreeEngineState(ModelSelector.uiModel());
	const { footerBox } = uiModel.content;
	const footerBoxButtonKey = TreeModelKeys.getFooterBoxButtonsKey();

	const Button = useTreeEngineContext((context) => context.componentMap.Button);
	const Footer = useTreeEngineContext((context) => context.widgetMap.Footer);
	const ButtonGroupContainer = useTreeEngineContext((context) => context.widgetMap.ButtonGroupContainer);

	const rightSlot: React.ReactNode[] = React.useMemo(
		() =>
			footerBox.rightSlot.map((button) => {
				return <Button key={button.id} element={button} componentKeys={footerBoxButtonKey} />;
			}) ?? [],
		[Button, footerBox.rightSlot, footerBoxButtonKey]
	);

	const leftSlot: React.ReactNode[] = React.useMemo(
		() =>
			footerBox.leftSlot.map((button) => {
				return <Button key={button.id} element={button} componentKeys={footerBoxButtonKey} />;
			}) ?? [],
		[Button, footerBox.leftSlot, footerBoxButtonKey]
	);

	return (
		<Footer ariaLevel={ariaLevel}>
			<ButtonGroupContainer responsive leftSlot={leftSlot} rightSlot={rightSlot} />
		</Footer>
	);
});
