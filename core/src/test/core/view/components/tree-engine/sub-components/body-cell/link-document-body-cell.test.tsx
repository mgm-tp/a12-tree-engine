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

import type { RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";

import {
	DataSelector,
	ModelSelector,
	type RowState,
	type TreeEngineState,
	type UIStateSelector
} from "../../../../../../../core/store/index.js";
import {
	type BodyCell,
	BodyCellUIValue,
	LinkDocumentBodyCell,
	type TreeEngineContextProvider,
	DefaultComponentMap,
	type TreeEngineRowContext
} from "../../../../../../../core/view/index.js";
import { defaultEngineState } from "../../../../../../setup/basic.spec.js";
import { createEngineState } from "../../../../../../utils/model-utils.js";
import { mockType } from "../../../../../../utils/mock-utils.js";
import { testIsNullComponent } from "../../../../../../utils/test-utils.js";

import {
	personCellProps,
	BodyCellWrapper,
	CustomWidget,
	teamIdentifier,
	teamNodeModel,
	basicLink,
	basicParentLink
} from "./shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.body-cell.link-document-body-cell", () => {
	const basicEngineState = defaultEngineState;
	const basicComponentMap = DefaultComponentMap;

	const basicRowContext: TreeEngineRowContext.Type = {
		rowState: {
			node: {
				document: {
					TeamDetails: {
						Location: "Munich",
						TeamName: "A12"
					},
					id: "DomainTeam/1"
				},
				identifier: teamIdentifier,
				children: []
			},
			nodeModel: teamNodeModel,
			uiState: mockType<UIStateSelector.NodeState>()
		},
		parentRowState: mockType<RowState>({ link: basicParentLink }),
		isCircular: false,
		shouldRenderPaginatedBodyRow: false
	};

	function setupTest(
		props: BodyCell.Props,
		customEngineState?: Partial<TreeEngineState>,
		customEngineContextProps?: Partial<TreeEngineContextProvider.Props>,
		customRowContextProps?: Partial<TreeEngineRowContext.Type>
	) {
		const bodyCellWrapperProps: BodyCellWrapper.Props = {
			customEngineState,
			customEngineContextProps,
			rowContextProps: {
				...basicRowContext,
				rowState: { ...basicRowContext.rowState, link: basicLink },
				...customRowContextProps
			}
		};

		return mount(
			<BodyCellWrapper {...bodyCellWrapperProps}>
				<LinkDocumentBodyCell {...props} />
			</BodyCellWrapper>
		);
	}

	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(DataSelector, "link").mockReturnValue(() => basicLink);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("given no parent", () => {
		it("should render nothing", () => {
			const result = setupTest(personCellProps);

			testIsNullComponent(result);
		});
	});

	describe("given no props.row.data.link", () => {
		it("should render nothing", () => {
			const result = setupTest(personCellProps);

			testIsNullComponent(result);
		});
	});

	describe("when not found relationship model from linkDescriptor", () => {
		beforeAll(() => {
			vi.spyOn(ModelSelector, "relationshipModelByName").mockReturnValue(() => undefined);
		});

		it("should render nothing", () => {
			const result = setupTest(personCellProps);

			testIsNullComponent(result);
		});
	});

	describe("when not found linkDocument in props.row.data.link", () => {
		it("should render nothing", () => {
			const result = setupTest(personCellProps);

			testIsNullComponent(result);
		});
	});

	describe("when props.row.data.link.linkDocument is not a GroupInstance instance", () => {
		it("should render nothing", () => {
			const result = setupTest(personCellProps);

			testIsNullComponent(result);
		});
	});

	describe("when not found relationshipModel.linkDocumentModel = null", () => {
		it("should render nothing", () => {
			const [teamPersonModel, teamTeamModel] = basicEngineState.models.modelGraph.relationshipModels;
			const noLinkDocumentTeamPersonModel: RelationshipModel = {
				...teamPersonModel,
				content: {
					...teamPersonModel.content,
					linkDocumentModel: null
				}
			};

			const result = setupTest(
				personCellProps,
				createEngineState
					.from(basicEngineState)
					.withRelationshipModels([noLinkDocumentTeamPersonModel, teamTeamModel])
					.create()
			);

			testIsNullComponent(result);
		});
	});

	describe("when given custom BodyCellUIValue component", () => {
		it("should use the component", () => {
			const result = setupTest(
				{
					...personCellProps,
					row: {
						...personCellProps.row,
						data: { nodeIdentifier: teamIdentifier, nodePath: [teamIdentifier] },
						parent: { ...personCellProps.row.parent, nodeModel: teamNodeModel }
					}
				},
				undefined,
				{ componentMap: { ...basicComponentMap, BodyCellUIValue: () => <CustomWidget /> } }
			);
			const bodyCell = result.find(CustomWidget);

			expect(bodyCell).toHaveLength(1);
		});
	});

	describe("when no given custom BodyCellUIValue component", () => {
		it("should use the default component", () => {
			const result = setupTest({
				...personCellProps,
				row: {
					...personCellProps.row,
					data: { nodeIdentifier: teamIdentifier, nodePath: [teamIdentifier] },
					parent: { ...personCellProps.row.parent, nodeModel: teamNodeModel }
				}
			});
			const bodyCell = result.find(BodyCellUIValue);

			expect(bodyCell).toHaveLength(1);
			expect(bodyCell.props().value).toBe("Watcher");
			expect(bodyCell.props().documentModelName).toBe("DomainTeamPerson_AdditionalFieldsModel");
			expect(bodyCell.props().documentModelPath).toEqual([{ elementName: "grp1" }, { elementName: "Position" }]);
		});
	});
});
