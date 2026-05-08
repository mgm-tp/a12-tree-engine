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

import { Activity, type DataProvider } from "@com.mgmtp.a12.client/client-core";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import { TreeEngineDataHolder, TreeEngineOperation } from "../../client/index.js";

/** @internal */
export const logger = LoggerFactory.getLogger("TreeEngineServerConnector");

/** @deprecated */
export function extractOperationFromProvideDataConfig(
	config: DataProvider.ProvideDataConfig
): TreeEngineOperation | undefined {
	return extractOperationsFromProvideDataConfig(config)?.[0];
}

export function extractOperationsFromProvideDataConfig(
	config: DataProvider.ProvideDataConfig
): TreeEngineOperation[] | undefined {
	if (!("operations" in config.details)) {
		return undefined;
	}
	const { operations } = config.details as { operations: TreeEngineOperation[] };
	if (Array.isArray(operations) && operations.every(TreeEngineOperation.isAssignableFrom)) {
		return operations;
	}

	return undefined;
}

/** @internal */
export function getTobeLoadedNodesDataHolders(
	dataHolders: TreeEngineDataHolder[],
	updatedDescriptors: Activity.DataHolderDescriptor[] = [],
	removedDescriptors: Activity.DataHolderDescriptor[] = []
): TreeEngineDataHolder[] {
	return dataHolders.filter((dataHolder) => {
		if (TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(dataHolder.descriptor)) {
			return false;
		}
		return (
			updatedDescriptors?.some((descriptor) => {
				return Activity.DataHolder.hasDescriptor(descriptor)(dataHolder);
			}) &&
			removedDescriptors?.every((descriptor) => {
				return Activity.DataHolder.hasNotDescriptor(descriptor)(dataHolder);
			})
		);
	});
}
