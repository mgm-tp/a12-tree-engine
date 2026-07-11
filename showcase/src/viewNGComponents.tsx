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

import type { ComponentType, JSX } from "react";

import type { View, ViewNGProps } from "@com.mgmtp.a12.client/client-core";
import { FrameFactories } from "@com.mgmtp.a12.client/client-core";

import { viewComponents } from "./containerFactory.js";

const ProgressComponent = FrameFactories.createProgressComponentProvider()([], "");

/**
 * Wraps a view component with a progress indicator and returns it as a viewNG component
 *
 * Use this for views in DynamicConfiguration that need progress indication,
 * since NG layouts don't automatically wrap views with a ProgressComponent.
 */
function withProgressIndicator(Component: ComponentType<View>): ComponentType<ViewNGProps> {
	const componentName = Component.displayName ?? Component.name;

	function WithProgressIndicator(props: ViewNGProps): JSX.Element {
		return (
			<ProgressComponent activityId={props.activityId}>
				<Component {...props} name={componentName} />
			</ProgressComponent>
		);
	}

	WithProgressIndicator.displayName = `withProgressIndicator(${componentName})`;

	return WithProgressIndicator;
}

export const viewNGComponents = Object.fromEntries(
	Object.entries(viewComponents).map(([name, Component]) => [name, withProgressIndicator(Component)])
) as Record<keyof typeof viewComponents, ComponentType<ViewNGProps>>;
