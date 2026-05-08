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

import {
	Dispatcher,
	type JsonRpc2Response,
	type DocumentJsonRpc2Request
} from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type ResponseFor } from "@com.mgmtp.a12.dataservices/dataservices-access/lib/dispatch/ResponseTypings.js";

import { JsonRpc } from "../../extensions/server-connector/internal/data-loaders/json-rpc.js";
import { type TreeEngineError, TreeEngineErrorCode } from "../../core/error/index.js";

describe("JsonRpc", () => {
	let dispatcherStub: MockInstance;

	beforeEach(() => {
		dispatcherStub = vi.spyOn(Dispatcher, "rpc");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("typedDispatch", () => {
		it("should successfully dispatch requests and return responses", async () => {
			const locale = "en-US";
			const mockRequests = [
				JsonRpc.Request.builder.deleteDocument({
					id: "test-1",
					params: { docRef: "doc-1", locale: "en-US" }
				})
			];

			const mockResponses: JsonRpc2Response[] = [
				{
					id: "test-1",
					jsonrpc: "2.0",
					result: { success: true }
				}
			];

			dispatcherStub.mockResolvedValue(mockResponses);

			const result = await JsonRpc.typedDispatch(locale, mockRequests);

			expect(result).toEqual(mockResponses);
			expect(dispatcherStub).toHaveBeenCalledWith(locale, mockRequests);

			const response = result[0];
			expect(response).toHaveProperty("id", "test-1");
			expect(response).toHaveProperty("jsonrpc", "2.0");
			expect(response).toHaveProperty("result");
		});

		it("should throw ServerError when dispatcher returns error responses", async () => {
			const locale = "en-US";
			const mockRequests = [
				JsonRpc.Request.builder.deleteDocument({
					id: "test-1",
					params: { docRef: "doc-1", locale: "en-US" }
				})
			];

			const mockErrorResponse: JsonRpc.Response.Error = {
				id: "test-1",
				jsonrpc: "2.0",
				error: {
					code: -32603,
					message: "Internal error",
					data: { details: "Database connection failed" }
				}
			};

			dispatcherStub.mockRejectedValue(mockErrorResponse);

			try {
				await JsonRpc.typedDispatch(locale, mockRequests);
				throw new Error("Expected ServerError to be thrown");
			} catch (error) {
				expect(error).toHaveProperty("errorCode", TreeEngineErrorCode.SERVER_ERROR);
				expect(error).toHaveProperty("name", `TREE_ENGINE_ERROR/${TreeEngineErrorCode.SERVER_ERROR}`);
				expect((error as Error).message).toContain("Data Services encountered some errors");
				expect((error as TreeEngineError.ServerError).errors).toBeInstanceOf(Array);

				const serverError = error as TreeEngineError.ServerError;
				expect(serverError.errors).toHaveLength(1);
				expect(serverError.errors[0]).toEqual(mockErrorResponse.error);
			}
		});

		it("should throw ServerError when dispatcher returns array of error responses", async () => {
			const locale = "en-US";
			const mockRequests = [
				JsonRpc.Request.builder.deleteDocument({
					id: "test-1",
					params: { docRef: "doc-1", locale: "en-US" }
				}),
				JsonRpc.Request.builder.deleteDocument({
					id: "test-2",
					params: { docRef: "doc-2", locale: "en-US" }
				})
			];

			const mockErrorResponses: JsonRpc.Response.Error[] = [
				{
					id: "test-1",
					jsonrpc: "2.0",
					error: {
						code: -32603,
						message: "Internal error",
						data: { details: "Database connection failed" }
					}
				},
				{
					id: "test-2",
					jsonrpc: "2.0",
					error: {
						code: -32602,
						message: "Invalid params",
						data: { details: "Document not found" }
					}
				}
			];

			dispatcherStub.mockRejectedValue(mockErrorResponses);

			try {
				await JsonRpc.typedDispatch(locale, mockRequests);
				throw new Error("Expected ServerError to be thrown");
			} catch (error) {
				const serverError = error as TreeEngineError.ServerError;
				expect(serverError.errors).toHaveLength(2);
				expect(serverError.errors[0]).toEqual(mockErrorResponses[0].error);
				expect(serverError.errors[1]).toEqual(mockErrorResponses[1].error);
			}
		});

		it("should re-throw non-JSON-RPC errors", async () => {
			const locale = "en-US";
			const mockRequests = [
				JsonRpc.Request.builder.copyDocument({
					id: "test-1",
					params: { docRef: "doc-1", locale: "en-US" }
				})
			];

			const networkError = new Error("Network timeout");
			dispatcherStub.mockRejectedValue(networkError);

			try {
				await JsonRpc.typedDispatch(locale, mockRequests);
				throw new Error("Expected network error to be re-thrown");
			} catch (error) {
				expect(error).toBe(networkError);
				expect(error).toHaveProperty("message", "Network timeout");
			}
		});
	});

	describe("Response.find", () => {
		it("should find matching response by id", () => {
			const request: DocumentJsonRpc2Request.DeleteJsonRpc2Request = {
				id: "delete-1",
				jsonrpc: "2.0",
				method: "DELETE_DOCUMENT",
				params: { docRef: "doc-1", locale: "en-US" }
			};

			const responses: JsonRpc2Response[] = [
				{
					id: "query-1",
					jsonrpc: "2.0",
					result: { documents: [] }
				},
				{
					id: "delete-1",
					jsonrpc: "2.0",
					result: { success: true }
				},
				{
					id: "copy-1",
					jsonrpc: "2.0",
					result: { documentId: "new-doc" }
				}
			];

			const result = JsonRpc.Response.find(request, responses);

			expect(result).toBeDefined();
			if (result) {
				expect(result.id).toBe("delete-1");
				expect(result.result).toEqual({ success: true });

				type ExpectedResponseType = ResponseFor<DocumentJsonRpc2Request.DeleteJsonRpc2Request>;
				const typedResult: ExpectedResponseType = result;
				expect(typedResult).toBeDefined();
			}
		});

		it("should return undefined when no matching response found", () => {
			const request: DocumentJsonRpc2Request.CopyJsonRpc2Request = {
				id: "copy-1",
				jsonrpc: "2.0",
				method: "COPY_DOCUMENT",
				params: { docRef: "doc-1", locale: "en-US" }
			};

			const responses: JsonRpc2Response[] = [
				{
					id: "different-id",
					jsonrpc: "2.0",
					result: { success: true }
				}
			];

			const result = JsonRpc.Response.find(request, responses);

			expect(result).toBeUndefined();

			type ExpectedResponseType = ResponseFor<DocumentJsonRpc2Request.CopyJsonRpc2Request>;
			const typedResult: ExpectedResponseType | undefined = result;
			expect(typedResult).toBeUndefined();
		});

		it("should handle empty responses array", () => {
			const request: DocumentJsonRpc2Request.DeleteJsonRpc2Request = {
				id: "delete-1",
				jsonrpc: "2.0",
				method: "DELETE_DOCUMENT",
				params: { docRef: "doc-1", locale: "en-US" }
			};

			const responses: JsonRpc2Response[] = [];

			const result = JsonRpc.Response.find(request, responses);

			expect(result).toBeUndefined();
		});
	});

	describe("Response.get", () => {
		it("should return matching response by id", () => {
			const request: DocumentJsonRpc2Request.CopyJsonRpc2Request = {
				id: "copy-1",
				jsonrpc: "2.0",
				method: "COPY_DOCUMENT",
				params: { docRef: "doc-1", locale: "en-US" }
			};

			const responses: JsonRpc2Response[] = [
				{
					id: "copy-1",
					jsonrpc: "2.0",
					result: { success: true, documentId: "new-doc-1" }
				}
			];

			const result = JsonRpc.Response.get(request, responses);

			expect(result).toBeDefined();
			expect(result.id).toBe("copy-1");
			expect(result.result).toEqual({ success: true, documentId: "new-doc-1" });

			type ExpectedResponseType = ResponseFor<DocumentJsonRpc2Request.CopyJsonRpc2Request>;
			const typedResult: ExpectedResponseType = result;
			expect(typedResult.id).toBe("copy-1");
		});

		it("should throw NotFoundError when no matching response found", () => {
			const request: DocumentJsonRpc2Request.DeleteJsonRpc2Request = {
				id: "delete-1",
				jsonrpc: "2.0",
				method: "DELETE_DOCUMENT",
				params: { docRef: "doc-1", locale: "en-US" }
			};

			const responses: JsonRpc2Response[] = [
				{
					id: "different-id",
					jsonrpc: "2.0",
					result: { success: true }
				}
			];

			expect(() => JsonRpc.Response.get(request, responses)).toThrow();

			try {
				JsonRpc.Response.get(request, responses);
				throw new Error("Expected NotFoundError to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				const errorInstance = error as Error;
				expect(errorInstance.message).toContain("TreeEngine.Response");
				expect(errorInstance.message).toContain('"delete-1"');
			}
		});

		it("should handle string request id types", () => {
			const request: DocumentJsonRpc2Request.DeleteJsonRpc2Request = {
				id: "delete-request-123",
				jsonrpc: "2.0",
				method: "DELETE_DOCUMENT",
				params: { docRef: "doc-1", locale: "en-US" }
			};

			const responses: JsonRpc2Response[] = [
				{
					id: "delete-request-123",
					jsonrpc: "2.0",
					result: { success: true }
				}
			];

			const result = JsonRpc.Response.get(request, responses);

			expect(result).toBeDefined();
			expect(result.id).toBe("delete-request-123");

			type ExpectedResponseType = ResponseFor<DocumentJsonRpc2Request.DeleteJsonRpc2Request>;
			const typedResult: ExpectedResponseType = result;
			expect(typedResult.result).toHaveProperty("success");
		});

		it("should handle number request id types", () => {
			const request: DocumentJsonRpc2Request.CopyJsonRpc2Request = {
				id: 12345,
				jsonrpc: "2.0",
				method: "COPY_DOCUMENT",
				params: { docRef: "doc-1", locale: "en-US" }
			};

			const responses: JsonRpc2Response[] = [
				{
					id: 12345,
					jsonrpc: "2.0",
					result: { success: true, documentId: "copied-doc" }
				}
			];

			const result = JsonRpc.Response.get(request, responses);

			expect(result).toBeDefined();
			expect(result.id).toBe(12345);

			type ExpectedResponseType = ResponseFor<DocumentJsonRpc2Request.CopyJsonRpc2Request>;
			const typedResult: ExpectedResponseType = result;
			expect(typedResult.result).toHaveProperty("success");
		});
	});

	describe("Type Safety Tests", () => {
		it("should maintain type safety for different request types", () => {
			const deleteRequest: DocumentJsonRpc2Request.DeleteJsonRpc2Request = {
				id: "delete-1",
				jsonrpc: "2.0",
				method: "DELETE_DOCUMENT",
				params: { docRef: "doc-1", locale: "en-US" }
			};

			const copyRequest: DocumentJsonRpc2Request.CopyJsonRpc2Request = {
				id: "copy-1",
				jsonrpc: "2.0",
				method: "COPY_DOCUMENT",
				params: { docRef: "doc-1", locale: "en-US" }
			};

			const responses: JsonRpc2Response[] = [
				{
					id: "delete-1",
					jsonrpc: "2.0",
					result: { success: true }
				},
				{
					id: "copy-1",
					jsonrpc: "2.0",
					result: { success: true, documentId: "new-doc" }
				}
			];

			const deleteResponse = JsonRpc.Response.find(deleteRequest, responses);
			const copyResponse = JsonRpc.Response.find(copyRequest, responses);

			if (deleteResponse) {
				expect(deleteResponse.result).toHaveProperty("success");
			}

			if (copyResponse) {
				expect(copyResponse.result).toHaveProperty("success");
				expect(copyResponse.result).toHaveProperty("documentId");
			}
		});

		it("should work with request builders", () => {
			const deleteRequest = JsonRpc.Request.builder.deleteDocument({
				id: "builder-delete-1",
				params: { docRef: "doc-1", locale: "en-US" }
			});

			const copyRequest = JsonRpc.Request.builder.copyDocument({
				id: "builder-copy-1",
				params: { docRef: "doc-1", locale: "en-US" }
			});

			const responses: JsonRpc2Response[] = [
				{
					id: "builder-delete-1",
					jsonrpc: "2.0",
					result: { success: true }
				},
				{
					id: "builder-copy-1",
					jsonrpc: "2.0",
					result: { success: true, documentId: "new-doc" }
				}
			];

			const deleteResponse = JsonRpc.Response.get(deleteRequest, responses);
			const copyResponse = JsonRpc.Response.get(copyRequest, responses);

			expect(deleteResponse.result).toHaveProperty("success");
			expect(copyResponse.result).toHaveProperty("success");
			expect(copyResponse.result).toHaveProperty("documentId");

			type DeleteResponseType = ResponseFor<typeof deleteRequest>;
			type CopyResponseType = ResponseFor<typeof copyRequest>;

			const typedDeleteResponse: DeleteResponseType = deleteResponse;
			const typedCopyResponse: CopyResponseType = copyResponse;

			expect(typedDeleteResponse).toBeDefined();
			expect(typedCopyResponse).toBeDefined();
		});
	});
});
