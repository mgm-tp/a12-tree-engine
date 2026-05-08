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

import { type ModelGraph } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";

import { type RuntimeTreeModel } from "../../../../../core/models/index.js";
import { type Identifier } from "../../../../../core/store/index.js";
import { type DragObject, type HoveredObject, RootNodeRow } from "../../../../../core/view/index.js";
import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { createEngineState } from "../../../../utils/model-utils.js";
import {
	ForbidCreateCircularRule,
	ForbidDropOnItselfRule,
	ForbidDropOnParentRule,
	ForbidOrderBetweenRelatives,
	MakeChildRule,
	MakeRootRule,
	MakeSiblingRule
} from "../../../../../core/view/internal/configuration/dnd/can-drop-rules.js";

import { createDragItem, createFlattenNodeRow, createHoveredItem } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.dnd.general-dnd-can-drop-rules", () => {
	const NO_STATEMENT = "no-statement";
	const basicEngineState = defaultEngineState;
	const basicDocumentModels = basicEngineState.models.modelGraph.documentModels;
	const [teamNodeModel, personNodeModel] = basicEngineState.models.uiModel.content.nodes;

	describe(MakeRootRule.name, () => {
		const root = mockType<HoveredObject>({
			row: RootNodeRow.create()
		});

		describe("when dragged item is a root node", () => {
			it("should return false", () => {
				const result = MakeRootRule.canDrop({
					dragItem: createDragItem({ parent: RootNodeRow.create() }),
					hoveredItem: root,
					engineState: basicEngineState
				});
				expect(result).toBe(false);
			});
		});

		describe("when hovered item is the root", () => {
			describe("when dragged item has a parent", () => {
				describe("when its parent is a root node", () => {
					describe("when the root identifier is undefined", () => {
						it("should return false", () => {
							const result = MakeRootRule.canDrop({
								dragItem: createDragItem({ parent: RootNodeRow.create() }),
								hoveredItem: root,
								engineState: basicEngineState
							});

							expect(result).toBe(false);
						});
					});
				});

				describe("when document model of dragged item is same as document model", () => {
					describe("when one of dragged item's childRelationshipConfigurations is same as relationshipName and parentRole of root configuration", () => {
						it("should return true", () => {
							const result = MakeRootRule.canDrop({
								dragItem: createDragItem({
									identifier: { type: "DomainTeam", id: "DomainTeam/20" },
									parent: createFlattenNodeRow()
								}),
								hoveredItem: root,
								engineState: basicEngineState
							});

							expect(result).toBe(true);
						});
					});

					describe("when NONE of dragged item's childRelationshipConfigurations is same as relationshipName and parentRole of root configuration", () => {
						const engineState = createEngineState
							.from(basicEngineState)
							.withNodes([{ ...teamNodeModel, childRelationshipConfigurations: [] }, personNodeModel])
							.create();

						it("should return true", () => {
							const result = MakeRootRule.canDrop({
								dragItem: createDragItem({
									identifier: { type: "DomainTeam", id: "DomainTeam/20" },
									parent: createFlattenNodeRow()
								}),
								hoveredItem: root,
								engineState
							});

							expect(result).toBe(true);
						});
					});
				});

				describe("when document model of dragged item is NOT same as document model of root", () => {
					const basicConfiguration = basicEngineState.models.uiModel.content.configuration;

					const peopleDocumentModel: ModelGraph.DocumentModel = {
						modelId: "DomainPeople",
						relations: [],
						subTypes: [],
						abstractModel: false
					};
					const dummyRoot: RuntimeTreeModel.RootConfiguration = {
						documentModelRef: "DomainDummy",
						relationshipModelRef: "DummyTeam",
						parentRole: "Dummy"
					};
					const peopleRoot: RuntimeTreeModel.RootConfiguration = {
						documentModelRef: "DomainPeople",
						relationshipModelRef: "PeoplePerson",
						parentRole: "People"
					};

					describe("when not found root document model", () => {
						it("should return false", () => {
							const engineState = createEngineState
								.from(basicEngineState)
								.withConfigurations({
									...basicConfiguration,
									root: dummyRoot
								})
								.create();
							const result = MakeRootRule.canDrop({
								dragItem: createDragItem({
									identifier: { type: "DomainTeam", id: "DomainTeam/20" },
									parent: createFlattenNodeRow()
								}),
								hoveredItem: root,
								engineState
							});

							expect(result).toBe(false);
						});
					});

					describe("when dragged item's is NOT a sub-type of root", () => {
						it("should return false", () => {
							const engineState = createEngineState
								.from(basicEngineState)
								.withDocumentModels([...basicDocumentModels, peopleDocumentModel])
								.withConfigurations({ ...basicConfiguration, root: peopleRoot })
								.create();

							const result = MakeRootRule.canDrop({
								dragItem: createDragItem({
									identifier: { type: "DomainTeam", id: "DomainTeam/20" },
									parent: createFlattenNodeRow()
								}),
								hoveredItem: root,
								engineState
							});

							expect(result).toBe(false);
						});
					});

					describe("when dragged item's is a sub-type of root", () => {
						it("should return true", () => {
							const engineState = createEngineState
								.from(basicEngineState)
								.withDocumentModels([...basicDocumentModels, { ...peopleDocumentModel, subTypes: ["DomainTeam"] }])
								.withConfigurations({ ...basicConfiguration, root: peopleRoot })
								.create();

							const result = MakeRootRule.canDrop({
								dragItem: createDragItem({
									identifier: { type: "DomainTeam", id: "DomainTeam/20" },
									parent: createFlattenNodeRow()
								}),
								hoveredItem: root,
								engineState
							});

							expect(result).toBe(true);
						});
					});
				});
			});
		});

		describe("when hovered item is not the root", () => {
			it("should return no-statement", () => {
				const hoveredItem = createHoveredItem({ position: TreeTableNodeDropPosition.AS_CHILD });
				const result = MakeRootRule.canDrop({
					dragItem: createDragItem(),
					hoveredItem,
					engineState: basicEngineState
				});

				expect(result).toBe(NO_STATEMENT);
			});
		});
	});

	describe(ForbidDropOnItselfRule.name, () => {
		describe("when hovered item has the same identifier as the dragged item", () => {
			it("should return false", () => {
				const result = ForbidDropOnItselfRule.canDrop({
					dragItem: createDragItem({ identifier: { type: "DomainTeam", id: "DomainTeam/1024" } }),
					hoveredItem: createHoveredItem({
						identifier: { type: "DomainTeam", id: "DomainTeam/1024" },
						position: TreeTableNodeDropPosition.AS_CHILD
					}),
					engineState: basicEngineState
				});

				expect(result).toBe(false);
			});
		});

		describe("when hovered item has the different identifier from the dragged item's", () => {
			it("should return no-statement", () => {
				const result = ForbidDropOnItselfRule.canDrop({
					dragItem: createDragItem({ identifier: { type: "DomainTeam", id: "DomainTeam/2048" } }),
					hoveredItem: createHoveredItem({
						identifier: { type: "DomainTeam", id: "DomainTeam/1024" },
						position: TreeTableNodeDropPosition.TOP
					}),
					engineState: basicEngineState
				});

				expect(result).toBe(NO_STATEMENT);
			});
		});
	});

	describe(ForbidDropOnParentRule.name, () => {
		describe("when hovered position is TOP", () => {
			describe("when hovered item has no parent", () => {
				it("should return no-statement", () => {
					const result = ForbidDropOnParentRule.canDrop({
						dragItem: createDragItem(),
						hoveredItem: createHoveredItem({ position: TreeTableNodeDropPosition.TOP, parent: undefined }),
						engineState: basicEngineState
					});

					expect(result).toBe(NO_STATEMENT);
				});
			});

			describe("when hovered item has parent", () => {
				it("should return no-statement", () => {
					const result = ForbidDropOnParentRule.canDrop({
						dragItem: createDragItem(),
						hoveredItem: createHoveredItem({
							position: TreeTableNodeDropPosition.TOP,
							parent: createFlattenNodeRow()
						}),
						engineState: basicEngineState
					});

					expect(result).toBe(NO_STATEMENT);
				});
			});
		});

		describe("when hovered position is AS_CHILD", () => {
			describe("when dragged item has no parent", () => {
				it("should return no-statement", () => {
					const result = ForbidDropOnParentRule.canDrop({
						dragItem: createDragItem({ parent: undefined }),
						hoveredItem: createHoveredItem({
							position: TreeTableNodeDropPosition.AS_CHILD
						}),
						engineState: basicEngineState
					});

					expect(result).toBe(NO_STATEMENT);
				});
			});

			describe("when dragged item has parent", () => {
				describe("when dragged item's parent is different from hovered item", () => {
					it("should return no-statement", () => {
						const result = ForbidDropOnParentRule.canDrop({
							dragItem: createDragItem({
								parent: createFlattenNodeRow({
									identifier: { type: "DomainTeam", id: "DomainTeam/1024" }
								})
							}),
							hoveredItem: createHoveredItem({
								identifier: { type: "DomainTeam", id: "DomainTeam/2048" },
								position: TreeTableNodeDropPosition.AS_CHILD
							}),
							engineState: basicEngineState
						});

						expect(result).toBe(NO_STATEMENT);
					});
				});

				describe("when dragged item's parent is hovered item", () => {
					it("should return no-statement", () => {
						const identifier: Identifier = { type: "DomainTeam", id: "DomainTeam/1024" };
						const parent = createFlattenNodeRow({
							identifier
						});

						const result = ForbidDropOnParentRule.canDrop({
							dragItem: createDragItem({ parent }),
							hoveredItem: createHoveredItem({
								identifier,
								parent,
								position: TreeTableNodeDropPosition.AS_CHILD
							}),
							engineState: basicEngineState
						});

						expect(result).toBe(false);
					});
				});
			});
		});
	});

	describe(ForbidCreateCircularRule.name, () => {
		describe("when dragged and hovered item are siblings", () => {
			it("should return no-statement", () => {
				const parent = createFlattenNodeRow({
					identifier: { type: "DomainTeam", id: "DomainTeam/1024" }
				});

				const result = ForbidCreateCircularRule.canDrop({
					dragItem: createDragItem({
						identifier: { type: "DomainTeam", id: "DomainTeam/2048" },
						parent
					}),
					hoveredItem: createHoveredItem({
						position: TreeTableNodeDropPosition.AS_CHILD,
						parent
					}),
					engineState: basicEngineState
				});

				expect(result).toBe(NO_STATEMENT);
			});
		});

		describe("when dragged item is the parent of the hovered item", () => {
			it("should return false", () => {
				const dragItem = createDragItem({ identifier: { type: "DomainTeam", id: "DomainTeam/1024" } });

				const hoveredItem = createHoveredItem({
					position: TreeTableNodeDropPosition.TOP,
					parent: dragItem.row
				});

				const result = ForbidCreateCircularRule.canDrop({ dragItem, hoveredItem, engineState: basicEngineState });

				expect(hoveredItem.row.parent).toEqual(dragItem.row);
				expect(result).toBe(false);
			});
		});

		describe("when dragged item is the grandparent of the hovered item", () => {
			it("should return false", () => {
				const dragItem = createDragItem({
					identifier: { type: "DomainTeam", id: "DomainTeam/1024" }
				});

				const middleNodeRow = createFlattenNodeRow({
					parent: dragItem.row,
					identifier: { type: "DomainTeam", id: "DomainTeam/2048" }
				});

				const hoveredItem = createHoveredItem({
					parent: middleNodeRow,
					position: TreeTableNodeDropPosition.TOP
				});

				const result = ForbidCreateCircularRule.canDrop({ dragItem, hoveredItem, engineState: basicEngineState });

				expect(hoveredItem.row.parent?.parent).toEqual(dragItem.row);
				expect(result).toBe(false);
			});
		});
	});

	describe(MakeSiblingRule.name, () => {
		describe("dragged and hovered item are siblings", () => {
			it("should not allow to drop one another and return false", () => {
				const parent = createFlattenNodeRow({
					identifier: { type: "DomainTeam", id: "DomainTeam/1024" }
				});

				const dragItem = createDragItem({
					identifier: { type: "DomainTeam", id: "DomainTeam/2049" },
					parent
				});

				const hoveredItem = createHoveredItem({
					identifier: { type: "DomainTeam", id: "DomainTeam/2048" },
					position: TreeTableNodeDropPosition.AS_CHILD,
					parent
				});

				const result = MakeSiblingRule.canDrop({
					dragItem,
					hoveredItem,
					engineState: basicEngineState
				});
				expect(result).toBe(false);
			});
		});
		describe("dragged and hovered item don't have the same parent", () => {
			it("should allow drop one another", () => {
				const dragItem = createDragItem({
					identifier: { type: "DomainTeam", id: "DomainTeam/2049" },
					parent: createFlattenNodeRow({
						identifier: { type: "DomainTeam", id: "DomainTeam/1024" }
					})
				});

				const hoveredItem = createHoveredItem({
					identifier: { type: "DomainTeam", id: "DomainTeam/2048" },
					position: TreeTableNodeDropPosition.AS_CHILD,
					parent: RootNodeRow.create()
				});

				const result = MakeSiblingRule.canDrop({
					dragItem,
					hoveredItem,
					engineState: basicEngineState
				});

				const expectedResult = {
					droppedNodeRow: undefined,
					draggedNodeRow: dragItem.row,
					position: TreeTableNodeDropPosition.AS_CHILD
				};
				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe(MakeChildRule.name, () => {
		describe("when position is TOP", () => {
			it("should return no-statement", () => {
				const result = MakeChildRule.canDrop({
					dragItem: createDragItem(),
					hoveredItem: createHoveredItem({
						position: TreeTableNodeDropPosition.TOP
					}),
					engineState: basicEngineState
				});

				expect(result).toBe(NO_STATEMENT);
			});
		});

		describe("when position is AS_CHILD", () => {
			describe("when there is a valid relationship between them", () => {
				it("should return true", () => {
					const result = MakeChildRule.canDrop({
						dragItem: mockType<DragObject>({
							row: {
								nodeModel: teamNodeModel
							}
						}),
						hoveredItem: createHoveredItem({
							position: TreeTableNodeDropPosition.AS_CHILD
						}),
						engineState: basicEngineState
					});

					expect(result).toBe(true);
				});
			});

			describe("when there is no valid relationship between them", () => {
				it("should return false", () => {
					const result = MakeChildRule.canDrop({
						dragItem: mockType<DragObject>({
							row: {
								nodeModel: teamNodeModel
							}
						}),
						hoveredItem: mockType<HoveredObject>({
							row: {
								nodeModel: personNodeModel
							},
							position: TreeTableNodeDropPosition.AS_CHILD
						}),
						engineState: basicEngineState
					});

					expect(result).toBe("no-statement");
				});
			});
		});
	});

	describe(ForbidOrderBetweenRelatives.name, () => {
		const testCases: [boolean, boolean, TreeTableNodeDropPosition, "no-statement" | false][] = [
			[true, false, TreeTableNodeDropPosition.BOTTOM, false],
			[false, true, TreeTableNodeDropPosition.TOP, false],

			[false, true, TreeTableNodeDropPosition.BOTTOM, "no-statement"],
			[false, false, TreeTableNodeDropPosition.BOTTOM, "no-statement"],

			[true, false, TreeTableNodeDropPosition.TOP, "no-statement"],
			[false, false, TreeTableNodeDropPosition.TOP, "no-statement"],

			[true, false, TreeTableNodeDropPosition.AS_CHILD, "no-statement"],
			[false, true, TreeTableNodeDropPosition.AS_CHILD, "no-statement"],
			[false, false, TreeTableNodeDropPosition.AS_CHILD, "no-statement"]
		];

		testCases.forEach(([isPredecessor, isSuccessor, position, expectedResult]) => {
			describe(`when position = ${position}, and hoveredItem is ${
				isPredecessor ? "the predecessor of" : isSuccessor ? "the successor of" : "not related to"
			} draggedItem`, () => {
				it("should return " + expectedResult, () => {
					const hoveredItem = mockType<HoveredObject>({
						row: {
							data: {
								nodePath: [{ type: "DomainTeam", id: "DomainTeam/1024" }]
							}
						},
						position
					});

					const draggedItem = mockType<DragObject>({
						row: {
							predecessor: isPredecessor ? hoveredItem.row.data.nodePath : undefined,
							successor: isSuccessor ? hoveredItem.row.data.nodePath : undefined
						}
					});

					const result = ForbidOrderBetweenRelatives.canDrop({
						dragItem: draggedItem,
						hoveredItem,
						engineState: basicEngineState
					});

					expect(result).toBe(expectedResult);
				});
			});
		});
	});
});
