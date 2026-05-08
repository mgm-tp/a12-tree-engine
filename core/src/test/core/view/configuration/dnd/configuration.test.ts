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

import { vi } from "vitest";

import { DragAndDropUtils } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/drag-and-drop-utils.js";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";

import { ModelSelector, type TreeEngineState } from "../../../../../core/store/index.js";
import { defaultDndConfiguration, type DragObject, type FlattenNodeRow } from "../../../../../core/view/index.js";
import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { type RuntimeTreeModel } from "../../../../../core/models/index.js";
import { type HoveredObject, stringify } from "../../../../../core/view/internal/configuration/dnd/configuration.js";
import {
	ForbidCreateCircularRule,
	MakeRootRule
} from "../../../../../core/view/internal/configuration/dnd/can-drop-rules.js";

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.dnd.configuration", () => {
	const basicEngineState = defaultEngineState;

	test("Trivial properties", () => {
		const result = defaultDndConfiguration(mockType<TreeEngineState>());

		expect(result).toMatchObject({
			acceptType: "TreeEngineDndRow",
			backend: DragAndDropUtils.DefaultDndBackend,
			options: DragAndDropUtils.DefaultDndBackendOptions,
			hoverDelay: 600
		});

		expect(result.canDrag).toBeDefined();
		expect(result.canDrop).toBeDefined();
	});

	describe("canDrag", () => {
		describe("when not found the node model", () => {
			// let nodeModelStub: ReturnType<typeof vi.spyOn>;
			beforeAll(() => {
				vi.spyOn(ModelSelector, "nodeModel").mockReturnValue(() => undefined);
			});

			// afterAll(() => {
			// 	nodeModelStub.restore();
			// });

			it("should return false", () => {
				const dragItem = mockType<DragObject>({
					row: {
						data: {
							nodeIdentifier: { id: "DomainTeam/1" },
							nodePath: []
						}
					}
				});
				const { canDrag } = defaultDndConfiguration(basicEngineState);
				const result = canDrag?.({ dragItem });

				expect(result).toBe(false);
			});
		});

		describe("when dnd configuration of dragItem is false", () => {
			it("should return false", () => {
				const dragItem = mockType<DragObject>({
					row: {
						data: {
							nodeIdentifier: { id: "DomainTeam/1" },
							nodePath: []
						}
					}
				});
				const { canDrag } = defaultDndConfiguration(basicEngineState);
				const result = canDrag?.({ dragItem });

				expect(result).toBe(false);
			});
		});

		describe("when dnd configuration of dragItem is true", () => {
			// let nodeModelStub: ReturnType<typeof vi.spyOn>;
			beforeAll(() => {
				vi.spyOn(ModelSelector, "nodeModel").mockReturnValue(() =>
					mockType<RuntimeTreeModel.TreeNode>({
						configuration: {
							dnd: true
						}
					})
				);
			});

			// afterAll(() => {
			// 	nodeModelStub.restore();
			// });

			it("should return false", () => {
				const dragItem = mockType<DragObject>({
					row: {
						data: {
							nodeIdentifier: { id: "DomainTeam/1" },
							nodePath: []
						}
					}
				});

				const { canDrag } = defaultDndConfiguration(basicEngineState);
				const result = canDrag?.({ dragItem });

				expect(result).toBe(true);
			});
		});
	});

	// NOTE: canDrop function will be tested in integration test

	describe("stringify", () => {
		const dragItem = mockType<DragObject>({
			row: {
				data: {
					nodeIdentifier: { type: "DomainTeam", id: "1" },
					nodePath: [{ type: "DomainTeam", id: "1" }]
				}
			}
		});

		const hoveredItem = mockType<HoveredObject>({
			position: TreeTableNodeDropPosition.AS_CHILD,
			row: {
				data: {
					nodeIdentifier: { type: "DomainTeam", id: "2" },
					nodePath: [
						{ type: "DomainTeam", id: "3" },
						{ type: "TeamTeam", id: "4" }
					]
				}
			}
		});

		it("should work properly", () => {
			expect(
				stringify({
					dragItem,
					hoveredItem,
					rule: MakeRootRule,
					result: false
				})
			).toBe(
				`
CanDrop calculation
Drag item: {"nodeIdentifier":{"type":"DomainTeam","id":"1"},"nodePath":[{"type":"DomainTeam","id":"1"}]}
Hover item: {"nodeIdentifier":{"type":"DomainTeam","id":"2"},"nodePath":[{"type":"DomainTeam","id":"3"},{"type":"TeamTeam","id":"4"}]}
Position: as_child
Rule name: If hovered item is of type RootNodeRow, the drag item want to be a root node.
Result: false
`.trim()
			);

			expect(
				stringify({
					dragItem,
					hoveredItem,
					rule: ForbidCreateCircularRule,
					result: true
				})
			).toBe(
				`
CanDrop calculation
Drag item: {"nodeIdentifier":{"type":"DomainTeam","id":"1"},"nodePath":[{"type":"DomainTeam","id":"1"}]}
Hover item: {"nodeIdentifier":{"type":"DomainTeam","id":"2"},"nodePath":[{"type":"DomainTeam","id":"3"},{"type":"TeamTeam","id":"4"}]}
Position: as_child
Rule name: A node row can not be dropped on its children because it will cause CIRCULAR relation.
Result: true
`.trim()
			);

			expect(
				stringify({
					dragItem,
					hoveredItem,
					rule: ForbidCreateCircularRule,
					result: {
						draggedNodeRow: dragItem.row,
						droppedNodeRow: mockType<FlattenNodeRow>({
							data: {
								nodeIdentifier: { type: "DomainTeam", id: "5" },
								nodePath: [{ type: "DomainTeam", id: "5" }]
							}
						}),
						position: TreeTableNodeDropPosition.BOTTOM
					}
				})
			).toBe(
				`
CanDrop calculation
Drag item: {"nodeIdentifier":{"type":"DomainTeam","id":"1"},"nodePath":[{"type":"DomainTeam","id":"1"}]}
Hover item: {"nodeIdentifier":{"type":"DomainTeam","id":"2"},"nodePath":[{"type":"DomainTeam","id":"3"},{"type":"TeamTeam","id":"4"}]}
Position: as_child
Rule name: A node row can not be dropped on its children because it will cause CIRCULAR relation.
Result: redirection
	Redirect dropped row: {"nodeIdentifier":{"type":"DomainTeam","id":"5"},"nodePath":[{"type":"DomainTeam","id":"5"}]}
	Redirect position: bottom
`.trim()
			);
		});
	});
});
