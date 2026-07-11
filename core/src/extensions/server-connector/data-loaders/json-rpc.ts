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
	type DocumentJsonRpc2Request,
	type RelationshipJsonRpc2request,
	type QueryJsonRpc2Request,
	type Query as DSQuery,
	type JsonRpc2Request,
	Dispatcher,
	JsonRpc2Response,
	type ResponseFor,
	type SupportedRequest,
	type LoadThumbnailUrlsJsonRpc2
} from "@com.mgmtp.a12.dataservices/dataservices-access";

import { TreeEngineError, TreeEngineErrorCode } from "../../../core/error/tree-engine-error.js";

const JSON_RPC_VERSION = "2.0";

/** @internal */
export namespace JsonRpc {
	export namespace Request {
		type Payload<Request extends JsonRpc2Request> = Omit<Request, "jsonrpc" | "method">;

		export type ModifyLink = RelationshipJsonRpc2request.ModifyLinkJsonRpc2request;
		export namespace ModifyLink {
			export function isAssignableFrom(
				request: JsonRpc2Request
			): request is RelationshipJsonRpc2request.ModifyLinkJsonRpc2request {
				return request.method === "MODIFY_LINK";
			}
		}

		export type DeleteDocument = DocumentJsonRpc2Request.DeleteJsonRpc2Request;
		export namespace DeleteDocument {
			export function isAssignableFrom(
				request: JsonRpc2Request
			): request is DocumentJsonRpc2Request.DeleteJsonRpc2Request {
				return request.method === "DELETE_DOCUMENT";
			}
		}

		export type RelinkDocument = RelationshipJsonRpc2request.RelinkDocumentJsonRpc2request;
		export namespace RelinkDocument {
			export function isAssignableFrom(
				request: JsonRpc2Request
			): request is RelationshipJsonRpc2request.RelinkDocumentJsonRpc2request {
				return request.method === "RELINK_DOCUMENT";
			}
		}

		export type DeleteLink = RelationshipJsonRpc2request.DeleteLinkJsonRpc2request;
		export namespace DeleteLink {
			export function isAssignableFrom(
				request: JsonRpc2Request
			): request is RelationshipJsonRpc2request.DeleteLinkJsonRpc2request {
				return request.method === "DELETE_LINK";
			}
		}

		export type AddLink = RelationshipJsonRpc2request.AddLinkJsonRpc2request;
		export namespace AddLink {
			export function isAssignableFrom(
				request: JsonRpc2Request
			): request is RelationshipJsonRpc2request.AddLinkJsonRpc2request {
				return request.method === "ADD_LINK";
			}
		}

		export type CopyDocument = DocumentJsonRpc2Request.CopyJsonRpc2Request;
		export namespace CopyDocument {
			export function isAssignableFrom(
				request: JsonRpc2Request
			): request is DocumentJsonRpc2Request.CopyJsonRpc2Request {
				return request.method === "COPY_DOCUMENT";
			}
		}

		export type LoadThumbnailUrls = LoadThumbnailUrlsJsonRpc2.Request;
		export namespace LoadThumbnailUrls {
			export function isAssignableFrom(request: JsonRpc2Request): request is LoadThumbnailUrlsJsonRpc2.Request {
				return request.method === "LOAD_THUMBNAIL_URLS_INTERNAL";
			}
		}

		export type Query<QueryRoot extends Query.QueryRoot = Query.QueryRoot> = QueryJsonRpc2Request<QueryRoot>;
		export namespace Query {
			export interface QueryRoot extends DSQuery.QueryRoot {
				projectionName: "document";
			}

			export function isAssignableFrom(request: JsonRpc2Request): request is QueryJsonRpc2Request<QueryRoot> {
				return request.method === "QUERY";
			}
		}

