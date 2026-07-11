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

import type { TableRenderPropsType, TreeTableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core";

import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { testHook } from "../../../../utils/test-utils.js";
import { defaultDndConfiguration, type DndConfiguration, type FlattenNodeRow } from "../../../../../core/view/index.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { useCanDrop } from "../../../../../core/view/configuration/dnd/use-can-drop.js";

describe("@com.mgmtp.a12.tree-engine.core.view.configuration.dnd.use-can-drop", () => {
	const basicEngineState = defaultEngineState;
	const basicDndConfiguration = defaultDndConfiguration(basicEngineState);
	const basicParams = { dragItem: mockType<DragItem>(), hoveredItem: mockType<HoveredItem>() };

	type DragItem = TableRenderPropsType.DragObject<FlattenNodeRow>;
	type HoveredItem = TreeTableRenderPropsType.HoveredObject<FlattenNodeRow>;

	function setupTest(
		customDndConfiguration?: Partial<DndConfiguration>,
		customTopLevelMultiSelectedRows?: FlattenNodeRow[]
	) {
		return testHook(
			useCanDrop,
			[
				{ current: { ...basicDndConfiguration, ...customDndConfiguration } },
				{ current: customTopLevelMultiSelectedRows ?? [mockType<FlattenNodeRow>(), mockType<FlattenNodeRow>()] }
			],
			basicEngineState
		);
	}

	describe("when no given canDrop configuration", () => {
		it("should return false", () => {
			const canDrop = setupTest({ canDrop: undefined });

			expect(canDrop?.(basicParams)).toBe(false);
		});
	});

	describe("when not selected any rows", () => {
		it("should return the result from calling canDrop configuration", () => {
			[true, false].forEach((canDropResult) => {
				const canDropConfig = vi.fn().mockReturnValue(canDropResult);
				const canDrop = setupTest({ canDrop: canDropConfig }, []);

				expect(canDrop?.(basicParams)).toBe(canDropResult);
				expect(canDropConfig).toHaveBeenCalledOnce();
				expect(canDropConfig).toHaveBeenCalledWith(basicParams);
			});
		});
	});

	describe("when having some selected rows", () => {
		describe("when some of them can not be dropped", () => {
			it("should return false", () => {
				const canDropConfig = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
				const canDrop = setupTest({ canDrop: canDropConfig });

				expect(canDrop?.(basicParams)).toBe(false);
				expect(canDropConfig).toHaveBeenCalledTimes(2);
			});
		});

		describe("when all of them can be dropped", () => {
			it("should return true", () => {
				const canDropConfig = vi.fn().mockReturnValue(true);
				const canDrop = setupTest({ canDrop: canDropConfig });

				expect(canDrop?.(basicParams)).toBe(true);
				expect(canDropConfig).toHaveBeenCalledTimes(2);
			});
		});
	});
});
