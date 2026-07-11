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
import { vi } from "vitest";

import { DragAndDropUtils } from "@com.mgmtp.a12.widgets/widgets-core";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import {
	type WidgetMap,
	type DndConfiguration,
	type EventHandlersDispatchMap,
	DefaultWidgetMap,
	DefaultComponentMap,
	TreeEngineContextProvider,
	useTreeEngineContext,
	type TreeEngineContext
} from "../../../../core/view/index.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType, type Stub } from "../../../utils/mock-utils.js";
import { type Selector as BaseSelector, TreeEngineState, UIStateSelector } from "../../../../core/store/index.js";

describe("@com.mgmtp.a12.tree-engine.core.view.context.context", () => {
	const basicEngineState = defaultEngineState;
	const basicContextProps: TreeEngineContextProvider.Props = {
		state: basicEngineState,
		eventHandlers: mockType<EventHandlersDispatchMap>()
	};

	function setupTest<T>(
		selector: BaseSelector<T, TreeEngineContext.Type>,
		contextProps: TreeEngineContextProvider.Props | undefined
	) {
		const { result } = renderHook(() => useTreeEngineContext(selector), {
			wrapper: contextProps
				? (props: { children: React.ReactNode }) => (
						<TreeEngineContextProvider {...contextProps}>{props.children}</TreeEngineContextProvider>
					)
				: undefined
		});

		return result.current;
	}

	describe("eventHandlers", () => {
		it("should use props.eventHandlers", () => {
			const eventHandlers = mockType<EventHandlersDispatchMap>();
			const result = setupTest((context) => context.eventHandlers, {
				...basicContextProps,
				eventHandlers
			});

			expect(result).toEqual(eventHandlers);
		});
	});

	describe("dndConfiguration", () => {
		describe("when not given a custom dndConfiguration", () => {
			it("should use the defaultDndConfiguration", () => {
				const dndConfiguration = setupTest((context) => context.dndConfiguration, {
					...basicContextProps,
					state: basicEngineState
				});

				expect(dndConfiguration).toMatchObject({
					acceptType: "TreeEngineDndRow",
					backend: DragAndDropUtils.DefaultDndBackend,
					options: DragAndDropUtils.DefaultDndBackendOptions,
					hoverDelay: 600
				});

				expect(dndConfiguration.canDrag).toBeDefined();
				expect(dndConfiguration.canDrop).toBeDefined();
			});
		});

		describe("when given a custom dndConfiguration", () => {
			it("should use the custom dndConfiguration", () => {
				const customDndConfiguration: DndConfiguration = {
					acceptType: "CustomType",
					backend: mockType<typeof DragAndDropUtils.DefaultDndBackend>(),
					options: DragAndDropUtils.DefaultDndBackendOptions,
					hoverDelay: 900,

					canDrop: mockType<NonNullable<DndConfiguration["canDrop"]>>(),
					canDrag: mockType<NonNullable<DndConfiguration["canDrag"]>>()
				};

				const dndConfiguration = setupTest((context) => context.dndConfiguration, {
					...basicContextProps,
					state: basicEngineState,
					dndConfiguration: customDndConfiguration
				});

				expect(dndConfiguration).toMatchObject(customDndConfiguration);
			});
		});
	});

	describe("converter", () => {
		describe("when not wrap with TreeEngineContextProvider", () => {
			it("should throw an error", () => {
				const { formatValue } = setupTest((context) => context.converter, undefined);

				expect(() => formatValue(mockType<DocumentModel>(), [{ elementName: "TeamDetails" }], "A12")).toThrow();
			});
		});

		describe("when wrap with TreeEngineContextProvider", () => {
			describe("when not given a converter", () => {
				it("should call and use the defaultConverterProvider", () => {
					const { formatValue } = setupTest((context) => context.converter, {
						...basicContextProps
					});

					expect(formatValue).toBeInstanceOf(Function);
				});
			});
		});
	});

	describe("componentMap", () => {
		describe("when not given componentMap", () => {
			it("should use the DefaultComponentMap", () => {
				const componentMap = setupTest((context) => context.componentMap, basicContextProps);

				expect(componentMap).toEqual(DefaultComponentMap);
			});
		});
	});

	describe("widgetMap", () => {
		describe("when not given widgetMap", () => {
			it("should use the DefaultWidgetMap", () => {
				const widgetMap = setupTest((context) => context.widgetMap, basicContextProps);

				expect(widgetMap).toEqual(DefaultWidgetMap);
			});
		});

		describe("when given a custom widgetMap", () => {
			it("should use the custom widgetMap", () => {
				const customWidgetMap = mockType<WidgetMap>();
				const widgetMap = setupTest((context) => context.widgetMap, {
					...basicContextProps,
					widgetMap: customWidgetMap
				});

				expect(widgetMap).toEqual(customWidgetMap);
			});
		});
	});

	describe("rowActionStateGetter", () => {
		describe("when not given rowActionStateGetter", () => {
			it("should not have rowActionStateGetter", () => {
				const rowActionStateGetter = setupTest((context) => context.rowActionStateGetter, basicContextProps);

				expect(rowActionStateGetter).toBeUndefined();
			});
		});

		describe("when not given rowActionStateGetter", () => {
			it("should use the rowActionStateGetter", () => {
				const rowActionStateGetter = () => ({});
				const result = setupTest((context) => context.rowActionStateGetter, {
					...basicContextProps,
					rowActionStateGetter
				});

				expect(result).toEqual(rowActionStateGetter);
			});
		});
	});

	describe("rowStyling", () => {
		describe("given no rowStyling", () => {
			it("should not have rowStyling", () => {
				const rowStyling = setupTest((context) => context.rowStyling, basicContextProps);

				expect(rowStyling).toBeUndefined();
			});
		});

		describe("given rowStyling", () => {
			it("should use the rowStyling", () => {
				const rowStyling = () => ({});
				const result = setupTest((context) => context.rowStyling, {
					...basicContextProps,
					rowStyling
				});

				expect(result).toEqual(rowStyling);
			});
		});
	});

	describe("state", () => {
		it("should use props.state", () => {
			const state = mockType<TreeEngineState>({
				models: {
					uiModel: {
						header: { id: "Test" },
						content: { configuration: { dnd: { onDrag: { expandHoveredNode: true } } } }
					}
				},
				root: { children: [] }
			});
			const result = setupTest((context) => context.state, {
				...basicContextProps,
				state
			});

			expect(result).toEqual(state);
		});
	});

	describe("smallView", () => {
		describe("given a specific smallView", () => {
			const smallViews = [true, false];

			it("should return that smallView from the context", () => {
				smallViews.forEach((smallView) => {
					const result = setupTest((context) => context.smallView, {
						...basicContextProps,
						smallView
					});
					expect(result).toEqual(smallView);
				});
			});
		});
	});

	describe("overallMultiSelection", () => {
		const testCases: [TreeEngineState.MultiSelectionState, boolean][] = [
			[TreeEngineState.MultiSelectionState.SELECTED, true],
			[TreeEngineState.MultiSelectionState.PARTLY_SELECTED, true],
			[TreeEngineState.MultiSelectionState.DESELECTED, false]
		];

		let overallMultiSelectionStub: Stub<typeof UIStateSelector.overallMultiSelection>;

		it("should return expected checked value", () => {
			testCases.forEach(([overallMultiSelection, expectedCheck]) => {
				overallMultiSelectionStub = vi
					.spyOn(UIStateSelector, "overallMultiSelection")
					.mockReturnValue(() => overallMultiSelection);
				const result = setupTest((context) => context.overallMultiSelection, basicContextProps);

				expect(result).toBe(expectedCheck);

				overallMultiSelectionStub.mockRestore();
			});
		});
	});

	describe("uiIdPrefix", () => {
		describe("given a specific uiIdPrefix", () => {
			it("should return that smallView from the context", () => {
				const uiIdPrefix = "Sample-Prefix";
				const result = setupTest((context) => context.uiIdPrefix, {
					...basicContextProps,
					uiIdPrefix
				});
				expect(result).toBe(uiIdPrefix);
			});
		});
	});
});
