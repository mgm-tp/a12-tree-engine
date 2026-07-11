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

import type { DynamicScene } from "@com.mgmtp.a12.client/client-core";

import { viewNGComponents } from "../viewNGComponents.js";

import {
	CATEGORIES_DESCRIPTOR,
	CATEGORIES_VIRTUAL_SCROLL_DESCRIPTOR,
	CATEGORIES_PAGINATION_DESCRIPTOR,
	CATEGORIES_PAGINATED_VIRTUAL_SCROLL_DESCRIPTOR,
	DOMAIN_CATEGORY_DESCRIPTOR,
	DOMAIN_PRODUCT_DESCRIPTOR,
	CATEGORIES_CUSTOM_DESCRIPTOR,
	CATEGORIES_MULTI_LEVEL_DESCRIPTOR
} from "./descriptors.js";

const { TreeCRUD, FormCRUD, OverviewCRUD } = viewNGComponents;

export const scenes: DynamicScene[] = [
	{
		name: "categories-tree",
		matches: (d) => d.model === CATEGORIES_DESCRIPTOR.model && !d.feature,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "categories-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "categories-virtual-scroll-tree",
		matches: (d) =>
			d.model === CATEGORIES_VIRTUAL_SCROLL_DESCRIPTOR.model &&
			d.feature === CATEGORIES_VIRTUAL_SCROLL_DESCRIPTOR.feature,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "categories-virtual-scroll-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "categories-paginated-tree",
		matches: (d) =>
			d.model === CATEGORIES_PAGINATION_DESCRIPTOR.model && d.feature === CATEGORIES_PAGINATION_DESCRIPTOR.feature,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "categories-paginated-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "categories-paginated-virtual-scroll-tree",
		matches: (d) =>
			d.model === CATEGORIES_PAGINATED_VIRTUAL_SCROLL_DESCRIPTOR.model &&
			d.feature === CATEGORIES_PAGINATED_VIRTUAL_SCROLL_DESCRIPTOR.feature,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "categories-paginated-virtual-scroll-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "category-child-relationship-editor",
		matches: (d) => d.model === DOMAIN_CATEGORY_DESCRIPTOR.model && d.engine === "relationship" && !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/MODAL",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "CategoriesStandaloneRelationshipEngine"
						}
					]
				}
			]
		}
	},
	{
		name: "Category-overview",
		matches: (d) => d.model === DOMAIN_CATEGORY_DESCRIPTOR.model && !d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: OverviewCRUD,
					models: [
						{
							modelType: "overview",
							name: "Category-overview"
						}
					]
				}
			]
		}
	},
	{
		name: "Category",
		matches: (d) => !!d.instance && d.model === DOMAIN_CATEGORY_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "Category",
							documentModel: "DomainCategory"
						}
					]
				}
			]
		}
	},
	{
		name: "Product-overview",
		matches: (d) => d.model === DOMAIN_PRODUCT_DESCRIPTOR.model && !d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: OverviewCRUD,
					models: [
						{
							modelType: "overview",
							name: "Product-overview"
						}
					]
				}
			]
		}
	},
	{
		name: "Product",
		matches: (d) => !!d.instance && d.model === DOMAIN_PRODUCT_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "Product",
							documentModel: "DomainProduct"
						},
						{
							modelType: "form",
							name: "Bundle",
							documentModel: "DomainBundle"
						}
					]
				}
			]
		}
	},
	{
		name: "ProductCategory_LinkForm",
		matches: (d) => d.model === "DomainProductCategory_AdditionalFieldsModel" && !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/MODAL",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "ProductCategory_LinkForm"
						}
					]
				}
			]
		}
	},
	{
		name: "Bundle",
		matches: (d) => d.model === "DomainBundle" && !!d.instance,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: FormCRUD,
					models: [
						{
							modelType: "form",
							name: "Bundle",
							documentModel: "DomainBundle"
						}
					]
				}
			]
		}
	},
	{
		name: "custom-categories-tree",
		matches: (d) =>
			d.model === CATEGORIES_CUSTOM_DESCRIPTOR.model && d.feature === CATEGORIES_CUSTOM_DESCRIPTOR.feature,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "custom-categories-tree"
						}
					]
				}
			]
		}
	},
	{
		name: "categories-tree-multi-level",
		matches: (d) => d.model === CATEGORIES_MULTI_LEVEL_DESCRIPTOR.model,
		sceneChange: {
			onEnter: [
				{
					type: "DYNAMIC_ADD_VIEW",
					region: "/CONTENT",
					component: TreeCRUD,
					models: [
						{
							modelType: "tree",
							name: "categories-tree-multi-level"
						}
					]
				}
			]
		}
	}
];
