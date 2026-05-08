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

import { type Identifier } from "../../../../core/store/index.js";
import { type TreeEngineDataHolder } from "../../../client/index.js";

/** @internal */
export namespace RequestId {
	const cleanNonAlphaNumericChars = (id: string) => id.replace(/[^a-zA-Z0-9]/g, "");

	export function createForRootNodes(descriptor: TreeEngineDataHolder.Descriptor.RootNodes): string {
		return "TreeEngineRoots";
	}

	export function createForHiddenRootNodes(descriptor: TreeEngineDataHolder.Descriptor.HiddenRootNodes): string {
		return "TreeEngineHiddenRoots";
	}

	export function createForChildNodes(descriptor: TreeEngineDataHolder.Descriptor.ChildNodes): string {
		return cleanNonAlphaNumericChars(
			`TreeEngineChildren/${descriptor.relationshipModel}/${descriptor.relationshipRole}/${descriptor.source}`
		);
	}

	export function createForParentNodes(descriptor: TreeEngineDataHolder.Descriptor.ParentNodes): string {
		return cleanNonAlphaNumericChars(
			`TreeEngineParents/${descriptor.relationshipModel}/${descriptor.relationshipRole}/${descriptor.source}`
		);
	}

	export function createForAddLink(relationshipModel: string, _suffix?: string): string {
		let suffix = "";
		if (_suffix) {
			suffix = `Suffix${_suffix}`;
		}
		return cleanNonAlphaNumericChars(`AddLinkType${relationshipModel}${suffix}`);
	}

	export function createForRelinkLink(relationshipModel: string, entity1: string, entity2: string): string {
		return cleanNonAlphaNumericChars(`RelinkType${relationshipModel}Entity1${entity1}Entity2${entity2}`);
	}

	export function createForModifyLink(linkIdentifier: Identifier): string {
		return cleanNonAlphaNumericChars(`ModifyLinkType${linkIdentifier.type}Suffix${linkIdentifier.id}`);
	}

	export function createForDeleteLink(linkIdentifier: Identifier): string {
		return cleanNonAlphaNumericChars(`DeleteLinkType${linkIdentifier.type}Id${linkIdentifier.id}`);
	}

	export function createForAddDocument(documentModel: string, _suffix?: string): string {
		let suffix = "";
		if (_suffix) {
			suffix = `Suffix${_suffix}`;
		}
		return cleanNonAlphaNumericChars(`AddDocumentType${documentModel}${suffix}`);
	}

	export function createForCopyDocument(docRef: string, _suffix?: string): string {
		let suffix = "";
		if (_suffix) {
			suffix = `Suffix${_suffix}`;
		}
		return cleanNonAlphaNumericChars(`CopyDocumentType${docRef}${suffix}`);
	}

	export function createForDeleteNode(nodeIdentifier: Identifier): string {
		return cleanNonAlphaNumericChars(`DeleteNodeId${nodeIdentifier.id}`);
	}
}
