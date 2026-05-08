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

import { type TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.api.js";
import { type Activity } from "@com.mgmtp.a12.client/client-core";

import { type Identifier, type TreeEngineState } from "../../../core/store/index.js";
import { type TreeModel } from "../../../core/models/index.js";

export type TreeEngineOperation =
	| TreeEngineOperation.ExpandWholeTree
	| TreeEngineOperation.ExpandSubTree
	| TreeEngineOperation.ExpandToNode
	| TreeEngineOperation.LoadAllChildNodes
	| TreeEngineOperation.LoadMoreNodes
	| TreeEngineOperation.LoadAllNodes
	| TreeEngineOperation.ReloadNodes
	| TreeEngineOperation.Mutation;

export namespace TreeEngineOperation {
	export type Mutation = AddLink | DeleteLink | DeleteNode | MoveNode | CopyNode;

	export namespace Mutation {
		export function isAssignableFrom(operation: TreeEngineOperation): operation is Mutation {
			return ["ADD_LINK", "DELETE_LINK", "DELETE_NODE", "MOVE_NODE", "COPY_NODE"].includes(operation.type);
		}
	}

	export type Done = DeleteNodeDone | DeleteLinkDone | AddLinkDone | MoveNodeDone | CopyNodeDone;
	export type Failed = DeleteNodeFailed | DeleteLinkFailed | AddLinkFailed | MoveNodeFailed | CopyNodeFailed;

	interface Base<P> {
		readonly type: string;
		readonly payload: P;
	}

	export interface Errorable {
		readonly error: Error;
	}

	export interface AffectableDataHolders {
		/**
		 * The list of data holders which need to be reloaded after the operation is done.
		 */
		readonly outdatedDataHolderDescriptors?: Activity.DataHolderDescriptor[];
		/**
		 * The list of data holders which need to be removed after the operation is done.
		 */
		readonly removedDataHolderDescriptors?: Activity.DataHolderDescriptor[];
	}

	export interface DeleteNode extends Base<DeleteNode.Payload> {
		readonly type: "DELETE_NODE";
	}
	export interface DeleteNodeDone extends Base<DeleteNode.DonePayload> {
		readonly type: "DELETE_NODE";
	}
	export interface DeleteNodeFailed extends Base<DeleteNode.FailedPayload> {
		readonly type: "DELETE_NODE";
	}
	export namespace DeleteNode {
		export interface Payload extends AffectableDataHolders {
			readonly nodePath: TreeEngineState.NodePath;
			readonly nodeIdentifier: Identifier;
			readonly parentIdentifier?: Identifier;
		}

		export type FailedPayload = Errorable;
		export interface DonePayload {}
	}

	export interface DeleteLink extends Base<DeleteLink.Payload> {
		readonly type: "DELETE_LINK";
	}
	export interface DeleteLinkDone extends Base<DeleteLink.DonePayload> {
		readonly type: "DELETE_LINK";
	}
	export interface DeleteLinkFailed extends Base<DeleteLink.FailedPayload> {
		readonly type: "DELETE_LINK";
	}
	export namespace DeleteLink {
		export interface Payload extends AffectableDataHolders {
			readonly nodePath: TreeEngineState.NodePath;
			readonly nodeIdentifier: Identifier;
			readonly parentIdentifier?: Identifier;
		}

		export type FailedPayload = Errorable;
		export interface DonePayload {}
	}

	export interface AddLink extends Base<AddLink.Payload> {
		readonly type: "ADD_LINK";
	}
	export interface AddLinkDone extends Base<AddLink.DonePayload> {
		readonly type: "ADD_LINK";
	}
	export interface AddLinkFailed extends Base<AddLink.FailedPayload> {
		readonly type: "ADD_LINK";
	}
	export namespace AddLink {
		export interface Payload extends AffectableDataHolders {
			readonly relationshipModel: string;
			readonly parent: Link;
			readonly child: Link;
			readonly linkDocument?: object;
			readonly predecessorLinkRef?: string;
			readonly position?: TreeModel.InsertPosition;
		}

		export interface Link {
			readonly role: string;
			readonly docRef: string;
		}

		export type FailedPayload = Errorable;
		export interface DonePayload {
			newLinkIdentifier?: Identifier;
		}
	}

	export interface CopyNode extends Base<CopyNode.Payload> {
		readonly type: "COPY_NODE";
	}

	export interface CopyNodeDone extends Base<CopyNode.DonePayload> {
		readonly type: "COPY_NODE";
	}
	export interface CopyNodeFailed extends Base<CopyNode.FailedPayload> {
		readonly type: "COPY_NODE";
	}

	export namespace CopyNode {
		export interface Payload extends AffectableDataHolders {
			nodes: Node[];
			target?: {
				nodeIdentifier: Identifier;
				nodePath: TreeEngineState.NodePath;
			};
			position?: TreeTableNodeDropPosition;
		}

		export interface Node extends Partial<RmAndRoles> {
			docRef: string;
			nodeType: string;
			children?: Node[];
		}

		export interface RmAndRoles {
			readonly relationshipModel: string;
			readonly roles?: Roles;
		}

		export interface Roles {
			readonly parent: string;
			readonly child: string;
		}

		export type FailedPayload = Errorable;

		export interface DonePayload {
			readonly newLinkIdentifiers?: Identifier[];
		}
	}

	export interface MoveNode extends Base<MoveNode.Payload> {
		readonly type: "MOVE_NODE";
	}
	export interface MoveNodeDone extends Base<MoveNode.DonePayload> {
		readonly type: "MOVE_NODE";
	}
	export interface MoveNodeFailed extends Base<MoveNode.FailedPayload> {
		readonly type: "MOVE_NODE";
	}

	export namespace MoveNode {
		export type Payload = (MakeRootPayload | MakeChildPayload) & RmAndRoles & AffectableDataHolders;

		export interface Row {
			nodePath: TreeEngineState.NodePath;
			nodeIdentifier: Identifier;
			isRoot?: boolean;
		}

		export enum Type {
			ROOT_NODE = "root-node",
			CHILD_NODE = "child-node"
		}

		export interface BasePayload {
			readonly type: Type;

			readonly movedRow: Readonly<Row>;
			readonly movedRowParent: Identifier | undefined;
			/**
			 * The link between the moved row to its direct parent node
			 */
			readonly movedRowLink: TreeEngineState.Link | undefined;

			readonly targetRowParent: Readonly<Row> | undefined;
			readonly position?: TreeTableNodeDropPosition;

			readonly linkDocument?: object;
		}

		export interface MakeRootPayload extends BasePayload {
			readonly type: Type.ROOT_NODE;

			/**
			 * The links between the moved row to parent nodes (including both direct and indirect nodes)
			 * Making a node root in A12 Services requires to unlink every possible "parent" side of the node's relationship.
			 */
			readonly movedRowLinks: TreeEngineState.Link[];
			/**
			 * The direct and indirect parent nodes of the moved row.
			 * Making a node root in A12 Services requires to unlink every possible "parent" side of the node's relationship.
			 */
			readonly movedRowParents: Identifier[];
		}

		export interface MakeChildPayload extends BasePayload {
			readonly type: Type.CHILD_NODE;

			readonly targetRow: Readonly<Row>;
			readonly targetRowParent: Readonly<Row>;
		}

		export interface RmAndRoles {
			readonly relationshipModel: string;
			readonly linkDocumentModel?: string;
			readonly roles?: Roles;
		}

		export interface Roles {
			readonly parent: string;
			readonly child: string;
		}

		export type FailedPayload = Errorable;

		export interface DonePayload {
			readonly newLinkIdentifier?: Identifier;
		}
	}

	export interface ExpandWholeTree extends Base<AffectableDataHolders> {
		readonly type: "EXPAND_WHOLE_TREE";
	}
	export interface ExpandSubTree extends Base<ExpandAll.Payload> {
		readonly type: "EXPAND_SUB_TREE";
	}
	export namespace ExpandAll {
		export interface Payload extends AffectableDataHolders {
			readonly nodePath: TreeEngineState.NodePath;
			readonly nodeIdentifier: Identifier;
		}
	}

	export interface ReloadNodes extends Base<ReloadNodes.Payload> {
		readonly type: "RELOAD_NODES";
	}
	export namespace ReloadNodes {
		export interface Payload extends AffectableDataHolders {
			readonly nodes: Identifier[];
		}
	}

	export interface LoadAllChildNodes extends Base<LoadAllChildNodes.Payload> {
		readonly type: "LOAD_ALL_CHILD_NODES";
	}
	export namespace LoadAllChildNodes {
		export interface Payload extends AffectableDataHolders {
			readonly nodes?: {
				nodeIdentifier: Identifier;
				/** @deprecated will be removed in v10.0, because node path is not needed when performing the operation. */
				nodePath: TreeEngineState.NodePath;
			}[];

			/**
			 * Define a limit on how many levels a reload action should dive into
			 * @default Infinity travel until reaching the leaf nodes
			 */
			level?: number;

			/** If enabled, only reload nodes that have been loaded */
			readonly onlyLoadedNodes?: boolean;

			/** If enabled, pagination meta will be ignored and full size shall be loaded */
			readonly ignorePagination?: boolean;
		}
	}

	export interface ExpandToNode extends Base<ExpandToNode.Payload> {
		readonly type: "EXPAND_TO_NODE";
	}

	export namespace ExpandToNode {
		export interface Payload extends AffectableDataHolders {
			readonly nodePath: TreeEngineState.NodePath;
			readonly nodesFromNodePath?: Identifier[];
		}
	}

	export interface LoadMoreNodes extends Base<LoadMoreNodes.Payload> {
		readonly type: "LOAD_MORE_NODES";
	}

	export namespace LoadMoreNodes {
		export interface Payload extends AffectableDataHolders {
			readonly nodePath: TreeEngineState.NodePath;
			readonly nodeIdentifier: Identifier;
		}
	}

	export interface LoadAllNodes extends Base<LoadAllNodes.Payload> {
		readonly type: "LOAD_ALL_NODES";
	}

	export namespace LoadAllNodes {
		export interface Payload extends AffectableDataHolders {
			readonly nodePath: TreeEngineState.NodePath;
			readonly nodeIdentifier: Identifier;
		}
	}

	export function isAssignableFrom(obj: object): obj is TreeEngineOperation {
		return obj && "type" in obj && "payload" in obj;
	}
}
