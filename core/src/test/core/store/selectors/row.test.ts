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

import {
	type DataSelector,
	type Identifier,
	ModelSelector,
	type RowState,
	RowStateSelector,
	type TreeEngineState,
	type UIStateSelector
} from "../../../../core/store/index.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.store.selectors.row", () => {
	const basicEngineState = defaultEngineState;
	const basicTeamIdentifier: Identifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};

	const basicNodePath: TreeEngineState.NodePath = [basicTeamIdentifier];

	function setupTest(
		params?: Partial<DataSelector.RelativeNodeParams> & { engineState?: TreeEngineState }
	): RowState | undefined {
		return RowStateSelector.rowState({
			nodeIdentifier: params?.nodeIdentifier ?? basicTeamIdentifier,
			nodePath: params?.nodePath ?? basicNodePath
		})(params?.engineState ?? basicEngineState);
	}

	describe("state", () => {
		describe("nodeModel", () => {
			describe("when not found the node model", () => {
				it("should return undefined", () => {
					expect(
						setupTest({
							nodeIdentifier: {
								...basicTeamIdentifier,
								type: "DomainDummy"
							}
						})
					).toBeUndefined();
				});
			});

			describe("when found the node model", () => {
				it("should return proper node model from the engine state", () => {
					const result = setupTest();
					const expectedResult = ModelSelector.nodeModel(basicTeamIdentifier.type)(basicEngineState);

					expect(result?.nodeModel).toEqual(expectedResult);
				});
			});
		});

		describe("uiState", () => {
			it("should return current uiState of the node", () => {
				const result = setupTest({
					engineState: {
						...basicEngineState,
						selectedNodes: {
							...basicEngineState.selectedNodes,
							"DomainTeam[DomainTeam/1]": {}
						},
						busyNodes: {
							...basicEngineState.busyNodes,
							DomainTeam: {
								"DomainTeam/1": {}
							}
						}
					}
				});

				const expectedUIState: UIStateSelector.NodeState = {
					selected: true,
					busy: true,
					expanded: false,
					matchedCount: null,
					multiSelection: undefined
				};

				expect(result?.uiState).toEqual(expectedUIState);
			});
		});

		describe("node", () => {
			it("should return the node data from the engine state", () => {
				const result = setupTest();
				const expectedNode = basicEngineState.data?.[basicTeamIdentifier.type]?.[basicTeamIdentifier.id];

				expect(result?.node).toEqual(expectedNode);
			});
		});

		describe("link", () => {
			it("should return link from the engine state", () => {
				const link: TreeEngineState.Link = {
					identifier: {
						type: "TeamPerson",
						id: "5"
					},
					linkRef: mockType<TreeEngineState.LinkRef>()
				};

				const result = setupTest({
					nodeIdentifier: {
						type: "DomainPerson",
						id: "DomainPerson/1"
					},
					nodePath: [
						basicTeamIdentifier,
						{
							type: "TeamPerson",
							id: "5"
						}
					],
					engineState: {
						...basicEngineState,
						data: {
							...basicEngineState.data,
							TeamPerson: {
								"5": link
							}
						}
					}
				});

				expect(result?.link).toEqual(link);
			});
		});
	});
});
