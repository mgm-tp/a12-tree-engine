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

import { type Identifier, TreeDataUtils } from "../../../../../core/store/index.js";
import { TreeEngineDataHolder } from "../../../../client/index.js";
import { type DataOperation } from "../../data-loaders/data-loader.js";

/** @internal */
export namespace PaginationUtils {
	export function getSize(dataHolder: TreeEngineDataHolder) {
		const meta = TreeEngineDataHolder.Meta.fromSlices(dataHolder.slices);

		const currentSize = meta?.children.length;
		const fullSize = meta?.fullSize;
		const expectedSize = meta?.expectedSize;

		return { fullSize, currentSize, expectedSize };
	}

	export function updateExpectedSizeForRemovedNode(
		dataHolders: TreeEngineDataHolder[],
		nodeIdentifier: Identifier,
		defaultPageSize?: number
	): TreeEngineDataHolder[] {
		const dataHoldersWithUpdatedFullSize: TreeEngineDataHolder[] = dataHolders.map((dataHolder) => {
			if (!TreeDataUtils.readNodeData(dataHolder.data ?? {}, nodeIdentifier)) {
				return dataHolder;
			}
			return setSize(dataHolder, { fullSizeOffset: -1 });
		});
		return normalizeExpectedSize(dataHoldersWithUpdatedFullSize, defaultPageSize);
	}

	export function updateExpectedSizeForAddedNode(
		dataHolders: TreeEngineDataHolder[],
		relationshipModel: string,
		defaultPageSize?: number
	): TreeEngineDataHolder[] {
		const dataHoldersWithUpdatedFullSize: TreeEngineDataHolder[] = dataHolders.map((dataHolder) => {
			if (dataHolder.descriptor.relationshipModel !== relationshipModel) {
				return dataHolder;
			}
			return setSize(dataHolder, { fullSizeOffset: +1 });
		});
		return normalizeExpectedSize(dataHoldersWithUpdatedFullSize, defaultPageSize);
	}

	/**
	 * @param defaultPageSize if provide, normalization will always try to make sure the value of expected page size
	 * 						  to have minimum value of defaultPageSize. Otherwise, 0 is expected.
	 */
	export function normalizeExpectedSize(
		dataHolders: TreeEngineDataHolder[],
		defaultPageSize?: number
	): TreeEngineDataHolder[] {
		let totalExpectedSize = 0;
		for (const dataHolder of dataHolders) {
			const { expectedSize, currentSize } = getSize(dataHolder);
			totalExpectedSize += expectedSize ?? currentSize ?? 0;
		}

		if (defaultPageSize) {
			totalExpectedSize = Math.max(totalExpectedSize, defaultPageSize);
		}

		const result: TreeEngineDataHolder[] = [];
		let remainingExpectedSize = totalExpectedSize;
		for (let index = 0; index < dataHolders.length; index++) {
			const dataHolder = dataHolders[index];
			const isLastDataHolder = index === dataHolders.length - 1;
			if (isLastDataHolder) {
				result.push(setSize(dataHolder, { expectedSize: remainingExpectedSize }));
			} else {
				const fullSize = getSize(dataHolder).fullSize ?? 0;
				const expectedSize = Math.min(remainingExpectedSize, fullSize);
				result.push(setSize(dataHolder, { expectedSize }));
				remainingExpectedSize -= expectedSize;
			}
		}

		return result;
	}

	export function increaseExpectedSize(
		dataHolders: TreeEngineDataHolder[],
		defaultPageSize?: number
	): TreeEngineDataHolder[] {
		const result: TreeEngineDataHolder[] = [];
		let nextPageSize = defaultPageSize ?? 0;
		let index = 0;
		while (nextPageSize > 0) {
			if (index === dataHolders.length) {
				break;
			}
			const isLastDataHolder = index === dataHolders.length - 1;
			const dataHolder = dataHolders[index];
			const { currentSize, fullSize } = getSize(dataHolder);
			if (!fullSize) {
				index++;
				continue;
			}

			const nextCurrentSize = (currentSize ?? 0) + nextPageSize;
			if (isLastDataHolder) {
				const expectedSize = nextCurrentSize;
				result.push(setSize(dataHolder, { expectedSize }));
				nextPageSize = 0;
			} else {
				const expectedSize = Math.min(fullSize, nextCurrentSize);
				result.push(setSize(dataHolder, { expectedSize }));
				nextPageSize = nextCurrentSize - fullSize;
			}

			index++;
		}
		return result;
	}

	export function setSize(
		dataHolder: TreeEngineDataHolder,
		params: {
			fullSize?: number;
			expectedSize?: number;
			fullSizeOffset?: number;
			expectedSizeOffset?: number;
		}
	): TreeEngineDataHolder {
		const meta = TreeEngineDataHolder.Meta.fromSlices(dataHolder.slices);
		const children = meta?.children ?? [];

		const { fullSize, expectedSize, fullSizeOffset, expectedSizeOffset } = params;

		let nextExpectedSize = expectedSize ?? meta?.expectedSize;
		if (expectedSizeOffset && nextExpectedSize) {
			nextExpectedSize = nextExpectedSize + expectedSizeOffset;
		}

		let nextFullSize = fullSize ?? meta?.fullSize ?? 0;
		if (fullSizeOffset !== undefined) {
			nextFullSize = nextFullSize + fullSizeOffset;
		}

		return {
			...dataHolder,
			slices: TreeEngineDataHolder.Slices.toSlices({
				...meta,
				children,
				fullSize: nextFullSize,
				expectedSize: nextExpectedSize
			})
		};
	}

	export function toPaging(dataHolder: TreeEngineDataHolder, modelPageSize?: number, reload = false) {
		const { fullSize, currentSize, expectedSize = modelPageSize } = PaginationUtils.getSize(dataHolder);

		let paging: DataOperation.Query.Paging | undefined;
		if (fullSize !== undefined && expectedSize !== undefined) {
			if (reload) {
				paging = {
					offset: 0,
					limit: expectedSize
				};
			} else if (expectedSize === modelPageSize) {
				paging = {
					offset: 0,
					limit: modelPageSize
				};
			} else if (currentSize !== undefined && expectedSize > currentSize) {
				paging = {
					offset: currentSize,
					limit: expectedSize - currentSize
				};
			}
		} else if (modelPageSize) {
			paging = {
				offset: 0,
				limit: modelPageSize
			};
		}

		return paging;
	}
}
