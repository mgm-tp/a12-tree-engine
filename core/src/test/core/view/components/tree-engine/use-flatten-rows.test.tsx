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

import { DataSelector, ModelSelector, type TreeEngineState, type Identifier } from "../../../../../core/store/index.js";
import { type FlattenNodeRow, RootNodeRow } from "../../../../../core/view/index.js";
import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { testHook } from "../../../../utils/test-utils.js";
import { FlattenRowHooks } from "../../../../../core/view/components/tree-engine/use-flatten-rows.js";

describe("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.use-flatten-rows", () => {
	const basicEngineState = defaultEngineState;
	const [teamNodeModel, personNodeModel] = defaultEngineState.models.uiModel.content.nodes;

	const basicIdentifier: Identifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};

	const basicRoot: TreeEngineState.Root = {
		children: [basicIdentifier]
	};

	type CustomTreeEngineData = {
		readonly [type: string]:
			| TreeEngineState.NodeMap<TreeEngineState.Node>
			| TreeEngineState.NodeMap<TreeEngineState.Link>
			| undefined;
	};

	const basicData: CustomTreeEngineData = {
		DomainTeam: {
			"DomainTeam/1": {
				identifier: { type: "DomainTeam", id: "DomainTeam/1" },
				document: {},
				children: [
					{ type: "TeamTeam", id: "1" },
					{ type: "TeamTeam", id: "3" }
				]
			},
			"DomainTeam/2": {
				identifier: { type: "DomainTeam", id: "DomainTeam/2" },
				document: {},
				children: [{ type: "TeamPerson", id: "2" }]
			},
			"DomainTeam/3": {
				identifier: { type: "DomainTeam", id: "DomainTeam/3" },
				document: {},
				children: []
			}
		},
		TeamTeam: {
			"1": {
				identifier: { type: "TeamTeam", id: "1" },
				linkRef: {
					id: "1",
					linkDescriptor: {
						relationshipModel: "TeamTeam",
						entities: [
							{ role: "Parent", docRef: "DomainTeam/1", modelName: "DomainTeam" },
							{ role: "Child", docRef: "DomainTeam/2", modelName: "DomainTeam" }
						]
					}
				}
			},
			"3": {
				identifier: { type: "TeamTeam", id: "3" },
				linkRef: {
					id: "3",
					linkDescriptor: {
						relationshipModel: "TeamTeam",
						entities: [
							{ role: "Parent", docRef: "DomainTeam/1", modelName: "DomainTeam" },
							{ role: "Child", docRef: "DomainTeam/3", modelName: "DomainTeam" }
						]
					}
				}
			}
		},
		DomainPerson: {
			"DomainPerson/1": {
				identifier: { id: "DomainPerson/1", type: "DomainPerson" },
				document: {},
				children: []
			}
		},
		TeamPerson: {
			"2": {
				identifier: { type: "TeamPerson", id: "2" },
				linkRef: {
					id: "2",
					linkDescriptor: {
						relationshipModel: "TeamPerson",
						entities: [
							{ role: "Team", docRef: "DomainTeam/2", modelName: "DomainTeam" },
							{ role: "Person", docRef: "DomainPerson/1", modelName: "DomainPerson" }
						]
					}
				}
			}
		}
	};

	const basicUiRoot = { ...RootNodeRow.create(), childrenCount: 1 };

	function setupTest(customEngineState?: Partial<TreeEngineState>) {
		const data = customEngineState?.data || basicData;
		const root = customEngineState?.root || basicRoot;
		return testHook(FlattenRowHooks.useFlattenRows, [], { ...basicEngineState, ...customEngineState, data, root });
	}

	function testArrowButtons(rows: FlattenNodeRow[], expected: Record<string, boolean>) {
		for (const row of rows) {
			if (row.id === "ROOT") {
				continue;
			}

			const actual = row.children !== undefined;
			expect(actual).toBe(expected[row.id]);
		}
	}

	/**
	 *  Testing tree structure:
	 *    root
	 *    |-- team1
	 *    |   |-- team2
	 *    |       |-- person1
	 *    |-- team3
	 *
	 *  We will test in both two cases:
	 *   1. Team1 is a child of the root
	 *   2. Team1 is the root.
	 *
	 *  The four below constants are expected expanded subtree at each node row.
	 */

	const nodeRowAtPerson_1: FlattenNodeRow = {
		data: {
			nodeIdentifier: { id: "DomainPerson/1", type: "DomainPerson" },
			nodePath: [
				{ id: "DomainTeam/1", type: "DomainTeam" },
				{ id: "1", type: "TeamTeam" },
				{ id: "2", type: "TeamPerson" }
			]
		},
		id: "DomainTeam[DomainTeam/1]=>TeamTeam[1]=>TeamPerson[2]",
		level: 2,
		childrenCount: 0,
		rowIndex: 0,
		fullPageSize: 0,
		nodeModel: personNodeModel,
		predecessor: undefined,
		successor: undefined,
		lastIndex: true
	};

	const nodeRowAtTeam_2: FlattenNodeRow = {
		children: [],
		data: {
			nodeIdentifier: { id: "DomainTeam/2", type: "DomainTeam" },
			nodePath: [
				{ id: "DomainTeam/1", type: "DomainTeam" },
				{ id: "1", type: "TeamTeam" }
			]
		},
		id: "DomainTeam[DomainTeam/1]=>TeamTeam[1]",
		level: 1,
		childrenCount: 1,
		fullPageSize: 0,
		rowIndex: 0,
		nodeModel: teamNodeModel,
		predecessor: undefined,
		successor: undefined,
		lastIndex: false
	};

	const nodeRowAtTeam_3: FlattenNodeRow = {
		children: [],
		data: {
			nodeIdentifier: { id: "DomainTeam/3", type: "DomainTeam" },
			nodePath: [
				{ id: "DomainTeam/1", type: "DomainTeam" },
				{ id: "3", type: "TeamTeam" }
			]
		},
		id: "DomainTeam[DomainTeam/1]=>TeamTeam[3]",
		level: 1,
		childrenCount: 0,
		fullPageSize: 0,
		rowIndex: 1,
		nodeModel: teamNodeModel,
		predecessor: undefined,
		successor: undefined,
		lastIndex: true
	};

	const nodeRowAtTeam_1: FlattenNodeRow = {
		children: [],
		data: {
			nodeIdentifier: { id: "DomainTeam/1", type: "DomainTeam" },
			nodePath: [{ id: "DomainTeam/1", type: "DomainTeam" }]
		},
		id: "DomainTeam[DomainTeam/1]",
		level: 0,
		childrenCount: 2,
		fullPageSize: 0,
		rowIndex: 0,
		nodeModel: teamNodeModel,
		predecessor: undefined,
		successor: undefined,
		lastIndex: false
	};

	function eliminateIcon(node: FlattenNodeRow): Exclude<FlattenNodeRow, "icon"> {
		const result = { ...node };
		delete result.icon;
		return result;
	}

	function eliminateParent(node: FlattenNodeRow): Exclude<FlattenNodeRow, "parent"> {
		const result = { ...node };
		delete result.parent;
		return result;
	}

	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	describe("Case 1: Root has no identifier", () => {
		describe("Case 1.1: Root has no children", () => {
			it("should return RootNodeRow with empty children", () => {
				const uiRoot = setupTest({ root: { ...basicRoot, children: [] } });

				const root = { ...basicUiRoot, childrenCount: 0 };
				expect(uiRoot).toEqual([root]);
			});
		});

		describe(`Case 1.2: Tree has structure:
                       root (No identifier)
                       |-- team1
                       |   |-- team2
                       |   |    |-- person1
                       |   |-- team3`, () => {
			describe("when the corresponding node in store for team1 is NOT found", () => {
				beforeAll(() => {
					vi.spyOn(DataSelector, "node").mockReturnValue(() => undefined);
				});

				it("should throw an error", () => {
					expect(() => setupTest()).toThrow();
				});
			});

			describe("when the corresponding node in store for team1 is found", () => {
				describe("when corresponding node model for team1 is NOT found", () => {
					beforeAll(() => {
						vi.spyOn(ModelSelector, "nodeModel").mockReturnValue(() => undefined);
					});

					it("should throw an error", () => {
						expect(() => setupTest()).toThrow();
					});
				});

				describe("when corresponding node model for team1 is found", () => {
					describe("when team1 node is NOT expanded", () => {
						it("should only calculate nodeRow at 01 levels", () => {
							const flattenNodeRows = setupTest();

							expect(flattenNodeRows.map(eliminateIcon)).toEqual([
								basicUiRoot,
								{ ...nodeRowAtTeam_1, parent: basicUiRoot, childrenCount: 2 }
							]);
						});
					});

					describe("when team1 node is expanded", () => {
						describe("when the link between team1 and team2 is NOT found", () => {
							it("should throw an error", () => {
								const customEngineState: Partial<TreeEngineState> = {
									data: {
										...basicData,
										TeamTeam: undefined
									},
									root: basicRoot,
									expandedNodes: {
										"DomainTeam[DomainTeam/1]": {}
									}
								};

								expect(() => setupTest(customEngineState)).toThrow();
							});
						});

						describe("when the link between team1 and team2 is found", () => {
							describe("when team2 is not expanded", () => {
								it("should only calculate nodeRow at 02 levels", () => {
									const result = setupTest({
										expandedNodes: {
											"DomainTeam[DomainTeam/1]": {}
										}
									});

									expect(result.map(eliminateIcon).map(eliminateParent)).toEqual([
										basicUiRoot,
										nodeRowAtTeam_1,
										{
											...nodeRowAtTeam_2,
											successor: [
												{ id: "DomainTeam/1", type: "DomainTeam" },
												{ id: "3", type: "TeamTeam" }
											]
										},
										{
											...nodeRowAtTeam_3,
											predecessor: [
												{ id: "DomainTeam/1", type: "DomainTeam" },
												{ id: "1", type: "TeamTeam" }
											]
										}
									]);

									testArrowButtons(result, {
										[nodeRowAtTeam_1.id]: true,
										[nodeRowAtTeam_2.id]: true,
										[nodeRowAtTeam_3.id]: true
									});
								});
							});

							describe("when team2 is expanded", () => {
								it("should only calculate nodeRow at all (03) levels", () => {
									const result = setupTest({
										expandedNodes: {
											"DomainTeam[DomainTeam/1]": {},
											"DomainTeam[DomainTeam/1]=>TeamTeam[1]": {}
										}
									});

									expect(result.map(eliminateIcon).map(eliminateParent)).toEqual([
										basicUiRoot,
										nodeRowAtTeam_1,
										{
											...nodeRowAtTeam_2,
											successor: [
												{ id: "DomainTeam/1", type: "DomainTeam" },
												{ id: "3", type: "TeamTeam" }
											]
										},
										{ ...nodeRowAtPerson_1, children: undefined },
										{
											...nodeRowAtTeam_3,
											predecessor: [
												{ id: "DomainTeam/1", type: "DomainTeam" },
												{ id: "1", type: "TeamTeam" }
											]
										}
									]);

									testArrowButtons(result, {
										[nodeRowAtTeam_1.id]: true,
										[nodeRowAtTeam_2.id]: true,
										[nodeRowAtPerson_1.id]: false,
										[nodeRowAtTeam_3.id]: true
									});
								});
							});
						});
					});
				});
			});
		});

		describe("when enable preload", () => {
			it("should hide arrow button for expanded and no child nodes", () => {
				const result = setupTest({
					...basicEngineState,
					preloadChildNodes: true,
					root: basicRoot,
					data: basicData,
					expandedNodes: {
						"DomainTeam[DomainTeam/1]": {},
						"DomainTeam[DomainTeam/1]=>TeamTeam[1]": {},
						"DomainTeam[DomainTeam/1]=>TeamTeam[1]=>TeamPerson[2]": {},
						"DomainTeam[DomainTeam/1]=>TeamTeam[3]": {}
					}
				});

				testArrowButtons(result, {
					[nodeRowAtTeam_1.id]: true,
					[nodeRowAtTeam_2.id]: true,
					[nodeRowAtPerson_1.id]: false,
					[nodeRowAtTeam_3.id]: false
				});
			});
		});
	});

	describe(`Case 2: Tree root has an identifier (team1), with structure
			       root (= team1)
			       |-- team2
			       |   |-- person1
			       |-- team3
			      `, () => {
		const identifiedRoot: TreeEngineState.Root = {
			identifier: { type: "DomainTeam", id: "DomainTeam/1" },
			children: [
				{ type: "TeamTeam", id: "1" },
				{ type: "TeamTeam", id: "3" }
			]
		};

		describe("when can not find opposite entity with root entity", () => {
			it("should throw an error", () => {
				const customEngineState = {
					root: identifiedRoot,
					data: {
						...basicData,
						TeamTeam: {
							...basicData["TeamTeam"],
							"1": {
								identifier: { type: "TeamTeam", id: "1" },
								linkRef: {
									id: "1",
									linkDescriptor: {
										relationshipModel: "TeamTeam",
										entities: [
											{ role: "Parent", docRef: "DomainTeam/1" },
											{ role: "Child", docRef: "DomainTeam/1" }
										]
									}
								}
							}
						}
					}
				};

				expect(() => setupTest(customEngineState)).toThrow();
			});
		});
		describe("when all node rows is collapsed", () => {
			it("should calculate at 01 level", () => {
				const result = setupTest({ root: identifiedRoot, expandedNodes: {} });

				const root = { ...basicUiRoot, childrenCount: 2 };
				expect(result.map(eliminateIcon).map(eliminateParent)).toEqual([
					root,
					{
						...nodeRowAtTeam_2,
						level: 0,
						successor: [
							{ id: "DomainTeam/1", type: "DomainTeam" },
							{ id: "3", type: "TeamTeam" }
						]
					},
					{
						...nodeRowAtTeam_3,
						level: 0,
						predecessor: [
							{ id: "DomainTeam/1", type: "DomainTeam" },
							{ id: "1", type: "TeamTeam" }
						],
						lastIndex: true
					}
				]);

				testArrowButtons(result, {
					[nodeRowAtTeam_2.id]: true,
					[nodeRowAtTeam_3.id]: true
				});
			});
		});

		describe("when team2 is expanded", () => {
			it("should calculate at 02 levels", () => {
				const result = setupTest({
					root: identifiedRoot,
					expandedNodes: {
						"DomainTeam[DomainTeam/1]=>TeamTeam[1]": {}
					}
				});

				const root = { ...basicUiRoot, childrenCount: 2 };
				expect(result.map(eliminateIcon).map(eliminateParent)).toEqual([
					root,
					{
						...nodeRowAtTeam_2,
						level: 0,
						successor: [
							{ id: "DomainTeam/1", type: "DomainTeam" },
							{ id: "3", type: "TeamTeam" }
						]
					},
					{ ...nodeRowAtPerson_1, level: 1, children: undefined },
					{
						...nodeRowAtTeam_3,
						level: 0,
						predecessor: [
							{ id: "DomainTeam/1", type: "DomainTeam" },
							{ id: "1", type: "TeamTeam" }
						],
						lastIndex: true
					}
				]);
			});
		});

		describe("when enable preload", () => {
			it("should hide arrow button for no child nodes", () => {
				const result = setupTest({
					...basicEngineState,
					preloadChildNodes: true,
					root: identifiedRoot,
					data: basicData,
					expandedNodes: { "DomainTeam[DomainTeam/1]=>TeamTeam[1]": {} }
				});

				testArrowButtons(result, {
					[nodeRowAtTeam_2.id]: true,
					[nodeRowAtPerson_1.id]: false,
					[nodeRowAtTeam_3.id]: false
				});
			});
		});
	});
});
