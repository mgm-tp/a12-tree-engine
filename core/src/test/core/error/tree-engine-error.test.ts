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

import { TreeEngineBaseError, TreeEngineError, TreeEngineErrorCode } from "../../../core/error/index.js";

describe("@com.mgmtp.a12.tree-engine.core.error.tree-engine-error", () => {
	describe("TreeEngineBaseError.isInstance", () => {
		it("should return true if the object contains errorCode and name", () => {
			[
				[null, false],
				[{}, false],
				[{ name: "An error" }, false],
				[{ errorCode: "A" }, false],
				[{ errorCode: "B", name: "An error" }, true]
			].forEach(([object, result]) => {
				expect(TreeEngineBaseError.isInstance(object)).toBe(result);
			});
		});
	});

	describe("TreeEngineError", () => {
		describe("isInstance", () => {
			it("should return true if it is TreeEngineBaseError and its errorCode belongs to TreeEngineErrorCode", () => {
				[
					[{ errorCode: "A" }, false],
					[{ errorCode: "B", name: "An error" }, false],
					[{ errorCode: TreeEngineErrorCode.SERVER_ERROR, name: "An error" }, true]
				].forEach(([object, result]) => {
					expect(TreeEngineError.isInstance(object)).toBe(result);
				});
			});
		});

		describe("ServerError.isInstance", () => {
			it(`should return true if the "errors" field contains all JsonRpc2Error instances`, () => {
				const baseObject = { errorCode: TreeEngineErrorCode.SERVER_ERROR, name: "An error" };
				[
					[baseObject, false],
					[{ ...baseObject, errors: undefined }, false],
					[{ ...baseObject, errors: [] }, false],
					[{ ...baseObject, errors: [{ code: 12345, message: "Rpc error", data: {} }] }, true]
				].forEach(([object, result]) => {
					expect(TreeEngineError.ServerError.isInstance(object)).toBe(result);
				});
			});
		});

		describe("NotFoundError", () => {
			const errorCode = TreeEngineErrorCode.NOT_FOUND_ERROR;

			describe("constructor", () => {
				it("should return the error with proper properties", () => {
					const testCases: [
						Parameters<typeof TreeEngineError.NotFoundError>,
						TreeEngineError<TreeEngineErrorCode.NOT_FOUND_ERROR>
					][] = [
						[
							["TreeEngine.State"],
							{
								errorCode,
								message: "Can not find TreeEngine.State",
								name: "TREE_ENGINE_ERROR/NOT_FOUND_ERROR/TreeEngine.State"
							}
						],
						[
							["DocumentModel", "DomainTeam"],
							{
								errorCode,
								message: "Can not find DocumentModel [DomainTeam]",
								name: "TREE_ENGINE_ERROR/NOT_FOUND_ERROR/DocumentModel"
							}
						],
						[
							["TreeEngine.ModelsState", { activityId: "12345" }],
							{
								errorCode,
								message: "Can not find TreeEngine.ModelsState in activity [12345]",
								name: "TREE_ENGINE_ERROR/NOT_FOUND_ERROR/TreeEngine.ModelsState"
							}
						],
						[
							["RelationshipModel", { activityId: "12345", id: "TeamTeam" }],
							{
								errorCode,
								message: "Can not find RelationshipModel [TeamTeam] in activity [12345]",
								name: "TREE_ENGINE_ERROR/NOT_FOUND_ERROR/RelationshipModel"
							}
						]
					];

					testCases.forEach(([params, result]) => {
						const error = TreeEngineError.NotFoundError(...params);

						expect(error).toBeInstanceOf(TreeEngineError);
						expect(error.name).toEqual(result.name);
						expect(error.message).toEqual(result.message);
						expect(error.errorCode).toEqual(result.errorCode);
					});
				});
			});

			describe("isInstance", () => {
				it("should return true if match errorCode and name", () => {
					const testCases: [Parameters<typeof TreeEngineError.NotFoundError.isInstance>, boolean][] = [
						[
							[
								{
									errorCode: TreeEngineErrorCode.SERVER_ERROR,
									message: "Could not find TreeEngine.State",
									name: "TREE_ENGINE_ERROR/NOT_FOUND_ERROR/TreeEngine.State"
								},
								"TreeEngine.State"
							],
							false
						],
						[
							[
								{
									errorCode: TreeEngineErrorCode.NOT_FOUND_ERROR,
									message: "Could not find TreeEngine.State",
									name: "TREE_ENGINE_ERROR/SERVER_ERROR"
								},
								"TreeEngine.State"
							],
							false
						],
						[
							[
								{
									errorCode: TreeEngineErrorCode.NOT_FOUND_ERROR,
									message: "Could not find TreeEngine.State",
									name: "TREE_ENGINE_ERROR/NOT_FOUND_ERROR/TreeEngine.State"
								},
								"TreeEngine.State"
							],
							true
						]
					];

					testCases.forEach(([params, result]) => {
						expect(TreeEngineError.NotFoundError.isInstance(...params)).toEqual(result);
					});
				});
			});
		});

		describe("TypeError", () => {
			const errorCode = TreeEngineErrorCode.TYPE_ERROR;

			describe("constructor", () => {
				it("should return the error with proper properties", () => {
					const testCases: [
						Parameters<typeof TreeEngineError.TypeError>,
						TreeEngineError<TreeEngineErrorCode.TYPE_ERROR>
					][] = [
						[
							["TreeEngine.Request"],
							{
								errorCode,
								message: "Invalid TreeEngine.Request",
								name: "TREE_ENGINE_ERROR/TYPE_ERROR/TreeEngine.Request"
							}
						],
						[
							["TreeEngine.Request", { expect: "Receive ONE request" }],
							{
								errorCode,
								message: 'Invalid TreeEngine.Request.\nExpect: "Receive ONE request"',
								name: "TREE_ENGINE_ERROR/TYPE_ERROR/TreeEngine.Request"
							}
						],
						[
							["TreeEngine.Request", { actual: {} }],
							{
								errorCode,
								message: "Invalid TreeEngine.Request.\nActual: {}",
								name: "TREE_ENGINE_ERROR/TYPE_ERROR/TreeEngine.Request"
							}
						],
						[
							["TreeEngine.Request", { expect: "Receive ONE request", actual: [{}, {}].length }],
							{
								errorCode,
								message: 'Invalid TreeEngine.Request.\nExpect: "Receive ONE request".\nActual: 2',
								name: "TREE_ENGINE_ERROR/TYPE_ERROR/TreeEngine.Request"
							}
						]
					];

					testCases.forEach(([params, result]) => {
						const error = TreeEngineError.TypeError(...params);

						expect(error).toBeInstanceOf(TreeEngineError);
						expect(error.name).toEqual(result.name);
						expect(error.message).toEqual(result.message);
						expect(error.errorCode).toEqual(result.errorCode);
					});
				});
			});

			describe("isInstance", () => {
				it("should return true if match errorCode and name", () => {
					const testCases: [Parameters<typeof TreeEngineError.TypeError.isInstance>, boolean][] = [
						[
							[
								{
									errorCode: TreeEngineErrorCode.SERVER_ERROR,
									message: "Could not find TreeEngine.State",
									name: "TREE_ENGINE_ERROR/NOT_FOUND_ERROR/TreeEngine.State"
								},
								"TreeEngine.State"
							],
							false
						],
						[
							[
								{
									errorCode: TreeEngineErrorCode.TYPE_ERROR,
									message: "Could not find TreeEngine.State",
									name: "TREE_ENGINE_ERROR/SERVER_ERROR"
								},
								"TreeEngine.State"
							],
							false
						],
						[
							[
								{
									errorCode: TreeEngineErrorCode.TYPE_ERROR,
									message: "",
									name: "TREE_ENGINE_ERROR/TYPE_ERROR/TreeEngine.State"
								},
								"TreeEngine.State"
							],
							true
						]
					];

					testCases.forEach(([params, result]) => {
						expect(TreeEngineError.TypeError.isInstance(...params)).toEqual(result);
					});
				});
			});
		});
	});
});
