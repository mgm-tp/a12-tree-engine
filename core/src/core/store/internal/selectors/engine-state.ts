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

import { TreeEngineError } from "../../../error/index.js";

import { type DataState, type ModelsState, type TreeEngineState, type UiState } from "../store.js";

/** @internal */
export function engineState(state: object): TreeEngineState {
	if (isEngineState(state)) {
		return state;
	}
	throw TreeEngineError.TypeError("TreeEngine.State", { actual: state });
}

/** @internal */
export function isEngineState(state: object): state is TreeEngineState {
	return isDataState(state) && isUiState(state) && "models" in state;
}

/** @internal */
export function dataState(state: object): DataState {
	if (isDataState(state)) {
		return state;
	}
	throw TreeEngineError.TypeError("TreeEngine.DataState", { actual: state });
}

/** @internal */
export function isDataState(state: object): state is DataState {
	return "root" in state && "data" in state;
}

/** @internal */
export function uiState(state: object): UiState {
	if (isUiState(state)) {
		return state;
	}
	throw TreeEngineError.TypeError("TreeEngine.UiState", { actual: state });
}

/** @internal */
export function isUiState(state: object | undefined): state is UiState {
	return (
		!!state &&
		"selectedNodes" in state &&
		"expandedNodes" in state &&
		"matchedNodes" in state &&
		"query" in state &&
		"dialog" in state
	);
}

/** @internal */
export function modelsState(state: object): ModelsState {
	if (isModelsState(state)) {
		return state;
	}
	throw TreeEngineError.TypeError("TreeEngine.ModelsState", { actual: state });
}

/** @internal */
export function isModelsState(state: object): state is ModelsState {
	return "models" in state;
}
