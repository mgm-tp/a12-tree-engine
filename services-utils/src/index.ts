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

/**
 * Main entry point for Services Utils
 *
 * This module exports both the CLI functionality and the programmatic API
 */

// Export the programmatic API
export {
	// Main API functions
	seedData,
	cleanDocumentsData,
	generateNodes,
	uploadModelsData,
	waitOnServer,
	executeCommand,

	// Fluent API
	ServicesUtils,
	createServicesUtils,

	// Types
	type SeedOptions,
	type CleanDocumentsOptions,
	type GenerateOptions,
	type UploadModelsOptions,
	type WaitOnOptions,
	type CleanDocParams,
	type GenerateParams,
	type WaitOnParams,
	type UploadParams
} from "./api.js";

// Default export for convenience
export { createServicesUtils as default } from "./api.js";
