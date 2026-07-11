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

import { type Identifier, TreeEngineState } from "./store.js";

export namespace TreeDataUtils {
	export function readNodeData(
		data: TreeEngineState.Data,
		nodeIdentifier: Identifier
	): TreeEngineState.Node | undefined {
		const nodeMap = data[nodeIdentifier.type];
		if (!nodeMap) {
			return undefined;
		}
		const entity = nodeMap[nodeIdentifier.id];
		if (!entity || !TreeEngineState.Node.isAssignableFrom(entity)) {
			return undefined;
		}
		return entity;
	}

	export function addNodeData(
		data: TreeEngineState.Data,
		node: TreeEngineState.Node,
		mutationType: MutationType = MutationType.IMMUTABLE
	): TreeEngineState.Data {
		return updateNodeData(data, node, mutationType);
	}

	export function updateNodeData(
		data: TreeEngineState.Data,
		node: TreeEngineState.Node,
		mutationType: MutationType = MutationType.IMMUTABLE
	): TreeEngineState.Data {
		return updateEntityData(data, node, mutationType);
	}

	export function deleteNodeData(data: TreeEngineState.Data, node: TreeEngineState.Node): TreeEngineState.Data {
		const { type, id } = node.identifier;
		const nodesByType: TreeEngineState.NodeMap<TreeEngineState.Entity> = { ...data[type] };
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete nodesByType[id];
		return {
			...data,
			[type]: nodesByType
		};
	}

	export function readLinkData(
		data: TreeEngineState.Data,
		linkIdentifier: Identifier
	): TreeEngineState.Link | undefined {
		const nodeMap = data[linkIdentifier.type];
		if (!nodeMap) {
			return undefined;
		}
		const entity = nodeMap[linkIdentifier.id];
		if (!entity || !TreeEngineState.Link.isAssignableFrom(entity)) {
			return undefined;
		}
		return entity;
	}

	export function addLinkData(
		data: TreeEngineState.Data,
		link: TreeEngineState.Link,
		mutationType: MutationType = MutationType.IMMUTABLE
	): TreeEngineState.Data {
		return updateLinkData(data, link, mutationType);
	}

	export function updateLinkData(
		data: TreeEngineState.Data,
		link: TreeEngineState.Link,
		mutationType: MutationType = MutationType.IMMUTABLE
	): TreeEngineState.Data {
		return updateEntityData(data, link, mutationType);
	}

	export function deleteLinkData(data: TreeEngineState.Data, linkIdentifier: Identifier): TreeEngineState.Data {
		const { type, id } = linkIdentifier;
		const nodesByType: TreeEngineState.NodeMap<TreeEngineState.Entity> = { ...data[type] };
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete nodesByType[id];
		return {
			...data,
			[type]: nodesByType
		};
	}

	function updateEntityData(
		data: TreeEngineState.Data,
		entity: TreeEngineState.Entity,
		mutationType: MutationType = MutationType.IMMUTABLE
	): TreeEngineState.Data {
		const { identifier } = entity;

		if (mutationType === MutationType.MUTABLE) {
			type MutableData = {
				-readonly [K in keyof TreeEngineState.Data]: TreeEngineState.Data[K];
			};

			const mutableData = data as MutableData;
			const mutableGroup = data[identifier.type];
			if (!mutableGroup) {
				mutableData[identifier.type] = { [identifier.id]: entity };
			} else {
				mutableGroup[identifier.id] = entity;
			}
			return mutableData;
		}

		return {
			...data,
			[identifier.type]: {
				...data[identifier.type],
				[identifier.id]: entity
			}
		};
	}

	export enum MutationType {
		MUTABLE,
		IMMUTABLE
	}
}
