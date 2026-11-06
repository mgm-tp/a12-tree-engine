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

import { screen } from "@testing-library/react";
import type { ReactWrapper } from "enzyme";
import { vi } from "vitest";

import {
	Badge,
	ColumnVisibilityPanel as WidgetsColumnVisibilityPanel,
	type ColumnVisibilityItem
} from "@com.mgmtp.a12.widgets/widgets-core";

import type { TreeModel } from "../../../../../core/models/tree-model.js";
import type { TreeEngineState } from "../../../../../core/store/index.js";
import { ColumnVisibilityButton, TreeEngineContextProvider } from "../../../../../core/view/index.js";
import { createContextProps, defaultEngineState, enLocale } from "../../../../setup/basic.spec.js";
import { createEngineState } from "../../../../utils/model-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.view.components.column-visibility.column-visibility", () => {
	const hierarchicalColumnRef = defaultEngineState.models.uiModel.content.configuration.hierarchicalColumnRef;

	function column(id: string, extra?: Partial<TreeModel.Column>): TreeModel.Column {
		return {
			id,
			name: id,
			label: [{ locale: "en", text: id }],
			width: 1,
			fixedWidth: false,
			...extra
		};
	}

	/** The hierarchical column, one shown column and one the model hides on load. */
	const defaultColumns = [column(hierarchicalColumnRef), column("size"), column("owner", { initiallyHidden: true })];

	/** The full map a model starts out in, with the given entries overridden. */
	function initialVisibility(
		columns: TreeModel.Column[],
		overrides: TreeEngineState.ColumnVisibility = {}
	): TreeEngineState.ColumnVisibility {
		return {
			...Object.fromEntries(columns.map((c) => [c.id, c.id === hierarchicalColumnRef || c.initiallyHidden !== true])),
			...overrides
		};
	}

	function setupTest(params?: { columns?: TreeModel.Column[]; columnVisibility?: TreeEngineState.ColumnVisibility }) {
		const onColumnVisibilityChanged = vi.fn();
		const columns = params?.columns ?? defaultColumns;
		const state = createEngineState
			.from({ ...defaultEngineState, columnVisibility: params?.columnVisibility })
			.withColumns(columns)
			.create();

		const wrapper = mount(
			<ColumnVisibilityButton />,
			{
				wrappingComponent: TreeEngineContextProvider,
				wrappingComponentProps: createContextProps(state, { eventHandlers: { onColumnVisibilityChanged } })
			},
			enLocale
		);

		return { wrapper, columns, onColumnVisibilityChanged };
	}

	/** Found by its accessible name, which flips between the two states. */
	function trigger(): HTMLButtonElement {
		return screen.getByLabelText<HTMLButtonElement>(/^(Open|Close) column visibility$/);
	}

	/** The panel renders nothing until the trigger opens it, as in the running engine. */
	function openPanel(wrapper: ReactWrapper) {
		React.act(() => {
			trigger().click();
		});
		wrapper.update();

		return wrapper.find(WidgetsColumnVisibilityPanel);
	}

	/** What the engine hands the widget: one entry per hideable column. */
	function panelItems(wrapper: ReactWrapper): ColumnVisibilityItem[] {
		return openPanel(wrapper).props().items;
	}

	function emitChange(wrapper: ReactWrapper, change?: { id: string; visible: boolean }) {
		const panel = openPanel(wrapper);
		React.act(() => {
			panel.props().onVisibilityChange?.({}, change);
		});
	}

	describe("trigger button", () => {
		it("renders with an accessible name and collapsed state", () => {
			setupTest();

			expect(screen.getByLabelText("Open column visibility")).toHaveAttribute("aria-expanded", "false");
			expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
		});

		it("renders nothing when the tree offers no hideable column", () => {
			setupTest({ columns: [column(hierarchicalColumnRef)] });

			expect(screen.queryByLabelText(/^(Open|Close) column visibility$/)).toBeNull();
		});

		it("reflects the open state after activation", () => {
			const { wrapper } = setupTest();

			openPanel(wrapper);

			expect(screen.getByLabelText("Close column visibility")).toHaveAttribute("aria-expanded", "true");
		});
	});

	describe("customized badge", () => {
		it("is hidden while the view matches the modelled default", () => {
			const { wrapper } = setupTest();

			expect(wrapper.find(Badge).props().hidden).equal(true);
		});

		it("shows once a column deviates", () => {
			const { wrapper } = setupTest({ columnVisibility: { size: false } });

			expect(wrapper.find(Badge).props().hidden).equal(false);
		});

		it("an override matching the modelled default is not a deviation", () => {
			const { wrapper } = setupTest({ columnVisibility: { size: true, owner: false } });

			expect(wrapper.find(Badge).props().hidden).equal(true);
		});
	});

	describe("panel", () => {
		it("stays closed until the trigger is used", () => {
			const { wrapper } = setupTest();

			expect(wrapper.find(WidgetsColumnVisibilityPanel)).to.have.length(0);
		});

		it("the hierarchical column is never offered", () => {
			const { wrapper, columns } = setupTest();

			const items = panelItems(wrapper);

			expect(items).to.have.length(columns.length - 1);
			expect(items.map((item) => item.id)).not.to.include(hierarchicalColumnRef);
		});

		it("each row carries the modelled default alongside its current visibility", () => {
			const { wrapper } = setupTest();

			const items = panelItems(wrapper);

			expect(items.map((item) => [item.id, item.visible, item.defaultVisible])).deep.equal([
				["size", true, true],
				["owner", false, false]
			]);
		});

		it("an override wins over the modelled default", () => {
			const { wrapper } = setupTest({ columnVisibility: { size: false, owner: true } });

			const items = panelItems(wrapper);

			expect(items.map((item) => [item.id, item.visible, item.defaultVisible])).deep.equal([
				["size", false, true],
				["owner", true, false]
			]);
		});
	});

	describe("toggling", () => {
		it("emits the complete resulting map, merging into what was there", () => {
			const { wrapper, onColumnVisibilityChanged, columns } = setupTest({
				columnVisibility: initialVisibility(defaultColumns)
			});

			emitChange(wrapper, { id: "size", visible: false });

			expect(onColumnVisibilityChanged).toHaveBeenCalledWith({
				columnVisibility: initialVisibility(columns, { size: false })
			});
		});

		it("showing a column the model hides on load stores it as visible", () => {
			const { wrapper, onColumnVisibilityChanged, columns } = setupTest({
				columnVisibility: initialVisibility(defaultColumns)
			});

			emitChange(wrapper, { id: "owner", visible: true });

			expect(onColumnVisibilityChanged).toHaveBeenCalledWith({
				columnVisibility: initialVisibility(columns, { owner: true })
			});
		});
	});

	describe("reset", () => {
		it("restores the modelled visibility rather than showing everything", () => {
			const { wrapper, onColumnVisibilityChanged, columns } = setupTest({
				columnVisibility: { size: false, owner: true }
			});

			emitChange(wrapper);

			expect(onColumnVisibilityChanged).toHaveBeenCalledWith({
				columnVisibility: initialVisibility(columns)
			});
		});

		it("the restored map keeps an entry for the hierarchical column", () => {
			const { wrapper, onColumnVisibilityChanged } = setupTest({ columnVisibility: { size: false } });

			emitChange(wrapper);

			const [{ columnVisibility }] = onColumnVisibilityChanged.mock.calls[0] as [
				{ columnVisibility: TreeEngineState.ColumnVisibility }
			];
			expect(columnVisibility[hierarchicalColumnRef]).equal(true);
		});
	});

	describe("row labelling", () => {
		const labelCases = [
			column("both", { label: [{ locale: "en", text: "Both" }], icon: { name: "star" } }),
			column("textOnly", { label: [{ locale: "en", text: "Text only" }] }),
			column("iconOnly", { label: [], icon: { name: "star" } }),
			column("neither", { label: [] })
		];

		function labelCaseItems() {
			const { wrapper } = setupTest({ columns: [column(hierarchicalColumnRef), ...labelCases] });

			return panelItems(wrapper);
		}

		it("passes the label text and the icon when both are modelled", () => {
			const [item] = labelCaseItems();

			expect(item.label).equal("Both");
			expect(item.icon).not.equal(undefined);
		});

		it("passes only the label text when no icon is modelled", () => {
			const item = labelCaseItems()[1];

			expect(item.label).equal("Text only");
			expect(item.icon).equal(undefined);
		});

		it("still passes the icon when the column has an icon but no label", () => {
			const item = labelCaseItems()[2];

			expect(item.label).equal(undefined);
			expect(item.icon).not.equal(undefined);
		});

		it("passes neither when neither is modelled, so the row stays toggleable", () => {
			const item = labelCaseItems()[3];

			// A column without label and icon is a modelling mistake, reported at modelling time.
			expect(item.label).equal(undefined);
			expect(item.icon).equal(undefined);
			expect(item.id).equal("neither");
		});
	});
});
