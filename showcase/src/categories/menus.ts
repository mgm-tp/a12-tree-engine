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

import { ActivitySelectors, type DynamicMenu, type Selector } from "@com.mgmtp.a12.client/client-core";

import { onClickFor } from "../utils.js";

import {
	CATEGORIES_DESCRIPTOR,
	CATEGORIES_VIRTUAL_SCROLL_DESCRIPTOR,
	CATEGORIES_PAGINATION_DESCRIPTOR,
	CATEGORIES_PAGINATED_VIRTUAL_SCROLL_DESCRIPTOR,
	CATEGORIES_MULTI_LEVEL_DESCRIPTOR,
	CATEGORIES_CUSTOM_DESCRIPTOR,
	DOMAIN_CATEGORY_DESCRIPTOR,
	DOMAIN_PRODUCT_DESCRIPTOR
} from "./descriptors.js";

const onClickCategories = onClickFor(CATEGORIES_DESCRIPTOR);
const onClickCategoriesVirtualScroll = onClickFor(CATEGORIES_VIRTUAL_SCROLL_DESCRIPTOR);
const onClickCategoriesPagination = onClickFor(CATEGORIES_PAGINATION_DESCRIPTOR);
const onClickCategoriesPaginatedVirtualScroll = onClickFor(CATEGORIES_PAGINATED_VIRTUAL_SCROLL_DESCRIPTOR);
const onClickCategoriesMultiLevel = onClickFor(CATEGORIES_MULTI_LEVEL_DESCRIPTOR);
const onClickCategoriesCustom = onClickFor(CATEGORIES_CUSTOM_DESCRIPTOR);
const onClickDomainCategory = onClickFor(DOMAIN_CATEGORY_DESCRIPTOR);
const onClickDomainProduct = onClickFor(DOMAIN_PRODUCT_DESCRIPTOR);

export const menus: Selector<DynamicMenu[]> = (state) => {
	const categoriesActivity = ActivitySelectors.activitiesByDescriptor(CATEGORIES_DESCRIPTOR)(state).at(0);
	const categoriesVirtualScrollActivity = ActivitySelectors.activitiesByDescriptor(
		CATEGORIES_VIRTUAL_SCROLL_DESCRIPTOR
	)(state).at(0);
	const categoriesPaginationActivity = ActivitySelectors.activitiesByDescriptor(CATEGORIES_PAGINATION_DESCRIPTOR)(
		state
	).at(0);
	const categoriesPaginatedVirtualScrollActivity = ActivitySelectors.activitiesByDescriptor(
		CATEGORIES_PAGINATED_VIRTUAL_SCROLL_DESCRIPTOR
	)(state).at(0);
	const categoriesMultiLevelActivity = ActivitySelectors.activitiesByDescriptor(CATEGORIES_MULTI_LEVEL_DESCRIPTOR)(
		state
	).at(0);
	const categoriesCustomActivity = ActivitySelectors.activitiesByDescriptor(CATEGORIES_CUSTOM_DESCRIPTOR)(state).at(0);
	const domainCategoryActivity = ActivitySelectors.activitiesByDescriptor(DOMAIN_CATEGORY_DESCRIPTOR)(state).at(0);
	const domainProductActivity = ActivitySelectors.activitiesByDescriptor(DOMAIN_PRODUCT_DESCRIPTOR)(state).at(0);

	return [
		{
			id: "ProductsManagement",
			label: { key: "application.menu.productsManagement.label" },
			children: [
				{
					id: "Products Tree",
					label: { key: "application.menu.productsManagement.tree" },
					selected: categoriesActivity !== undefined,
					action: onClickCategories
				},
				{
					id: "Virtual Scroll",
					label: { key: "application.menu.productsManagement.scroll" },
					selected: categoriesVirtualScrollActivity !== undefined,
					action: onClickCategoriesVirtualScroll
				},
				{
					id: "Pagination",
					label: { key: "application.menu.productsManagement.pagination" },
					selected: categoriesPaginationActivity !== undefined,
					action: onClickCategoriesPagination
				},
				{
					id: "PaginatedVirtualScroll",
					label: { key: "application.menu.productsManagement.paginatedVirtualScroll" },
					selected: categoriesPaginatedVirtualScrollActivity !== undefined,
					action: onClickCategoriesPaginatedVirtualScroll
				},
				{
					id: "Categories Multi-Level",
					label: { key: "application.menu.productsManagement.multiLevel" },
					selected: categoriesMultiLevelActivity !== undefined,
					action: onClickCategoriesMultiLevel
				},
				{
					id: "Custom Category",
					label: { key: "application.menu.productsManagement.customCategory" },
					selected: categoriesCustomActivity !== undefined,
					action: onClickCategoriesCustom
				},
				{
					id: "DomainCategory",
					label: { key: "application.menu.productsManagement.domainCategory" },
					selected: domainCategoryActivity !== undefined,
					action: onClickDomainCategory
				},
				{
					id: "DomainProduct",
					label: { key: "application.menu.productsManagement.domainProduct" },
					selected: domainProductActivity !== undefined,
					action: onClickDomainProduct
				}
			]
		}
	];
};
