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

import { DataSelector, Identifier, TreeEngineState } from "../../../../core/store/index.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";
import { type Mutable } from "../../../../extensions/client/internal/shared.js";
import { createMockPerson } from "../../../utils/state-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.store.selectors.data", () => {
	const basicEngineState = defaultEngineState;

	const basicNodeIdentifier: Identifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};

	describe("DataSelector", () => {
		describe("data", () => {
			it("should return data selector", () => {
				const result = DataSelector.data()(basicEngineState);

				expect(result).toBe(basicEngineState.data);
			});
		});

		describe("root", () => {
			it("should return root selector", () => {
				const result = DataSelector.root()(basicEngineState);

				expect(result).toBe(basicEngineState.root);
			});
		});

		describe("node", () => {
			it("should return node selector", () => {
				const result = DataSelector.node(basicNodeIdentifier)(basicEngineState);

				expect(result).toBe(basicEngineState.data?.[basicNodeIdentifier.type]?.[basicNodeIdentifier.id]);
			});
		});

		describe("link", () => {
			it("should return link selector", () => {
				const linkRefMoq = mockType<TreeEngineState.LinkRef>();

				const node: TreeEngineState.Link = {
					identifier: basicNodeIdentifier,
					linkRef: linkRefMoq
				};

				const state: TreeEngineState = {
					...basicEngineState,
					data: {
						...basicEngineState.data,
						[basicNodeIdentifier.type]: {
							[basicNodeIdentifier.id]: node
						}
					}
				};

				const result = DataSelector.link(basicNodeIdentifier)(state);

				expect(result).toBe(node);
			});
		});

		describe("selectors of relative nodes", () => {
			describe("basic tree", () => {
				const parentIdentifier: Identifier = Identifier.from("DomainTeam/20");
				const parentPath: TreeEngineState.NodePath = [parentIdentifier];
				const {
					identifier: firstPersonIdentifier,
					linkIdentifier: firstPersonLinkIdentifier,
					nodePath: firstPersonPath,
					link: firstPersonLink
				} = createMockPerson("DomainPerson/20", parentPath, parentIdentifier);

				const {
					identifier: secondPersonIdentifier,
					linkIdentifier: secondPersonLinkIdentifier,
					nodePath: secondPersonPath,
					link: secondPersonLink
				} = createMockPerson("DomainPerson/21", parentPath, parentIdentifier);

				const {
					identifier: thirdPersonIdentifier,
					linkIdentifier: thirdPersonLinkIdentifier,
					nodePath: thirdPersonPath,
					link: thirdPersonLink
				} = createMockPerson("DomainPerson/22", parentPath, parentIdentifier);

				const children: Identifier[] = [
					{ id: "TeamTeam/21", type: "TeamTeam" },
					firstPersonLinkIdentifier,
					secondPersonLinkIdentifier,
					thirdPersonLinkIdentifier
				];
				const parentNode: TreeEngineState.Node = { identifier: parentIdentifier, document: {}, children };
				const engineState: TreeEngineState = {
					...basicEngineState,
					root: { ...basicEngineState.root, children: [...basicEngineState.root.children, parentIdentifier] },
					data: {
						...basicEngineState.data,
						["TeamPerson"]: {
							...basicEngineState.data["TeamPerson"],
							[firstPersonLinkIdentifier.id]: firstPersonLink,
							[secondPersonLinkIdentifier.id]: secondPersonLink,
							[thirdPersonLinkIdentifier.id]: thirdPersonLink
						},
						["DomainTeam"]: {
							...basicEngineState.data["DomainTeam"],
							[parentIdentifier.id]: parentNode
						}
					}
				};

				describe("parent", () => {
					const result = DataSelector.parent({
						nodeIdentifier: firstPersonIdentifier,
						nodePath: firstPersonPath
					})(engineState);

					it("should select the correct parent", () => {
						expect(result).toEqual({
							nodeIdentifier: parentIdentifier,
							linkIdentifier: firstPersonLinkIdentifier,
							nodePath: parentPath
						});
					});
				});

				describe("predecessor", () => {
					describe("given the first node", () => {
						it("should return undefined", () => {
							const result = DataSelector.predecessor({
								nodeIdentifier: firstPersonIdentifier,
								nodePath: firstPersonPath
							})(engineState);
							expect(result).toBeUndefined();
						});
					});

					describe("given a node in middle", () => {
						it("should select the node's predecessor", () => {
							const result = DataSelector.predecessor({
								nodeIdentifier: secondPersonIdentifier,
								nodePath: secondPersonPath
							})(engineState);

							expect(result).toEqual({
								nodeIdentifier: firstPersonIdentifier,
								linkIdentifier: firstPersonLinkIdentifier,
								nodePath: firstPersonPath
							});
						});
					});
				});

				describe("successor", () => {
					describe("given the last node", () => {
						it("should return undefined", () => {
							const result = DataSelector.successor({
								nodeIdentifier: thirdPersonIdentifier,
								nodePath: thirdPersonPath
							})(engineState);

							expect(result).toBeUndefined();
						});
					});

					describe("given a node in middle", () => {
						it("should select the correct successor", () => {
							const result = DataSelector.successor({
								nodeIdentifier: firstPersonIdentifier,
								nodePath: firstPersonPath
							})(engineState);

							expect(result).toEqual({
								nodeIdentifier: secondPersonIdentifier,
								linkIdentifier: secondPersonLinkIdentifier,
								nodePath: secondPersonPath
							});
						});
					});
				});
			});

			describe("circular tree", () => {
				const teamIdentifier: Identifier = { id: "DomainTeam/20", type: "DomainTeam" };
				const parentPath: TreeEngineState.NodePath = [teamIdentifier];

				const childLinkIdentifier: Identifier = { id: "TeamTeam/1", type: "TeamTeam" };
				const childNodePath: TreeEngineState.NodePath = [...parentPath, childLinkIdentifier];
				const childLink: TreeEngineState.Link = mockType<TreeEngineState.Link>({
					linkRef: mockType<TreeEngineState.LinkRef>({
						linkDescriptor: {
							entities: [
								{ docRef: teamIdentifier.id, role: "Parent", modelName: "DomainTeam" },
								{ docRef: teamIdentifier.id, role: "Child", modelName: "DomainTeam" }
							]
						}
					})
				});

				const parentNode: TreeEngineState.Node = {
					identifier: teamIdentifier,
					document: {},
					children: [childLinkIdentifier]
				};
				const engineState: TreeEngineState = {
					...basicEngineState,
					root: { ...basicEngineState.root, children: [...basicEngineState.root.children, teamIdentifier] },
					data: {
						...basicEngineState.data,
						["TeamTeam"]: {
							...basicEngineState.data["TeamTeam"],
							[childLinkIdentifier.id]: childLink
						},
						["DomainTeam"]: {
							...basicEngineState.data["DomainTeam"],
							parentNode
						}
					}
				};

				describe("parent", () => {
					const result = DataSelector.parent({
						nodeIdentifier: teamIdentifier,
						nodePath: childNodePath
					})(engineState);

					it("should select the correct parent", () => {
						expect(result).toEqual({
							nodeIdentifier: teamIdentifier,
							linkIdentifier: childLinkIdentifier,
							nodePath: parentPath
						});
					});
				});
			});
		});

		describe("isCircularPath", () => {
			function createTeamNode(id: string): TreeEngineState.Node {
				return {
					identifier: { id: `DomainTeam/${id}`, type: "DomainTeam" },
					document: {},
					children: []
				};
			}

			function createTeamTeamLink(
				parentTeamNode: Mutable<TreeEngineState.Node>,
				childTeamNode: TreeEngineState.Node
			): TreeEngineState.Link {
				const id = `${parentTeamNode.identifier.id}-${childTeamNode.identifier.id}`;
				const link: TreeEngineState.Link = {
					identifier: { type: "TeamTeam", id: `TeamTeam/${id}` },
					linkRef: {
						id,
						linkDescriptor: {
							relationshipModel: "TeamTeam",
							entities: [
								{ role: "Parent", docRef: parentTeamNode.identifier.id, modelName: parentTeamNode.identifier.type },
								{ role: "Child", docRef: childTeamNode.identifier.id, modelName: parentTeamNode.identifier.type }
							]
						}
					}
				};
				parentTeamNode.children = [...parentTeamNode.children, link.identifier];
				return link;
			}

			const node0 = createTeamNode("0");
			const node1 = createTeamNode("1");
			const node2 = createTeamNode("2");
			const node3 = createTeamNode("3");
			const node4 = createTeamNode("4");

			const link01 = createTeamTeamLink(node0, node1);
			const link12 = createTeamTeamLink(node1, node2);
			const link23 = createTeamTeamLink(node2, node3);
			const link31 = createTeamTeamLink(node3, node1);
			const link14 = createTeamTeamLink(node1, node4);

			const engineState: TreeEngineState = {
				...basicEngineState,
				root: { ...basicEngineState.root, children: [node0.identifier] },
				data: {
					["TeamTeam"]: {
						[link01.identifier.id]: link01,
						[link12.identifier.id]: link12,
						[link23.identifier.id]: link23,
						[link31.identifier.id]: link31,
						[link14.identifier.id]: link14
					},
					["DomainTeam"]: {
						[node0.identifier.id]: node0,
						[node1.identifier.id]: node1,
						[node2.identifier.id]: node2,
						[node3.identifier.id]: node3,
						[node4.identifier.id]: node4
					}
				}
			};

			const testCases: [TreeEngineState.NodePath, boolean][] = [
				[[], false],
				[[node0.identifier], false],
				[[node0.identifier, link01.identifier, link14.identifier], false],
				[[node0.identifier, link01.identifier, link12.identifier, link23.identifier, link31.identifier], true],
				[
					[
						node0.identifier,
						link01.identifier,
						link12.identifier,
						link23.identifier,
						link31.identifier,
						link14.identifier
					],
					true
				]
			];

			testCases.forEach(([nodePath, expectedResult]) => {
				describe(`given path ${TreeEngineState.NodePath.toString(nodePath)}`, () => {
					it(`should be ${expectedResult}`, () => {
						expect(DataSelector.isCircularPath(nodePath)(engineState)).toBe(expectedResult);
					});
				});
			});
		});
	});
});
