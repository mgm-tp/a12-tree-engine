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

import { vi, expect } from "vitest";

import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";

import {
	defaultDndConfiguration,
	type DragObject,
	type FlattenNodeRow,
	type HoveredObject,
	type DndConfiguration,
	type DndRedirection
} from "../../../../../core/view/index.js";
import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { testHook } from "../../../../utils/test-utils.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { type DataState, type ModelsState, TreeEngineState } from "../../../../../core/store/index.js";
import { useDndOptions } from "../../../../../core/view/internal/configuration/dnd/use-dnd-options.js";
import { FlattenRowHooks } from "../../../../../core/view/internal/components/tree-engine/use-flatten-rows.js";

describe("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.use-tree-engine-dnd-configuration", () => {
	const basicEngineState = defaultEngineState;
	const teamNodeModel = basicEngineState.models.uiModel.content.nodes[0];
	const DEFAULT_HOVER_DELAY = defaultDndConfiguration(mockType<DataState & ModelsState>()).hoverDelay;

	let setTimeoutSpy: ReturnType<typeof vi.fn>;
	let clearTimeoutSpy: ReturnType<typeof vi.fn>;

	const basicEventHandlers = {
		onDndStarted: vi.fn(),
		onDndDone: vi.fn(),
		onDndHover: vi.fn()
	};

	type DndCallbacks = Omit<DndConfiguration, "acceptType" | "backend" | "options" | "hoverDelay">;

	const basicDndCallbacks: Record<keyof DndCallbacks, ReturnType<typeof vi.fn>> = {
		onBeginDrag: vi.fn(),
		onHover: vi.fn(),
		onEndDrag: vi.fn(),
		onDrop: vi.fn(),
		canDrag: vi.fn(),
		canDrop: vi.fn()
	};

	function setupTest(
		customDndCallbacks?: Partial<Record<keyof DndCallbacks, ReturnType<typeof vi.fn> | any>>,
		customEngineState?: Partial<TreeEngineState>
	) {
		return testHook(
			useDndOptions,
			[[]],
			{ ...basicEngineState, ...customEngineState },
			{
				eventHandlers: basicEventHandlers,
				dndConfiguration: {
					...defaultDndConfiguration(basicEngineState),
					...basicDndCallbacks,
					...customDndCallbacks
				}
			}
		);
	}

	function createFlattenNodeRow(id: string): FlattenNodeRow {
		return {
			id,
			data: {
				nodeIdentifier: { type: "DomainTeam", id },
				nodePath: [{ type: "DomainTeam", id }]
			},
			nodeModel: teamNodeModel,
			level: 0,
			childrenCount: 0,
			rowIndex: 0
		};
	}

	beforeEach(() => {
		setTimeoutSpy = vi.spyOn(window, "setTimeout");
		clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	/**
	 * NodeRow constants
	 */

	const basicDragNodeRow = createFlattenNodeRow("DomainTeam/1");

	const basicHoveredNodeRow = createFlattenNodeRow("DomainTeam/3");

	const basicDragItem: DragObject = {
		row: basicDragNodeRow,
		rowIndex: 0
	};

	const basicHoveredItem: HoveredObject = {
		row: basicHoveredNodeRow,
		rowIndex: 1,
		position: TreeTableNodeDropPosition.AS_CHILD
	};

	it("should return all defined properties", () => {
		const { onBeginDrag, onHover, onEndDrag, onDrop, canDrop, acceptType } = setupTest();

		expect(onDrop).toBeDefined();
		expect(canDrop).toBeDefined();
		expect(onHover).toBeDefined();
		expect(onBeginDrag).toBeDefined();
		expect(onEndDrag).toBeDefined();
		expect(acceptType).toBe("TreeEngineDndRow");
	});

	describe("onBeginDrag", () => {
		it("dndConfiguration.onBeginDrag and eventHandlers.onDndStarted should be called with proper arguments", () => {
			const { onBeginDrag } = setupTest();
			onBeginDrag?.({
				dragItem: basicDragItem
			});

			expect(basicEventHandlers.onDndStarted).toHaveBeenCalledWith({ draggingNodeRow: basicDragItem.row });
			expect(basicDndCallbacks.onBeginDrag).toHaveBeenCalledWith({ dragItem: basicDragItem });
		});
	});

	describe("onHover", () => {
		describe("when onHover is called first time", () => {
			describe("when params.hoveredItem is undefined", () => {
				it("should call clearTimeout and dndConfiguration.onHover, but never call setTimeout", () => {
					const { onBeginDrag, onHover } = setupTest();

					onBeginDrag?.({ dragItem: basicDragItem });
					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: undefined
					});

					expect(clearTimeoutSpy).toHaveBeenCalledOnce();
					expect(basicDndCallbacks.onHover).toHaveBeenCalledWith({
						dragItem: basicDragItem,
						hoveredItem: undefined
					});
				});
			});

			describe("when params.hoveredItem is defined, AND params.hoveredItem.position = top", () => {
				it("should call clearTimeout and dndConfiguration.onHover, but never call setTimeout", () => {
					const hoveredTopItem = {
						...basicHoveredItem,
						position: TreeTableNodeDropPosition.TOP
					};
					const { onBeginDrag, onHover } = setupTest();

					onBeginDrag?.({ dragItem: basicDragItem });
					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: hoveredTopItem
					});

					expect(clearTimeoutSpy).toHaveBeenCalledOnce();
					expect(basicDndCallbacks.onHover).toHaveBeenCalledWith({
						dragItem: basicDragItem,
						hoveredItem: hoveredTopItem
					});
				});

				describe("when params.hoveredItem is defined, and params.hoveredItem.position = as_child  ", () => {
					it("should call clearTimeout, then setTimeout, then dndConfiguration.onHover", () => {
						const { onBeginDrag, onHover } = setupTest();

						onBeginDrag?.({ dragItem: basicDragItem });
						onHover?.({
							dragItem: basicDragItem,
							hoveredItem: basicHoveredItem
						});

						expect(clearTimeoutSpy).toHaveBeenCalledOnce();

						expect(setTimeoutSpy).toHaveBeenCalledOnce();
						expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), DEFAULT_HOVER_DELAY);
						// TODO: calledAfter not supported in Vitest - verify call order manually

						expect(basicDndCallbacks.onHover).toHaveBeenCalledWith({
							dragItem: basicDragItem,
							hoveredItem: basicHoveredItem
						});
					});

					describe(
						"when params.hoveredItem is defined," +
							"\n\twhen params.hoveredItem.position = as_child," +
							"\n\twhen the timer is over" +
							"\n\twhen the item is not droppable",
						() => {
							it("should call eventHandlers.onDndHover with canDrop argument = false", () => {
								vi.useFakeTimers({ toFake: [] });

								const { onHover, onBeginDrag } = setupTest();

								onBeginDrag?.({ dragItem: basicDragItem });
								onHover?.({
									dragItem: basicDragItem,
									hoveredItem: basicHoveredItem
								});

								expect(basicDndCallbacks.canDrop).not.toHaveBeenCalled();
								expect(basicEventHandlers.onDndHover).not.toHaveBeenCalled();

								vi.advanceTimersByTime(1000);

								expect(basicDndCallbacks.canDrop).toHaveBeenCalledWith({
									dragItem: basicDragItem,
									hoveredItem: basicHoveredItem
								});

								expect(basicEventHandlers.onDndHover).toHaveBeenCalledWith({
									hoveredNodeRow: basicHoveredItem.row,
									position: basicHoveredItem.position,
									draggingNodeRow: basicDragItem.row,
									canDrop: false
								});
								vi.useRealTimers();
							});
						}
					);

					describe(
						"when params.hoveredItem is defined," +
							"\n\twhen params.hoveredItem.position = as_child," +
							"\n\twhen the timer is over" +
							"\n\twhen the item is droppable",
						() => {
							it("should call eventHandlers.onDndHover with canDrop argument = true", () => {
								vi.useFakeTimers({ toFake: [] });
								const canDropStub = vi.fn().mockReturnValue(true);

								const { onHover, onBeginDrag } = setupTest({
									canDrop: canDropStub
								});

								onBeginDrag?.({ dragItem: basicDragItem });
								onHover?.({
									dragItem: basicDragItem,
									hoveredItem: basicHoveredItem
								});

								expect(canDropStub).not.toHaveBeenCalled();
								expect(basicEventHandlers.onDndHover).not.toHaveBeenCalled();

								vi.advanceTimersByTime(1000);

								expect(canDropStub).toHaveBeenCalledWith({
									dragItem: basicDragItem,
									hoveredItem: basicHoveredItem
								});

								expect(basicEventHandlers.onDndHover).toHaveBeenCalledWith({
									hoveredNodeRow: basicHoveredItem.row,
									position: basicHoveredItem.position,
									draggingNodeRow: basicDragItem.row,
									canDrop: true
								});
							});
						}
					);
				});
			});
		});

		describe("when onHover is called second time", () => {
			describe("when hover on different items", () => {
				it("should call clearTimeout, but not setTimeout", () => {
					const { onHover, onBeginDrag } = setupTest();

					onBeginDrag?.({ dragItem: basicDragItem });

					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: basicHoveredItem
					});

					clearTimeoutSpy.mockClear();
					setTimeoutSpy.mockClear();

					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: {
							row: createFlattenNodeRow("DomainTeam/21"),
							rowIndex: 1,
							position: TreeTableNodeDropPosition.AS_CHILD
						}
					});

					expect(clearTimeoutSpy).toHaveBeenCalledOnce();
					expect(setTimeoutSpy).toHaveBeenCalled();
				});
			});
			describe("when continue hover on the same item and same position", () => {
				it("should not call neither clearTimeout nor setTimeout", () => {
					const { onHover, onBeginDrag } = setupTest();

					onBeginDrag?.({ dragItem: basicDragItem });

					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: basicHoveredItem
					});

					clearTimeoutSpy.mockClear();
					setTimeoutSpy.mockClear();

					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: basicHoveredItem
					});

					expect(clearTimeoutSpy).not.toHaveBeenCalled();
					expect(setTimeoutSpy).not.toHaveBeenCalled();
				});
			});

			describe("when continue hover on the same item, but change position from as_child to top", () => {
				it("should call clearTimeout, but not setTimeout", () => {
					const { onHover, onBeginDrag } = setupTest();

					onBeginDrag?.({ dragItem: basicDragItem });

					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: {
							...basicHoveredItem,
							position: TreeTableNodeDropPosition.AS_CHILD
						}
					});

					clearTimeoutSpy.mockClear();
					setTimeoutSpy.mockClear();

					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: {
							...basicHoveredItem,
							position: TreeTableNodeDropPosition.TOP
						}
					});

					expect(clearTimeoutSpy).toHaveBeenCalledOnce();
					expect(setTimeoutSpy).not.toHaveBeenCalled();
				});
			});

			describe("when continue hover on the same item, but change position from top to as_child", () => {
				it("should call both clearTimeout, and setTimeout", () => {
					const { onHover, onBeginDrag } = setupTest();

					onBeginDrag?.({ dragItem: basicDragItem });

					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: {
							...basicHoveredItem,
							position: TreeTableNodeDropPosition.TOP
						}
					});

					clearTimeoutSpy.mockClear();
					setTimeoutSpy.mockClear();

					onHover?.({
						dragItem: basicDragItem,
						hoveredItem: {
							...basicHoveredItem,
							position: TreeTableNodeDropPosition.AS_CHILD
						}
					});

					expect(clearTimeoutSpy).toHaveBeenCalledOnce();
					expect(setTimeoutSpy).toHaveBeenCalledOnce();
					// TODO: calledAfter not supported in Vitest - verify call order manually
				});
			});
		});

		describe("when onHover is called 100 times on the same item and same position", () => {
			describe("when position = as_child", () => {
				it("should call clearTimeout once and setTimeout once", () => {
					const { onHover, onBeginDrag } = setupTest();

					onBeginDrag?.({ dragItem: basicDragItem });

					for (let times = 0; times < 100; times++) {
						onHover?.({
							dragItem: basicDragItem,
							hoveredItem: basicHoveredItem
						});
					}

					expect(clearTimeoutSpy).toHaveBeenCalledOnce();

					expect(setTimeoutSpy).toHaveBeenCalledOnce();
					expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), DEFAULT_HOVER_DELAY);
					// TODO: calledAfter not supported in Vitest - verify call order manually
				});

				it("should call eventHandlers.onDndHover once", () => {
					vi.useFakeTimers({ toFake: [] });
					const { onHover, onBeginDrag } = setupTest();

					onBeginDrag?.({ dragItem: basicDragItem });

					for (let times = 0; times < 100; times++) {
						onHover?.({
							dragItem: basicDragItem,
							hoveredItem: basicHoveredItem
						});
					}
					vi.advanceTimersByTime(1000);

					expect(basicEventHandlers.onDndHover).toHaveBeenCalledOnce();
					vi.useRealTimers();
				});
			});

			describe("when position = top", () => {
				it("should call clearTimeout 100 times and not call setTimeout", () => {
					const { onHover, onBeginDrag } = setupTest();

					onBeginDrag?.({ dragItem: basicDragItem });

					for (let times = 0; times < 100; times++) {
						onHover?.({
							dragItem: basicDragItem,
							hoveredItem: {
								...basicHoveredItem,
								position: TreeTableNodeDropPosition.TOP
							}
						});
					}

					expect(clearTimeoutSpy).toHaveBeenCalledTimes(100);
					expect(setTimeoutSpy).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe("onEndDrag", () => {
		describe("when params.dropResult is undefined", () => {
			it("should call dndConfiguration.onEndDrag with proper arguments", () => {
				const { onEndDrag, onHover, onBeginDrag } = setupTest();

				onBeginDrag?.({ dragItem: basicDragItem });
				onHover?.({
					dragItem: basicDragItem,
					hoveredItem: undefined
				});
				onEndDrag?.({ dragItem: basicDragItem, dropResult: null });

				expect(basicDndCallbacks.onEndDrag).toHaveBeenCalledOnce();
				expect(basicDndCallbacks.onEndDrag).toHaveBeenCalledWith({ dragItem: basicDragItem, dropResult: null });
			});
		});

		describe("when params.dropResult is defined", () => {
			it("should call dndConfiguration.onEndDrag with proper arguments", () => {
				const { onEndDrag, onHover, onBeginDrag } = setupTest();

				onBeginDrag?.({ dragItem: basicDragItem });
				onHover?.({
					dragItem: basicDragItem,
					hoveredItem: basicHoveredItem
				});
				onEndDrag?.({ dragItem: basicDragItem, dropResult: basicHoveredItem });

				expect(basicDndCallbacks.onEndDrag).toHaveBeenCalledWith({
					dragItem: basicDragItem,
					dropResult: basicHoveredItem
				});
			});
		});
	});

	describe("onDrop", () => {
		describe("when the result of recalling canDrop is false", () => {
			it("should throw an error", () => {
				const { onDrop } = setupTest({ canDrop: () => false });

				expect(() => onDrop?.({ dragItem: basicDragItem, dropResult: basicHoveredItem })).toThrow();
			});
		});

		describe("when the result of recalling canDrop is true", () => {
			it("should call clearTimeout, then call eventHandlers.onDndDone with regular parameters", () => {
				const { onDrop } = setupTest({ canDrop: () => true });

				onDrop?.({ dragItem: basicDragItem, dropResult: basicHoveredItem });

				expect(clearTimeoutSpy).toHaveBeenCalledOnce();

				expect(basicEventHandlers.onDndDone).toHaveBeenCalledWith({
					draggedNodeRow: basicDragItem.row,
					droppedNodeRow: basicHoveredItem.row,
					position: basicHoveredItem.position
				});
			});
		});

		describe("when the result of recalling canDrop is a DndRedirection", () => {
			it("should call clearTimeout, then call eventHandlers.onDndDone with the dndRedirection", () => {
				const dndRedirection = mockType<DndRedirection>();
				const { onDrop } = setupTest({ canDrop: () => dndRedirection });

				onDrop?.({ dragItem: basicDragItem, dropResult: basicHoveredItem });

				expect(clearTimeoutSpy).toHaveBeenCalledOnce();

				expect(basicEventHandlers.onDndDone).toHaveBeenCalledWith(dndRedirection);
			});
		});
	});

	describe("canDrag", () => {
		describe("when not having selected nodes", () => {
			it("should call dndConfiguration from context", () => {
				const canDragSpy = vi.fn();
				const { canDrag } = setupTest({ canDrag: canDragSpy });
				canDrag?.({ dragItem: basicDragItem });

				expect(canDragSpy).toHaveBeenCalledOnce();
				expect(canDragSpy).toHaveBeenCalledWith({ dragItem: basicDragItem });
			});
		});

		describe("when having selected nodes", () => {
			let useMultiSelectedRows: ReturnType<typeof vi.spyOn>;
			let multiSelectionNodes: TreeEngineState.MultiSelectionNodes;

			describe("when there is link document", () => {
				describe("when dragItem is the selected nodes", () => {
					beforeAll(() => {
						const rows = [basicDragItem.row, createFlattenNodeRow("DomainTeam/5")];
						useMultiSelectedRows = vi.spyOn(FlattenRowHooks, "useMultiSelectedRows").mockReturnValue(rows);
						multiSelectionNodes = toMultiSelectionNodes(rows);
					});

					it("should return false", () => {
						const { canDrag } = setupTest(undefined, { multiSelectionNodes });
						const result = canDrag?.({ dragItem: basicDragItem });

						expect(result).toBe(false);
					});
					afterAll(() => useMultiSelectedRows.mockRestore());
				});

				describe("when multiSelectedNode got collapsed by a parent", () => {
					beforeAll(() => {
						const rows = [createFlattenNodeRow("DomainTeam/5")];
						useMultiSelectedRows = vi.spyOn(FlattenRowHooks, "useMultiSelectedRows").mockReturnValue([]);
						multiSelectionNodes = toMultiSelectionNodes(rows);
					});

					it("should return false", () => {
						const { canDrag } = setupTest(undefined, { multiSelectionNodes });
						const result = canDrag?.({ dragItem: basicDragItem });

						expect(result).toBe(false);
					});
				});
				describe("when there is no link document", () => {
					const models = {
						...basicEngineState.models,
						modelGraph: {
							...basicEngineState.models.modelGraph,
							relationshipModels: basicEngineState.models.modelGraph.relationshipModels.map((model) => {
								return { ...model, content: { ...model.content, linkDocumentModel: null } };
							})
						}
					};

					describe("when dragItem is the selected nodes", () => {
						beforeAll(() => {
							const rows = [
								basicDragItem.row,
								createFlattenNodeRow("DomainTeam/5"),
								createFlattenNodeRow("DomainTeam/6")
							];
							useMultiSelectedRows = vi.spyOn(FlattenRowHooks, "useMultiSelectedRows").mockReturnValue(rows);
							multiSelectionNodes = toMultiSelectionNodes(rows);
						});

						it("should return true when default canDrag", () => {
							const { canDrag } = setupTest({ canDrag: () => true }, { models, multiSelectionNodes });
							const result = canDrag?.({ dragItem: basicDragItem });

							expect(result).toBe(true);
						});
						afterAll(() => useMultiSelectedRows.mockRestore());
					});

					describe("when dragItem is NOT the selected nodes", () => {
						beforeAll(() => {
							const rows = [createFlattenNodeRow("DomainTeam/5"), createFlattenNodeRow("DomainTeam/6")];
							useMultiSelectedRows = vi.spyOn(FlattenRowHooks, "useMultiSelectedRows").mockReturnValue(rows);
							multiSelectionNodes = toMultiSelectionNodes(rows);
						});

						it("should return false", () => {
							const { canDrag } = setupTest({ canDrag: () => true }, { models, multiSelectionNodes });
							const result = canDrag?.({ dragItem: basicDragItem });

							expect(result).toBe(false);
						});
						afterAll(() => useMultiSelectedRows.mockRestore());
					});
				});
			});
		});

		describe("canDrop", () => {
			const canDropStub = vi.fn();

			afterEach(() => {
				canDropStub.mockReset();
			});

			describe("when dndConfig.canDrop returns false", () => {
				beforeAll(() => {
					canDropStub.mockReturnValue(false);
				});

				it("should return false", () => {
					const { canDrop } = setupTest({ canDrop: canDropStub });
					const result = canDrop?.({
						dragItem: basicDragItem,
						hoveredItem: basicHoveredItem
					});

					expect(canDropStub).toHaveBeenCalledWith({
						dragItem: basicDragItem,
						hoveredItem: basicHoveredItem
					});
					expect(result).toBe(false);
				});
			});

			describe("when dndConfig.canDrop returns true", () => {
				beforeAll(() => {
					canDropStub.mockReturnValue(true);
				});

				it("should return true", () => {
					const { canDrop } = setupTest({ canDrop: canDropStub });
					const result = canDrop?.({
						dragItem: basicDragItem,
						hoveredItem: basicHoveredItem
					});

					expect(canDropStub).toHaveBeenCalledWith({
						dragItem: basicDragItem,
						hoveredItem: basicHoveredItem
					});
					expect(result).toBe(true);
				});
			});
		});
	});
});

function toMultiSelectionNodes(rows: FlattenNodeRow[]) {
	return rows.reduce<TreeEngineState.MultiSelectionNodes>((nodes, row) => {
		return {
			...nodes,
			[TreeEngineState.NodePath.toString(row.data.nodePath)]: TreeEngineState.MultiSelectionState.SELECTED
		};
	}, {});
}
