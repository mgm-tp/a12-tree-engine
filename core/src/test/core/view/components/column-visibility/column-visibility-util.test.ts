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

import { type RuntimeTreeModel, TreeModel } from "../../../../../core/models/tree-model.js";
import {
	getInitialColumnVisibility,
	hasVisibilityDeviation,
	isColumnVisibilityAvailable,
	isColumnVisible,
	isColumnVisibleByDefault,
	isHideableColumn
} from "../../../../../core/view/components/column-visibility/column-visibility.js";

describe("@com.mgmtp.a12.tree-engine.core.view.components.column-visibility.column-visibility-util", () => {
	const configuration = { hierarchicalColumnRef: "name" };

	function column(id: string, initiallyHidden?: true): TreeModel.Column {
		return {
			id,
			name: id,
			label: [{ locale: "en", text: id }],
			width: 1,
			fixedWidth: false,
			...(initiallyHidden ? { initiallyHidden } : {})
		};
	}

	const hierarchicalColumn = column("name");
	const shownColumn = column("size");
	const hiddenColumn = column("owner", true);
	const columns = [hierarchicalColumn, shownColumn, hiddenColumn];

	describe("isHideableColumn", () => {
		it("the hierarchical column is not hideable", () => {
			expect(isHideableColumn(hierarchicalColumn, configuration)).equal(false);
		});

		it("any other column is hideable", () => {
			expect(isHideableColumn(shownColumn, configuration)).equal(true);
			expect(isHideableColumn(hiddenColumn, configuration)).equal(true);
		});
	});

	describe("isColumnVisibleByDefault", () => {
		it("columns are shown by default", () => {
			expect(isColumnVisibleByDefault(shownColumn, configuration)).equal(true);
		});

		it("a column marked initially hidden is hidden", () => {
			expect(isColumnVisibleByDefault(hiddenColumn, configuration)).equal(false);
		});

		it("initiallyHidden is ignored on the hierarchical column", () => {
			const hierarchicalMarkedHidden = column("name", true);
			expect(isColumnVisibleByDefault(hierarchicalMarkedHidden, configuration)).equal(true);
		});
	});

	describe("isColumnVisible", () => {
		it("an override wins over the modelled default", () => {
			expect(isColumnVisible(shownColumn, configuration, { size: false })).equal(false);
			expect(isColumnVisible(hiddenColumn, configuration, { owner: true })).equal(true);
		});

		it("falls back to the modelled default when no override is set", () => {
			expect(isColumnVisible(shownColumn, configuration, {})).equal(true);
			expect(isColumnVisible(hiddenColumn, configuration, {})).equal(false);
		});

		it("the hierarchical column stays visible even with an override", () => {
			expect(isColumnVisible(hierarchicalColumn, configuration, { name: false })).equal(true);
		});
	});

	describe("hasVisibilityDeviation", () => {
		it("no deviation without overrides", () => {
			expect(hasVisibilityDeviation(columns, configuration, undefined)).equal(false);
			expect(hasVisibilityDeviation(columns, configuration, {})).equal(false);
		});

		it("deviation once a column differs from its modelled default", () => {
			expect(hasVisibilityDeviation(columns, configuration, { size: false })).equal(true);
			expect(hasVisibilityDeviation(columns, configuration, { owner: true })).equal(true);
		});

		it("an override matching the modelled default is not a deviation", () => {
			expect(hasVisibilityDeviation(columns, configuration, { size: true })).equal(false);
		});
	});

	describe("isColumnVisibilityAvailable", () => {
		const columnVisibilityElement: TreeModel.ColumnVisibilityElement = {
			type: TreeModel.ElementType.COLUMN_VISIBILITY
		};

		function uiModelWith(
			enableUserDefinedColumnVisibility: true | undefined,
			subHeaderBox: { leftSlot: TreeModel.Element[]; rightSlot: TreeModel.Element[] }
		): RuntimeTreeModel {
			return {
				content: { configuration: { ...configuration, enableUserDefinedColumnVisibility }, columns, subHeaderBox }
			} as unknown as RuntimeTreeModel;
		}

		it("both the flag and an element are required", () => {
			expect(
				isColumnVisibilityAvailable(uiModelWith(true, { leftSlot: [], rightSlot: [columnVisibilityElement] }))
			).equal(true);
		});

		it("the element alone renders nothing", () => {
			expect(
				isColumnVisibilityAvailable(uiModelWith(undefined, { leftSlot: [], rightSlot: [columnVisibilityElement] }))
			).equal(false);
		});

		it("the flag alone renders nothing", () => {
			expect(isColumnVisibilityAvailable(uiModelWith(true, { leftSlot: [], rightSlot: [] }))).equal(false);
		});

		it("either slot carries the element", () => {
			expect(
				isColumnVisibilityAvailable(uiModelWith(true, { leftSlot: [columnVisibilityElement], rightSlot: [] }))
			).equal(true);
		});
	});

	describe("getInitialColumnVisibility", () => {
		const uiModel = { content: { configuration, columns } } as unknown as RuntimeTreeModel;

		it("carries one entry per column, following the modelled default", () => {
			expect(getInitialColumnVisibility(uiModel)).deep.equal({ name: true, size: true, owner: false });
		});

		it("the initial state is no deviation, so a reset offers nothing", () => {
			const initial = getInitialColumnVisibility(uiModel);
			expect(hasVisibilityDeviation(columns, configuration, initial)).equal(false);
		});
	});
});
