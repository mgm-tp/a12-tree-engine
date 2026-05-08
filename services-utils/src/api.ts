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

import * as Fs from "node:fs";

import { updateBaseUrl } from "./utils/index.js";
import { main as cleanDocuments, type CleanDocParams } from "./commands/clean-documents.js";
import { main as generate, type GenerateParams } from "./commands/generate.js";
import { main as seed, type WaitOnParams } from "./commands/seed/index.js";
import { main as uploadModels, type UploadParams } from "./commands/model/upload.js";
import { main as waitOn } from "./commands/wait-on.js";

/**
 * Options for seeding data
 */
export interface SeedOptions {
	preset?: "default" | "a12-teams" | "categories" | "categories-slim" | "model-editor" | "circular-nodes";
	variant?: "normal" | "pagination" | "group-management";
	data?: "simple" | "multiple-pages";
	baseUrl?: string;
	waitOn?: boolean;
	whenDirNotFound?: string;
	whenVolumeNotFound?: string;
}

/**
 * Options for cleaning documents
 */
export interface CleanDocumentsOptions {
	showcases?: "all" | "a12-teams" | "categories" | "model-editor" | string[];
	variant?: "normal" | "pagination" | "group-management" | "all";
	baseUrl?: string;
	waitOn?: boolean;
	whenDirNotFound?: string;
	whenVolumeNotFound?: string;
}

/**
 * Options for generating nodes
 */
export interface GenerateOptions {
	categories: number[];
	products?: number;
	baseUrl?: string;
	waitOn?: boolean;
	whenDirNotFound?: string;
	whenVolumeNotFound?: string;
}

/**
 * Options for uploading models
 */
export interface UploadModelsOptions {
	path?: string;
	baseUrl?: string;
	waitOn?: boolean;
	whenDirNotFound?: string;
	whenVolumeNotFound?: string;
}

/**
 * Options for waiting on server
 */
export interface WaitOnOptions {
	timeout?: number;
	baseUrl?: string;
	whenDirNotFound?: string;
	whenVolumeNotFound?: string;
}

/**
 * Common options interface
 */
interface CommonOptions {
	baseUrl?: string;
	waitOn?: boolean;
	whenDirNotFound?: string;
	whenVolumeNotFound?: string;
}

/**
 * Check preconditions before running commands
 */
async function checkPreconditions(options: CommonOptions): Promise<void> {
	if (options.whenDirNotFound && Fs.existsSync(options.whenDirNotFound)) {
		console.log(`Cancelled because directory "${options.whenDirNotFound}" already exists.`);
		process.exit(0);
	}

	if (options.baseUrl) {
		updateBaseUrl(options.baseUrl);
	}
}

/**
 * Seed data to server using a specific preset
 */
export async function seedData(options: SeedOptions = {}): Promise<void> {
	await checkPreconditions(options);

	const params: WaitOnParams = {
		preset: options.preset || "default",
		variant: options.variant || "normal",
		data: options.data || "simple",
		waitOn: options.waitOn
	};

	await seed(params);
}

/**
 * Clean all documents of certain showcase(s)
 */
export async function cleanDocumentsData(options: CleanDocumentsOptions = {}): Promise<void> {
	await checkPreconditions(options);

	const params: CleanDocParams = {
		showcases: Array.isArray(options.showcases) ? options.showcases : [options.showcases || "all"],
		variant: options.variant || "normal"
	};

	await cleanDocuments(params);
}

/**
 * Recursively generate nodes
 */
export async function generateNodes(options: GenerateOptions): Promise<void> {
	if (!options.categories || options.categories.length === 0) {
		throw new Error("Categories array is required for generate command");
	}

	await checkPreconditions(options);

	const params: GenerateParams = {
		categories: options.categories,
		products: options.products,
		waitOn: options.waitOn
	};

	await generate(params);
}

/**
 * Upload all models in specified directory
 */
export async function uploadModelsData(options: UploadModelsOptions = {}): Promise<void> {
	await checkPreconditions(options);

	const params: UploadParams = {
		path: options.path || "resources/models",
		waitOn: options.waitOn
	};

	await uploadModels(params);
}

/**
 * Wait until the server starts
 */
export async function waitOnServer(options: WaitOnOptions = {}): Promise<void> {
	await checkPreconditions(options);

	const params = {
		timeout: options.timeout
	};

	await waitOn(params);
}

/**
 * Execute any command programmatically
 */
export async function executeCommand(
	command: "seed" | "clean-documents" | "generate" | "upload-models" | "wait-on",
	options: SeedOptions | CleanDocumentsOptions | GenerateOptions | UploadModelsOptions | WaitOnOptions
): Promise<void> {
	switch (command) {
		case "seed":
			await seedData(options as SeedOptions);
			break;
		case "clean-documents":
			await cleanDocumentsData(options as CleanDocumentsOptions);
			break;
		case "generate":
			await generateNodes(options as GenerateOptions);
			break;
		case "upload-models":
			await uploadModelsData(options as UploadModelsOptions);
			break;
		case "wait-on":
			await waitOnServer(options as WaitOnOptions);
			break;
		default:
			throw new Error(`Unknown command: ${command}`);
	}
}

/**
 * Convenience class for fluent API usage
 */
export class ServicesUtils {
	private options: CommonOptions = {};

	/**
	 * Set base URL for all subsequent operations
	 */
	baseUrl(url: string): this {
		this.options.baseUrl = url;
		return this;
	}

	/**
	 * Set condition to only run when directory doesn't exist
	 */
	whenDirNotFound(path: string): this {
		this.options.whenDirNotFound = path;
		return this;
	}

	/**
	 * Set condition to only run when volume doesn't exist
	 */
	whenVolumeNotFound(volume: string): this {
		this.options.whenVolumeNotFound = volume;
		return this;
	}

	/**
	 * Seed data with fluent API
	 */
	async seed(options: Omit<SeedOptions, keyof CommonOptions> = {}): Promise<void> {
		await seedData({ ...this.options, ...options });
	}

	/**
	 * Clean documents with fluent API
	 */
	async cleanDocuments(options: Omit<CleanDocumentsOptions, keyof CommonOptions> = {}): Promise<void> {
		await cleanDocumentsData({ ...this.options, ...options });
	}

	/**
	 * Generate nodes with fluent API
	 */
	async generate(options: Omit<GenerateOptions, keyof CommonOptions>): Promise<void> {
		await generateNodes({ ...this.options, ...options });
	}

	/**
	 * Upload models with fluent API
	 */
	async uploadModels(options: Omit<UploadModelsOptions, keyof CommonOptions> = {}): Promise<void> {
		await uploadModelsData({ ...this.options, ...options });
	}

	/**
	 * Wait on server with fluent API
	 */
	async waitOn(options: Omit<WaitOnOptions, keyof CommonOptions> = {}): Promise<void> {
		await waitOnServer({ ...this.options, ...options });
	}
}

/**
 * Create a new ServicesUtils instance for fluent API usage
 */
export function createServicesUtils(): ServicesUtils {
	return new ServicesUtils();
}

// Re-export types for convenience
export type { CleanDocParams, GenerateParams, WaitOnParams, UploadParams };
