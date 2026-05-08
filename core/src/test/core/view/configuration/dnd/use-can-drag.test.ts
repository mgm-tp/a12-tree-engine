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

import { type TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/table-renderer.api.js";

import { defaultEngineState, type PartialEventHandlerContextProps } from "../../../../setup/basic.spec.js";
import { testHook } from "../../../../utils/test-utils.js";
import { useCanDrag } from "../../../../../core/view/internal/configuration/dnd/use-can-drag.js";
import { defaultDndConfiguration, type FlattenNodeRow } from "../../../../../core/view/index.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { FlattenRowHooks } from "../../../../../core/view/internal/components/tree-engine/use-flatten-rows.js";
import { TreeEngineState } from "../../../../../core/store/index.js";

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.dnd.use-can-drag", () => {
	const basicEngineState = defaultEngineState;

	type DragItem = TableRenderPropsType.DragObject<FlattenNodeRow>;

	function setupTest(
		customContextProps?: Partial<PartialEventHandlerContextProps>,
		customEngineState?: Partial<TreeEngineState>
	) {
		return testHook(useCanDrag, [[]], { ...basicEngineState, ...customEngineState }, customContextProps);
	}

	let multiSelectionNodes: TreeEngineState.MultiSelectionNodes;

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("when no given canDrag configuration", () => {
		it("should return false", () => {
			const canDrag = setupTest({
				dndConfiguration: { ...defaultDndConfiguration(basicEngineState), canDrag: undefined }
			});

			expect(
				canDrag?.({
					dragItem: mockType<DragItem>({
						row: {
							data: {
								nodeIdentifier: { type: "DomainTeam", id: "1" },
								nodePath: [{ type: "DomainTeam", id: "1" }]
							},
							parent: undefined
						}
					})
				})
			).toBe(false);
		});
	});

	describe("when not selected any rows", () => {
		beforeEach(() => {
			vi.spyOn(FlattenRowHooks, "useMultiSelectedRows").mockReturnValue([]);
			multiSelectionNodes = toMultiSelectionNodes([]);
		});

		it("should return the result from calling canDrag configuration", () => {
			[true, false].forEach((canDragResult) => {
				const canDragConfig = vi.fn().mockReturnValue(canDragResult);
				const canDrag = setupTest(
					{
						dndConfiguration: { ...defaultDndConfiguration(basicEngineState), canDrag: canDragConfig }
					},
					{ multiSelectionNodes }
				);

				expect(
					canDrag?.({
						dragItem: mockType<DragItem>({
							row: {
								data: {
									nodePath: [{ type: "DomainTeam", id: "1" }]
								}
							}
						})
					})
				).toBe(canDragResult);
			});
		});
	});

	describe("when selecting some rows", () => {
		beforeEach(() => {
			const rows = [
				mockType<FlattenNodeRow>({
					data: {
						nodePath: [
							{ type: "DomainTeam", id: "1" },
							{ type: "TeamTeam", id: "2" }
						]
					}
				}),
				mockType<FlattenNodeRow>({
					data: {
						nodePath: [
							{ type: "DomainTeam", id: "1" },
							{ type: "TeamTeam", id: "3" }
						]
					}
				})
			];
			vi.spyOn(FlattenRowHooks, "useMultiSelectedRows").mockReturnValue(rows);
			multiSelectionNodes = toMultiSelectionNodes(rows);
		});

		describe("when the drag item is not belong to selected rows", () => {
			it("should return false", () => {
				const canDrag = setupTest(undefined, { multiSelectionNodes });
				expect(
					canDrag?.({
						dragItem: mockType<DragItem>({
							row: {
								data: {
									nodePath: [
										{ type: "DomainTeam", id: "1" },
										{ type: "TeamTeam", id: "4" }
									],
									nodeIdentifier: { type: "DomainTeam", id: "DomainTeam/1" }
								}
							}
						})
					})
				).toBe(false);
			});
		});

		describe("when the drag item is belong to selected rows", () => {
			describe("when there is a selected row can not be dragged", () => {
				it("should return false", () => {
					const canDragConfig = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
					const canDrag = setupTest(
						{
							dndConfiguration: { ...defaultDndConfiguration(basicEngineState), canDrag: canDragConfig }
						},
						{ multiSelectionNodes }
					);

					expect(
						canDrag?.({
							dragItem: mockType<DragItem>({
								row: {
									data: {
										nodePath: [
											{ type: "DomainTeam", id: "1" },
											{ type: "TeamTeam", id: "3" }
										]
									}
								}
							})
						})
					).toBe(false);
				});
			});

			describe("when all selected row can be dragged", () => {
				it("should return true", () => {
					const canDragConfig = vi.fn().mockReturnValue(true);
					const canDrag = setupTest(
						{
							dndConfiguration: { ...defaultDndConfiguration(basicEngineState), canDrag: canDragConfig }
						},
						{ multiSelectionNodes }
					);

					expect(
						canDrag?.({
							dragItem: mockType<DragItem>({
								row: {
									data: {
										nodePath: [
											{ type: "DomainTeam", id: "1" },
											{ type: "TeamTeam", id: "3" }
										]
									}
								}
							})
						})
					).toBe(false);
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
