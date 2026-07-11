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

import type * as Enzyme from "enzyme";

import { TreeEngineState } from "../../../../../core/store/index.js";
import { TreeEngineContextProvider, ConfirmationDialog, DialogsRenderer } from "../../../../../core/view/index.js";
import { createContextProps, defaultEngineState } from "../../../../setup/basic.spec.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { TreeModel } from "../../../../../core/models/index.js";
import { testIsNullComponent } from "../../../../utils/test-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.dialogs.dialog-renderer", () => {
	const basicEngineState = defaultEngineState;

	function setupTest(customEngineState?: Partial<TreeEngineState>): Enzyme.ReactWrapper {
		return mount(<DialogsRenderer />, {
			wrappingComponent: TreeEngineContextProvider,
			wrappingComponentProps: createContextProps({
				...basicEngineState,
				...customEngineState
			})
		});
	}

	describe("when current dialogState type is Confirmation", () => {
		it("should render ConfirmationDialog", () => {
			const dialogState: TreeEngineState.Dialog.Confirmation.EventButton = {
				type: TreeEngineState.Dialog.Type.CONFIRMATION,
				confirmationType: TreeEngineState.Dialog.Confirmation.ConfirmationType.EVENT_BUTTON,
				button: { id: "0", event: "A" },
				confirmation: {}
			};

			const result = setupTest({ dialog: dialogState });
			const dialog = result.find(ConfirmationDialog);

			expect(dialog).toHaveLength(1);
			expect(dialog.props().dialogState).toEqual(dialogState);
		});
	});

	describe("when current dialogState type is InsertChildNode", () => {
		it("should not render anything", () => {
			const dialogState: TreeEngineState.Dialog.InsertChildNode = {
				type: TreeEngineState.Dialog.Type.INSERT_CHILD_NODE,
				button: { type: "insert", position: TreeModel.InsertPosition.AS_CHILD },
				options: [],
				insertPosition: mockType<TreeEngineState.InsertPosition>()
			};
			const result = setupTest({ dialog: dialogState });

			expect(result.isEmptyRender()).toBe(true);
		});
	});

	describe("when current dialogState type is InsertRootNode", () => {
		it("should not render anything", () => {
			const dialogState: TreeEngineState.Dialog.InsertRootNode = {
				type: TreeEngineState.Dialog.Type.INSERT_ROOT_NODE,
				button: { id: "0", event: "A" }
			};
			const result = setupTest({ dialog: dialogState });

			expect(result.isEmptyRender()).toBe(true);
		});
	});

	describe("when current dialogState is null", () => {
		it("should not render anything", () => {
			const result = setupTest({ dialog: null });

			testIsNullComponent(result);
		});
	});
});
