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

import * as React from "react";

import { type RuntimeTreeModel, type TreeModel } from "../../../../../../models/index.js";
import { useTreeEngineState } from "../../../../context/tree-engine-context-provider.js";
import { ModelSelector } from "../../../../../../store/index.js";

import { type FlattenNodeRow } from "../types.js";

/** @internal */
export namespace NodeConfigurationHook {
	export function useTreeNodeConfiguration<Property extends keyof TreeModel.TreeNodeColumnConfiguration>(params: {
		row?: FlattenNodeRow;
		columnRef?: string;
	}) {
		const { row, columnRef } = params;
		const parentNodeModel = row?.parent?.nodeModel;
		const childNodeModel = row?.nodeModel;

		const childRelationshipConfiguration = useLinkChildRelationshipConfiguration({
			parentNodeModel,
			childNodeModel
		});

		return React.useCallback<(property: Property) => TreeModel.TreeNodeColumnConfiguration[Property] | undefined>(
			(property: Property) => {
				const linkConfiguration = childRelationshipConfiguration?.columns?.find(
					(column) => column.columnRef === columnRef
				)?.configuration?.[property];

				const nodeConfiguration = row?.nodeModel.columns.find((column) => column.columnRef === columnRef)
					?.configuration?.[property];

				return linkConfiguration ?? nodeConfiguration;
			},
			[childRelationshipConfiguration?.columns, columnRef, row?.nodeModel.columns]
		);
	}

	function useLinkChildRelationshipConfiguration(params: {
		parentNodeModel?: RuntimeTreeModel.TreeNode;
		childNodeModel?: RuntimeTreeModel.TreeNode;
	}) {
		const models = useTreeEngineState(ModelSelector.models());
		const { parentNodeModel, childNodeModel } = params;

		return React.useMemo<RuntimeTreeModel.ChildRelationshipConfiguration | undefined>(() => {
			if (!parentNodeModel || !childNodeModel) {
				return undefined;
			}

			const matchedRelationshipModelRef = ModelSelector.relationshipBetweenDocumentModels([
				parentNodeModel.documentModelRef,
				childNodeModel.documentModelRef
			])({ models })?.header.id;

			return parentNodeModel?.childRelationshipConfigurations.find(
				({ relationshipModelRef }) => relationshipModelRef === matchedRelationshipModelRef
			);
		}, [models, parentNodeModel, childNodeModel]);
	}
}
