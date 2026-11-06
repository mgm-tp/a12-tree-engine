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

/*
 * Nothing reachable from this file may import `src/core`: a module already loaded by a setup file can
 * no longer be replaced by `vi.mock` in a test file, so pulling in an engine barrel here would disable
 * module mocking across the whole suite.
 */

import "@testing-library/jest-dom/vitest";
import "./react-19-compat.js";

import ReactAdapterExport from "@cfaester/enzyme-adapter-react-18";
import { cleanup } from "@testing-library/react";
import Enzyme from "enzyme";

import * as Utils from "../utils/mount.js";

/**
 * The adapter is published as CommonJS carrying an ESM-style default export, so `nodenext` resolves
 * the default import to the module namespace rather than the class. Unwrapping covers both shapes.
 */
type AdapterConstructor = new () => Enzyme.EnzymeAdapter;

const ReactAdapter = ((ReactAdapterExport as { default?: AdapterConstructor }).default ??
	ReactAdapterExport) as AdapterConstructor;

Enzyme.configure({ adapter: new ReactAdapter() });

// @ts-expect-error To suppress warning about act(...) being called in a non-async way
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

declare global {
	const mount: typeof Utils.mount;
	const getInteractiveElement: typeof Utils.getInteractiveElement;
}

// oxlint-disable-next-line ban-ts-comment
// @ts-ignore
globalThis.mount = Utils.mount;
// oxlint-disable-next-line ban-ts-comment
// @ts-ignore
globalThis.getInteractiveElement = Utils.getInteractiveElement;

afterEach(() => {
	Utils.unmountAll();
	cleanup();
});
