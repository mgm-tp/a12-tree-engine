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

import { type Mock, vi } from "vitest";

import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";

import {
	Events,
	type Identifier,
	ModelSelector,
	type TreeEngineState,
	UIStateSelector
} from "../../../../core/store/index.js";
import { onDndHoverMiddleware } from "../../../../core/store/internal/middleware/events/onDndHover.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";
import { setupMiddleware } from "../../../utils/store-utils.js";

import { nonMatchedAction, shouldCallNextMiddlewareAndReturnResultedAction } from "./shared.js";

describe("@com.mgmtp.a12.tree-engine.core.store.middleware.events.onDndHover", () => {
	const basicEngineState = defaultEngineState;
	const basicNodeState: UIStateSelector.NodeState = {
		expanded: false,
		selected: true,
		busy: true,
		matchedCount: null
	};

	const basicDraggingRow = mockType<Events.DndHoverPayload["draggingRow"]>();
	const basicNodeIdentifier: Identifier = { id: "DomainTeam/20", type: "DomainTeam" };
	const basicNodePath: TreeEngineState.NodePath = [
		{ id: "DomainTeam/1", type: "DomainTeam" },
		{ id: "TeamTeam/20", type: "TeamTeam" }
	];
	const basicPosition = TreeTableNodeDropPosition.TOP;
	const hoverTeamAction = Events.onDndHover({
		draggingRow: basicDraggingRow,
		hoveredRow: { nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath, position: basicPosition },
		canDrop: true
	});

	function setupTest(initialState = basicEngineState) {
		return setupMiddleware(onDndHoverMiddleware, initialState);
	}

	describe("given a matched action", () => {
		let nodeStateSelectorStub: Mock<typeof UIStateSelector.nodeState>;

		beforeEach(() => {
			nodeStateSelectorStub = vi.spyOn(UIStateSelector, "nodeState");
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		describe("given the node is not expanded", () => {
			beforeEach(() => {
				nodeStateSelectorStub.mockReturnValue(() => ({
					...basicNodeState,
					expanded: false
				}));
			});

			it("it should dispatch an expanding action", () => {
				const { store, invoke } = setupTest();
				invoke(hoverTeamAction);

				expect(store.dispatch).toHaveBeenCalledOnce();
				expect(store.dispatch).toHaveBeenCalledWith(
					Events.onNodeExpansionChanged({
						nodeIdentifier: basicNodeIdentifier,
						nodePath: basicNodePath
					})
				);
			});

			describe("given hovered node not containing any child relationship configuration", () => {
				beforeAll(() => {
					vi.spyOn(ModelSelector, "nodeModel").mockReturnValue(() => basicEngineState.models.uiModel.content.nodes[1]);
				});

				const nodeIdentifier: Identifier = { type: "DomainPerson", id: "DomainPerson/1" };
				const nodePath: TreeEngineState.NodePath = [
					{ id: "DomainTeam/1", type: "DomainTeam" },
					{ id: "TeamPerson/21", type: "TeamPerson" }
				];

				it("should not dispatch an expanding action", () => {
					const { store, invoke } = setupTest();

					const hoverPersonAction = Events.onDndHover({
						draggingRow: basicDraggingRow,
						hoveredRow: { nodeIdentifier, nodePath, position: basicPosition },
						canDrop: true
					});
					invoke(hoverPersonAction);

					expect(store.dispatch).not.toHaveBeenCalled();
				});
			});

			shouldCallNextMiddlewareAndReturnResultedAction(setupTest, hoverTeamAction);
		});

		describe("given the node is expanded", () => {
			beforeEach(() => {
				nodeStateSelectorStub.mockReturnValue(() => ({
					...basicNodeState,
					expanded: true
				}));
			});

			it("it should not dispatch anything", () => {
				const { store, invoke } = setupTest();
				invoke(hoverTeamAction);
				expect(store.dispatch).not.toHaveBeenCalled();
			});

			shouldCallNextMiddlewareAndReturnResultedAction(setupTest, hoverTeamAction);
		});
	});

	describe("given a non-matched action", () => {
		shouldCallNextMiddlewareAndReturnResultedAction(setupTest, nonMatchedAction);
	});
});
