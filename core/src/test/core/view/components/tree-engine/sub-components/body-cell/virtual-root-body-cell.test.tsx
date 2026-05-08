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

import { RootNodeRow, type TreeEngineRowContext } from "../../../../../../../core/view/index.js";
import { defaultEngineState } from "../../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../../utils/mock-utils.js";
import { VirtualRootBodyCell } from "../../../../../../../core/view/internal/components/tree-engine/sub-components/virtual-root-body-cell.js";
import { createEngineState } from "../../../../../../utils/model-utils.js";

import { BodyCellWrapper, teamNodeModel } from "./shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.body-cell.virtual-root-body-cell", () => {
	const hierarchicalColumnRef = "1024";
	const basicEngineState = createEngineState
		.from(defaultEngineState)
		.withConfigurations({
			...defaultEngineState.models.uiModel.content.configuration,
			hierarchicalColumnRef,
			virtualRoot: { label: [{ locale: "en", text: "Virtual Root" }] }
		})
		.create();

	const basicRowContextProps = mockType<TreeEngineRowContext.Type>({ rowState: { nodeModel: teamNodeModel } });

	function setupTest(props: VirtualRootBodyCell.Props) {
		const bodyCellWrapperProps: BodyCellWrapper.Props = {
			customEngineState: basicEngineState,
			rowContextProps: basicRowContextProps
		};

		return mount(
			<BodyCellWrapper {...bodyCellWrapperProps}>
				<VirtualRootBodyCell {...props} />
			</BodyCellWrapper>
		);
	}

	it("should render the label defined in model", () => {
		const result = setupTest({ columnRef: hierarchicalColumnRef, row: RootNodeRow.create() });
		expect(result.text()).toBe("Virtual Root");
	});
});
