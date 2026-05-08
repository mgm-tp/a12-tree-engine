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

import {
	DataSelector,
	ModelSelector,
	type TreeEngineState,
	type UIStateSelector
} from "../../../../../../../core/store/index.js";
import {
	type BodyCell,
	BodyCellUIValue,
	DefaultComponentMap,
	DocumentBodyCell,
	type TreeEngineContextProvider,
	type TreeEngineRowContext
} from "../../../../../../../core/view/index.js";
import { mockType } from "../../../../../../utils/mock-utils.js";
import { testIsNullComponent } from "../../../../../../utils/test-utils.js";
import { DocumentUtils } from "../../../../../../../core/models/internal/shared.js";

import { teamCellProps, BodyCellWrapper, CustomWidget, teamNodeModel, teamIdentifier } from "./shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.body-cell.document-body-cell", () => {
	const basicComponentMap = DefaultComponentMap;

	const basicRowContext: TreeEngineRowContext.Type = {
		rowState: { nodeModel: teamNodeModel, uiState: mockType<UIStateSelector.NodeState>() },
		isCircular: false,
		shouldRenderPaginatedBodyRow: false
	};

	function setupTest(
		props: BodyCell.Props,
		customEngineState?: Partial<TreeEngineState>,
		customEngineContextProps?: Partial<TreeEngineContextProvider.Props>
	) {
		const bodyCellWrapperProps: BodyCellWrapper.Props = {
			customEngineState,
			customEngineContextProps,
			rowContextProps: basicRowContext
		};
		return mount(
			<BodyCellWrapper {...bodyCellWrapperProps}>
				<DocumentBodyCell {...props} />
			</BodyCellWrapper>
		);
	}
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(DataSelector, "node").mockReturnValue(() => {
			return {
				document: { TeamDetails: { Location: "Munich", TeamName: "A12" }, id: "DomainTeam/1" },
				identifier: teamIdentifier,
				children: []
			};
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("when not found documentModel", () => {
		beforeAll(() => {
			vi.spyOn(ModelSelector, "documentModelByName").mockReturnValue(() => undefined);
		});

		it("should render nothing", () => {
			const result = setupTest(teamCellProps);

			testIsNullComponent(result);
		});
	});

	describe("when not found columnRef in nodeModel.columns", () => {
		it("should render nothing", () => {
			const result = setupTest({
				...teamCellProps,
				columnRef: "1024"
			});

			testIsNullComponent(result);
		});
	});

	describe("when node.document is not JSON format", () => {
		beforeAll(() => {
			vi.spyOn(DocumentUtils, "isGroupInstance").mockReturnValue(false);
		});

		it("should render nothing", () => {
			const result = setupTest(teamCellProps);

			testIsNullComponent(result);
		});
	});

	describe("when given custom BodyCellUIValue component", () => {
		it("should use the component", () => {
			const result = setupTest(teamCellProps, undefined, {
				componentMap: {
					...basicComponentMap,
					BodyCellUIValue: () => <CustomWidget />
				}
			});
			const bodyCell = result.find(CustomWidget);

			expect(bodyCell).toHaveLength(1);
		});
	});

	describe("when no given custom BodyCellUIValue component", () => {
		it("should use the default component", () => {
			const result = setupTest(teamCellProps);
			const bodyCell = result.find(BodyCellUIValue);

			expect(bodyCell).toHaveLength(1);
			expect(bodyCell.props().value).toBe("Munich");
			expect(bodyCell.props().documentModelName).toBe("DomainTeam");
			expect(bodyCell.props().documentModelPath).toEqual([{ elementName: "TeamDetails" }, { elementName: "Location" }]);
			expect(bodyCell.props().documentId).toBe("DomainTeam/1");
		});
	});
});
