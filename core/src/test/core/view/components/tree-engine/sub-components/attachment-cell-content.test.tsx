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

import type * as Enzyme from "enzyme";
import * as React from "react";

import { ResponsiveImageContainer } from "@com.mgmtp.a12.widgets/widgets-core/lib/responsive-image-container/index.js";
import { type Attachment } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/main/icon.view.js";

import {
	AttachmentCellContent,
	AttachmentIcon
} from "../../../../../../core/view/internal/components/tree-engine/sub-components/attachment-cell-content.js";
import { type FlattenNodeRow, TreeEngineContextProvider } from "../../../../../../core/view/index.js";
import { TreeModel } from "../../../../../../core/models/index.js";
import {
	createContextProps,
	defaultEngineState,
	type PartialEventHandlerContextProps
} from "../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../utils/mock-utils.js";

describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.attachment-cell-content", () => {
	const basicEngineState = defaultEngineState;
	const basicAttachment: Attachment = {
		internal_filename: "internal_filename.jpg",
		original_filename: "filename.jpg",
		mime_type: "image/jpeg",
		description: "an image",
		attachment_id: null
	};

	const basicColumnRef = "abcdef";

	const MIME_TYPE = {
		supportedImage: "image/jpeg",
		nonSupportedImage: "image/tiff",
		nonImage: "application/pdf"
	};

	function setupTest(
		props?: Partial<AttachmentCellContent.Props>,
		attachmentDisplayMode?: TreeModel.AttachmentDisplayMode,
		customEngineContextProps?: Partial<PartialEventHandlerContextProps>
	): Enzyme.ReactWrapper {
		const attachment: Attachment = {
			...basicAttachment,
			...props?.attachment
		};

		const row = mockType<FlattenNodeRow>({
			nodeModel: { columns: [{ columnRef: basicColumnRef, configuration: { attachmentDisplayMode } }] }
		});

		return mount(
			<AttachmentCellContent
				displayMode={attachmentDisplayMode}
				columnRef={basicColumnRef}
				attachment={attachment}
				row={row}
			/>,
			{
				wrappingComponent: TreeEngineContextProvider,
				wrappingComponentProps: createContextProps(basicEngineState, customEngineContextProps)
			}
		);
	}

	describe("displayMode", () => {
		describe("when given displayMode = preview", () => {
			describe("when given non-support image or non-image attachment", () => {
				it("should render an icon", () => {
					[MIME_TYPE.nonSupportedImage, MIME_TYPE.nonImage].forEach((mime_type) => {
						const attachment: Attachment = { ...basicAttachment, mime_type };
						const result = setupTest({ attachment }, TreeModel.AttachmentDisplayMode.PREVIEW);

						const responsiveImageContainer = result.find(ResponsiveImageContainer);
						const attachmentIcon = result.find(AttachmentIcon);

						expect(responsiveImageContainer).toHaveLength(0);
						expect(attachmentIcon).toHaveLength(1);

						expect(attachmentIcon.props().title).toBe(basicAttachment.original_filename);
						expect(attachmentIcon.props().attachment).toEqual(attachment);
					});
				});
			});
		});

		describe("when given displayMode = icon", () => {
			it("should render an icon only", () => {
				Object.values(MIME_TYPE).forEach((mime_type) => {
					const attachment: Attachment = { ...basicAttachment, mime_type };
					const result = setupTest({ attachment }, TreeModel.AttachmentDisplayMode.ICON);

					const responsiveImageContainer = result.find(ResponsiveImageContainer);
					const attachmentIcon = result.find(AttachmentIcon);

					expect(responsiveImageContainer).toHaveLength(0);
					expect(attachmentIcon).toHaveLength(1);

					expect(attachmentIcon.props().title).toBe(basicAttachment.original_filename);
					expect(attachmentIcon.props().attachment).toEqual(attachment);
				});
			});
		});

		describe("when given displayMode = file_name", () => {
			it("should render file name only", () => {
				Object.values(MIME_TYPE).forEach((mime_type) => {
					const attachment: Attachment = { ...basicAttachment, mime_type };
					const result = setupTest({ attachment }, TreeModel.AttachmentDisplayMode.FILE_NAME);

					const responsiveImageContainer = result.find(ResponsiveImageContainer);
					const attachmentIcon = result.find(AttachmentIcon);

					expect(responsiveImageContainer).toHaveLength(0);
					expect(attachmentIcon).toHaveLength(0);

					expect(result.text()).toBe(attachment.original_filename);
				});
			});

			it("should use internal_filename when no given original_filename", () => {
				const attachment: Attachment = {
					...basicAttachment,
					mime_type: MIME_TYPE.nonImage,
					original_filename: undefined
				};
				const result = setupTest({ attachment }, TreeModel.AttachmentDisplayMode.FILE_NAME);

				expect(result.text()).toBe(attachment.internal_filename);
			});
		});

		describe("when given displayMode = icon_with_file_name", () => {
			it("should render icon and file name", () => {
				Object.values(MIME_TYPE).forEach((mime_type) => {
					const attachment: Attachment = { ...basicAttachment, mime_type };
					const result = setupTest({ attachment }, TreeModel.AttachmentDisplayMode.ICON_WITH_FILE_NAME);

					const responsiveImageContainer = result.find(ResponsiveImageContainer);
					const attachmentIcon = result.find(AttachmentIcon);

					expect(responsiveImageContainer).toHaveLength(0);
					expect(attachmentIcon).toHaveLength(1);

					expect(attachmentIcon.props().title).toBe(undefined);
					expect(attachmentIcon.props().attachment).toEqual(attachment);

					const fileName = result.find("span").at(0).childAt(1);
					expect(fileName.text()).toBe(attachment.original_filename);
				});
			});
		});
	});

	describe("AttachmentIcon", () => {
		describe("given various mime type", () => {
			it("should render proper icon type", () => {
				const testCases: [MimeType: string | undefined | null, ExpectedIcon: string][] = [
					[undefined, "datatype_default"],
					[null, "datatype_default"],
					["application/pdf", "datatype_pdf"],
					["application/msword", "datatype_text"],
					["text/plain", "datatype_text"],
					["application/vnd.ms-excel", "datatype_spreadsheet"],
					["image/png", "datatype_image"],
					["image/ico", "datatype_image"],
					["image/tiff", "datatype_image"],
					["video/mp4", "datatype_video"],
					["video/mov", "datatype_video"],
					["audio/mp3", "datatype_audio"],
					["something/unknown", "datatype_default"]
				];

				testCases.forEach(([mime_type, expectedIcon]) => {
					const attachmentIcon = mount(<AttachmentIcon attachment={{ ...basicAttachment, mime_type }} />);

					const icon = attachmentIcon.find(Icon);
					expect(icon.props()).toMatchObject({ size: "big", iconTheme: "custom" });
					expect(icon.props().children).toBe(expectedIcon);
				});
			});
		});
	});
});
