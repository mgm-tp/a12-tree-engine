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

import { isAction, type Dispatch, type Middleware, type MiddlewareAPI, type UnknownAction } from "redux";

import { TreeEngineError } from "../../../core/error/tree-engine-error.js";
import { createEngineMiddlewares } from "../../../core/store/middleware/middleware-factory.js";

import { TreeEngineActions } from "../actions.js";
import { TreeEngineSelectors } from "../selectors.js";

/** @internal */
export const createTreeEngineAdapterMiddleware = (): Middleware => {
	const middlewares = createEngineMiddlewares();
	return (bapApi) => (bapNext) => (bapAction) => {
		if (TreeEngineActions.event.match(bapAction) || TreeEngineActions.command.match(bapAction)) {
			const { activityId } = bapAction.payload;
			const engineApi: MiddlewareAPI = {
				getState: createEngineGetState(bapApi.getState, activityId),
				dispatch: createEngineDispatch(bapApi.dispatch, activityId)
			};
			const newNext = createEngineNext(engineApi, bapNext, activityId, middlewares);
			newNext(bapAction.payload.engineAction);
			return bapAction;
		}
		return bapNext(bapAction);
	};
};

function createEngineGetState(getState: () => object, activityId: string): () => object {
	return () => {
		const engineState = TreeEngineSelectors.engineState(activityId)(getState());
		if (!engineState) {
			throw TreeEngineError.NotFoundError("TreeEngine.State", { activityId });
		}
		return engineState;
	};
}

function createEngineDispatch(dispatch: Dispatch, activityId: string): Dispatch {
	return <T extends UnknownAction>(engineAction: T): T => {
		if (isAction(engineAction)) {
			if (engineAction.type.includes("COMMAND")) {
				dispatch(TreeEngineActions.command({ activityId, engineAction }));
			} else {
				dispatch(TreeEngineActions.event({ activityId, engineAction }));
			}
		}

		return engineAction;
	};
}

/**
 * @see https://redux.js.org/advanced/middleware#attempt-6-naively-applying-the-middleware
 */
function createEngineNext(
	api: MiddlewareAPI,
	bapNext: (action: unknown) => unknown,
	activityId: string,
	middlewares: Middleware[]
): (action: unknown) => unknown {
	const reversedMiddlewares = middlewares.toReversed();
	const engineDispatch = createEngineDispatch(bapNext as Dispatch, activityId);
	let dispatch = (engineAction: unknown) => {
		engineDispatch(engineAction as UnknownAction);
		return engineAction;
	};
	reversedMiddlewares.forEach((middleware) => {
		dispatch = middleware(api)(dispatch);
	});
	return dispatch;
}
