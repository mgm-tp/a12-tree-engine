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

import { TreeTableNodeDropPosition } from "@com.mgmtp.a12.widgets/widgets-core";

import { TreeModel } from "../../../../core/models/index.js";
import { Events, type Identifier, type TreeEngineState } from "../../../../core/store/index.js";
import { defaultMapDispatchToEventHandlers, type FlattenNodeRow } from "../../../../core/view/index.js";
import { defaultEngineState } from "../../../setup/basic.spec.js";
import { mockType } from "../../../utils/mock-utils.js";

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.event-handlers-dispatch-map", () => {
	const teamNodeModel = defaultEngineState.models.uiModel.content.nodes[0];

	const basicNodeIdentifier: Identifier = {
		id: "DomainTeam/1",
		type: "DomainTeam"
	};
	const basicNodePath: TreeEngineState.NodePath = [basicNodeIdentifier];

	const basicNodeRow: FlattenNodeRow = {
		data: {
			nodeIdentifier: basicNodeIdentifier,
			nodePath: basicNodePath
		},
		nodeModel: teamNodeModel,
		level: 1,
		id: "1024",
		childrenCount: 0,
		rowIndex: 0
	};

	const droppedNodeRow: FlattenNodeRow = {
		data: {
			nodeIdentifier: { type: "DomainTeam", id: "DomainTeam/4" },
			nodePath: [{ type: "DomainTeam", id: "DomainTeam/4" }]
		},
		nodeModel: teamNodeModel,
		level: 1,
		id: "2048",
		childrenCount: 0,
		rowIndex: 0
	};

	const basicConfirmation: TreeModel.ConfirmationText = {
		message: [
			{
				locale: "en",
				text: "This button will do nothing beside testing purpose. Do you really wish to proceed?"
			},
			{
				locale: "de",
				text: "Diese Schaltfläche bewirkt nichts anderes als Testzwecke. Möchten Sie wirklich fortfahren?"
			}
		]
	};

	const basicButton: TreeModel.ButtonType = {
		icon: {
			name: "autorenew"
		},
		confirmation: basicConfirmation,
		id: "button-ec3fb",
		event: "event_renew",
		primary: false
	};

	const basicNodeEventActionButton: TreeModel.TreeNodeEventActionButton = {
		type: "event",
		event: "edit"
	};

	const dispatch = vi.fn();

	function setupTest() {
		return defaultMapDispatchToEventHandlers(dispatch);
	}

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("onNodeExpansionChanged", () => {
		describe("when node is not expanded", () => {
			it("should dispatch with expanded arg = true", () => {
				setupTest().onNodeExpansionChanged(basicNodeRow.data);

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onNodeExpansionChanged({
						nodeIdentifier: basicNodeIdentifier,
						nodePath: basicNodePath
					})
				);
			});
		});

		describe("when node is expanded", () => {
			it("should dispatch with expanded arg = false", () => {
				setupTest().onNodeExpansionChanged(basicNodeRow.data);

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onNodeExpansionChanged({
						nodeIdentifier: basicNodeIdentifier,
						nodePath: basicNodePath
					})
				);
			});
		});
	});

	describe("onEventButtonClicked", () => {
		describe("when button has a confirmation", () => {
			it("should dispatch onEventButtonClickedRequest", () => {
				setupTest().onEventButtonClicked({ button: basicButton });

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onEventButtonClickedRequest({ confirmation: basicConfirmation, button: basicButton })
				);
			});
		});

		describe("when button has no confirmation", () => {
			it("should dispatch onEventButtonClicked", () => {
				const button = {
					...basicButton,
					confirmation: undefined
				};

				setupTest().onEventButtonClicked({
					button
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(Events.onEventButtonClicked({ button }));
			});
		});
	});

	describe("onNodeEventButtonClicked", () => {
		describe("when button has a confirmation", () => {
			it("should dispatch onNodeEventButtonClickedRequest", () => {
				const button = {
					...basicNodeEventActionButton,
					confirmation: basicConfirmation
				};

				setupTest().onNodeEventButtonClicked({ ...basicNodeRow.data, button });

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onNodeEventButtonClickedRequest({
						nodeIdentifier: basicNodeRow.data.nodeIdentifier,
						confirmation: basicConfirmation,
						nodePath: basicNodePath,
						button
					})
				);
			});
		});

		describe("when button has no confirmation", () => {
			it("should dispatch onNodeEventButtonClicked", () => {
				const button = {
					...basicNodeEventActionButton,
					confirmation: undefined
				};

				setupTest().onNodeEventButtonClicked({ ...basicNodeRow.data, button });

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onNodeEventButtonClicked({
						nodeIdentifier: basicNodeRow.data.nodeIdentifier,
						nodePath: basicNodePath,
						button
					})
				);
			});
		});
	});

	describe("onInsertChildNodeButtonClicked", () => {
		it("should dispatch onInsertChildNodeRequest.started", () => {
			const button: TreeModel.TreeNodeInsertActionButton = {
				type: "insert",
				position: TreeModel.InsertPosition.AS_CHILD
			};
			setupTest().onInsertChildNodeButtonClicked({ ...basicNodeRow.data, button });

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(
				Events.onInsertChildNodeRequest.started({
					insertPosition: {
						target: { nodeIdentifier: basicNodeRow.data.nodeIdentifier, nodePath: basicNodePath },
						position: TreeModel.InsertPosition.AS_CHILD
					},
					button,
					documentModelId: undefined
				})
			);
		});
	});

	describe("onDialogClosed", () => {
		it("should dispatch onDialogClosed", () => {
			setupTest().onDialogClosed();

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(Events.onDialogClosed({}));
		});
	});

	describe("onDialogConfirmed", () => {
		it("should dispatch onDialogConfirmed", () => {
			const payload = mockType<Events.DialogConfirmedPayload>();
			setupTest().onDialogConfirmed({ payload });

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(Events.onDialogConfirmed(payload));
		});
	});

	describe("onNodeSelectionChanged", () => {
		it("should dispatch onNodeSelectionChanged", () => {
			setupTest().onNodeSelectionChanged({ ...basicNodeRow.data });

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(
				Events.onNodeSelectionChanged({
					nodeIdentifier: basicNodeIdentifier,
					nodePath: [basicNodeIdentifier],
					selected: true
				})
			);
		});
	});

	describe("onColumnWidthsChanged", () => {
		it("should dispatch onColumnWidthsChanged", () => {
			const changedColumnWidths: TreeEngineState.ColumnWidths = { abc: 1.3 };
			setupTest().onColumnWidthsChanged({ changedColumnWidths });

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(Events.onColumnWidthsChanged({ changedColumnWidths }));
		});
	});

	describe("onDndStart", () => {
		it("should dispatch onDndStarted", () => {
			setupTest().onDndStarted({ draggingNodeRow: basicNodeRow });

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(
				Events.onDndStarted({
					nodePath: basicNodePath,
					nodeIdentifier: basicNodeIdentifier
				})
			);
		});
	});

	describe("onDndDone", () => {
		describe("when droppedNodeRow is undefined", () => {
			it("should dispatch onDndDone", () => {
				setupTest().onDndDone({
					draggedNodeRow: basicNodeRow,
					droppedNodeRow: undefined,
					position: TreeTableNodeDropPosition.AS_CHILD
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onDndDone({
						draggedRow: { nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath },
						droppedRow: undefined
					})
				);
			});
		});

		describe("when position is undefined", () => {
			it("should dispatch onDndDone", () => {
				setupTest().onDndDone({
					draggedNodeRow: basicNodeRow,
					droppedNodeRow,
					position: undefined
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onDndDone({
						draggedRow: { nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath },
						droppedRow: undefined
					})
				);
			});
		});

		describe("when droppedNodeRow and position are both defined", () => {
			it("should dispatch onDndDone", () => {
				setupTest().onDndDone({
					draggedNodeRow: basicNodeRow,
					droppedNodeRow,
					position: TreeTableNodeDropPosition.AS_CHILD
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onDndDone({
						draggedRow: { nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath },
						droppedRow: {
							nodeIdentifier: { type: "DomainTeam", id: "DomainTeam/4" },
							nodePath: [{ type: "DomainTeam", id: "DomainTeam/4" }],
							position: TreeTableNodeDropPosition.AS_CHILD
						}
					})
				);
			});
		});
	});

	describe("onDndHover", () => {
		const testCases: [boolean, TreeTableNodeDropPosition][] = [
			[true, TreeTableNodeDropPosition.AS_CHILD],
			[true, TreeTableNodeDropPosition.TOP],
			[false, TreeTableNodeDropPosition.AS_CHILD],
			[false, TreeTableNodeDropPosition.BOTTOM]
		];
		testCases.forEach(([canDrop, position]) => {
			describe(`when canDrop = ${canDrop}, position = ${position}`, () => {
				it("should dispatch onDndHover", () => {
					setupTest().onDndHover({
						hoveredNodeRow: droppedNodeRow,
						draggingNodeRow: basicNodeRow,
						canDrop,
						position
					});

					expect(dispatch).toHaveBeenCalledOnce();
					expect(dispatch).toHaveBeenCalledWith(
						Events.onDndHover({
							draggingRow: { nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath },
							hoveredRow: {
								nodeIdentifier: { type: "DomainTeam", id: "DomainTeam/4" },
								nodePath: [{ type: "DomainTeam", id: "DomainTeam/4" }],
								position
							},
							canDrop
						})
					);
				});
			});
		});
	});

	describe("onRowClicked", () => {
		describe("when rowActivation is event with non-built-in event name", () => {
			it("should dispatch onRowClicked with the event name", () => {
				setupTest().onRowClicked({
					...basicNodeRow.data,
					nodeModel: {
						...basicNodeRow.nodeModel,
						rowActivation: { type: "event", event: "test" }
					}
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onRowClicked({
						nodeIdentifier: basicNodeIdentifier,
						nodePath: basicNodePath,
						event: "test"
					})
				);
			});
		});

		describe("when rowActivation is event", () => {
			it("should dispatch onNodeEventButtonClicked with the event name", () => {
				setupTest().onRowClicked({
					...basicNodeRow.data,
					nodeModel: {
						...basicNodeRow.nodeModel,
						rowActivation: { type: "event", event: "event_open_node" }
					}
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onNodeEventButtonClicked({
						nodeIdentifier: basicNodeIdentifier,
						nodePath: basicNodePath,
						button: { type: "event", event: "event_open_node" }
					})
				);
			});
		});

		describe("when rowActivation is insert with position above", () => {
			it("should dispatch onInsertSiblingNodeRequest", () => {
				setupTest().onRowClicked({
					...basicNodeRow.data,
					nodeModel: {
						...basicNodeRow.nodeModel,
						rowActivation: {
							type: "insert",
							position: TreeModel.InsertPosition.ABOVE,
							documentModelRef: "DM"
						}
					}
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onInsertSiblingNodeRequest.started({
						documentModelId: "DM",
						button: {
							type: "insert",
							position: TreeModel.InsertPosition.ABOVE,
							documentModelRef: "DM"
						},
						insertPosition: {
							target: { nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath },
							position: TreeModel.InsertPosition.ABOVE
						}
					})
				);
			});
		});

		describe("when rowActivation is insert with position as_child", () => {
			it("should dispatch onInsertChildNodeRequest", () => {
				setupTest().onRowClicked({
					...basicNodeRow.data,
					nodeModel: {
						...basicNodeRow.nodeModel,
						rowActivation: {
							type: "insert",
							position: TreeModel.InsertPosition.AS_CHILD,
							documentModelRef: "DM"
						}
					}
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onInsertChildNodeRequest.started({
						documentModelId: "DM",
						button: {
							type: "insert",
							position: TreeModel.InsertPosition.AS_CHILD,
							documentModelRef: "DM"
						},
						insertPosition: {
							target: { nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath },
							position: TreeModel.InsertPosition.AS_CHILD
						}
					})
				);
			});
		});

		describe("when rowActivation is insert with position below", () => {
			it("should dispatch onInsertSiblingNodeRequest", () => {
				setupTest().onRowClicked({
					...basicNodeRow.data,
					nodeModel: {
						...basicNodeRow.nodeModel,
						rowActivation: {
							type: "insert",
							position: TreeModel.InsertPosition.BELOW,
							documentModelRef: "DM"
						}
					}
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onInsertSiblingNodeRequest.started({
						documentModelId: "DM",
						button: {
							type: "insert",
							position: TreeModel.InsertPosition.BELOW,
							documentModelRef: "DM"
						},
						insertPosition: {
							target: { nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath },
							position: TreeModel.InsertPosition.BELOW
						}
					})
				);
			});
		});

		describe("when rowActivation is non_interactive", () => {
			it("should not dispatch anything", () => {
				setupTest().onRowClicked({
					...basicNodeRow.data,
					nodeModel: {
						...basicNodeRow.nodeModel,
						rowActivation: { type: "non_interactive" }
					}
				});

				expect(dispatch).not.toHaveBeenCalled();
			});
		});

		describe("when rowActivation is absent", () => {
			it("should dispatch onNodeSelectionChanged", () => {
				setupTest().onRowClicked({
					...basicNodeRow.data,
					nodeModel: {
						...basicNodeRow.nodeModel,
						rowActivation: undefined
					}
				});

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onNodeSelectionChanged({
						nodeIdentifier: basicNodeIdentifier,
						nodePath: basicNodePath,
						selected: true
					})
				);
			});
		});
	});

	describe("onMultiSelectionButtonClicked", () => {
		it("should dispatch onMultiSelectionButtonClicked", () => {
			setupTest().onMultiSelectionButtonClicked();

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(Events.onMultiSelectionButtonClicked({}));
		});
	});

	describe("onMultiSelectionEventButtonClicked", () => {
		describe("when button has confirmation field", () => {
			it("should dispatch onMultiSelectionEventButtonClickedRequest", () => {
				const confirmation: TreeModel.ConfirmationText = { title: [{ locale: "en", text: "test" }] };
				const button: TreeModel.ButtonType = { id: "0", event: "A", confirmation };
				setupTest().onMultiSelectionEventButtonClicked({ button });

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(
					Events.onMultiSelectionEventButtonClickedRequest({ button, confirmation })
				);
			});
		});

		describe("when button has no confirmation field", () => {
			it("should dispatch onMultiSelectionEventButtonClicked", () => {
				const button: TreeModel.ButtonType = { id: "0", event: "A" };
				setupTest().onMultiSelectionEventButtonClicked({ button });

				expect(dispatch).toHaveBeenCalledOnce();
				expect(dispatch).toHaveBeenCalledWith(Events.onMultiSelectionEventButtonClicked({ button }));
			});
		});
	});

	describe("onOverallMultiSelectionClicked", () => {
		it("should dispatch onOverallMultiSelectionClicked", () => {
			setupTest().onOverallMultiSelectionClicked();

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(Events.onOverallMultiSelectionClicked({}));
		});
	});

	describe("onNodeMultiSelectionClicked", () => {
		it("should dispatch onNodeMultiSelectionClicked", () => {
			setupTest().onNodeMultiSelectionClicked({ nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath });

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(
				Events.onNodeMultiSelectionClicked({ nodeIdentifier: basicNodeIdentifier, nodePath: basicNodePath })
			);
		});
	});

	describe("onNodeRangeSelectionClicked", () => {
		it("should dispatch onNodeRangeSelectionClicked", () => {
			setupTest().onNodeRangeSelectionClicked({
				nodePath: basicNodePath
			});

			expect(dispatch).toHaveBeenCalledOnce();
			expect(dispatch).toHaveBeenCalledWith(
				Events.onNodeRangeSelectionClicked({
					nodePath: basicNodePath
				})
			);
		});
	});
});
