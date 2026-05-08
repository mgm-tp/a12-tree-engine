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
import { vi } from "vitest";

import { DefaultTreeTableComponentRenderers } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/main/tree-table.view.js";
import {
	DefaultTableComponentRenderers,
	TableContextProvider
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/table.view.js";

import { DocumentUtils } from "../../../../../../core/models/internal/utils/document-utils.js";
import { DataSelector, type TreeEngineState, UIStateSelector } from "../../../../../../core/store/index.js";
import {
	type BodyRow,
	DefaultWidgetMap,
	type FlattenNodeRow,
	RootNodeRow,
	TreeEngineContextProvider
} from "../../../../../../core/view/index.js";
import {
	PaginatedBodyRow,
	PaginationButtons,
	RootPaginationButtons
} from "../../../../../../core/view/internal/components/tree-engine/sub-components/body-row/paginated-body-row.js";
import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps
} from "../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../utils/mock-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.paginated-body-row", () => {
	let nodeStateStub: ReturnType<typeof vi.spyOn>;

	const basicEngineState = defaultEngineState;
	const teamNodeModel = basicEngineState.models.uiModel.content.nodes[0];

	function setupTest(
		rowsProps: BodyRow.Props,
		customEngineState?: TreeEngineState,
		customContextProp?: Partial<PartialEventHandlerContextProps>
	) {
		const contextProps: Partial<PartialEventHandlerContextProps> = { dndConfiguration: false, ...customContextProp };

		return mount(
			<TreeEngineContextProvider {...createContextProps(customEngineState ?? basicEngineState, contextProps)}>
				<TableContextProvider value={{ columns: [], componentRenderers: DefaultTableComponentRenderers }}>
					{/** @ts-expect-error typing issue*/}
					<PaginatedBodyRow {...rowsProps} />
				</TableContextProvider>
			</TreeEngineContextProvider>
		);
	}

	const rootNodeIdentifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};
	const rootRow = mockType<FlattenNodeRow>({
		data: { nodeIdentifier: rootNodeIdentifier, nodePath: [rootNodeIdentifier] },
		nodeModel: teamNodeModel,
		fullPageSize: 4,
		childrenCount: 2,
		children: [],
		parent: RootNodeRow.create()
	});

	const child1NodeIdentifier = {
		id: "DomainTeam/2",
		type: "DomainTeam"
	};
	const child1Row = mockType<FlattenNodeRow>({
		data: { nodeIdentifier: child1NodeIdentifier, nodePath: [child1NodeIdentifier] },
		nodeModel: teamNodeModel,
		lastIndex: false,
		rowIndex: 0,
		predecessor: [child1NodeIdentifier],
		parent: rootRow
	});
	const child2NodeIdentifier = {
		id: "DomainTeam/3",
		type: "DomainTeam"
	};
	const child2Row = mockType<FlattenNodeRow>({
		data: { nodeIdentifier: child2NodeIdentifier, nodePath: [child2NodeIdentifier] },
		nodeModel: teamNodeModel,
		lastIndex: true,
		rowIndex: 1,
		predecessor: [child1NodeIdentifier],
		parent: rootRow
	});

	describe("PaginationButtons", () => {
		beforeEach(() => {
			vi.spyOn(DefaultTreeTableComponentRenderers, "bodyRowRenderer").mockReturnValue(
				<PaginationButtons row={mockType()} rowIndex={1} column={mockType()} />
			);
			vi.spyOn(DataSelector, "node").mockReturnValue(() => mockType<TreeEngineState.Node>({}));
			vi.spyOn(DocumentUtils, "getValue").mockReturnValue("");
			nodeStateStub = vi
				.spyOn(UIStateSelector, "nodeState")
				.mockReturnValue(() => mockType<UIStateSelector.NodeState>({ busy: false }));
		});

		afterEach(() => vi.restoreAllMocks());

		it.skip("should render a PaginationButtons if row is the last one", () => {
			const result = setupTest({ row: child2Row, rowIndex: child2Row.rowIndex ?? 0 });
			expect(result.find(PaginationButtons)).toHaveLength(1);
		});

		it.skip("should not render a PaginationButtons if row is not the last one", () => {
			const result = setupTest({ row: child1Row, rowIndex: child1Row.rowIndex ?? 0 });
			expect(result.find(PaginationButtons)).toHaveLength(0);
		});

		it.skip("should recursively render PaginationButtons", () => {
			const childOfChild2NodeIdentifier = {
				id: "DomainTeam/4",
				type: "DomainTeam"
			};
			const childOfChild2Row = mockType<FlattenNodeRow>({
				data: { nodeIdentifier: childOfChild2NodeIdentifier, nodePath: [childOfChild2NodeIdentifier] },
				nodeModel: teamNodeModel,
				lastIndex: true,
				rowIndex: 0,
				predecessor: [child1NodeIdentifier],
				parent: mockType<FlattenNodeRow>({ ...child2Row, fullPageSize: 5, childrenCount: 1 })
			});
			const result = setupTest({ row: childOfChild2Row, rowIndex: childOfChild2Row.rowIndex ?? 0 });
			expect(result.find(PaginationButtons)).toHaveLength(2);
		});

		describe("busy", () => {
			beforeEach(() => {
				nodeStateStub.mockRestore();
				nodeStateStub = vi
					.spyOn(UIStateSelector, "nodeState")
					.mockReturnValue(() => mockType<UIStateSelector.NodeState>({ busy: true }));
			});

			afterEach(() => vi.restoreAllMocks());

			it("should render disabled links when its row is busy", () => {
				const result = setupTest({ row: child2Row, rowIndex: child2Row.rowIndex ?? 0 });
				const links = result.find(DefaultWidgetMap.Link);
				expect(links.first().prop("linkAttributes")).toHaveProperty("aria-disabled", true);
				expect(links.last().prop("linkAttributes")).toHaveProperty("aria-disabled", true);
			});
		});
	});

	describe("RootPaginationButtons", () => {
		beforeEach(() => {
			vi.spyOn(DefaultTreeTableComponentRenderers, "bodyRowRenderer").mockReturnValue(
				<RootPaginationButtons row={mockType()} />
			);
			nodeStateStub = vi
				.spyOn(UIStateSelector, "nodeState")
				.mockReturnValue(() => mockType<UIStateSelector.NodeState>({ busy: false }));
		});

		afterEach(() => vi.restoreAllMocks());

		const updatedRootRow = mockType<FlattenNodeRow>({
			...rootRow,
			lastIndex: true,
			rowIndex: 0,
			parent: { ...RootNodeRow.create(), childrenCount: 1, fullPageSize: 3 }
		});

		it("should render a RootPaginationButtons if row is the last one", () => {
			const result = setupTest({ row: updatedRootRow, rowIndex: updatedRootRow.rowIndex ?? 0 });
			expect(result.find(RootPaginationButtons)).toHaveLength(1);
		});

		describe("busy", () => {
			beforeEach(() => {
				nodeStateStub.mockRestore();
				nodeStateStub = vi
					.spyOn(UIStateSelector, "nodeState")
					.mockReturnValue(() => mockType<UIStateSelector.NodeState>({ busy: true }));
			});

			afterEach(() => vi.restoreAllMocks());

			it("should render disabled links when its row is busy", () => {
				const result = setupTest({ row: updatedRootRow, rowIndex: updatedRootRow.rowIndex ?? 0 });
				const links = result.find(RootPaginationButtons).find(DefaultWidgetMap.Link);
				expect(links.first().prop("linkAttributes")).toHaveProperty("aria-disabled", true);
				expect(links.last().prop("linkAttributes")).toHaveProperty("aria-disabled", true);
			});
		});
	});
});
