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

import { type Activity } from "@com.mgmtp.a12.client/client-core";

import { type Identifier, type TreeEngineState } from "../../../core/store/index.js";

export interface TreeEngineActivity extends Activity {
	readonly descriptor: TreeEngineActivity.Descriptor;
}

export namespace TreeEngineActivity {
	/** @deprecated This is no longer the default way to check for Tree Engine instance, try selecting engineState instead. */
	export function isAssignableFrom(activity: Activity): activity is TreeEngineActivity {
		return Descriptor.DefaultInstance.isAssignableFrom(activity.descriptor);
	}

	export type Descriptor = Descriptor.DefaultInstance | Descriptor.HiddenRootInstance;
	export namespace Descriptor {
		export type DefaultInstance = Activity.Descriptor;

		export namespace DefaultInstance {
			/** @deprecated This is no longer the default way to check for Tree Engine instance, try selecting engineState instead. */
			export function isAssignableFrom(descriptor: Activity.Descriptor): descriptor is Descriptor.DefaultInstance {
				return descriptor["engine"] === "tree";
			}
		}

		export interface HiddenRootInstance extends DefaultInstance {
			readonly rootInstance: string;
			readonly rootRelationshipName: string;
			readonly rootRelationshipRole: string;
		}

		export namespace HiddenRootInstance {
			export function isAssignableFrom(descriptor: Activity.Descriptor): descriptor is Descriptor.HiddenRootInstance {
				const { rootInstance, rootRelationshipName, rootRelationshipRole } = descriptor;
				return !!rootInstance && !!rootRelationshipName && !!rootRelationshipRole;
			}
		}
	}
}

export interface TreeEngineDataHolder extends Activity.DataHolder<TreeEngineDataHolder.Data> {
	readonly descriptor:
		| TreeEngineDataHolder.Descriptor.ChildNodes
		| TreeEngineDataHolder.Descriptor.ParentNodes
		| TreeEngineDataHolder.Descriptor.RootNodes
		| TreeEngineDataHolder.Descriptor.HiddenRootNodes;
}

export namespace TreeEngineDataHolder {
	export function isAssignableFrom(dataHolder: Activity.DataHolder): dataHolder is TreeEngineDataHolder {
		return (
			Descriptor.ChildNodes.isAssignableFrom(dataHolder.descriptor) ||
			Descriptor.ParentNodes.isAssignableFrom(dataHolder.descriptor) ||
			Descriptor.RootNodes.isAssignableFrom(dataHolder.descriptor) ||
			Descriptor.HiddenRootNodes.isAssignableFrom(dataHolder.descriptor)
		);
	}

	export namespace Descriptor {
		interface Base extends Activity.DataHolderDescriptor {
			readonly type: string;
			readonly relationshipModel?: string;
			readonly relationshipRole?: string;
		}

		export interface ChildNodes extends Base {
			readonly type: "CHILD_NODES";
			/** A12 docRef instance, e.g.: DomainProduct/12, DomainCategory/1 */
			readonly source: string;
		}

		export namespace ChildNodes {
			export function isAssignableFrom(descriptor: Activity.DataHolderDescriptor): descriptor is ChildNodes {
				return descriptor["type"] === "CHILD_NODES" && !!descriptor["source"];
			}
		}

		export interface ParentNodes extends Base {
			readonly type: "PARENT_NODES";
			/** A12 docRef instance, e.g.: DomainProduct/12, DomainCategory/1 */
			readonly source: string;
		}

		export namespace ParentNodes {
			export function isAssignableFrom(descriptor: Activity.DataHolderDescriptor): descriptor is ParentNodes {
				return descriptor["type"] === "PARENT_NODES" && !!descriptor["source"];
			}
		}

		export interface RootNodes extends Base {
			readonly type: "ROOT_NODES";
		}

		export namespace RootNodes {
			export function isAssignableFrom(descriptor: Activity.DataHolderDescriptor): descriptor is RootNodes {
				return descriptor["type"] === "ROOT_NODES";
			}
		}

		export interface HiddenRootNodes extends Base {
			readonly type: "HIDDEN_ROOT_NODES";
			/** A12 docRef instance, e.g.: DomainProduct/12, DomainCategory/1 */
			readonly source: string;
		}
		export namespace HiddenRootNodes {
			export function isAssignableFrom(descriptor: Activity.DataHolderDescriptor): descriptor is HiddenRootNodes {
				return descriptor["type"] === "HIDDEN_ROOT_NODES" && !!descriptor["source"];
			}
		}
	}

	export type Data = TreeEngineState.Data;

	export interface Meta extends TreeEngineState.Paging {
		readonly identifier?: Identifier;
		readonly children: Identifier[];
	}

	export namespace Meta {
		export function fromSlices(slices: Activity.DataHolder["slices"]): Meta | undefined {
			if (slices.meta && "children" in slices.meta) {
				return slices.meta as Meta;
			}
			return undefined;
		}
	}

	export interface Slices {
		meta: Meta;
	}
	export namespace Slices {
		export function toSlices(meta: Meta): Activity.DataHolder["slices"] {
			return { meta };
		}
		export function fromSlices(slices: Activity.DataHolder["slices"]): Meta | undefined {
			if (slices.meta && "children" in slices.meta) {
				return slices.meta as Meta;
			}
			return undefined;
		}
	}
}
