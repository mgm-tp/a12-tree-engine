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

import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { testHook } from "../../../../utils/test-utils.js";
import {
	defaultDndConfiguration,
	type DndConfiguration,
	type DndRedirection,
	type DragObject,
	type DropResult,
	type FlattenNodeRow
} from "../../../../../core/view/index.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { useBulkDndHandler, useSingleDndHandler } from "../../../../../core/view/configuration/dnd/use-on-drop.js";

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.dnd.use-on-drop", () => {
	const basicEngineState = defaultEngineState;
	const basicDndConfiguration = defaultDndConfiguration(basicEngineState);

	afterEach(() => {
		vi.clearAllMocks();
		vi.resetAllMocks();
	});

	describe("useBulkDndHandler", () => {
		const onBulkDndDoneSpy = vi.fn();
		const basicTopLevelMultiSelectedRows: FlattenNodeRow[] = [
			mockType<FlattenNodeRow>(),
			mockType<FlattenNodeRow>(),
			mockType<FlattenNodeRow>()
		];

		function setupTest(customDndConfiguration?: Partial<DndConfiguration>) {
			return testHook(
				useBulkDndHandler,
				[
					{ current: { ...basicDndConfiguration, ...customDndConfiguration } },
					{ current: basicTopLevelMultiSelectedRows }
				],
				basicEngineState,
				{ eventHandlers: { onBulkDndDone: onBulkDndDoneSpy } }
			);
		}

		describe("when dropResult is undefined", () => {
			it("should call onBulkDndDone handler with top level dragged rows only", () => {
				const bulkDndHandler = setupTest(undefined);

				bulkDndHandler(mockType<DragObject>());

				expect(onBulkDndDoneSpy).toHaveBeenCalledOnce();
				expect(onBulkDndDoneSpy).toHaveBeenCalledWith({ draggedNodeRows: basicTopLevelMultiSelectedRows });
			});
		});

		describe("when dropResult is defined", () => {
			it("should call canDrop config with each top level row", () => {
				const canDropStub = vi.fn().mockReturnValue(true);
				const bulkDndHandler = setupTest({ canDrop: canDropStub });

				bulkDndHandler(mockType<DragObject>(), mockType<DropResult>());

				expect(canDropStub).toHaveBeenCalledTimes(3);
			});

			describe("when some of canDrop results return false", () => {
				it("should throw an error", () => {
					const canDropStub = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);
					const bulkDndHandler = setupTest({ canDrop: canDropStub });

					expect(() => bulkDndHandler(mockType<DragObject>(), mockType<DropResult>())).toThrow();
				});
			});

			describe("when some of canDrop results return a DndRedirection", () => {
				it("should throw an error", () => {
					const canDropStub = vi
						.fn()
						.mockReturnValueOnce(true)
						.mockReturnValueOnce(true)
						.mockReturnValueOnce(mockType<DndRedirection>());
					const bulkDndHandler = setupTest({ canDrop: canDropStub });

					expect(() => bulkDndHandler(mockType<DragObject>(), mockType<DropResult>())).toThrow();
				});
			});

			describe("when all of canDrop results return true", () => {
				it("should call onBulkDndDone with proper params", () => {
					const canDropStub = vi.fn().mockReturnValue(true);
					const bulkDndHandler = setupTest({ canDrop: canDropStub });
					const droppedNodeRow = mockType<FlattenNodeRow>();

					bulkDndHandler(
						mockType<DragObject>(),
						mockType<DropResult>({ row: droppedNodeRow, position: TreeTableNodeDropPosition.TOP })
					);

					expect(onBulkDndDoneSpy).toHaveBeenCalledOnce();
					expect(onBulkDndDoneSpy).toHaveBeenCalledWith({
						draggedNodeRows: basicTopLevelMultiSelectedRows,
						droppedNodeRow: droppedNodeRow,
						position: TreeTableNodeDropPosition.TOP
					});
				});
			});

			describe("when all of canDrop results return DndRedirection", () => {
				it("should call onBulkDndDone with proper params", () => {
					const canDropStub = vi
						.fn()
						.mockReturnValueOnce(mockType<DndRedirection>())
						.mockReturnValueOnce(mockType<DndRedirection>())
						.mockReturnValueOnce(mockType<DndRedirection>());
					const bulkDndHandler = setupTest({ canDrop: canDropStub });
					const droppedNodeRow = mockType<FlattenNodeRow>();

					bulkDndHandler(
						mockType<DragObject>(),
						mockType<DropResult>({ row: droppedNodeRow, position: TreeTableNodeDropPosition.BOTTOM })
					);

					expect(onBulkDndDoneSpy).toHaveBeenCalledOnce();
					expect(onBulkDndDoneSpy).toHaveBeenCalledWith({
						draggedNodeRows: basicTopLevelMultiSelectedRows,
						droppedNodeRow: droppedNodeRow,
						position: TreeTableNodeDropPosition.BOTTOM
					});
				});
			});
		});
	});

	describe("useSingleDndHandler", () => {
		const onDndDoneSpy = vi.fn();

		function setupTest(customDndConfiguration?: Partial<DndConfiguration>) {
			return testHook(
				useSingleDndHandler,
				[{ current: { ...basicDndConfiguration, ...customDndConfiguration } }],
				basicEngineState,
				{ eventHandlers: { onDndDone: onDndDoneSpy } }
			);
		}

		describe("when canDropResult returns a DndRedirection", () => {
			it("should call onDndDone with that redirection", () => {
				const dndRedirection = mockType<DndRedirection>();
				const canDropStub = vi.fn().mockReturnValue(dndRedirection);
				const singleDndHandler = setupTest({ canDrop: canDropStub });

				singleDndHandler(mockType<DragObject>(), mockType<DropResult>());

				expect(onDndDoneSpy).toHaveBeenCalledOnce();
				expect(onDndDoneSpy).toHaveBeenCalledWith(dndRedirection);
			});
		});

		describe("when canDropResult returns false", () => {
			it("should throw an error", () => {
				const canDropStub = vi.fn().mockReturnValue(false);
				const singleDndHandler = setupTest({ canDrop: canDropStub });

				expect(() => singleDndHandler(mockType<DragObject>(), mockType<DropResult>())).toThrow();
			});
		});

		describe("when canDropResult returns true", () => {
			describe("when dropResult is undefined", () => {
				it("should call onDndDone with dragObject row", () => {
					const canDropStub = vi.fn().mockReturnValue(true);
					const singleDndHandler = setupTest({ canDrop: canDropStub });

					const dragRow = mockType<FlattenNodeRow>();

					singleDndHandler(mockType<DragObject>({ row: dragRow }), undefined);

					expect(onDndDoneSpy).toHaveBeenCalledOnce();
					expect(onDndDoneSpy).toHaveBeenCalledWith({ draggedNodeRow: dragRow });
				});
			});

			describe("when dropResult is defined", () => {
				it("should call onDndDone to drop dragObject as child of root", () => {
					const canDropStub = vi.fn().mockReturnValue(true);
					const singleDndHandler = setupTest({ canDrop: canDropStub });

					const dragRow = mockType<FlattenNodeRow>();
					const dropRow = mockType<FlattenNodeRow>();

					singleDndHandler(mockType<DragObject>({ row: dragRow }), mockType<DropResult>({ row: dropRow }));

					expect(onDndDoneSpy).toHaveBeenCalledOnce();
					expect(onDndDoneSpy).toHaveBeenCalledWith({
						draggedNodeRow: dragRow,
						droppedNodeRow: dropRow,
						position: TreeTableNodeDropPosition.AS_CHILD
					});
				});
			});
		});
	});
});