		export const builder = {
			modifyLink(payload: Payload<Request.ModifyLink>): Request.ModifyLink {
				return {
					...payload,
					jsonrpc: JSON_RPC_VERSION,
					method: "MODIFY_LINK"
				};
			},
			copyDocument(payload: Payload<Request.CopyDocument>): Request.CopyDocument {
				return {
					...payload,
					jsonrpc: JSON_RPC_VERSION,
					method: "COPY_DOCUMENT"
				};
			},
			deleteDocument(payload: Payload<Request.DeleteDocument>): Request.DeleteDocument {
				return {
					...payload,
					jsonrpc: JSON_RPC_VERSION,
					method: "DELETE_DOCUMENT"
				};
			},
			relinkDocument(payload: Payload<Request.RelinkDocument>): Request.RelinkDocument {
				return {
					...payload,
					jsonrpc: JSON_RPC_VERSION,
					method: "RELINK_DOCUMENT"
				};
			},
			deleteLink(payload: Payload<Request.DeleteLink>): Request.DeleteLink {
				return {
					...payload,
					jsonrpc: JSON_RPC_VERSION,
					method: "DELETE_LINK"
				};
			},
			addLink(payload: Payload<Request.AddLink>): Request.AddLink {
				return {
					...payload,
					jsonrpc: JSON_RPC_VERSION,
					method: "ADD_LINK"
				};
			},
			loadThumbnailUrls(payload: Payload<Request.LoadThumbnailUrls>): Request.LoadThumbnailUrls {
				return {
					...payload,
					jsonrpc: JSON_RPC_VERSION,
					method: "LOAD_THUMBNAIL_URLS_INTERNAL"
				};
			},
			query<QueryRoot extends Query.QueryRoot = Query.QueryRoot>(
				payload: Payload<Request.Query<QueryRoot>>
			): QueryJsonRpc2Request {
				return {
					...payload,
					jsonrpc: JSON_RPC_VERSION,
					method: "QUERY"
				};
			}
		};
	}

	export namespace Response {
		export function find<Req extends SupportedRequest>(
			request: Req,
			responses: JsonRpc2Response[]
		): ResponseFor<Req> | undefined {
			return responses.find((response) => response.id === request.id) as ResponseFor<Req> | undefined;
		}

		export function get<Req extends SupportedRequest>(request: Req, responses: JsonRpc2Response[]): ResponseFor<Req> {
			const response = find(request, responses);
			if (!response) {
				throw TreeEngineError.NotFoundError("TreeEngine.Response", { id: JSON.stringify(request.id) });
			}
			return response;
		}

		export interface Error extends JsonRpc2Response {
			readonly error: JsonRpc2Response.JsonRpc2Error;
		}

		export namespace Error {
			export function isInstance(obj: unknown): obj is Error {
				return typeof obj === "object" && !!obj && JsonRpc2Response.error.isInstance(obj);
			}

			export function hasErrors(responses: unknown): responses is JsonRpc.Response.Error | JsonRpc.Response.Error[] {
				if (Array.isArray(responses) && responses.every(JsonRpc2Response.isInstance)) {
					return JsonRpc2Response.hasErrors(responses);
				}

				if (JsonRpc2Response.isInstance(responses)) {
					return JsonRpc2Response.hasError(responses);
				}

				return false;
			}
		}
	}

	export async function typedDispatch(locale: string, requests: SupportedRequest[]): Promise<JsonRpc2Response[]> {
		try {
			return await Dispatcher.rpc(locale, requests);
		} catch (error) {
			if (Response.Error.hasErrors(error)) {
				throw toServerError(error);
			} else {
				throw error;
			}
		}
	}
}

function toServerError(responses: JsonRpc.Response.Error | JsonRpc.Response.Error[]): TreeEngineError.ServerError {
	const errors = (Array.isArray(responses) ? responses : [responses])
		.filter(JsonRpc.Response.Error.isInstance)
		.map(({ error }) => error);

	if (errors.length === 0) {
		throw new Error(`Could not find any error in JSON RPC responses.`);
	}

	return {
		errors,
		errorCode: TreeEngineErrorCode.SERVER_ERROR,
		name: `TREE_ENGINE_ERROR/${TreeEngineErrorCode.SERVER_ERROR}`,
		message: `Data Services encountered some errors and was unable to complete the requests. See "errors" field for more details.`
	};
}
