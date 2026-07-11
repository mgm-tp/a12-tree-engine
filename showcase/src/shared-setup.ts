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

import { type SagaGenerator, select } from "typed-redux-saga";

import {
	ActivitySelectors,
	type DynamicConfiguration,
	ModuleRegistryProvider
} from "@com.mgmtp.a12.client/client-core";
// import { DocumentRtCustomExtensionService } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { NewLinkPositionParams, TreeEngineSaga } from "@com.mgmtp.a12.treeengine/treeengine-core";
import { Relationship } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { dataModelerModule } from "./model-editor/module.js";
import { categoriesModule } from "./categories/module.js";
// import { CustomFieldTypeFactory } from "./custom-field-types/customFieldTypeFactory.js";
import { assert } from "./helpers.js";
import { ShowcaseConfigModule } from "./showcase-module.js";
import { teamModule } from "./a12team/module.js";

export const applicationModules: DynamicConfiguration[] = [
	ShowcaseConfigModule,
	teamModule,
	categoriesModule,
	dataModelerModule
];

export function getServerURL(): string {
	return window.location.pathname + "api";
}

export function registerApplicationModules(): void {
	applicationModules.forEach((module) => ModuleRegistryProvider.getInstance().addModule(module));
}

// export function registerCustomFieldTypes(): void {
// 	// FIXME: This service is deprecated. Provide the custom field types to the Kernel APIs directly instead (see GeneratedCodeRtConfig.customFieldTypeFactory).
// 	DocumentRtCustomExtensionService.registerCustomFieldTypes(new CustomFieldTypeFactory());
// }

// tag::LinkCreationSetting2[]
export function* isLinkAddedByDetailActivity(
	params: TreeEngineSaga.IsLinkAddedByDetailActivityParams
): SagaGenerator<boolean | undefined> {
	const { activityId } = params;
	const activity = yield* select(ActivitySelectors.activityById(activityId));
	assert(activity, "Activity not found");
	return activity.descriptor["view"] === "CustomA12TeamTreeEngine" ? true : undefined;
}
// end::LinkCreationSetting2[]

// tag::CustomSagasRegistration[]
export function createCustomSagaRegistrations(): TreeEngineSaga.SagaRegistrationsMap {
	return {
		watchChildLinksCreation: dontAllowCustomA12TeamTree,
		watchNodeDeletion: dontAllowCustomA12TeamTree,
		watchLinkDeletion: dontAllowCustomA12TeamTree
	};

	function* dontAllowCustomA12TeamTree(activityId: string): SagaGenerator<boolean> {
		const activity = yield* select(ActivitySelectors.activityById(activityId));
		return activity?.descriptor["view"] !== "CustomA12TeamTreeEngine";
	}
}
// end::CustomSagasRegistration[]

export function* getNewLinkPosition({
	relationshipModelRef,
	activityId
}: NewLinkPositionParams): SagaGenerator<Relationship.LinkPosition | undefined> {
	// Enable default BOTTOM position for specific relationship
	if (relationshipModelRef === "CategoryCategory") {
		return Relationship.LinkPosition.BOTTOM;
	}
	// Enable default BOTTOM position for whole activity
	const activity = yield* select(ActivitySelectors.activityById(activityId));
	if (
		activity?.descriptor.model === "files-tree" ||
		activity?.descriptor.model === "data-modeler-tree" ||
		activity?.descriptor.model === "non-virtual-root-data-modeler-tree"
	) {
		return Relationship.LinkPosition.BOTTOM;
	}

	// Product nodes can not be ordered inside a bundle node,
	// so new product adds into the bundle will always on BOTTOM of other products
	// even with following settings.
	if (relationshipModelRef === "BundleProduct") {
		return Relationship.LinkPosition.TOP;
	}
	return undefined;
}

export function* getPreloadChildNodesSetting(activityId: string): SagaGenerator<boolean> {
	const activity = yield* select(ActivitySelectors.activityById(activityId));
	assert(activity, "Activity not found");

	return (
		activity.descriptor.model === "a12-teams" ||
		activity.descriptor.model === "a12-teams-tree-pagination" ||
		activity.descriptor.model === "a12-teams-tree-multi-level" ||
		activity.descriptor.feature === "custom-categories-tree" ||
		activity.descriptor.model === "data-modeler-tree" ||
		activity.descriptor.model === "file-explorer-tree-preload-abstract-superType" ||
		activity.descriptor.model === "categories-tree-multi-level"
	);
}
