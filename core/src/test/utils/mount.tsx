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

import type * as React from "react";
import { DndProvider } from "react-dnd";

import * as Enzyme from "enzyme";
import { ThemeProvider } from "styled-components";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DefaultLocalizerContextProvider } from "@com.mgmtp.a12.utils/utils-localization-react";
import { defaultTheme, DragAndDropUtils, type Container } from "@com.mgmtp.a12.widgets/widgets-core";

import { enLocale } from "../setup/locales.js";

interface WithWrappingComponent<T extends Container = Container> {
	wrappingComponent?: React.FC<T>;
	wrappingComponentProps?: T;
}
export function mount<T extends Container = Container>(
	element: React.ReactElement,
	options?: Omit<Enzyme.MountRendererProps, keyof WithWrappingComponent> & WithWrappingComponent<T>,
	customLocale?: Locale
): Enzyme.ReactWrapper {
	const DefinedWrapper = options?.wrappingComponent;
	const wrappingComponentProps = options?.wrappingComponentProps;

	const WrappingComponent: React.FC<T> = (props) => {
		const children = DefinedWrapper ? <DefinedWrapper {...wrappingComponentProps} {...props} /> : props.children;

		return (
			<DndProvider backend={DragAndDropUtils.DefaultDndBackend} options={DragAndDropUtils.DefaultDndBackendOptions}>
				<DefaultLocalizerContextProvider locale={customLocale ?? enLocale}>
					<ThemeProvider theme={defaultTheme}>{children}</ThemeProvider>
				</DefaultLocalizerContextProvider>
			</DndProvider>
		);
	};

	const container = document.createElement("div");
	document.body.appendChild(container);

	const wrapper = Enzyme.mount(element as never, {
		attachTo: container,
		wrappingComponent: WrappingComponent as never
	});

	mountedWrappers.set(wrapper, container);

	return wrapper;
}

/**
 * Tears down every tree {@link mount} created, and is registered as a global `afterEach` by the test
 * setup file.
 *
 * A mounted tree that outlives its test keeps React work queued on the scheduler and leaves its
 * container behind in the shared page, where the next test would find it through `document`.
 */
export function unmountAll(): void {
	mountedWrappers.forEach(unmountWrapper);
	mountedWrappers.clear();
}

const mountedWrappers = new Map<Enzyme.ReactWrapper, HTMLElement>();

/** A test may have unmounted its own wrapper already, which makes the second unmount throw. */
function unmountWrapper(container: HTMLElement, wrapper: Enzyme.ReactWrapper): void {
	try {
		wrapper.unmount();
	} catch {
		// already unmounted
	}

	container.remove();
}

export function getInteractiveElement(wrapper: Enzyme.ReactWrapper<unknown | any>): Enzyme.ReactWrapper {
	return wrapper
		.findWhere((item) => {
			return ["button", "li", "div", "a"].includes(item.getDOMNode()?.tagName?.toLowerCase());
		})
		.at(0);
}
