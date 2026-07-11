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

import { vi } from "vitest";

import {
	DefaultTableComponentRenderers,
	TableContextProvider,
	TableTemplate
} from "@com.mgmtp.a12.widgets/widgets-core";

import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps
} from "../../../../../setup/basic.spec.js";
import {
	BodyRow,
	type DndBodyRow,
	type FlattenNodeRow,
	TreeEngineContextProvider,
	TreeEngineRowContextProvider
} from "../../../../../../core/view/index.js";
import { mockType, type Stub } from "../../../../../utils/mock-utils.js";
import {
	type Identifier,
	type RowState,
	RowStateSelector,
	type TreeEngineState
} from "../../../../../../core/store/index.js";
import { testIsNullComponent } from "../../../../../utils/test-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.body-row", () => {
	const basicEngineState = defaultEngineState;
	const teamNodeModel = basicEngineState.models.uiModel.content.nodes[0];
	const basicNodeIdentifier = {
		id: "DomainTeam/2",
		type: "DomainTeam"
	};

	const basicProps: BodyRow.Props = {
		row: mockType<FlattenNodeRow>({
			data: {
				nodeIdentifier: basicNodeIdentifier,
				nodePath: [basicNodeIdentifier]
			},
			nodeModel: teamNodeModel
		}),
		rowIndex: 0
	};

	function setupTest(
		customProps?: Partial<BodyRow.Props>,
		customEngineState?: TreeEngineState,
		customContextProp?: Partial<PartialEventHandlerContextProps>
	) {
		const props: BodyRow.Props = { ...basicProps, ...customProps };
		const contextProps: Partial<PartialEventHandlerContextProps> = { dndConfiguration: false, ...customContextProp };
		return mount(
			<TreeEngineContextProvider {...createContextProps(customEngineState ?? basicEngineState, contextProps)}>
				<TableContextProvider value={{ columns: [], componentRenderers: DefaultTableComponentRenderers }}>
					<BodyRow {...props} />
				</TableContextProvider>
			</TreeEngineContextProvider>
		);
	}

	describe("when not found the node model", () => {
		beforeEach(() => {
			vi.spyOn(console, "error").mockImplementation(() => {});
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should throw an error", () => {
			const nodeIdentifier: Identifier = { type: "DomainDummy", id: "DomainDummy/1" };
			const result = setupTest({
				...basicProps,
				row: {
					...basicProps.row,
					data: { nodeIdentifier, nodePath: [nodeIdentifier] }
				}
			});

			testIsNullComponent(result);
		});
	});

	describe("TreeEngineRowContextProvider value", () => {
		describe("rowState", () => {
			let rowStateSelectorStub: Stub<typeof RowStateSelector.rowState>;
			const rowState = mockType<RowState>();

			beforeAll(() => {
				rowStateSelectorStub = vi.spyOn(RowStateSelector, "rowState").mockReturnValue(() => rowState);
			});
			afterAll(() => {
				vi.restoreAllMocks();
			});
			it("should be the return value of rowState selector", () => {
				const contextValue = setupTest().find(TreeEngineRowContextProvider).props().value;

				expect(rowStateSelectorStub).toHaveBeenCalledWith(basicProps.row.data);
				expect(contextValue.rowState).toBe(rowState);
			});
		});
	});

	describe("Disabled", () => {
		it("should render a disabled BodyRow", () => {
			const customEngineState = { ...defaultEngineState, disabled: true };
			const customProps: DndBodyRow.Props = {
				...basicProps,
				row: { ...basicProps.row, predecessor: [{ type: "DomainTeam", id: "DomainTeam/1" }] }
			};
			const result = setupTest(customProps, customEngineState);
			expect(result.find(TableTemplate.BodyRow).props().disabled).toBe(true);
		});
	});
});
