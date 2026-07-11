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

import JSZip from "jszip";

import type { Model } from "@com.mgmtp.a12.base/base-model-api";
import type { JsonRpc2Request, JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

export let BASE_URL = process.env.BASE_URL || "http://localhost:15000";
export function updateBaseUrl(baseUrl: string) {
	BASE_URL = baseUrl;
}

export async function rpcRequest(requests: JsonRpc2Request[]): Promise<JsonRpc2Response[]> {
	const res = await fetch(`${BASE_URL}/api/v2/rpc`, {
		method: "POST",
		body: JSON.stringify(requests),
		headers: { "Content-Type": "application/json", "Accept-Language": "en" }
	});
	if (res.status > 400) {
		throw new Error(`Cannot call the JSON RPC request. Error: ${res.status} - ${res.statusText}`);
	}
	return res.json();
}

export async function bulkModelUploadRequest(models: Model[]): Promise<string[]> {
	const arrayBuffer = await createArrayBuffer(models);
	const response = await fetch(`${BASE_URL}/api/v2/models`, {
		method: "PUT",
		body: arrayBuffer,
		headers: { Accept: "*/*" }
	});
	return response.json();
}

async function createArrayBuffer(models: Model[]): Promise<ArrayBuffer> {
	const zip = new JSZip();
	models.forEach((model) => zip.file(`${model.header.id}.json`, JSON.stringify(model)));
	return zip
		.generateAsync({ type: "blob", compression: "DEFLATE" })
		.then((blob) => (blob as AugmentedBlob).arrayBuffer());
}

interface AugmentedBlob extends Blob {
	arrayBuffer(): Promise<ArrayBuffer>;
}
