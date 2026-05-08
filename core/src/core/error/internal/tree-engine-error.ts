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

import { type AnyAction } from "typescript-fsa";

import { type Activity } from "@com.mgmtp.a12.client/client-core";
import { JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

export interface TreeEngineBaseError extends Error, Activity.Error.Base {
	readonly message: string;
}

export class TreeEngineError<ErrorCode extends string = TreeEngineErrorCode>
	extends Error
	implements TreeEngineBaseError
{
	errorCode: ErrorCode;
	details?: { subError: unknown; causeAction: AnyAction };

	constructor(
		params: Error & {
			errorCode: ErrorCode;
			details?: { subError: unknown; causeAction: AnyAction };
		}
	) {
		super(params.message);
		this.name = params.name;
		this.errorCode = params.errorCode;
		this.details = params.details;
	}
}

export namespace TreeEngineBaseError {
	export function isInstance(object: unknown): object is TreeEngineBaseError {
		return !!object && typeof object === "object" && "errorCode" in object && "name" in object;
	}
}

export enum TreeEngineErrorCode {
	SERVER_ERROR = "SERVER_ERROR",
	NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
	TYPE_ERROR = "TYPE_ERROR",

	/**
	 * Loading operation errors
	 */
	EXPAND_WHOLE_TREE_ERROR = "EXPAND_WHOLE_TREE_ERROR",
	EXPAND_SUB_TREE_ERROR = "EXPAND_SUB_TREE_ERROR",
	EXPAND_NODE_ERROR = "EXPAND_NODE_ERROR",
	RELOAD_NODE_ERROR = "RELOAD_NODE_ERROR",
	SCROLL_TO_NODE_ERROR = "SCROLL_TO_NODE_ERROR",
	SELECT_NODE_ERROR = "SELECT_NODE_ERROR",
	MULTI_SELECT_NODE_ERROR = "MULTI_SELECT_NODE_ERROR",
	PAGING_ERROR = "PAGING_ERROR",

	/**
	 * Saving operation errors
	 */
	CREATE_NODE_ERROR = "CREATE_NODE_ERROR",
	ADD_LINK_ERROR = "ADD_LINK_ERROR",
	DELETE_LINK_ERROR = "DELETE_LINK_ERROR",
	DELETE_NODE_ERROR = "DELETE_NODE_ERROR",
	COPY_NODE_ERROR = "COPY_NODE_ERROR",
	CUT_NODE_ERROR = "CUT_NODE_ERROR",
	PASTE_NODE_ERROR = "PASTE_NODE_ERROR",
	DRAG_AND_DROP_ERROR = "DRAG_AND_DROP_ERROR",

	CREATED_INSTANCE_ID_NOT_FOUND_ERROR = "CREATED_INSTANCE_ID_NOT_FOUND_ERROR"
}

export namespace TreeEngineError {
	export function isInstance(object: unknown): object is TreeEngineError {
		return TreeEngineBaseError.isInstance(object) && Object.keys(TreeEngineErrorCode).includes(object.errorCode);
	}

	export interface ServerError extends TreeEngineError<TreeEngineErrorCode.SERVER_ERROR> {
		readonly errors: JsonRpc2Response.JsonRpc2Error[];
	}

	export namespace ServerError {
		export function isInstance(object: unknown): object is ServerError {
			if (
				TreeEngineBaseError.isInstance(object) &&
				object.errorCode === TreeEngineErrorCode.SERVER_ERROR &&
				"errors" in object
			) {
				const errors = (object as any).errors;
				return Array.isArray(errors) && errors.length > 0 && errors.every(JsonRpc2Response.JsonRpc2Error.isInstance);
			}

			return false;
		}
	}

	export const NotFoundError = (() => {
		const errorCode = TreeEngineErrorCode.NOT_FOUND_ERROR;
		const initializer = (type: SubErrorType, options?: string | { id?: string; activityId?: string }) => {
			const id =
				typeof options === "string"
					? `[${options}]`
					: typeof options === "object" && options.id
						? `[${options.id}]`
						: "";

			const activityId = typeof options === "object" ? options.activityId : undefined;
			const location = activityId ? `in activity [${activityId}]` : "";

			return new TreeEngineError<TreeEngineErrorCode.NOT_FOUND_ERROR>({
				errorCode,
				message: format(`Can not find ${type} ${id} ${location}`),
				name: createName(errorCode, type)
			});
		};

		initializer.isInstance = (
			object: unknown,
			type: SubErrorType
		): object is TreeEngineError<TreeEngineErrorCode.NOT_FOUND_ERROR> => {
			return (
				TreeEngineError.isInstance(object) &&
				object.errorCode === errorCode &&
				object.name === createName(errorCode, type)
			);
		};

		return initializer;
	})();

	export const TypeError = (() => {
		const errorCode = TreeEngineErrorCode.TYPE_ERROR;
		const initializer = (type: SubErrorType, options: { expect?: unknown; actual?: unknown } = {}) => {
			const { expect, actual } = options;

			const message = [
				`Invalid ${type}`,
				expect && `Expect: ${JSON.stringify(expect)}`,
				actual && `Actual: ${JSON.stringify(actual)}`
			]
				.filter(Boolean)
				.join(".\n");

			return new TreeEngineError<TreeEngineErrorCode.TYPE_ERROR>({
				errorCode,
				message: format(message),
				name: createName(errorCode, type)
			});
		};

		initializer.isInstance = (
			object: unknown,
			type: SubErrorType
		): object is TreeEngineError<TreeEngineErrorCode.TYPE_ERROR> => {
			return (
				TreeEngineError.isInstance(object) &&
				object.errorCode === errorCode &&
				object.name === createName(errorCode, type)
			);
		};

		return initializer;
	})();

	/**
	 * Loading operation errors
	 */
	export const ExpandWholeTreeError = createError(
		TreeEngineErrorCode.EXPAND_WHOLE_TREE_ERROR,
		() => "Can not expand the whole tree"
	);
	export const ExpandSubTreeError = createError(
		TreeEngineErrorCode.EXPAND_SUB_TREE_ERROR,
		() => "Can not expand the desired subtree"
	);
	export const ExpandNodeError = createError(
		TreeEngineErrorCode.EXPAND_NODE_ERROR,
		() => "Can not expand the desired node"
	);
	export const ReloadNodeError = createError(
		TreeEngineErrorCode.RELOAD_NODE_ERROR,
		() => "Can not reload the desired node"
	);
	export const ScrollToNodeError = createError(
		TreeEngineErrorCode.SCROLL_TO_NODE_ERROR,
		() => "Can not scroll to the desired node"
	);
	export const SelectNodeError = createError(
		TreeEngineErrorCode.SELECT_NODE_ERROR,
		() => "Can not select the desired node"
	);
	export const MultiSelectNodeError = createError(
		TreeEngineErrorCode.MULTI_SELECT_NODE_ERROR,
		() => "Can not select the desired node(s)"
	);
	export const PagingError = createError(TreeEngineErrorCode.PAGING_ERROR, () => "Can not load more page");

	/**
	 * Saving operation errors
	 */
	export const CreateNodeError = createError(
		TreeEngineErrorCode.CREATE_NODE_ERROR,
		(type: "root" | "child" | "sibling") => `Can not create the ${type} node`
	);
	export const AddLinkError = createError(
		TreeEngineErrorCode.ADD_LINK_ERROR,
		(actionType: string) => `Could not link created document in action ${actionType}`
	);
	export const DeleteLinkError = createError(
		TreeEngineErrorCode.DELETE_LINK_ERROR,
		() => "Can not delete the desired link"
	);
	export const DeleteNodeError = createError(
		TreeEngineErrorCode.DELETE_NODE_ERROR,
		() => "Can not delete the desired node(s)"
	);
	export const CopyNodeError = createError(
		TreeEngineErrorCode.COPY_NODE_ERROR,
		() => "Can not copy to the desired node(s)"
	);
	export const CutNodeError = createError(TreeEngineErrorCode.CUT_NODE_ERROR, () => "Can not cut the desired node(s)");
	export const PasteNodeError = createError(
		TreeEngineErrorCode.PASTE_NODE_ERROR,
		() => "Can not paste to the desired node(s)"
	);
	export const DragAndDropNodeError = createError(
		TreeEngineErrorCode.DRAG_AND_DROP_ERROR,
		() => "Can not perform drag and drop operation"
	);
	export const CreatedInstanceIdNotFound = createError(
		TreeEngineErrorCode.CREATED_INSTANCE_ID_NOT_FOUND_ERROR,
		(actionType: string) => `Could not find newly created instanceId in ${actionType}`
	);

	export type SubErrorType =
		| "LockId"
		| "Locale"
		| "Activity"
		| "DataHolder"
		| "Document"
		| "ModelPath"
		| "GroupInstance"
		| "FieldInstanceValue"
		| "DocumentModel"
		| "DocumentModelId"
		| "DocumentModel.Element"
		| "RelationshipModel"
		| "RelationshipModel.LinkEntitySpec"
		| "RelationshipModel.LinkDocumentModel"
		| "RelationshipModel.RelationshipRole"
		| "RelationshipModel.EntityCharacteristic"
		| "Relationship.LinkDocument"
		| "TreeEngine.Model"
		| "TreeEngine.Model.PageSize"
		| "TreeEngine.Model.ExpansionStrategy"
		| "TreeEngine.DataHolder"
		| "TreeEngine.State"
		| "TreeEngine.ModelsState"
		| "TreeEngine.DataState"
		| "TreeEngine.UiState"
		| "TreeEngine.Operation"
		| "TreeEngine.Identifier"
		| "TreeEngine.Node"
		| "TreeEngine.Link"
		| "TreeEngine.LinkRef"
		| "TreeEngine.NodeModel"
		| "TreeEngine.ParentNode"
		| "TreeEngine.NodePath"
		| "TreeEngine.Request"
		| "TreeEngine.Response"
		| "TreeEngine.Clipboard"
		| "TreeEngine.ChildRelationshipConfiguration"
		| "TreeEngine.Type"
		| "TreeEngine.PageSizeMap"
		| "TreeEngine.Query"
		| "TreeEngine.Root"
		| "TreeEngine.HiddenRoot"
		| "TreeEngine.Slices"
		| never;
}

/**
 * A utility function to create error creators and their type guards
 */
function createError<Code extends TreeEngineErrorCode, Params extends unknown[] = unknown[]>(
	errorCode: Code,
	constructor: (...params: Params) => string | { name: string; message: string },
	typeGuard?: ErrorTypeGuard<TreeEngineError<Code>>["isInstance"]
): ErrorConstructor<Code, Params> & ErrorTypeGuard<TreeEngineError<Code>> {
	const result = (...params: Params): TreeEngineError<Code> => {
		const constructorResult = constructor(...params);

		if (typeof constructorResult === "string") {
			return new TreeEngineError<Code>({
				errorCode,
				name: createName(errorCode),
				message: constructorResult
			});
		}

		return new TreeEngineError<Code>({ errorCode, ...constructorResult });
	};

	const defaultTypeGuard = (object: unknown): object is TreeEngineError<Code> =>
		TreeEngineError.isInstance(object) && object.errorCode === errorCode;

	result.isInstance = typeGuard ?? defaultTypeGuard;

	return result;
}

export type ErrorConstructor<Code extends TreeEngineErrorCode, Params extends unknown[]> = (
	...params: Params
) => TreeEngineError<Code>;

export interface ErrorTypeGuard<Error extends TreeEngineError> {
	isInstance(object: unknown): object is Error;
}

const format = (message: string) => message.replace(/\s{2,}/g, " ").trim();

const createName = (errorCode: TreeEngineErrorCode, ...subtypes: string[]) =>
	["TREE_ENGINE_ERROR", errorCode, ...subtypes].join("/");
