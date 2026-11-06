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

import type { RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { TreeEngineError } from "../../error/tree-engine-error.js";
import { ModelSelector } from "../../store/selectors/models.js";
import type { ModelsState } from "../../store/store.js";
import type { RuntimeTreeModel, TreeModel } from "../tree-model.js";

/** @internal */
export namespace TreeModelUtils {
	/**
	 * The search result views the model offers, duplicates dropped. A model that names none offers
	 * both; the order carries no meaning — which view a search opens in is decided by
	 * {@link resolveSearchResultView}.
	 *
	 * @internal
	 */
	export function getSearchResultViews(configuration: TreeModel.Configuration): TreeModel.SearchResultView[] {
		const views = configuration.searchResultViews?.filter((view, index, all) => all.indexOf(view) === index) ?? [];
		return views.length > 0 ? views : ["reduced", "complete"];
	}

	/**
	 * The view a search runs in: the one the user picked while the model still offers it, otherwise
	 * reduced — or the only named view when reduced is not offered.
	 *
	 * @internal
	 */
	export function resolveSearchResultView(
		configuration: TreeModel.Configuration,
		chosenView: TreeModel.SearchResultView | undefined
	): TreeModel.SearchResultView {
		const views = getSearchResultViews(configuration);
		if (chosenView && views.includes(chosenView)) {
			return chosenView;
		}
		// The order the modeler wrote carries no meaning: a search opens reduced whenever that view is
		// on offer, and a single-entry list pins the tree to whichever view it names.
		return views.includes("reduced") ? "reduced" : views[0];
	}

	/** @internal */
	export function findColumnById(
		columns: RuntimeTreeModel.TreeNodeColumn[] | undefined,
		id: string
	): RuntimeTreeModel.TreeNodeColumn | undefined {
		return columns?.find((column) => column.columnRef === id);
	}

	/** @internal */
	export function getChildRelationshipModels(
		engineState: ModelsState,
		nodeModel: RuntimeTreeModel.TreeNode
	): RelationshipModel[] {
		return nodeModel.childRelationshipConfigurations.map((config) => {
			const relationshipModel = ModelSelector.relationshipModelByName(config.relationshipModelRef)(engineState);
			if (!relationshipModel) {
				throw TreeEngineError.NotFoundError("RelationshipModel", config.relationshipModelRef);
			}
			return relationshipModel;
		});
	}
}
