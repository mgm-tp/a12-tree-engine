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

import { type AnalysedRecorder, type RawRecorder } from "./types";
import { NumberUtils, StringUtils } from "./utils";

export function convert(rawRecorder: RawRecorder, type: "chart" | "xml" | "stat" | "json"): string | AnalysedRecorder {
	switch (type) {
		case "chart":
			return convertToChart(rawRecorder);
		case "xml":
			return convertToXML(rawRecorder);
		case "json":
			return JSON.stringify(analyse(rawRecorder), null, 2);
		default:
			return analyse(rawRecorder);
	}
}

/**
 * Return bar charts as a string for recorder's entries
 * @example
 * createChart({ collapse: [1400, 2100, 1800] })
 *
 *           ██▍   2400.00
 * collapse  █     1100.00
 *           █▊    1800.00
 */
function convertToChart(rawRecorder: RawRecorder): string {
	const maxTitleLength = 2 + Math.max(...Object.keys(rawRecorder).map(({ length }) => length));

	const charts: string[] = [];

	for (const [id, rawDurations] of Object.entries(rawRecorder)) {
		const durations = rawDurations.map((duration) => duration / 1000);
		const maxDuration = Math.ceil(Math.max(...durations));

		const chart = durations
			.map((duration, index) => {
				const title = index === Math.floor(durations.length / 2) ? id : "";
				const bar = StringUtils.createBar(duration);
				const label = NumberUtils.padTrailingZeros(NumberUtils.round(rawDurations[index]));

				return title.padEnd(maxTitleLength) + bar.padEnd(maxDuration) + label.padStart(10);
			})
			.join("\n");

		charts.push(chart);
	}

	return StringUtils.boxen(charts.join("\n\n"));
}

/**
 * Return an XML format that will be processed in Jenkins
 * See: https://llg.cubic.org/docs/junit/
 */
function convertToXML(rawRecorder: RawRecorder): string {
	let result = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
	result += `<testsuite name="Performance test" tests="0" timestamp="${new Date().toISOString()}">\n`;

	for (const [id, durations] of Object.entries(rawRecorder)) {
		for (const duration of durations) {
			const [classname, name] = id.split(".");
			result += `    <testcase classname="${classname}" name="${name}" time="${duration / 1000}" />\n`;
		}
	}

	return result + `</testsuite>`;
}

/**
 * Return descriptive statistic measures, e.g., median, mean, standard deviation, min, max
 */
function analyse(rawRecorder: RawRecorder): AnalysedRecorder {
	const result: AnalysedRecorder = {};

	for (const [id, values] of Object.entries(rawRecorder)) {
		const { length } = values;
		const mean = NumberUtils.sum(values) / length;
		const meanOfSquares = NumberUtils.sum(values.map((value) => value ** 2)) / length;
		const sd = (meanOfSquares - mean ** 2) ** 0.5;

		result[id] = {
			mean: NumberUtils.round(mean),
			sd: NumberUtils.round(sd),
			min: NumberUtils.round(Math.min(...values)),
			max: NumberUtils.round(Math.max(...values)),
			median: NumberUtils.round(NumberUtils.median(values))
		};
	}

	return result;
}
