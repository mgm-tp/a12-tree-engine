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

import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/api.js";

import { DocumentModelUtils } from "../../../../core/models/internal/utils/document-model-utils.js";
import { MultiSelectGroup } from "../../../../core/services/multi-select/index.js";

describe("@com.mgmtp.a12.tree-engine.core.models.utils.document-model-utils", () => {
	function createFactory() {
		return {
			createGroup(
				id: string,
				elements: ReadonlyArray<DocumentModel.Element>,
				usageType?: string | undefined
			): DocumentModel.Group {
				return {
					type: "Group",
					id,
					name: "G" + id,
					repeatability: 1,
					elements,
					usageType
				};
			},
			createField(id: string): DocumentModel.Field {
				return { type: "Field", id, name: "F" + id, fieldType: { type: "StringType" } };
			}
		};
	}

	const { createGroup, createField } = createFactory();

	describe("isAttachment", () => {
		describe("when given a field", () => {
			it("should return false", () => {
				const result = DocumentModelUtils.isAttachment(createField("0"));

				expect(result).toBe(false);
			});
		});

		describe("when given a normal group", () => {
			it("should return false", () => {
				const result = DocumentModelUtils.isAttachment(createGroup("0", []));

				expect(result).toBe(false);
			});
		});

		describe("when given a attachment group", () => {
			it("should return true", () => {
				const result = DocumentModelUtils.isAttachment(createGroup("0", [], "attachment"));

				expect(result).toBe(true);
			});
		});
	});

	describe("isMultiSelect", () => {
		describe("when given a field", () => {
			it("should return false", () => {
				const result = MultiSelectGroup.isInstance(createField("0"));

				expect(result).toBe(false);
			});
		});

		describe("when given a normal group", () => {
			it("should return false", () => {
				const result = MultiSelectGroup.isInstance(createGroup("0", []));

				expect(result).toBe(false);
			});
		});

		describe("when given a group has usageType = 'multi-select', but no child is EnumerationType field and has name 'value'", () => {
			it("should return false", () => {
				const result = MultiSelectGroup.isInstance(
					createGroup(
						"0",
						[
							createGroup("1", []),
							{ type: "Field", id: "2", name: "value", fieldType: { type: "StringType" } } as DocumentModel.Field,
							{
								type: "Field",
								id: "2",
								name: "Value",
								fieldType: { type: "EnumerationType" }
							} as DocumentModel.Field
						],
						"multi-select"
					)
				);

				expect(result).toBe(false);
			});
		});

		describe("when given a group has usageType = 'multi-select', and contains a EnumerationType field child has name 'value'", () => {
			it("should return true", () => {
				const result = MultiSelectGroup.isInstance(
					createGroup(
						"0",
						[
							{
								type: "Field",
								id: "2",
								name: "value",
								fieldType: { type: "EnumerationType" }
							} as DocumentModel.Field
						],
						"multi-select"
					)
				);

				expect(result).toBe(true);
			});
		});
	});
});
