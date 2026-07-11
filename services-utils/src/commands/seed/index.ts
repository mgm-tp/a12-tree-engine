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

import { main as runWaitOn } from "../wait-on.js";

import { main as a12Teams } from "./presets/a12-teams.js";
import { main as categories } from "./presets/categories.js";
import { main as categoriesSlim } from "./presets/categories.js";
import { main as modelEditor } from "./presets/model-editor.js";
import { main as circularNodes } from "./presets/circular-nodes.js";
import { main as defaultPreset } from "./presets/default-preset.js";
import type { ModelEditorParams } from "./presets/model-editor.js";

export interface WaitOnParams extends ModelEditorParams {
	waitOn?: boolean;
	preset: string;
}

export async function main({ preset, waitOn, variant, data }: WaitOnParams) {
	if (waitOn) {
		await runWaitOn({});
	}
	switch (preset) {
		case "a12-teams":
			return a12Teams();
		case "categories":
			return categories();
		case "categories-slim":
			return categoriesSlim({ slim: true });
		case "model-editor":
			return modelEditor({ variant, data });
		case "circular-nodes":
			return circularNodes();
		default:
			return defaultPreset();
	}
}
