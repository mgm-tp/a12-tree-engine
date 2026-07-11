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

import type {
	Relationship,
	EntityCharacteristics,
	RelationshipModel
} from "@com.mgmtp.a12.dataservices/dataservices-access";

import { LinkDescriptorUtils, RelationshipModelUtils } from "../../../../core/models/index.js";
import type { Identifier } from "../../../../core/store/index.js";
import { defaultRelationshipModels } from "../../../setup/basic.spec.js";

describe("@com.mgmtp.a12.tree-engine.core.models.utils.relationship-utils", () => {
	const teamPersonRelationshipModel = defaultRelationshipModels[0];

	const basicLinkDescriptor: Relationship.LinkDescriptorResponse = {
		relationshipModel: "TeamPerson",
		entities: [
			{ role: "Team", docRef: "DomainTeam/1", modelName: "DomainTeam" },
			{ role: "Person", docRef: "DomainPerson/18", modelName: "DomainPerson" }
		]
	};
	const nullDocRefLinkDescriptor: Relationship.LinkDescriptorResponse = {
		relationshipModel: "TeamPerson",
		entities: [
			{ role: "Team", docRef: "DomainTeam/1", modelName: "DomainTeam" },
			// @ts-expect-error - docRef is intentionally set to null for testing purposes
			{ role: "Person", docRef: null, modelName: "DomainPerson" }
		]
	};

	const basicTeamIdentifier: Identifier = { type: "DomainTeam", id: "DomainTeam/1" };
	const basicPersonIdentifier: Identifier = { type: "DomainPerson", id: "DomainPerson/18" };

	describe("LinkDescriptorUtils", () => {
		describe("getLinkEntitySpecByRole", () => {
			const testCases: [string, Relationship.LinkEntitySpec | undefined][] = [
				["Team", basicLinkDescriptor.entities[0]],
				["Person", basicLinkDescriptor.entities[1]],
				["Employee", undefined]
			];

			testCases.forEach(([role, expectedResult]) => {
				describe("when given role = " + role, () => {
					it("should return " + JSON.stringify(expectedResult), () => {
						const result = LinkDescriptorUtils.getLinkEntitySpecByRole(basicLinkDescriptor, role);

						expect(result).toEqual(expectedResult);
					});
				});
			});
		});

		describe("getLinkEntitySpecByReversedRole", () => {
			const testCases: [string, Relationship.LinkEntitySpec | undefined][] = [
				["Team", basicLinkDescriptor.entities[1]],
				["Person", basicLinkDescriptor.entities[0]],
				["Employee", undefined]
			];

			testCases.forEach(([role, expectedResult]) => {
				describe("when given role = " + role, () => {
					it("should return  " + JSON.stringify(expectedResult), () => {
						const result = LinkDescriptorUtils.getLinkEntitySpecByReversedRole(basicLinkDescriptor, role);

						expect(result).toEqual(expectedResult);
					});
				});
			});
		});

		describe("getNodeIdentifierByRole", () => {
			const testCases: [Relationship.LinkDescriptorResponse, RelationshipModel, string, Identifier | undefined][] = [
				[basicLinkDescriptor, teamPersonRelationshipModel, "Team", basicTeamIdentifier],
				[basicLinkDescriptor, teamPersonRelationshipModel, "Person", basicPersonIdentifier],
				[basicLinkDescriptor, teamPersonRelationshipModel, "Employee", undefined],

				[nullDocRefLinkDescriptor, teamPersonRelationshipModel, "Team", basicTeamIdentifier],
				[nullDocRefLinkDescriptor, teamPersonRelationshipModel, "Person", undefined],
				[nullDocRefLinkDescriptor, teamPersonRelationshipModel, "Employee", undefined]
			];

			testCases.forEach(([linkDescriptor, relationshipModel, role, expectedResult]) => {
				describe(`given relationshipModel ${relationshipModel.header.id} and role ${role}`, () => {
					it("should return " + JSON.stringify(expectedResult), () => {
						const result = LinkDescriptorUtils.getNodeIdentifierByRole(linkDescriptor, role);

						expect(result).toEqual(expectedResult);
					});
				});
			});
		});

		describe("getNodeIdentifierByReversedRole", () => {
			const testCases: [Relationship.LinkDescriptorResponse, string, Identifier | undefined][] = [
				[basicLinkDescriptor, "Team", basicPersonIdentifier],
				[basicLinkDescriptor, "Person", basicTeamIdentifier],
				[basicLinkDescriptor, "Employee", undefined],

				[nullDocRefLinkDescriptor, "Team", undefined],
				[nullDocRefLinkDescriptor, "Person", basicTeamIdentifier],
				[nullDocRefLinkDescriptor, "Employee", undefined]
			];

			testCases.forEach(([linkDescriptor, role, expectedResult]) => {
				describe(`given linkDescriptor = ${linkDescriptor}, relationshipModel = TeamPerson,  role = ${role}`, () => {
					it("should return " + JSON.stringify(expectedResult), () => {
						const result = LinkDescriptorUtils.getNodeIdentifierByReversedRole(linkDescriptor, role);

						expect(result).toEqual(expectedResult);
					});
				});
			});
		});

		describe("getNodeIdentifiers", () => {
			describe(`given linkDescriptor = ${JSON.stringify(basicLinkDescriptor)}, relationshipModel = TeamPerson`, () => {
				it("should return properly team and person identifiers", () => {
					const result = LinkDescriptorUtils.getNodeIdentifiers(basicLinkDescriptor);

					expect(result).toEqual([basicTeamIdentifier, basicPersonIdentifier]);
				});
			});

			describe("when a linkDescriptor's entity has no docRef", () => {
				it("should throw an error", () => {
					expect(() => LinkDescriptorUtils.getNodeIdentifiers(nullDocRefLinkDescriptor)).toThrow();
				});
			});
		});
	});

	describe("RelationshipModelUtils", () => {
		describe("getEntityCharacteristicByRole", () => {
			const testCases: [string, EntityCharacteristics | undefined][] = [
				["Team", teamPersonRelationshipModel.content.entityCharacteristics[0]],
				["Person", teamPersonRelationshipModel.content.entityCharacteristics[1]],
				["Employee", undefined]
			];

			testCases.forEach(([role, expectedResult]) => {
				describe("given TeamPerson RelationshipModel and role = " + role, () => {
					it("should return " + expectedResult?.role, () => {
						const result = RelationshipModelUtils.getEntityCharacteristicByRole(teamPersonRelationshipModel, role);

						expect(result).toEqual(expectedResult);
					});
				});
			});
		});

		describe("getEntityCharacteristicByReversedRole", () => {
			const testCases: [string, EntityCharacteristics | undefined][] = [
				["Team", teamPersonRelationshipModel.content.entityCharacteristics[1]],
				["Person", teamPersonRelationshipModel.content.entityCharacteristics[0]],
				["Employee", undefined]
			];

			testCases.forEach(([role, expectedResult]) => {
				describe("given TeamPerson RelationshipModel and role = " + role, () => {
					it("should return " + expectedResult?.role, () => {
						const result = RelationshipModelUtils.getEntityCharacteristicByReversedRole(
							teamPersonRelationshipModel,
							role
						);

						expect(result).toEqual(expectedResult);
					});
				});
			});
		});
	});
});
