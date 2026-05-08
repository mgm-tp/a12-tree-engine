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

import { Identifier, TreeEngineState } from "../../../core/store/index.js";

describe("@com.mgmtp.a12.tree-engine.core.store.store", () => {
	describe("TreeEngineState.NodePath", () => {
		describe("areEqual", () => {
			describe("when two paths have different length", () => {
				it("should return false", () => {
					const nodePath1: TreeEngineState.NodePath = [{ type: "DomainTeam", id: "DomainTeam/1" }];
					const nodePath2: TreeEngineState.NodePath = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/2" }
					];

					expect(TreeEngineState.NodePath.areEqual(nodePath1, nodePath2)).toBe(false);
				});
			});

			describe("when two paths have same length but some identifier are different", () => {
				it("should return false", () => {
					const nodePath1: TreeEngineState.NodePath = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/2" }
					];
					const nodePath2: TreeEngineState.NodePath = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/3" }
					];

					expect(TreeEngineState.NodePath.areEqual(nodePath1, nodePath2)).toBe(false);
				});
			});

			describe("when two paths are identical", () => {
				it("should return true", () => {
					const nodePath1: TreeEngineState.NodePath = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/2" }
					];
					const nodePath2: TreeEngineState.NodePath = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/2" }
					];

					expect(TreeEngineState.NodePath.areEqual(nodePath1, nodePath2)).toBe(true);
				});
			});
		});

		describe("fromString", () => {
			describe("when the string is empty", () => {
				it("should return empty node path", () => {
					expect(TreeEngineState.NodePath.fromString("")).toEqual([]);
				});
			});

			describe("when the string is valid", () => {
				it("should parse correctly", () => {
					expect(TreeEngineState.NodePath.fromString("DomainTeam[DomainTeam/1]=>TeamTeam[TeamTeam/2]")).toEqual([
						{ id: "DomainTeam/1", type: "DomainTeam" },
						{ id: "TeamTeam/2", type: "TeamTeam" }
					]);
				});
			});
		});

		describe("toString", () => {
			describe("when the path is empty", () => {
				it("should return empty string", () => {
					expect(TreeEngineState.NodePath.toString([])).toEqual("");
				});
			});

			describe("when the string is valid", () => {
				it("should parse correctly", () => {
					expect(
						TreeEngineState.NodePath.toString([
							{ id: "DomainTeam/1", type: "DomainTeam" },
							{ id: "TeamTeam/2", type: "TeamTeam" }
						])
					).toEqual("DomainTeam[DomainTeam/1]=>TeamTeam[TeamTeam/2]");
				});
			});
		});

		describe("toLinkIdentifier", () => {
			describe("when the path is empty", () => {
				it("should throw an error", () => {
					expect(() => TreeEngineState.NodePath.toLinkIdentifier([])).toThrow();
				});
			});

			describe("when the path has length 1", () => {
				it("should return undefined", () => {
					expect(
						TreeEngineState.NodePath.toLinkIdentifier([{ id: "DomainTeam/1", type: "DomainTeam" }])
					).toBeUndefined();
				});
			});

			describe("when the path has length greater than 1", () => {
				it("should return the last identifier", () => {
					expect(
						TreeEngineState.NodePath.toLinkIdentifier([
							{ id: "DomainTeam/1", type: "DomainTeam" },
							{ id: "TeamTeam/2", type: "TeamTeam" },
							{ id: "TeamTeam/3", type: "TeamTeam" }
						])
					).toEqual({ id: "TeamTeam/3", type: "TeamTeam" });
				});
			});
		});

		describe("getParentNodePath", () => {
			describe("when the path is empty", () => {
				it("should throw an error", () => {
					expect(TreeEngineState.NodePath.getParentNodePath([])).toBeUndefined();
				});
			});

			describe("when the path has length 1", () => {
				it("should return undefined", () => {
					expect(
						TreeEngineState.NodePath.getParentNodePath([{ id: "DomainTeam/1", type: "DomainTeam" }])
					).toBeUndefined();
				});
			});

			describe("when the path has length greater than 1", () => {
				it("should return the path except the last identifier", () => {
					expect(
						TreeEngineState.NodePath.getParentNodePath([
							{ id: "DomainTeam/1", type: "DomainTeam" },
							{ id: "TeamTeam/2", type: "TeamTeam" },
							{ id: "TeamTeam/3", type: "TeamTeam" }
						])
					).toEqual([
						{ id: "DomainTeam/1", type: "DomainTeam" },
						{ id: "TeamTeam/2", type: "TeamTeam" }
					]);
				});
			});
		});
	});

	describe("Identifier", () => {
		describe("from", () => {
			describe("when the instance does not have the correct form", () => {
				it("should throw an error", () => {
					expect(() => Identifier.from("DomainTeam")).toThrow();
					expect(() => Identifier.from("DomainTeam1")).toThrow();
				});
			});

			describe("when the instance has the correct form", () => {
				it("should parse correctly", () => {
					expect(Identifier.from("DomainTeam/1")).toEqual({ id: "DomainTeam/1", type: "DomainTeam" });
					expect(Identifier.from("ABC/CDE/1#1,1")).toEqual({ id: "ABC/CDE/1#1,1", type: "ABC" });
					expect(Identifier.from("DomainTeam/ab-9d")).toEqual({ id: "DomainTeam/ab-9d", type: "DomainTeam" });
				});
			});
		});

		describe("areEqual", () => {
			describe("when the two identifier's type are different", () => {
				it("should return false", () => {
					expect(
						Identifier.areEqual(
							{ type: "DomainTeam", id: "DomainTeam/1" },
							{ type: "DomainPerson", id: "DomainPerson/1" }
						)
					).toBe(false);
				});
			});

			describe("when the two identifier has the same type and different id", () => {
				it("should return false", () => {
					expect(
						Identifier.areEqual({ type: "DomainTeam", id: "DomainTeam/1" }, { type: "DomainTeam", id: "DomainTeam/2" })
					).toBe(false);
				});
			});

			describe("when the two identifier are identical", () => {
				it("should return true", () => {
					expect(
						Identifier.areEqual({ type: "DomainTeam", id: "DomainTeam/1" }, { type: "DomainTeam", id: "DomainTeam/1" })
					).toBe(true);
				});
			});
		});

		describe("areListEqual", () => {
			describe("when two lists have different length", () => {
				it("should return false", () => {
					const list1: Identifier[] = [{ type: "DomainTeam", id: "DomainTeam/1" }];
					const list2: Identifier[] = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/2" }
					];

					expect(Identifier.areListEqual(list1, list2)).toBe(false);
				});
			});

			describe("when two lists have same length but some identifiers are different", () => {
				it("should return false", () => {
					const list1: Identifier[] = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/2" }
					];
					const list2: Identifier[] = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/3" }
					];

					expect(Identifier.areListEqual(list1, list2)).toBe(false);
				});
			});

			describe("when two lists are identical", () => {
				it("should return true", () => {
					const list1: Identifier[] = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/2" }
					];
					const list2: Identifier[] = [
						{ type: "DomainTeam", id: "DomainTeam/1" },
						{ type: "TeamTeam", id: "TeamTeam/2" }
					];

					expect(Identifier.areListEqual(list1, list2)).toBe(true);
				});
			});
		});
	});
});
