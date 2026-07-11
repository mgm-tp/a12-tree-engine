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

import { renderHook } from "@testing-library/react";
import * as React from "react";
import * as Enzyme from "enzyme";
import { ThemeProvider } from "styled-components";
import { DndProvider } from "react-dnd";

import { defaultTheme, DragAndDropUtils, type Container } from "@com.mgmtp.a12.widgets/widgets-core";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DefaultLocalizerContextProvider } from "@com.mgmtp.a12.utils/utils-localization-react";

import type { TreeEngineState } from "../../core/store/index.js";
import {
	TreeEngineContextProvider,
	type TreeEngineRowContext,
	TreeEngineRowContextProvider
} from "../../core/view/index.js";

import { createContextProps, enLocale, type PartialEventHandlerContextProps } from "../setup/basic.spec.js";

export function testHook<Hook extends (...args: never[]) => any = (...args: never[]) => any>(
	hook: Hook,
	args: Parameters<Hook>,
	customEngineState: TreeEngineState,
	customEngineContextProps?: Partial<PartialEventHandlerContextProps>,
	locale?: Locale
): ReturnType<Hook> {
	const { result } = renderHook(() => hook(...args), {
		wrapper: (props: { children: React.ReactNode }) => (
			<DefaultLocalizerContextProvider locale={locale ?? enLocale}>
				<TreeEngineContextProvider {...createContextProps(customEngineState, customEngineContextProps)}>
					{props.children}
				</TreeEngineContextProvider>
			</DefaultLocalizerContextProvider>
		)
	});
	return result.current;
}

export function testRowHook<Hook extends (...args: never[]) => any = (...args: never[]) => any>(
	hook: Hook,
	args: Parameters<Hook>,
	customEngineState: TreeEngineState,
	customEngineRowContextProps: TreeEngineRowContext.Type,
	customEngineContextProps?: Partial<PartialEventHandlerContextProps>,
	locale?: Locale
): ReturnType<Hook> {
	const { result } = renderHook(() => hook(...args), {
		wrapper: (props: { children: React.ReactNode }) => (
			<DefaultLocalizerContextProvider locale={locale ?? enLocale}>
				<TreeEngineContextProvider {...createContextProps(customEngineState, customEngineContextProps)}>
					<TreeEngineRowContextProvider value={customEngineRowContextProps}>
						{props.children}
					</TreeEngineRowContextProvider>
				</TreeEngineContextProvider>
			</DefaultLocalizerContextProvider>
		)
	});
	return result.current;
}

export function testIsNullComponent(component: Enzyme.ReactWrapper) {
	expect(component.html()).toBe("");
}

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

	return Enzyme.mount(element as never, { wrappingComponent: WrappingComponent as never });
}
export function getInteractiveElement(wrapper: Enzyme.ReactWrapper<unknown | any>): Enzyme.ReactWrapper {
	return wrapper
		.findWhere((item) => {
			return ["button", "li", "div", "a"].includes(item.getDOMNode()?.tagName?.toLowerCase());
		})
		.at(0);
}

export function cartesianProduct<T>(...groups: Partial<T>[][]): T[] {
	let results: Partial<T>[] = [{}];

	for (const group of groups) {
		const nextResult: Partial<T>[] = [];

		for (const base of results) {
			for (const patch of group) {
				nextResult.push({ ...base, ...patch });
			}
		}

		results = nextResult;
	}

	return results as T[];
}
