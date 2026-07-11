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

import { AttachmentCell, type TreeEngineRowContext } from "../../../../../../core/view/index.js";
import { createContextProps } from "../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../utils/mock-utils.js";
import type { TreeModel } from "../../../../../../core/models/index.js";
import { AttachmentIcon } from "../../../../../../core/view/components/tree-engine/sub-components/attachment-cell-content.js";

import { BodyCellWrapper } from "./body-cell/shared.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.attachment-cell", () => {
	const basicAttachmentCellProps: AttachmentCell.Props = {
		documentId: "1024",
		attachment: {
			internal_filename: "new.jpg",
			original_filename: null,
			mime_type: "image/jpeg",
			category: null,
			description: null,
			attachment_id: null,
			content: null,
			size: null
		}
	};

	const basicColumnRef = "abcdef";

	const column = mockType<TreeModel.TreeNodeColumn>({
		columnRef: basicColumnRef
	});

	const rowState = mockType<TreeEngineRowContext.Type>({ rowState: { nodeModel: { columns: [column] } } });

	function setupTest(props?: Partial<AttachmentCell.Props>, thumbnails?: Record<string, string>) {
		return mount(<AttachmentCell {...basicAttachmentCellProps} {...props} />, {
			wrappingComponent: BodyCellWrapper,
			wrappingComponentProps: {
				columnModels: [mockType<TreeModel.Column>({ id: basicColumnRef })],
				rowContextProps: rowState,
				customEngineContextProps: createContextProps(undefined, { thumbnails })
			} as BodyCellWrapper.Props
		});
	}

	describe("Given an attachment with mime type is an image", () => {
		const image = {
			...basicAttachmentCellProps,
			mime_type: "image/jpeg"
		};

		describe("without attachment_id and empty/invalid content", () => {
			const testCases = [
				{
					description: "without attachment_id and empty content",
					attachment: { ...image, attachment_id: null, content: null }
				},
				{
					description: "without attachment_id and invalid content",
					attachment: { ...image, attachment_id: null, content: "localhost://invalid" }
				}
			];
			testCases.forEach((testCase) => {
				describe(`${testCase.description}`, () => {
					it("should not render img tag and icon", () => {
						const result = setupTest({ attachment: { ...testCase.attachment } });

						expect(result.find("img")).toHaveLength(0);
						expect(result.find(AttachmentIcon)).toHaveLength(0);
					});
				});
			});
		});

		describe("with attachment_id or valid content", () => {
			const attachmentIdWithThumbnails = "defc13ef-8e49-4a2e-9590-eb0c4f35c379";
			const thumbnails = {
				[attachmentIdWithThumbnails]: "./cs/download/d6a5adbe-48e6-49ed-8fa8-1cf7f6f3b61d"
			};

			const testCases = [
				{
					description: "with attachment_id, with thumbnailUrl",
					attachment: { ...image, attachment_id: attachmentIdWithThumbnails },
					imgSrc: "./cs/download/d6a5adbe-48e6-49ed-8fa8-1cf7f6f3b61d"
				},
				{
					description: "with attachment_id, without thumbnailUrl",
					attachment: { ...image, attachment_id: "defc13ef" },
					imgSrc: ""
				},
				{
					description: "with valid content",
					attachment: { ...image, content: "data:abcdef" },
					imgSrc: "data:abcdef"
				}
			];

			testCases.forEach((testCase) => {
				describe(`${testCase.description}`, () => {
					it("should render image tag instead of icon", () => {
						const result = setupTest({ attachment: { ...testCase.attachment } }, thumbnails);

						expect(result.find("img")).toHaveLength(1);
						expect(result.find("img").prop("src")).toBe(testCase.imgSrc);
						expect(result.find(AttachmentIcon)).toHaveLength(0);
					});
				});
			});
		});
	});

	describe("Given an attachment with mime type is not an image", () => {
		const attachment = {
			...basicAttachmentCellProps,
			mime_type: "application/pdf"
		};

		describe("without attachment_id and empty/invalid content", () => {
			const testCases = [
				{
					description: "without attachment_id and empty content",
					attachment: { ...attachment, attachment_id: null, content: null }
				},
				{
					description: "without attachment_id and invalid content",
					attachment: { ...attachment, attachment_id: null, content: "localhost://invalid" }
				}
			];
			testCases.forEach((testCase) => {
				describe(`${testCase.description}`, () => {
					it("should not render img tag and icon", () => {
						const result = setupTest({ attachment: { ...testCase.attachment } });

						expect(result.find("img")).toHaveLength(0);
						expect(result.find(AttachmentIcon)).toHaveLength(0);
					});
				});
			});
		});

		describe("with attachment_id or valid content", () => {
			const attachmentIdWithThumbnails = "defc13ef-8e49-4a2e-9590-eb0c4f35c379";
			const thumbnails = {
				[attachmentIdWithThumbnails]: "./cs/download/d6a5adbe-48e6-49ed-8fa8-1cf7f6f3b61d"
			};

			const testCases = [
				{
					description: "with attachment_id, with thumbnailUrl",
					attachment: { ...attachment, attachment_id: attachmentIdWithThumbnails }
				},
				{
					description: "with attachment_id, without thumbnailUrl",
					attachment: { ...attachment, attachment_id: "defc13ef" }
				},
				{
					description: "with valid content",
					attachment: { ...attachment, content: "data:abcdef" }
				}
			];

			testCases.forEach((testCase) => {
				describe(`${testCase.description}`, () => {
					it("should render icon instead of image tag", () => {
						const result = setupTest(
							{ attachment: { ...testCase.attachment, internal_filename: "Booking.pdf" } },
							thumbnails
						);

						expect(result.find("img")).toHaveLength(0);
						expect(result.find(AttachmentIcon)).toHaveLength(1);
						expect(result.find(AttachmentIcon).prop("title")).toBe("Booking.pdf");
					});
				});
			});
		});
	});
});
