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

import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { DndUtils } from "../../../../../core/view/configuration/dnd/utils.js";
import { FlattenNodeRow } from "../../../../../core/view/index.js";
import { mockType } from "../../../../utils/mock-utils.js";
import type { RuntimeTreeModel } from "../../../../../core/models/index.js";

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.dnd.utils", () => {
	const basicEngineState = defaultEngineState;

	describe("selectLastNodeRow", () => {
		describe("when root is undefined", () => {
			it("should return undefined", () => {
				expect(DndUtils.selectLastNodeRow(basicEngineState)).toBeUndefined();
			});
		});

		describe("when the input has invalid link between root and children nodes", () => {
			it("should return undefined", () => {
				const engineState = {
					...basicEngineState,
					root: {
						identifier: { id: "DomainTeam/2", type: "DomainTeam" },
						children: [
							{ id: "266", type: "TeamPerson" },
							{ id: "267", type: "TeamPerson" }
						]
					}
				};

				expect(DndUtils.selectLastNodeRow(engineState)).toBeUndefined();
			});
		});

		describe("when the input has valid link between root and children nodes", () => {
			it("should return a FlattenNodeRow", () => {
				const engineState = {
					...basicEngineState,
					root: {
						identifier: { id: "DomainTeam/2", type: "DomainTeam" },
						children: [
							{ id: "166", type: "TeamPerson" },
							{ id: "167", type: "TeamPerson" }
						]
					}
				};

				const result = DndUtils.selectLastNodeRow(engineState);

				if (typeof result !== "object") {
					throw new Error("Result must be a FlattenNodeRow");
				}

				expect(FlattenNodeRow.isAssignableFrom(result)).toBe(true);
				expect(result.id).toBe("DomainTeam[DomainTeam/2]=>TeamPerson[167]");
				expect(result.data.nodeIdentifier.id).toBe("DomainPerson/166");
				expect(result.data.nodeIdentifier.type).toBe("DomainPerson");
			});
		});
	});

	describe("isCircular", () => {
		describe("given a circular node", () => {
			it("should return true", () => {
				const row = {
					...mockType<FlattenNodeRow>(),
					data: {
						nodeIdentifier: { type: "DomainTeam", id: "1" },
						nodePath: [
							{ type: "DomainTeam", id: "1" },
							{ type: "TeamTeam", id: "11" },
							{ type: "TeamTeam", id: "12" }
						]
					},
					level: 2,
					parent: {
						id: "sampleId1",
						nodeModel: mockType<RuntimeTreeModel.TreeNode>(),
						level: 1,
						data: {
							nodeIdentifier: { type: "DomainTeam", id: "2" },
							nodePath: [
								{ type: "DomainTeam", id: "1" },
								{ type: "TeamTeam", id: "11" }
							]
						},
						parent: {
							id: "sampleId2",
							nodeModel: mockType<RuntimeTreeModel.TreeNode>(),
							level: 0,
							data: { nodeIdentifier: { type: "DomainTeam", id: "1" }, nodePath: [{ type: "DomainTeam", id: "1" }] }
						}
					}
				};

				expect(DndUtils.isCircular(row)).toBe(true);
			});
		});

		describe("given a non-circular node", () => {
			it("should return false", () => {
				const row = {
					...mockType<FlattenNodeRow>(),
					data: {
						nodeIdentifier: { type: "DomainTeam", id: "1" },
						nodePath: [
							{ type: "DomainTeam", id: "1" },
							{ type: "TeamTeam", id: "11" },
							{ type: "TeamTeam", id: "12" }
						]
					},
					level: 2,
					parent: undefined
				};

				expect(DndUtils.isCircular(row)).toBe(false);
			});
		});
	});
});
