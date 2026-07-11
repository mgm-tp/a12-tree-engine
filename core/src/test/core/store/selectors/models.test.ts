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

import { vi, type MockInstance } from "vitest";

import type { RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { ModelSelector } from "../../../../core/store/index.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { categoryEngineState, dataModelerEngineState } from "../../../utils/model-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.store.selectors.model", () => {
	const basicEngineState = defaultEngineState;
	const teamNodeModel = basicEngineState.models.uiModel.content.nodes[0];
	const [teamPersonConfig, teamTeamConfig] = teamNodeModel.childRelationshipConfigurations;

	describe("models", () => {
		it("should return the correct selector", () => {
			const models = ModelSelector.models()(basicEngineState);
			expect(models).toBe(basicEngineState.models);
		});
	});

	describe("modelGraph", () => {
		it("should return the correct selector", () => {
			const modelGraph = ModelSelector.modelGraph()(basicEngineState);
			expect(modelGraph).toBe(basicEngineState.models.modelGraph);
		});
	});

	describe("documentModelByName", () => {
		describe("given valid data model names", () => {
			it("should return the selector for each model name", () => {
				basicEngineState.models.documentModels.forEach((dataModel) => {
					const selector = ModelSelector.documentModelByName(dataModel.header.id);
					expect(selector(basicEngineState)).toBe(dataModel);
				});
			});
		});

		describe("given an invalid data model name", () => {
			const invalidName = "invalidDataModelName!";
			it("should return the selector that returns undefined", () => {
				const documentModel = ModelSelector.documentModelByName(invalidName)(basicEngineState);
				expect(documentModel).toBeUndefined();
			});
		});
	});

	describe("relationshipModels", () => {
		it("should return the selector for relationship models", () => {
			const relationshipModels = ModelSelector.relationshipModels()(basicEngineState);
			expect(relationshipModels).toBe(basicEngineState.models.modelGraph.relationshipModels);
		});
	});

	describe("relationshipModelByName", () => {
		describe("given valid relationship model names", () => {
			it("should return the selector for each model name", () => {
				basicEngineState.models.modelGraph.relationshipModels.forEach((relationshipModel) => {
					const selector = ModelSelector.relationshipModelByName(relationshipModel.header.id);
					expect(selector(basicEngineState)).toBe(relationshipModel);
				});
			});
		});

		describe("given an invalid relationship model name", () => {
			const invalidName = "invalidRelationshipModelName!";
			it("should return the selector that returns undefined", () => {
				const relationshipModel = ModelSelector.relationshipModelByName(invalidName)(basicEngineState);
				expect(relationshipModel).toBeUndefined();
			});
		});
	});

	describe("relationshipBetweenDocumentModels", () => {
		const selector = ModelSelector.relationshipBetweenDocumentModels;
		const engineState = dataModelerEngineState;
		const { relationshipModels } = engineState.models.modelGraph;
		const groupElementRm = relationshipModels[0];

		const testCases: [string, string, RelationshipModel | undefined][] = [
			["DomainGroup", "DomainElement", groupElementRm],
			["DomainGroup", "DomainGroup", groupElementRm],
			["DomainGroup", "DomainAttachmentGroup", groupElementRm],
			["DomainGroup", "DomainRule", groupElementRm],
			["DomainGroup", "DomainField", groupElementRm],
			["DomainAttachmentGroup", "DomainField", groupElementRm],
			["DomainAttachmentGroup", "DomainRule", groupElementRm],
			["DomainMultiSelectGroup", "DomainField", groupElementRm],
			["DomainGroup", "DomainDummy", undefined]
		];

		testCases.forEach(([firstDm, secondDm, expectedResult]) => {
			describe(`given ${firstDm} and ${secondDm}`, () => {
				it(`should return ${expectedResult?.header?.id}`, () => {
					const result = selector([firstDm, secondDm])(engineState);
					expect(result?.header.id).toBe(expectedResult?.header.id);
				});
			});
		});
	});

	describe("subtypeModels", () => {
		const engineState = dataModelerEngineState;
		const [elementDm, groupDm, attachmentGroupDm, multiSelectGroupDm, fieldDm, ruleDm] =
			engineState.models.modelGraph.documentModels;

		describe("given DomainElement", () => {
			it("should return group, rule and field document model", () => {
				const result = ModelSelector.subtypeModels(elementDm)(engineState);
				expect(result).toEqual([groupDm, fieldDm, ruleDm]);
			});

			it("should return all groups, rule and field document model if recursively", () => {
				const result = ModelSelector.subtypeModels(elementDm, true)(engineState);
				expect(result).toEqual([groupDm, attachmentGroupDm, multiSelectGroupDm, fieldDm, ruleDm]);
			});
		});

		describe("given DomainGroup", () => {
			it("should return two sub-groups", () => {
				const result = ModelSelector.subtypeModels(groupDm)(engineState);
				expect(result).toEqual([attachmentGroupDm, multiSelectGroupDm]);
			});
		});

		describe("given DomainAttachmentGroup", () => {
			it("should return empty array", () => {
				const result = ModelSelector.subtypeModels(attachmentGroupDm)(engineState);
				expect(result).toEqual([]);
			});
		});
	});

	describe("subtypeModelsByName", () => {
		const engineState = dataModelerEngineState;
		const [elementDm] = engineState.models.modelGraph.documentModels;

		let subtypeModelsStub: MockInstance;

		beforeAll(() => {
			subtypeModelsStub = vi.spyOn(ModelSelector, "subtypeModels");
			subtypeModelsStub.mockImplementation((dm, includeSubtypes) => {
				if (dm === elementDm && includeSubtypes === true) {
					return () => "mockValue";
				}
				return () => undefined;
			});
		});

		afterAll(() => {
			vi.restoreAllMocks();
		});

		describe("given document model name", () => {
			it("should call and return result from subtypeModels selector", () => {
				const result = ModelSelector.subtypeModelsByName("DomainElement")(engineState);
				expect(subtypeModelsStub).toHaveBeenCalledOnce();
				expect(subtypeModelsStub).toHaveBeenCalledWith(elementDm, true);
				expect(result).toBe("mockValue");
			});
		});
	});

	describe("uiModel", () => {
		it("should return the selector for ui model", () => {
			const uiModel = ModelSelector.uiModel()(basicEngineState);
			expect(uiModel).toBe(basicEngineState.models.uiModel);
		});
	});

	describe("nodeModel", () => {
		describe("given a type defined in tree nodes", () => {
			it("should return the corresponding node model", () => {
				const nodeModel = ModelSelector.nodeModel("DomainTeam")(basicEngineState);
				expect(nodeModel?.documentModelRef).toBe("DomainTeam");
			});
		});

		describe("given a type not defined in tree nodes", () => {
			describe("given the type does not have any super types defined in tree nodes", () => {
				it("should return undefined", () => {
					const nodeModel = ModelSelector.nodeModel("DummyDomain")(basicEngineState);
					expect(nodeModel).toBeUndefined();
				});
			});

			describe("given DomainBundle", () => {
				const engineState = categoryEngineState;
				const productTreeNode = engineState.models.uiModel.content.nodes[1];

				it("should return Product Tree Node", () => {
					const nodeModel = ModelSelector.nodeModel("DomainBundle")(engineState);
					expect(nodeModel).toBe(productTreeNode);
				});
			});
		});
	});

	describe("reversedChildRelationshipConfigurations", () => {
		describe("given A12 Team showcase", () => {
			describe("given DomainTeam", () => {
				it("should return teamTeamConfig", () => {
					const result = ModelSelector.reversedChildRelationshipConfigurations("DomainTeam")(basicEngineState);
					expect(result).toEqual([teamTeamConfig]);
				});
			});

			describe("given DomainPerson", () => {
				it("should return teamPersonConfig", () => {
					const result = ModelSelector.reversedChildRelationshipConfigurations("DomainPerson")(basicEngineState);
					expect(result).toEqual([teamPersonConfig]);
				});
			});
		});

		describe("given Category showcase", () => {
			const engineState = categoryEngineState;
			const categoryNodeModel = engineState.models.uiModel.content.nodes[0];
			const [categoryCategoryConfig, categoryProductConfig] = categoryNodeModel.childRelationshipConfigurations;

			describe("given DomainBundle", () => {
				it("should return categoryProductConfig", () => {
					const result = ModelSelector.reversedChildRelationshipConfigurations("DomainBundle")(engineState);
					expect(result).toEqual([categoryProductConfig]);
				});
			});

			describe("given DomainProduct", () => {
				it("should return categoryProductConfig", () => {
					const result = ModelSelector.reversedChildRelationshipConfigurations("DomainProduct")(engineState);
					expect(result).toEqual([categoryProductConfig]);
				});
			});

			describe("given DomainCategory", () => {
				it("should return categoryCategoryConfig", () => {
					const result = ModelSelector.reversedChildRelationshipConfigurations("DomainCategory")(engineState);
					expect(result).toEqual([categoryCategoryConfig]);
				});
			});
		});

		describe("given Data Modeler showcase", () => {
			const engineState = dataModelerEngineState;
			const groupElementConfig = engineState.models.uiModel.content.nodes[0].childRelationshipConfigurations[0];

			it("should return with groupElementConfig", () => {
				["DomainGroup", "DomainAttachmentGroup", "DomainMultiSelectGroup", "DomainField", "DomainRule"].forEach(
					(domain) => {
						const result = ModelSelector.reversedChildRelationshipConfigurations(domain)(engineState);
						expect(result).toEqual([groupElementConfig]);
					}
				);
			});
		});
	});

	describe("childEntityCharacteristic", () => {
		const [teamPersonRm, teamTeamRm] = basicEngineState.models.modelGraph.relationshipModels;

		describe("given Dummy RelationshipModel", () => {
			it("should return undefined", () => {
				const result = ModelSelector.childEntityCharacteristic({
					id: "1024",
					relationshipModelRef: "TeamDummy",
					parentRole: "Team"
				})(basicEngineState);
				expect(result).toBeUndefined();
			});
		});
		describe("given TeamPerson childRelationshipConfiguration", () => {
			it("should return person entity characteristics", () => {
				const result = ModelSelector.childEntityCharacteristic(teamPersonConfig)(basicEngineState);
				expect(result).toEqual(teamPersonRm.content.entityCharacteristics[1]);
			});
		});
		describe("given TeamTeam childRelationshipConfiguration", () => {
			it("should return child team entity characteristics", () => {
				const result = ModelSelector.childEntityCharacteristic(teamTeamConfig)(basicEngineState);
				expect(result).toEqual(teamTeamRm.content.entityCharacteristics[1]);
			});
		});
	});
});
