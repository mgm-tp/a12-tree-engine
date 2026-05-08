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

import { createContext } from "@com.mgmtp.a12.widgets/widgets-core/lib/context/index.js";
import { type Styleable } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/base-props.js";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/utils.js";
import { Message } from "@com.mgmtp.a12.widgets/widgets-core/lib/message/main/message.view.js";
import { TableTemplate } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/main/template/index.js";
import {
	type CellStyleGetter,
	type ColumnResizingOptions
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/table.api.js";
import {
	type TreeTableComponentRenderers,
	type TreeTableRowStyling,
	useTreeTableContext
} from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";

import { LocalizerHooks, RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import { TreeEngineRowContextProvider, useTreeEngineRowContextProvider } from "../../../context/row-context.js";

import { FlattenRowHooks } from "../use-flatten-rows.js";

import { type FlattenNodeRow, type TreeEngineColumn } from "./types.js";

/** @deprecated unused context, will be removed in 10.0 */
export namespace MultiSelectionDragPreviewContext {
	export interface Type {
		previewNodeRef: React.MutableRefObject<HTMLElement | null>;
	}
}

/** @deprecated unused context, will be removed in 10.0 */
export const MultiSelectionDragPreviewContext = createContext<MultiSelectionDragPreviewContext.Type>({
	previewNodeRef: React.createRef()
});

export namespace MultiSelectionDragPreview {
	export interface Props {
		/** @deprecated unused prop, will be removed in 10.0 */
		data: FlattenNodeRow[];
		/** @deprecated unused prop, will be removed in 10.0 */
		columns: TreeEngineColumn[];
		/** @deprecated unused prop, will be removed in 10.0 */
		componentRenderers: Partial<Renderers>;
		/** @deprecated unused prop, will be removed in 10.0 */
		rowStyling?: TreeTableRowStyling<FlattenNodeRow>;
		/** @deprecated unused prop, will be removed in 10.0 */
		cellStyling?: CellStyleGetter<FlattenNodeRow, TreeEngineColumn>;
		/** @deprecated unused prop, will be removed in 10.0 */
		columnResizingOptions?: ColumnResizingOptions<TreeEngineColumn>;
	}

	/** @deprecated unused prop, will be removed in 10.0 */
	export type Renderers = TreeTableComponentRenderers<FlattenNodeRow, TreeEngineColumn>;
}

/** @internal */
export const MultiSelectionDragPreview: React.FC<MultiSelectionDragPreview.Props> = React.memo(
	function MultiSelectionDragPreview(props) {
		const localizedResource = LocalizerHooks.useLocalizedResource();
		const data = useTreeTableContext<FlattenNodeRow>((c) => c.data);
		const multiSelectedRows = FlattenRowHooks.useMultiSelectedRows(data);

		let children: React.ReactNode;
		if (multiSelectedRows.length === 0) {
			return null;
		} else if (multiSelectedRows.length > 5) {
			const message = localizedResource(RESOURCE_KEYS.treeEngine.multiSelection.summary, {
				amount: { type: "plain", value: `${multiSelectedRows.length}` }
			});
			children = (
				<TableTemplate.BodyRow highlighted className={addPrefix("-u-flex -u-justify-center")}>
					<Message>{message}</Message>
				</TableTemplate.BodyRow>
			);
		} else {
			children = multiSelectedRows.map((row) => <PreviewRow key={row.id} row={row} />);
		}

		return <>{children}</>;
	}
);

namespace PreviewRow {
	export interface Props extends Styleable {
		row: FlattenNodeRow;
	}
}

const PreviewRow: React.FC<PreviewRow.Props> = React.memo((props) => {
	const bodyRowRenderer = useTreeTableContext((context) => context.componentRenderers.bodyRowRenderer);

	const rowContext = useTreeEngineRowContextProvider(props.row);

	if (!rowContext) {
		return null;
	}

	return (
		<TreeEngineRowContextProvider value={rowContext}>
			{bodyRowRenderer({ row: props.row, rowIndex: 0, style: props.style, className: props.className })}
		</TreeEngineRowContextProvider>
	);
});
