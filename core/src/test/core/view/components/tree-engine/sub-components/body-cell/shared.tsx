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

import {
	type TreeTableContextType,
	type TreeTableDragDropOptions,
	TreeTableContextProvider,
	type BaseTreeTableColumnType,
	type Container
} from "@com.mgmtp.a12.widgets/widgets-core";

import type { TreeModel } from "../../../../../../../core/models/index.js";
import type { TreeEngineState } from "../../../../../../../core/store/index.js";
import {
	type BodyCell,
	type FlattenNodeRow,
	TreeEngineContextProvider,
	type TreeEngineDataColumn,
	type TreeEngineRowContext,
	TreeEngineRowContextProvider
} from "../../../../../../../core/view/index.js";
import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps
} from "../../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../../utils/mock-utils.js";

interface FlattenNodeRowHasParent extends FlattenNodeRow {
	parent: FlattenNodeRow;
}

interface ChildCellProps extends BodyCell.Props {
	row: FlattenNodeRowHasParent;
}

const basicEngineState = defaultEngineState;
export const teamNodeModel = basicEngineState.models.uiModel.content.nodes[0];
export const personNodeModel = basicEngineState.models.uiModel.content.nodes[1];

export const teamIdentifier = {
	id: "DomainTeam/1",
	type: "DomainTeam"
};

export const personIdentifier = {
	id: "DomainPerson/16",
	type: "DomainPerson"
};

export const teamNodeRow: FlattenNodeRow = {
	id: "DomainTeam[DomainTeam/1]",
	level: 0,
	data: {
		nodeIdentifier: teamIdentifier,
		nodePath: [teamIdentifier]
	},
	nodeModel: teamNodeModel,
	childrenCount: 0,
	rowIndex: 0
};

export const basicLink: TreeEngineState.Link = {
	identifier: {
		id: "3",
		type: "TeamPerson"
	},
	linkDocument: {
		grp1: {
			Position: "Watcher"
		},
		id: "__NEW__"
	},
	linkRef: {
		id: "3",
		linkDescriptor: {
			entities: [
				{ docRef: "DomainTeam/1", role: "Team", modelName: "DomainTeam" },
				{ docRef: "DomainPerson/16", role: "Person", modelName: "DomainPerson" }
			],
			relationshipModel: "TeamPerson"
		}
	}
};

export const basicParentLink: TreeEngineState.Link = {
	identifier: {
		id: "4",
		type: "TeamTeam"
	},
	linkDocument: undefined,
	linkRef: {
		id: "3",
		linkDescriptor: {
			entities: [
				{ docRef: "DomainTeam/3", role: "Parent", modelName: "DomainTeam" },
				{ docRef: "DomainTeam/1", role: "Child", modelName: "DomainTeam" }
			],
			relationshipModel: "TeamTeam"
		}
	}
};

export const personNodeRow: FlattenNodeRow = {
	id: "TeamPerson[3]",
	level: 1,
	data: {
		nodeIdentifier: personIdentifier,
		nodePath: [personIdentifier]
	},
	nodeModel: basicEngineState.models.uiModel.content.nodes[1],
	childrenCount: 0,
	rowIndex: 0
};

export const teamCellProps: BodyCell.Props = {
	columnRef: "column-2d231s",
	row: teamNodeRow
};

export const personCellProps: ChildCellProps = {
	columnRef: "column-esd312",
	row: {
		...personNodeRow,
		parent: {
			...teamNodeRow,
			children: [personNodeRow]
		}
	}
};

export namespace BodyCellWrapper {
	export interface Props extends Container {
		readonly columnModels?: TreeModel.Column[];
		readonly customEngineState?: Partial<TreeEngineState>;
		readonly customEngineContextProps?: Partial<PartialEventHandlerContextProps>;
		readonly rowContextProps: TreeEngineRowContext.Type;
		readonly additionalColumnProps?: BaseTreeTableColumnType<FlattenNodeRow>;
	}
}

/**
 * To provide widgets's TreeTableContext and TreeEngineRowContext
 */

export const BodyCellWrapper: React.FC<BodyCellWrapper.Props> = (props) => {
	const { customEngineContextProps, customEngineState, columnModels, rowContextProps, additionalColumnProps } = props;

	const engineState: TreeEngineState = { ...basicEngineState, ...customEngineState };

	const treeTableContextColumn = (columnModels ?? engineState.models.uiModel.content.columns).map((columnModel) =>
		mockType<TreeEngineDataColumn>({ ...additionalColumnProps, columnModel })
	);

	const treeTableContextValue = mockType<
		TreeTableContextType<FlattenNodeRow, TreeEngineDataColumn, TreeTableDragDropOptions<FlattenNodeRow>>
	>({ columns: treeTableContextColumn });

	return (
		<TreeEngineContextProvider {...createContextProps(engineState, customEngineContextProps)}>
			<TreeTableContextProvider value={treeTableContextValue}>
				<TreeEngineRowContextProvider value={rowContextProps}>{props.children}</TreeEngineRowContextProvider>
			</TreeTableContextProvider>
		</TreeEngineContextProvider>
	);
};

export class CustomWidget extends React.Component {
	render(): React.ReactNode {
		return <div />;
	}
}
