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

import { vi, expect, type MockInstance } from "vitest";

import { type EntityCharacteristics, type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";

import { RelationshipModelUtils } from "../../../../../core/models/index.js";
import { type Identifier, ModelSelector, type TreeEngineState } from "../../../../../core/store/index.js";
import { type DragObject, FlattenNodeRow, type HoveredObject, RootNodeRow } from "../../../../../core/view/index.js";
import { defaultEngineState, defaultRelationshipModels } from "../../../../setup/basic.spec.js";
import { mockType } from "../../../../utils/mock-utils.js";
import {
	type CanDropRule,
	ForbidOrderBetweenDifferentRelationships,
	ForbidOrderInFixedRelationshipRule,
	ForbidOrderTopLevelRule,
	ReorderRootRule
} from "../../../../../core/view/internal/configuration/dnd/can-drop-rules.js";

import { createDragItem, createHoveredItem } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.dnd.ordering-dnd-can-drop-rules", () => {
	const NO_STATEMENT = "no-statement";
	const basicEngineState = defaultEngineState;
	const teamNodeModel = basicEngineState.models.uiModel.content.nodes[0];
	const personNodeModel = basicEngineState.models.uiModel.content.nodes[1];

	const identifiedRootState: TreeEngineState = {
		...basicEngineState,
		root: {
			...basicEngineState.root,
			identifier: {
				type: "DomainTeam",
				id: "DomainTeam/1"
			}
		}
	};

	const hoveredItemParent = mockType<FlattenNodeRow>({
		data: {
			nodeIdentifier: { type: "DomainTeam" }
		},
		nodeModel: teamNodeModel
	});

	const rootNode = mockType<FlattenNodeRow>({
		id: "ROOT",
		data: {
			nodePath: [],
			nodeIdentifier: { id: "DomainTeam/1", type: "DomainTeam" }
		}
	});

	const hoveredItem = {
		top: {
			hasParent: createHoveredItem({ position: TreeTableNodeDropPosition.TOP, parent: hoveredItemParent }),
			noParent: createHoveredItem({ position: TreeTableNodeDropPosition.TOP, parent: undefined })
		},

		bottom: {
			hasParent: createHoveredItem({ position: TreeTableNodeDropPosition.BOTTOM, parent: hoveredItemParent }),
			noParent: createHoveredItem({ position: TreeTableNodeDropPosition.BOTTOM, parent: undefined })
		},

		asChild: createHoveredItem({ position: TreeTableNodeDropPosition.AS_CHILD, parent: undefined })
	};

	const dragItem = {
		Dummy: mockType<DragObject>({
			row: {
				nodeModel: {
					documentModelRef: "DomainDummy"
				}
			}
		}),
		Person: mockType<DragObject>({
			row: {
				nodeModel: personNodeModel
			}
		}),
		Team: mockType<DragObject>({
			row: {
				nodeModel: teamNodeModel
			}
		}),
		hasNodeModel: mockType<DragObject>({
			row: {
				nodeModel: teamNodeModel
			}
		})
	};

	describe(ReorderRootRule.name, () => {
		const root = mockType<HoveredObject>({
			row: RootNodeRow.create()
		});

		describe("when the root is present", () => {
			describe("when the dragged node is the last node", () => {
				it("should return false", () => {
					const result = ReorderRootRule.canDrop({
						dragItem: createDragItem({
							parent: RootNodeRow.create(),
							identifier: { type: "DomainPerson", id: "DomainPerson/166" }
						}),
						hoveredItem: root,
						engineState: {
							...basicEngineState,
							root: {
								identifier: { id: "DomainTeam/2", type: "DomainTeam" },
								children: [
									{ id: "166", type: "TeamPerson" },
									{ id: "167", type: "TeamPerson" }
								]
							}
						}
					});

					expect(result).toBe(false);
				});
			});

			describe("when the last dropped node is available", () => {
				it("should return a DndRedirection", () => {
					const result = ReorderRootRule.canDrop({
						dragItem: createDragItem({
							identifier: { type: "DomainPerson", id: "DomainPerson/164" },
							parent: RootNodeRow.create()
						}),
						hoveredItem: root,
						engineState: {
							...basicEngineState,
							root: {
								identifier: { id: "DomainTeam/2", type: "DomainTeam" },
								children: [
									{ id: "166", type: "TeamPerson" },
									{ id: "167", type: "TeamPerson" }
								]
							}
						}
					});

					if (typeof result !== "object") {
						throw new Error("Result must be a DndRedirection");
					}

					expect(FlattenNodeRow.isAssignableFrom(result.droppedNodeRow)).toBe(true);
					expect(result.droppedNodeRow?.data.nodeIdentifier.id).toBe("DomainPerson/166");
					expect(result.droppedNodeRow?.data.nodeIdentifier.type).toBe("DomainPerson");
					expect(result.position).toBe(TreeTableNodeDropPosition.BOTTOM);
				});
			});
		});
	});

	describe(ForbidOrderInFixedRelationshipRule.name, () => {
		const positions = [TreeTableNodeDropPosition.TOP, TreeTableNodeDropPosition.BOTTOM] as const;

		positions.forEach((position, index) => {
			const caseIndex = index + 1;

			describe(`Cases 1.${caseIndex}: when position = ${position.toUpperCase()}`, () => {
				describe(`Case 1.${caseIndex}.1: when hoveredItem has parent`, () => {
					describe("when parent of hoveredItem has NO relationship with draggedItem", () => {
						it("should return no-statement", () => {
							const result = ForbidOrderInFixedRelationshipRule.canDrop({
								dragItem: dragItem.Dummy,
								hoveredItem: hoveredItem[position].hasParent,
								engineState: basicEngineState
							});

							expect(result).toBe(NO_STATEMENT);
						});
					});

					describe("when parent of hoveredItem has a relationship with draggedItem", () => {
						describe("when parentEntityCharacteristic.ordered = TRUE", () => {
							it("should return no-statement", () => {
								const result = ForbidOrderInFixedRelationshipRule.canDrop({
									dragItem: dragItem.Person,
									hoveredItem: hoveredItem[position].hasParent,
									engineState: basicEngineState
								});

								expect(result).toBe(NO_STATEMENT);
							});
						});

						describe("when parentEntityCharacteristic.ordered = FALSE", () => {
							let stub: MockInstance;
							beforeAll(() => {
								stub = vi.spyOn(RelationshipModelUtils, "getEntityCharacteristicByRole").mockReturnValue(
									mockType<EntityCharacteristics>({
										ordered: false
									})
								);
							});
							afterAll(() => stub.mockRestore());

							it("should return false", () => {
								const result = ForbidOrderInFixedRelationshipRule.canDrop({
									dragItem: dragItem.Person,
									hoveredItem: hoveredItem[position].hasParent,
									engineState: basicEngineState
								});

								expect(result).toBe(false);
							});
						});
					});
				});
				describe(`Case 1.${caseIndex}.2: when hoveredItem has NO parent, but root has an identifier`, () => {
					describe("when root has NO relationship with draggedItem", () => {
						it("should return no-statement", () => {
							const result = ForbidOrderInFixedRelationshipRule.canDrop({
								dragItem: dragItem.Dummy,
								hoveredItem: hoveredItem[position].noParent,
								engineState: identifiedRootState
							});

							expect(result).toBe(NO_STATEMENT);
						});
					});

					describe("when root has a relationship with draggedItem", () => {
						describe("when parentEntityCharacteristic.order = true", () => {
							it("should return no-statement", () => {
								const result = ForbidOrderInFixedRelationshipRule.canDrop({
									dragItem: dragItem.Person,
									hoveredItem: hoveredItem[position].noParent,
									engineState: identifiedRootState
								});

								expect(result).toBe(NO_STATEMENT);
							});
						});

						describe("when parentEntityCharacteristic.order = false", () => {
							let stub: MockInstance;
							beforeAll(() => {
								const teamPersonRelationshipModel = defaultRelationshipModels[0];
								const unorderedParentRelationshipModel: RelationshipModel = {
									...teamPersonRelationshipModel,
									content: {
										...teamPersonRelationshipModel.content,
										entityCharacteristics: [
											{ ...teamPersonRelationshipModel.content.entityCharacteristics[0], ordered: false },
											teamPersonRelationshipModel.content.entityCharacteristics[1]
										]
									}
								};

								stub = vi
									.spyOn(ModelSelector, "relationshipBetweenDocumentModels")
									.mockReturnValue(() => unorderedParentRelationshipModel);
							});

							afterAll(() => stub.mockRestore());

							it("should return false", () => {
								const result = ForbidOrderInFixedRelationshipRule.canDrop({
									dragItem: dragItem.Person,
									hoveredItem: hoveredItem[position].noParent,
									engineState: identifiedRootState
								});

								expect(result).toBe(false);
							});
						});
					});
				});
			});
		});
		describe("Cases 1.3: when position = AS_CHILD", () => {
			// We only need to test the first branch "if (parentRow && NodeRow.isAssignableFrom(parentRow))",
			// because this condition is always true for case position = AS_CHILD

			describe("when parent of hoveredItem has NO relationship with draggedItem", () => {
				it("should return no-statement", () => {
					const result = ForbidOrderInFixedRelationshipRule.canDrop({
						dragItem: dragItem.Dummy,
						hoveredItem: hoveredItem.asChild,
						engineState: basicEngineState
					});

					expect(result).toBe(NO_STATEMENT);
				});
			});

			describe("when parent of hoveredItem has relationship with draggedItem", () => {
				describe("when parentEntityCharacteristic.ordered = true", () => {
					it("should return no-statement", () => {
						const result = ForbidOrderInFixedRelationshipRule.canDrop({
							dragItem: dragItem.Person,
							hoveredItem: hoveredItem.asChild,
							engineState: basicEngineState
						});

						expect(result).toBe(NO_STATEMENT);
					});
				});

				describe("when parentEntityCharacteristic.ordered = false", () => {
					let stub: MockInstance;
					beforeAll(() => {
						stub = vi.spyOn(RelationshipModelUtils, "getEntityCharacteristicByRole").mockReturnValue(
							mockType<EntityCharacteristics>({
								ordered: false
							})
						);
					});

					afterAll(() => stub.mockRestore());

					it("should return no-statement", () => {
						const result = ForbidOrderInFixedRelationshipRule.canDrop({
							dragItem: dragItem.Person,
							hoveredItem: hoveredItem.asChild,
							engineState: basicEngineState
						});

						expect(result).toBe(false);
					});
				});
			});
		});
	});

	describe(ForbidOrderBetweenDifferentRelationships.name, () => {
		const positions = [TreeTableNodeDropPosition.TOP, TreeTableNodeDropPosition.BOTTOM] as const;
		positions.forEach((position, index) => {
			const caseIndex = index + 1;

			describe(`Cases 2.${caseIndex}: when position = ${position.toUpperCase()}`, () => {
				describe(`Cases 2.${caseIndex}.1: when hoveredItem has NO parent`, () => {
					describe("when root has NO identifier", () => {
						it("should return no-statement", () => {
							expect(
								ForbidOrderBetweenDifferentRelationships.canDrop({
									dragItem: dragItem.Dummy,
									hoveredItem: hoveredItem[position].noParent,
									engineState: basicEngineState
								})
							).toBe(NO_STATEMENT);
						});
					});

					describe("when the root has identifier", () => {
						describe("when root has NO relationship with dragItem", () => {
							it("should return no-statement", () => {
								expect(
									ForbidOrderBetweenDifferentRelationships.canDrop({
										dragItem: dragItem.Dummy,
										hoveredItem: hoveredItem[position].noParent,
										engineState: identifiedRootState
									})
								).toBe(NO_STATEMENT);
							});
						});

						describe("when root has relationship with dragItem", () => {
							describe("when this relationship id is same as link type of hoveredItem", () => {
								it("should return true", () => {
									expect(
										ForbidOrderBetweenDifferentRelationships.canDrop({
											dragItem: dragItem.Team,
											hoveredItem: {
												...hoveredItem[position].noParent,
												row: {
													...hoveredItem[position].noParent.row,
													parent: rootNode,
													data: {
														...hoveredItem[position].noParent.row.data,
														nodePath: [mockType<Identifier>(), mockType<Identifier>({ type: "TeamTeam" })]
													}
												}
											},
											engineState: identifiedRootState
										})
									).toBe(true);
								});
							});

							describe("when this relationship id is NOT same as link type of hoveredItem", () => {
								describe("when this relationship id is same as link type of hoveredItem's predecessor", () => {
									const expectedResult = position === TreeTableNodeDropPosition.TOP;
									it("should return " + expectedResult, () => {
										expect(
											ForbidOrderBetweenDifferentRelationships.canDrop({
												dragItem: dragItem.Team,
												hoveredItem: {
													...hoveredItem[position].noParent,
													row: {
														...hoveredItem[position].noParent.row,
														parent: rootNode,
														predecessor: [mockType<Identifier>(), mockType<Identifier>({ type: "TeamTeam" })]
													}
												},
												engineState: identifiedRootState
											})
										).toBe(expectedResult);
									});
								});

								describe(
									"when this relationship id is NOT same as link type of hoveredItem's predecessor" +
										"\n\t  when this relationship id is same as link type of hoveredItem's successor",
									() => {
										const expectedResult = position === TreeTableNodeDropPosition.BOTTOM;

										it("should return " + expectedResult, () => {
											expect(
												ForbidOrderBetweenDifferentRelationships.canDrop({
													dragItem: dragItem.Team,
													hoveredItem: {
														...hoveredItem[position].noParent,
														row: {
															...hoveredItem[position].noParent.row,
															parent: rootNode,
															successor: [mockType<Identifier>(), mockType<Identifier>({ type: "TeamTeam" })]
														}
													},
													engineState: identifiedRootState
												})
											).toBe(expectedResult);
										});
									}
								);
							});
						});
					});
				});
				describe(`Cases 2.${caseIndex}.2: when hoveredItem has parent`, () => {
					describe("when parent of hoveredItem has NO relationship with dragItem", () => {
						it("should return no-statement", () => {
							expect(
								ForbidOrderBetweenDifferentRelationships.canDrop({
									dragItem: dragItem.Dummy,
									hoveredItem: hoveredItem[position].hasParent,
									engineState: basicEngineState
								})
							).toBe(NO_STATEMENT);
						});
					});
					//
					describe("when parent of hoveredItem has a relationship with draggedItem", () => {
						describe("when this relationship id is same as link type of hoveredItem", () => {
							it("should return true", () => {
								expect(
									ForbidOrderBetweenDifferentRelationships.canDrop({
										dragItem: dragItem.hasNodeModel,
										hoveredItem: {
											...hoveredItem[position].hasParent,
											row: {
												...hoveredItem[position].hasParent.row,
												data: {
													...hoveredItem[position].hasParent.row.data,
													nodePath: [mockType<Identifier>(), mockType<Identifier>({ type: "TeamTeam" })]
												}
											}
										},
										engineState: basicEngineState
									})
								).toBe(true);
							});
						});
						//
						describe("when this relationship id is NOT same as link type of hoveredItem", () => {
							describe("when this relationship id is same as link type of hoveredItem's predecessor", () => {
								const expectedResult = position === TreeTableNodeDropPosition.TOP;
								it("should return " + expectedResult, () => {
									expect(
										ForbidOrderBetweenDifferentRelationships.canDrop({
											dragItem: dragItem.hasNodeModel,
											hoveredItem: {
												...hoveredItem[position].hasParent,
												row: {
													...hoveredItem[position].hasParent.row,
													data: {
														...hoveredItem[position].hasParent.row.data
													},
													predecessor: [mockType<Identifier>(), mockType<Identifier>({ type: "TeamTeam" })]
												}
											},
											engineState: basicEngineState
										})
									).toBe(expectedResult);
								});
							});

							describe(
								"when this relationship id is NOT same as link type of hoveredItem's predecessor" +
									"\n\t  when this relationship id is same as link type of hoveredItem's successor",
								() => {
									const expectedResult = position === TreeTableNodeDropPosition.BOTTOM;

									it("should return " + expectedResult, () => {
										expect(
											ForbidOrderBetweenDifferentRelationships.canDrop({
												dragItem: dragItem.hasNodeModel,
												hoveredItem: {
													...hoveredItem[position].hasParent,
													row: {
														...hoveredItem[position].hasParent.row,
														data: {
															...hoveredItem[position].hasParent.row.data
														},
														successor: [mockType<Identifier>(), mockType<Identifier>({ type: "TeamTeam" })]
													}
												},
												engineState: basicEngineState
											})
										).toBe(expectedResult);
									});
								}
							);
						});
					});
				});
			});
		});

		describe("Case 2.3: when position = AS_CHILD", () => {
			describe("when hoveredItem has NO relationship with dragItem", () => {
				it("should return no-statement", () => {
					expect(
						ForbidOrderBetweenDifferentRelationships.canDrop({
							dragItem: dragItem.Dummy,
							hoveredItem: hoveredItem.asChild,
							engineState: basicEngineState
						})
					).toBe(NO_STATEMENT);
				});
			});

			describe(
				"when hoveredItem has a relationship with draggedItem" +
					"\n\t  when this relationship id is same as link type of hoveredItem",
				() => {
					it("should return true", () => {
						expect(
							ForbidOrderBetweenDifferentRelationships.canDrop({
								dragItem: dragItem.Team,
								hoveredItem: {
									...hoveredItem.asChild,
									row: {
										...hoveredItem.asChild.row,
										data: {
											...hoveredItem.asChild.row.data,
											nodePath: [mockType<Identifier>(), mockType<Identifier>({ type: "TeamTeam" })]
										}
									}
								},
								engineState: basicEngineState
							})
						).toBe(true);
					});
				}
			);

			// This case will never happen because it will return true early by rule:
			// 'A node row can only be dropped as child of other node row when there is a valid relationship between them.'
			describe(
				"when hoveredItem has a relationship with draggedItem" +
					"\n\t  when this relationship id is NOT same as link type of hoveredItem",
				() => {
					it("should return false", () => {
						expect(
							ForbidOrderBetweenDifferentRelationships.canDrop({
								dragItem: dragItem.Person,
								hoveredItem: hoveredItem.asChild,
								engineState: basicEngineState
							})
						).toBe(false);
					});
				}
			);
		});
	});

	describe(ForbidOrderTopLevelRule.name, () => {
		const baseParams: Parameters<CanDropRule["canDrop"]>[0] = {
			dragItem: dragItem.Dummy,
			hoveredItem: {
				...hoveredItem.top.hasParent,
				row: {
					...hoveredItem.top.hasParent.row,
					parent: RootNodeRow.create()
				}
			},
			engineState: basicEngineState
		};

		describe("when ordering within top level in default instance", () => {
			it("should return false", () => {
				expect(ForbidOrderTopLevelRule.canDrop(baseParams)).toBe(false);
			});
		});

		describe("when position = AS_CHILD", () => {
			it("should return no-statement", () => {
				expect(ForbidOrderTopLevelRule.canDrop({ ...baseParams, hoveredItem: hoveredItem.asChild })).toBe(NO_STATEMENT);
			});
		});

		describe("when the parent of hoveredItem is not the root", () => {
			it("should return no-statement", () => {
				expect(ForbidOrderTopLevelRule.canDrop({ ...baseParams, hoveredItem: hoveredItem.top.hasParent })).toBe(
					NO_STATEMENT
				);
			});
		});

		describe("when in the hidden root instance", () => {
			it("should return no-statement", () => {
				expect(ForbidOrderTopLevelRule.canDrop({ ...baseParams, engineState: identifiedRootState })).toBe(NO_STATEMENT);
			});
		});
	});
});
