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

import type { Activity } from "@com.mgmtp.a12.client/client-core";

import { determineDetailActivityLinkOwnership } from "../../../../../../extensions/client/sagas/handlers/create-document/determine-detail-activity-link-ownership.js";

describe("@com.mgmtp.a12.tree-engine.extensions.client.sagas.create-document.determine-detail-activity-link-ownership", () => {
	function changelogDataHolder(changes: readonly unknown[]): Activity.DataHolder {
		return dataHolder({ feature: "relationship", type: "changelog" }, { changes });
	}

	function dataHolder(descriptor: Activity.DataHolderDescriptor, data: object): Activity.DataHolder {
		return {
			descriptor,
			data,
			slices: {},
			dirty: false,
			loadingState: "loaded",
			savingState: "not_saved"
		};
	}

	function documentDataHolder(data: { id: string; modelId: string }): Activity.DataHolder {
		return dataHolder({}, data);
	}

	type RaceArmPredicate<T extends string> = (state: object) => { stateChanged: boolean; returnValue: T | undefined };

	interface CallEffect<T extends string> {
		payload: { args: readonly [RaceArmPredicate<T>] };
	}

	interface RaceEffect {
		payload: {
			changelogDetected: Generator<CallEffect<"changelog">, unknown, unknown>;
			formEngineFallback: Generator<CallEffect<"formEngine">, unknown, unknown>;
		};
	}

	// The race arms are un-run call() generators, so step each one to reach its predicate closure.
	function racePredicates(generator: ReturnType<typeof determineDetailActivityLinkOwnership>): {
		changelogDetected: RaceArmPredicate<"changelog">;
		formEngineFallback: RaceArmPredicate<"formEngine">;
	} {
		const raceEffect = generator.next().value as RaceEffect;
		return {
			changelogDetected: (raceEffect.payload.changelogDetected.next().value as CallEffect<"changelog">).payload.args[0],
			formEngineFallback: (raceEffect.payload.formEngineFallback.next().value as CallEffect<"formEngine">).payload
				.args[0]
		};
	}

	describe("determineDetailActivityLinkOwnership", () => {
		const detailActivityId = "detail-activity-1";

		function activityWithDataHolders(dataHolders: Activity.DataHolder[]): Activity {
			return { id: detailActivityId, activationTimestamp: 0, descriptor: {}, dataHolders };
		}

		function stateWithActivity(activity: Activity | undefined): object {
			return { activities: activity ? { [detailActivityId]: activity } : {} };
		}

		it("yields relationship-engine when Relationship Engine's changelog is detected before the activity's save starts", () => {
			const generator = determineDetailActivityLinkOwnership(detailActivityId);
			generator.next();

			const result = generator.next({ changelogDetected: "changelog" });
			expect(result.done).toBe(true);
			expect(result.value).toBe("relationship-engine");
		});

		it("yields cancelled when the activity is cancelled before either race arm resolves", () => {
			const generator = determineDetailActivityLinkOwnership(detailActivityId);
			generator.next();

			const result = generator.next({ cancelled: { type: "cancel" } });
			expect(result.done).toBe(true);
			expect(result.value).toBe("cancelled");
		});

		it("yields tree-engine when the form-engine fallback is detected before the activity's save starts", () => {
			const generator = determineDetailActivityLinkOwnership(detailActivityId);
			generator.next();

			const result = generator.next({ formEngineFallback: "formEngine" });
			expect(result.done).toBe(true);
			expect(result.value).toBe("tree-engine");
		});

		it("yields tree-engine-save-in-progress when the activity's save starts with no changelog signal (case 5)", () => {
			const generator = determineDetailActivityLinkOwnership(detailActivityId);
			generator.next();
			generator.next({ saveStarted: { type: "save-started" } });

			const result = generator.next(undefined);
			expect(result.done).toBe(true);
			expect(result.value).toBe("tree-engine-save-in-progress");
		});

		it("yields tree-engine-save-in-progress when the save-started re-check still finds an empty changelog", () => {
			const generator = determineDetailActivityLinkOwnership(detailActivityId);
			generator.next();
			generator.next({ saveStarted: { type: "save-started" } });

			const result = generator.next(activityWithDataHolders([changelogDataHolder([])]));
			expect(result.done).toBe(true);
			expect(result.value).toBe("tree-engine-save-in-progress");
		});

		it("yields relationship-engine when the save-started re-check finds a populated changelog", () => {
			const generator = determineDetailActivityLinkOwnership(detailActivityId);
			generator.next();
			generator.next({ saveStarted: { type: "save-started" } });

			const result = generator.next(activityWithDataHolders([changelogDataHolder(["change-1"])]));
			expect(result.done).toBe(true);
			expect(result.value).toBe("relationship-engine");
		});

		describe("changelogDetected race-arm predicate", () => {
			it("resolves with the changelog verdict once Relationship Engine writes non-empty changes", () => {
				const generator = determineDetailActivityLinkOwnership(detailActivityId);
				const { changelogDetected } = racePredicates(generator);

				const state = stateWithActivity(activityWithDataHolders([changelogDataHolder(["change-1"])]));

				expect(changelogDetected(state)).toEqual({ stateChanged: true, returnValue: "changelog" });
			});

			it("keeps waiting while the activity has no changelog signal yet", () => {
				const generator = determineDetailActivityLinkOwnership(detailActivityId);
				const { changelogDetected } = racePredicates(generator);

				const state = stateWithActivity(activityWithDataHolders([changelogDataHolder([])]));

				expect(changelogDetected(state)).toEqual({ stateChanged: false, returnValue: undefined });
			});

			it("resolves with no changelog verdict once the activity itself is gone from the store", () => {
				const generator = determineDetailActivityLinkOwnership(detailActivityId);
				const { changelogDetected } = racePredicates(generator);

				expect(changelogDetected(stateWithActivity(undefined))).toEqual({
					stateChanged: true,
					returnValue: undefined
				});
			});
		});

		describe("formEngineFallback race-arm predicate", () => {
			it("keeps waiting while the activity itself is not yet in the store", () => {
				const generator = determineDetailActivityLinkOwnership(detailActivityId);
				const { formEngineFallback } = racePredicates(generator);

				expect(formEngineFallback(stateWithActivity(undefined))).toEqual({
					stateChanged: false,
					returnValue: undefined
				});
			});

			it("falls back to tree-engine once Relationship Engine reports an explicitly empty changelog", () => {
				const generator = determineDetailActivityLinkOwnership(detailActivityId);
				const { formEngineFallback } = racePredicates(generator);

				const state = stateWithActivity(activityWithDataHolders([changelogDataHolder([])]));

				expect(formEngineFallback(state)).toEqual({ stateChanged: true, returnValue: "formEngine" });
			});

			it("keeps waiting when there is no changelog signal and no form-engine document data", () => {
				const generator = determineDetailActivityLinkOwnership(detailActivityId);
				const { formEngineFallback } = racePredicates(generator);

				const state = stateWithActivity(activityWithDataHolders([]));

				expect(formEngineFallback(state)).toEqual({ stateChanged: false, returnValue: undefined });
			});

			it("falls back to tree-engine when there is no changelog but the activity holds form-engine document data", () => {
				const generator = determineDetailActivityLinkOwnership(detailActivityId);
				const { formEngineFallback } = racePredicates(generator);

				const state = stateWithActivity(
					activityWithDataHolders([documentDataHolder({ id: "doc-1", modelId: "model-1" })])
				);

				expect(formEngineFallback(state)).toEqual({ stateChanged: true, returnValue: "formEngine" });
			});
		});
	});
});
