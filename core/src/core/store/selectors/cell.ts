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

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { DocumentModelUtils, DocumentUtils } from "../../models/shared.js";
import { MultiSelectGroup } from "../../services/multi-select/multi-select.js";

import type { DataState, Identifier } from "../store.js";

import { DataSelector } from "./data.js";
import { type Selector, createSelector } from "./selector.js";

export namespace CellSelector {
	type InstanceValue = ReturnType<typeof DocumentUtils.getValue>;

	/** @internal */
	export function instanceValue(
		nodeIdentifier: Identifier,
		documentModelPath?: ModelPath,
		element?: DocumentModel.Element
	): Selector<InstanceValue | undefined, DataState> {
		const isMultiSelectGroup = element && MultiSelectGroup.isInstance(element);
		return (state) =>
			instanceValueReselect(
				state,
				nodeIdentifier.type,
				nodeIdentifier.id,
				documentModelPath && ModelPath.toString(documentModelPath),
				isMultiSelectGroup
			);
	}
	const instanceValueReselect = createSelector(
		[
			(state, nodeType: string, nodeId: string) => DataSelector.node({ type: nodeType, id: nodeId })(state),
			(_, __, ___, modelPath?: string) => modelPath,
			(_, __, ___, ____, isMultiSelectGroup?: boolean) => isMultiSelectGroup
		],
		(node, modelPath, isMultiSelectGroup) => {
			if (!node) {
				return undefined;
			}
			const { document } = node;
			if (!modelPath || !document || !DocumentUtils.isGroupInstance(document)) {
				return undefined;
			}
			const documentModelPath = ModelPath.fromString(modelPath);
			return DocumentUtils.getValue(
				document,
				DocumentModelUtils.toEntityInstancePath(documentModelPath, isMultiSelectGroup)
			);
		}
	);

	/** @internal */
	export function linkDocumentInstanceValue(
		linkIdentifier: Identifier,
		documentModelPath?: ModelPath,
		element?: DocumentModel.Element
	): Selector<InstanceValue | undefined, DataState> {
		const isMultiSelectGroup = element && MultiSelectGroup.isInstance(element);
		return (state) =>
			linkDocumentInstanceValueReselect(
				state,
				linkIdentifier.type,
				linkIdentifier.id,
				documentModelPath && ModelPath.toString(documentModelPath),
				isMultiSelectGroup
			);
	}

	const linkDocumentInstanceValueReselect = createSelector(
		[
			(state, relationshipName: string, relationshipId: string) =>
				DataSelector.link({ type: relationshipName, id: relationshipId })(state),
			(_, __, ___, modelPath?: string) => modelPath,
			(_, __, ___, ____, isMultiSelectGroup?: boolean) => isMultiSelectGroup
		],
		(link, modelPath, isMultiSelectGroup) => {
			if (!link) {
				return undefined;
			}
			const { linkDocument } = link;
			if (!modelPath || !linkDocument || !DocumentUtils.isGroupInstance(linkDocument)) {
				return undefined;
			}
			const documentModelPath = ModelPath.fromString(modelPath);
			return DocumentUtils.getValue(
				linkDocument,
				DocumentModelUtils.toEntityInstancePath(documentModelPath, isMultiSelectGroup)
			);
		}
	);
}
