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

import type { RuntimeTreeModel, TreeModel } from "../../../../../../core/models/tree-model.js";
import { resolveScreenReaderColumnId } from "../../../../../../core/view/components/tree-engine/sub-components/a11y-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.a11y-utils", () => {
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

	const columns = [column("name"), column("size"), column("owner", true)];

	function uiModel(screenReaderColumnRef?: string): RuntimeTreeModel {
		return {
			content: { configuration: { hierarchicalColumnRef: "name", screenReaderColumnRef }, columns }
		} as unknown as RuntimeTreeModel;
	}

	describe("resolveScreenReaderColumnId", () => {
		it("falls back to the hierarchical column when no screen reader column is modelled", () => {
			expect(resolveScreenReaderColumnId(uiModel(), undefined)).equal("name");
		});

		it("the fallback holds even when an override tries to hide the hierarchical column", () => {
			expect(resolveScreenReaderColumnId(uiModel(), { name: false })).equal("name");
		});

		it("resolves the modelled screen reader column while it is visible", () => {
			expect(resolveScreenReaderColumnId(uiModel("size"), undefined)).equal("size");
		});

		it("drops the reference once the end user hides that column", () => {
			expect(resolveScreenReaderColumnId(uiModel("size"), { size: false })).equal(undefined);
		});

		it("drops the reference for a column the model hides on load", () => {
			expect(resolveScreenReaderColumnId(uiModel("owner"), undefined)).equal(undefined);
		});

		it("keeps the reference once the end user shows the initially hidden column", () => {
			expect(resolveScreenReaderColumnId(uiModel("owner"), { owner: true })).equal("owner");
		});

		it("drops a reference that points at no column at all", () => {
			expect(resolveScreenReaderColumnId(uiModel("gone"), undefined)).equal(undefined);
		});

		it("the hierarchical column stays resolvable when referenced explicitly", () => {
			expect(resolveScreenReaderColumnId(uiModel("name"), { name: false })).equal("name");
		});
	});
});
