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

import { defaultEngineState, defaultRoot } from "../../../setup/basic.spec.js";
import { DataSelector, Identifier, type TreeEngineState } from "../../../../core/store/index.js";
import { createMockPerson } from "../../../utils/state-utils.js";
import { mockType } from "../../../utils/mock-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.store.selectors.data.nodePath", () => {
	const docRef = "DomainTeam/1";
	const notFoundDocRef = "DomainTeam/9999";

	describe("nodePaths", () => {
		it("should return empty array if docRef is a hidden root", () => {
			const result = DataSelector.nodePaths(docRef)({
				...defaultEngineState,
				root: {
					...defaultRoot,
					identifier: Identifier.from(docRef)
				}
			});

			expect(result).to.deep.eq([]);
		});

		it("should return empty array if Node of document reference not found", () => {
			const result = DataSelector.nodePaths(notFoundDocRef)(defaultEngineState);

			expect(result).to.deep.eq([]);
		});

		it("should return nodePaths according to Node of document references", () => {
			const result = DataSelector.nodePaths(docRef)(defaultEngineState);

			expect(result).to.deep.eq([[Identifier.from(docRef)]]);
		});
	});

	describe("nodePath", () => {
		it("should return undefined if docRef is a hidden root", () => {
			const result = DataSelector.nodePath(docRef)({
				...defaultEngineState,
				root: {
					...defaultRoot,
					identifier: Identifier.from(docRef)
				}
			});

			expect(result).to.eq(undefined);
		});

		it("should return undefined if Node of document reference not found", () => {
			const result = DataSelector.nodePath(notFoundDocRef)(defaultEngineState);

			expect(result).to.eq(undefined);
		});

		it("should return the first nodePath according to Node of document references", () => {
			const result = DataSelector.nodePath(docRef)(defaultEngineState);

			expect(result).to.deep.eq([Identifier.from(docRef)]);
		});
	});

	describe("nested", () => {
		const firstParentIdentifier: Identifier = Identifier.from("DomainTeam/20");
		const firstParentPath: TreeEngineState.NodePath = [firstParentIdentifier];
		const secondParentIdentifier: Identifier = Identifier.from("DomainTeam/21");

		const {
			identifier: firstPersonIdentifier,
			linkIdentifier: firstPersonLinkIdentifier,
			nodePath: firstPersonPath,
			link: firstPersonLink,
			node: firstPersonNode
		} = createMockPerson("DomainPerson/20", firstParentPath, firstParentIdentifier);

		const {
			identifier: secondPersonIdentifier,
			linkIdentifier: secondPersonLinkIdentifier,
			link: secondPersonLink,
			node: secondPersonNode
		} = createMockPerson("DomainPerson/21", firstParentPath, firstParentIdentifier);

		const firstPersonLinkSecondParent = mockType<TreeEngineState.Link>({
			linkRef: mockType<TreeEngineState.LinkRef>({
				linkDescriptor: {
					entities: [
						{ docRef: secondParentIdentifier.id, role: "Team", modelName: "DomainTeam" },
						{ docRef: firstPersonIdentifier.id, role: "Person", modelName: "DomainPerson" }
					]
				}
			})
		});

		const firstParentNode: TreeEngineState.Node = {
			identifier: firstParentIdentifier,
			document: {},
			children: [firstPersonLinkIdentifier, secondPersonLinkIdentifier]
		};

		const secondParentNode: TreeEngineState.Node = {
			identifier: secondParentIdentifier,
			document: {},
			children: [{ id: "22", type: "TeamPerson" }]
		};

		const engineState: TreeEngineState = {
			...defaultEngineState,
			root: {
				...defaultEngineState.root,
				children: [...defaultEngineState.root.children, firstParentIdentifier, secondParentIdentifier]
			},
			data: {
				...defaultEngineState.data,
				["TeamPerson"]: {
					...defaultEngineState.data["TeamPerson"],
					[firstPersonLinkIdentifier.id]: firstPersonLink,
					[secondPersonLinkIdentifier.id]: secondPersonLink,
					[22]: firstPersonLinkSecondParent
				},
				["DomainTeam"]: {
					...defaultEngineState.data["DomainTeam"],
					[firstParentIdentifier.id]: firstParentNode,
					[secondParentIdentifier.id]: secondParentNode
				},
				["DomainPerson"]: {
					...defaultEngineState.data["DomainPerson"],
					[firstPersonIdentifier.id]: firstPersonNode,
					[secondPersonIdentifier.id]: secondPersonNode
				}
			}
		};

		describe("nodePaths", () => {
			it("should return nodePaths according to Node of document references - nested", () => {
				const result = DataSelector.nodePaths("DomainPerson/20")(engineState);

				expect(result).to.deep.eq([firstPersonPath, [secondParentIdentifier, { id: "22", type: "TeamPerson" }]]);
			});
		});

		describe("nodePath", () => {
			it("should return the first nodePath according to Node of document references - nested", () => {
				const result = DataSelector.nodePath("DomainPerson/20")(engineState);

				expect(result).to.deep.eq(firstPersonPath);
			});
		});
	});
});
