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

import { call, type SagaGenerator } from "typed-redux-saga";

import { maybeAsyncFnWrapper } from "../utils.js";

import { watchChildNodeCreationSaga } from "./handlers/create-document/child/watch-child-node-creation-saga.js";
import { watchSiblingNodeCreationSaga } from "./handlers/create-document/sibling/watch-sibling-node-creation-saga.js";
import { watchRootNodeCreationSaga } from "./handlers/create-document/root/watch-root-node-creation-saga.js";
import { watchChildLinksCreationSaga } from "./handlers/watch-child-links-creation-saga.js";
import { watchDndNodesSaga } from "./handlers/dnd/watch-dnd-nodes-saga.js";
import { watchDndNodeSaga } from "./handlers/dnd/watch-dnd-node-saga.js";
import { watchLinkDeletionSaga } from "./handlers/watch-link-deletion-saga.js";
import { watchLoadAllNodesSaga } from "./handlers/watch-load-all-nodes-saga.js";
import { watchLoadMoreNodesSaga } from "./handlers/watch-load-more-nodes-saga.js";
import { watchNodeDeletionSaga } from "./handlers/watch-node-deletion-saga.js";
import { watchNodeRowSelectionSaga } from "./handlers/watch-node-row-selection-saga.js";
import { watchNodesDeletionSaga } from "./handlers/watch-nodes-deletion-saga.js";
import { watchCopyNodeSaga } from "./handlers/watch-copy-node-saga.js";
import { watchCopyNodesSaga } from "./handlers/watch-copy-nodes-saga.js";
import {
	watchCollapseSubTreeSaga,
	watchCollapseWholeTreeSaga,
	watchExpandSubTreeSaga,
	watchExpandWholeTreeSaga
} from "./handlers/watch-expand-collapse-whole-sub-tree-sagas.js";
import { watchNodeExpansionSaga } from "./handlers/watch-node-expansion-saga.js";
import {
	watchNodeMultiSelectionSaga,
	watchOverallMultiSelectionSaga
} from "./handlers/watch-node-multi-selection-saga.js";
import { watchPasteSaga } from "./handlers/watch-paste-saga.js";
import { watchReloadSaga } from "./handlers/watch-reload-saga.js";
import { watchScrollToNodeSaga } from "./handlers/watch-scroll-to-node-saga.js";
import type { TreeEngineSaga } from "./saga-setting.js";
import { watchCutNodesSaga } from "./handlers/watch-cut-nodes-saga.js";
import { watchCutNodeSaga } from "./handlers/watch-cut-node-saga.js";
import { watchAddWarningSaga } from "./handlers/watch-add-warning-saga.js";
import { watchRangeSelectionSaga } from "./handlers/watch-node-range-selection-saga.js";
import { watchNodeOpenSaga } from "./handlers/watch-node-open-saga.js";
import { watchToggleExpansionSaga } from "./handlers/watch-toggle-expansion-saga.js";

export function createDefaultSagasMap(setting: TreeEngineSaga.Setting) {
	return {
		watchAddWarning: fn(watchAddWarningSaga),
		watchDndNode: fn(watchDndNodeSaga),
		watchDndNodesSaga: fn(watchDndNodesSaga),
		watchNodeExpansion: fn(watchNodeExpansionSaga),
		watchPaste: fn(watchPasteSaga),
		watchCopyNode: fn(watchCopyNodeSaga),
		watchCopyNodes: fn(watchCopyNodesSaga),
		watchCutNode: fn(watchCutNodeSaga),
		watchCutNodes: fn(watchCutNodesSaga),
		watchNodeMultiSelection: fn(watchNodeMultiSelectionSaga),
		watchOverallMultiSelection: fn(watchOverallMultiSelectionSaga),
		watchRangeSelection: fn(watchRangeSelectionSaga),
		watchScrollToNode: fn(watchScrollToNodeSaga),
		watchReload: fn(watchReloadSaga),
		watchExpandWholeTree: fn(watchExpandWholeTreeSaga),
		watchCollapseWholeTree: fn(watchCollapseWholeTreeSaga),
		watchExpandSubTree: fn(watchExpandSubTreeSaga),
		watchCollapseSubTree: fn(watchCollapseSubTreeSaga),

		watchNodeRowSelection: fn(watchNodeRowSelectionSaga),
		watchChildLinksCreation: fn(watchChildLinksCreationSaga),
		watchLinkDeletion: fn(watchLinkDeletionSaga),
		watchNodeDeletion: fn(watchNodeDeletionSaga),
		watchNodesDeletion: fn(watchNodesDeletionSaga),
		watchChildNodeCreation: fn((activityId) =>
			watchChildNodeCreationSaga(activityId, setting.linkCreation, setting.newRelationshipEngine)
		),
		watchSiblingNodeCreation: fn((activityId) =>
			watchSiblingNodeCreationSaga(activityId, setting.linkCreation, setting.newRelationshipEngine)
		),
		watchRootNodeCreation: fn((activityId) => watchRootNodeCreationSaga(activityId, setting.linkCreation)),

		watchLoadMoreNodesSaga: fn(watchLoadMoreNodesSaga),
		watchLoadAllNodesSaga: fn(watchLoadAllNodesSaga),
		watchNodeOpen: fn(watchNodeOpenSaga),
		watchToggleExpansion: fn(watchToggleExpansionSaga)
	};
}

// A wrapper to keep internal saga typing safe after compiled
function fn(func: (activityId: string) => SagaGenerator<void>): (activityId: string) => SagaGenerator<void> {
	return func;
}

/** @internal */
export type TreeEngineSagasMap = Partial<ReturnType<typeof createDefaultSagasMap>>;

/** @internal */
export function* toTreeEngineSagasMap(
	activityId: string,
	defaultSagas: ReturnType<typeof createDefaultSagasMap>,
	sagaRegistrations: TreeEngineSaga.SagaRegistrationsMap
): SagaGenerator<TreeEngineSagasMap> {
	const result: TreeEngineSagasMap = {};
	const sagaNames = Object.keys(defaultSagas) as (keyof TreeEngineSagasMap)[];
	for (const sagaName of sagaNames) {
		const sagaRegistration = sagaRegistrations[sagaName];
		let registeredSaga: boolean | undefined;

		if (typeof sagaRegistration === "function") {
			registeredSaga = yield* call(maybeAsyncFnWrapper(sagaRegistration), activityId);
		} else {
			registeredSaga = sagaRegistration;
		}
		if (registeredSaga !== false) {
			result[sagaName] = defaultSagas[sagaName];
		}
	}
	return result;
}
