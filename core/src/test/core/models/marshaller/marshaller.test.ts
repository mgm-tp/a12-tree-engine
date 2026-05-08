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

import { type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { type LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";

import {
	findSuperTypeNode,
	type MarshallingParams,
	marshallTreeModel,
	marshallTreeNode
} from "../../../../core/models/internal/marshaller.js";
import { type TreeModel } from "../../../../core/models/index.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.models.marshaller", () => {
	const basicEngineState = defaultEngineState;

	const basicDocumentModels = basicEngineState.models.documentModels;
	const basicRelationshipModels = basicEngineState.models.modelGraph.relationshipModels;
	const basicHeader = basicEngineState.models.uiModel.header;
	const basicRuntimeTeamNode = basicEngineState.models.uiModel.content.nodes[0];

	const basicTreeNodeColumn: TreeModel.TreeNodeColumn = {
		columnRef: "column-23eade",
		elementRef: "field_c9ad3"
	};

	const basicChildRelationshipConfigurations: TreeModel.ChildRelationshipConfiguration[] = [
		{
			id: "crc-d29e42",
			relationshipModelRef: "TeamPerson",
			parentRole: "Team",
			columns: [
				{
					columnRef: "column-esd312",
					elementRef: "field_04443"
				}
			]
		},
		{
			id: "crc-cfae1d",
			relationshipModelRef: "TeamTeam",
			parentRole: "Parent"
		}
	];

	const basicTeamNode: TreeModel.TreeNode = {
		...basicRuntimeTeamNode,
		columns: [basicTreeNodeColumn],
		childRelationshipConfigurations: basicChildRelationshipConfigurations
	};

	const basicContent: TreeModel.Content = {
		subHeaderBox: { majorElements: [], minorElements: [] },
		footerBox: { majorElements: [], minorElements: [] },
		columns: [],
		nodes: [basicTeamNode],
		configuration: {
			// to initialize content.configuration.root
			rootRef: basicChildRelationshipConfigurations[1].id,
			hierarchicalColumnRef: "",
			dnd: {
				onDrag: {
					expandHoveredNode: false
				}
			},
			expansionStrategy: { type: "level_by_level" }
		}
	};

	function setupTest(params?: {
		header?: TreeModel.Header;
		content?: TreeModel.Content;
		documentModels?: DocumentModel[];
		relationshipModels?: RelationshipModel[];
	}) {
		return marshallTreeModel(
			{
				header: params?.header || basicHeader,
				content: params?.content || basicContent
			},
			params?.documentModels || basicDocumentModels,
			{
				relationshipModels: params?.relationshipModels || basicRelationshipModels,
				composeDocumentModels: [],
				documentModels: []
			}
		);
	}

	describe("content.nodes", () => {
		describe("content.nodes[_].childRelationshipConfigurations", () => {
			describe("when a childRelationshipConfiguration has no column", () => {
				it("should return that childRelationshipConfiguration with columns = undefined explicitly", () => {
					const result = setupTest();

					expect(result.content.nodes[0].childRelationshipConfigurations[1]).toEqual({
						...basicContent.nodes[0].childRelationshipConfigurations[1],
						columns: undefined
					});
				});
			});

			describe("when not found corresponding relationshipModel from a config.relationshipModelRef", () => {
				it("should throw an error", () => {
					const teamNode: TreeModel.TreeNode = {
						...basicRuntimeTeamNode,
						childRelationshipConfigurations: [
							{ ...basicChildRelationshipConfigurations[0], relationshipModelRef: "TeamDummy" },
							basicChildRelationshipConfigurations[1]
						]
					};

					expect(() =>
						setupTest({
							content: {
								...basicContent,
								nodes: [teamNode]
							}
						})
					).toThrow();
				});
			});

			describe("when the linkDocumentModelName of corresponding relationshipModel is null", () => {
				it("should return that childRelationshipConfiguration with columns = undefined explicitly", () => {
					const result = setupTest({
						relationshipModels: [
							{
								...basicRelationshipModels[0],
								content: { ...basicRelationshipModels[0].content, linkDocumentModel: null }
							},
							basicRelationshipModels[1]
						]
					});

					expect(result.content.nodes[0].childRelationshipConfigurations[1]).toEqual({
						...basicContent.nodes[0].childRelationshipConfigurations[1],
						columns: undefined
					});
				});
			});

			describe("when not found corresponding linkDataModel from calculated linkDocumentModelName", () => {
				it("should throw an error", () => {
					expect(() =>
						setupTest({
							documentModels: [
								{ ...basicDocumentModels[0], header: { ...basicDocumentModels[0].header, id: "AnotherName" } },
								...basicDocumentModels.slice(1)
							]
						})
					).toThrow();
				});
			});

			describe("when not found corresponding element in linkDataModel from column.elementRef", () => {
				it("should throw an error", () => {
					const childRelationshipConfigurations: TreeModel.ChildRelationshipConfiguration[] = [
						{
							...basicChildRelationshipConfigurations[0],
							columns: [{ columnRef: "column-esd312", elementRef: "field_12345" }]
						},
						basicChildRelationshipConfigurations[1]
					];

					expect(() =>
						setupTest({
							content: {
								...basicContent,
								nodes: [
									{
										...basicRuntimeTeamNode,
										childRelationshipConfigurations
									}
								]
							}
						})
					).toThrow();
				});
			});

			describe("when everything works properly", () => {
				it("should return columns of childRelationshipConfigurations which have the proper elementPath", () => {
					const result = setupTest();

					expect(result.content.nodes[0].childRelationshipConfigurations[0].columns?.[0]?.elementPath).toEqual([
						{ elementName: "grp1" },
						{ elementName: "Position" }
					]);
				});
			});
		});

		describe("content.nodes[_].columns", () => {
			describe("when not found dataModel from node.documentModelRef and params.dataModels", () => {
				it("should throw an error", () => {
					expect(() =>
						setupTest({
							content: {
								...basicContent,
								nodes: [{ ...basicTeamNode, documentModelRef: "DomainDummy" }]
							}
						})
					).toThrow();
				});
			});

			test("when can not find corresponding element from content.nodes.columns.elementRef", () => {
				const teamNode: TreeModel.TreeNode = {
					...basicTeamNode,
					columns: [{ ...basicTreeNodeColumn, elementRef: "field_12345" }]
				};

				expect(() => setupTest({ content: { ...basicContent, nodes: [teamNode] } })).toThrow();
			});

			describe("when everything works properly", () => {
				it("should return columns which have the proper elementPath", () => {
					const result = setupTest();

					expect(result.content.nodes[0].columns?.[0]?.elementPath).toEqual([
						{
							elementName: "TeamDetails"
						},
						{
							elementName: "TeamName"
						}
					]);
				});
			});
		});

		describe("inherit feature", () => {
			const superTeamNode: TreeModel.TreeNode = {
				documentModelRef: "DomainSuperTeam",
				id: "101",
				columns: [basicTreeNodeColumn],
				childRelationshipConfigurations: basicChildRelationshipConfigurations,
				actions: mockType<TreeModel.TreeNodeActionButton[]>(),
				contextMenu: mockType<TreeModel.TreeNodeContextMenu>(),
				defaultRowAction: mockType<TreeModel.DefaultRowAction>(),
				rowTitle: mockType<LocalizedModelText>(),
				icon: { name: "super-icon" },
				configuration: { dnd: true }
			};

			const customTeamNode: TreeModel.TreeNode = {
				documentModelRef: "DomainTeam",
				id: "102",
				columns: [],
				childRelationshipConfigurations: [],
				actions: mockType<TreeModel.TreeNodeActionButton[]>(),
				contextMenu: mockType<TreeModel.TreeNodeContextMenu>(),
				defaultRowAction: mockType<TreeModel.DefaultRowAction>(),
				configuration: { dnd: false }
			};

			const teamDocumentModel = basicDocumentModels[1];
			const superTeamDocumentModel: DocumentModel = {
				...teamDocumentModel,
				header: {
					...teamDocumentModel.header,
					id: "DomainSuperTeam",
					annotations: [{ name: "subTypes", value: "DomainTeam" }]
				}
			};

			const customDocumentModels: DocumentModel[] = [...basicDocumentModels, superTeamDocumentModel];

			it("subtype node should inherit only the property whose configuration.inherit.property = true", () => {
				const INHERIT_KEYS: (keyof NonNullable<TreeModel.TreeNodeConfiguration["inherit"]>)[] = [
					"icon",
					"styles",
					"actions",
					"columns",
					"contextMenu",
					"defaultRowAction",
					"rowTitle",
					"childRelationshipConfigurations"
				];

				for (const inheritKey of INHERIT_KEYS) {
					const inheritTeamNode: TreeModel.TreeNode = {
						...customTeamNode,
						configuration: {
							...customTeamNode.configuration,
							inherit: { [inheritKey]: true }
						}
					};

					const marshallingParams: MarshallingParams = {
						treeModel: {
							header: basicHeader,
							content: {
								...basicContent,
								nodes: [superTeamNode, inheritTeamNode]
							}
						},
						documentModels: customDocumentModels,
						relationshipModels: basicRelationshipModels
					};

					const inheritRuntimeTeamNode = marshallTreeNode(inheritTeamNode, marshallingParams);
					const superRuntimeTeamNode = marshallTreeNode(superTeamNode, marshallingParams);

					expect(inheritRuntimeTeamNode[inheritKey]).toEqual(superRuntimeTeamNode[inheritKey]);

					const nonInheritKeys = INHERIT_KEYS.filter((key) => key !== inheritKey);
					nonInheritKeys.forEach((nonInheritKey) => {
						expect(inheritRuntimeTeamNode[nonInheritKey]).toEqual(inheritTeamNode[nonInheritKey]);
					});
					expect(inheritRuntimeTeamNode.configuration.dnd).toBe(false);
				}
			});

			describe("findSuperTypeNode", () => {
				const basicMarshallingParams: MarshallingParams = {
					treeModel: {
						header: basicHeader,
						content: { ...basicContent, nodes: [customTeamNode] }
					},
					documentModels: basicDocumentModels,
					relationshipModels: basicRelationshipModels
				};

				describe("when no given super document model", () => {
					it("should return undefined", () => {
						expect(findSuperTypeNode(customTeamNode.documentModelRef, basicMarshallingParams)).toBe(undefined);
					});
				});

				describe("when given super document model, but the respective node is not included in tree model", () => {
					it("should return undefined", () => {
						const node = findSuperTypeNode(customTeamNode.documentModelRef, {
							...basicMarshallingParams,
							documentModels: customDocumentModels
						});
						expect(node).toBe(undefined);
					});
				});

				describe("when given super document model, and the respective node is included in tree model", () => {
					it("should return the super node", () => {
						const result = findSuperTypeNode(customTeamNode.documentModelRef, {
							...basicMarshallingParams,
							treeModel: {
								header: basicHeader,
								content: { ...basicContent, nodes: [superTeamNode, customTeamNode] }
							},
							documentModels: customDocumentModels
						});
						expect(result).toBe(superTeamNode);
					});
				});

				describe("when given multiple super document models", () => {
					it("should return the first respective node", () => {
						const anotherSuperTeamDocumentModel = mockType<DocumentModel>({
							header: {
								id: "DomainAnotherSuperTeam",
								annotations: [{ name: "subTypes", value: "DomainTeam" }]
							}
						});
						const anotherSuperTeamNode = mockType<TreeModel.TreeNode>({
							documentModelRef: "DomainAnotherSuperTeam",
							id: "103"
						});

						const result = findSuperTypeNode(customTeamNode.documentModelRef, {
							...basicMarshallingParams,
							treeModel: {
								header: basicHeader,
								content: { ...basicContent, nodes: [anotherSuperTeamNode, superTeamNode, customTeamNode] }
							},
							documentModels: [...customDocumentModels, anotherSuperTeamDocumentModel]
						});
						expect(result).toBe(anotherSuperTeamNode);
					});
				});
			});
		});
	});

	describe("content.configuration", () => {
		describe("when not found a childRelationshipConfiguration of a node whose id is same as content.configuration.rootRef", () => {
			it("should throw an error", () => {
				const content: TreeModel.Content = {
					...basicContent,
					configuration: {
						...basicContent.configuration,
						rootRef: "crc-12345"
					}
				};

				expect(() => setupTest({ content })).toThrow();
			});
		});

		describe("when found a childRelationshipConfiguration of a node whose id is same as content.configuration.rootRef", () => {
			it("should add the root into content.configuration properly", () => {
				const result = setupTest();

				expect(result.content.configuration.root).toEqual({
					documentModelRef: "DomainTeam",
					parentRole: "Parent",
					relationshipModelRef: "TeamTeam"
				});
			});
		});
	});
});
