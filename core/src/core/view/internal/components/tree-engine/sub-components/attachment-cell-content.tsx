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

import * as React from "react";

import { type Attachment } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/utils.js";

import { TreeModel } from "../../../../../models/index.js";
import { useTreeEngineContext } from "../../../context/tree-engine-context-provider.js";

import { type FlattenNodeRow } from "./types.js";

/** @internal */
export namespace AttachmentCellContent {
	export interface Props {
		attachment: Attachment;
		thumbnailUrl?: string;
		displayMode?: TreeModel.AttachmentDisplayMode;
		columnRef?: string;
		row?: FlattenNodeRow;
	}
}

/** @internal */
export const AttachmentCellContent: React.FC<AttachmentCellContent.Props> = React.memo(
	function AttachmentCellContent(props) {
		const { attachment } = props;
		const ResponsiveImageContainer = useTreeEngineContext((context) => context.widgetMap.ResponsiveImageContainer);

		const { useImage, hasIcon, hasFileName } = React.useMemo(() => {
			const displayMode = props.displayMode ?? TreeModel.AttachmentDisplayMode.PREVIEW;
			const hasFileName = [
				TreeModel.AttachmentDisplayMode.FILE_NAME,
				TreeModel.AttachmentDisplayMode.ICON_WITH_FILE_NAME
			].includes(displayMode);

			if (isSupportedImage(attachment.mime_type ?? "")) {
				if (displayMode === TreeModel.AttachmentDisplayMode.PREVIEW) {
					return { useImage: true };
				}

				return {
					hasIcon: [TreeModel.AttachmentDisplayMode.ICON, TreeModel.AttachmentDisplayMode.ICON_WITH_FILE_NAME].includes(
						displayMode
					),
					hasFileName
				};
			}

			return {
				hasIcon: displayMode !== TreeModel.AttachmentDisplayMode.FILE_NAME,
				hasFileName
			};
		}, [attachment.mime_type, props.displayMode]);

		const fileName = React.useMemo(
			() => attachment.original_filename || attachment.internal_filename || undefined,
			[attachment.internal_filename, attachment.original_filename]
		);

		if (useImage && props.thumbnailUrl) {
			return (
				<ResponsiveImageContainer src={props.thumbnailUrl} alt={attachment.description || undefined} title={fileName} />
			);
		}

		if (hasIcon || hasFileName) {
			return (
				<span className={addPrefix("-u-inline-flex -u-items-center")}>
					{hasIcon && <AttachmentIcon attachment={attachment} title={hasFileName ? undefined : fileName} />}
					{hasFileName && fileName}
				</span>
			);
		}

		return null;
	}
);

/** @internal */
export namespace AttachmentIcon {
	export interface Props {
		attachment: Attachment;
		title?: string;
	}
}

/** @internal */
export const AttachmentIcon: React.FC<AttachmentIcon.Props> = React.memo(function AttachmentIcon(props) {
	const { attachment, title } = props;
	const Icon = useTreeEngineContext((context) => context.widgetMap.Icon);

	const attachmentType = React.useMemo(() => getAttachmentType(attachment), [attachment]);

	return (
		<Icon className={addPrefix("-u-text-black")} size="big" title={title} iconTheme="custom">
			{`datatype_${attachmentType}`}
		</Icon>
	);
});

type AttachmentType = "image" | "text" | "pdf" | "spreadsheet" | "audio" | "video" | "default";

function getAttachmentType(attachment: Attachment): AttachmentType {
	const mimeType = attachment?.mime_type;

	if (!mimeType) {
		return "default";
	}

	if (mimeType === "application/pdf") {
		return "pdf";
	}

	if (
		[
			"text/rtf",
			"text/plain",
			"application/rtf",
			"application/msword",
			"application/vnd.oasis.opendocument.text",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		].includes(mimeType)
	) {
		return "text";
	}

	if (
		[
			"application/vnd.ms-excel",
			"application/vnd.oasis.opendocument.spreadsheet",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		].includes(mimeType)
	) {
		return "spreadsheet";
	}

	const type = mimeType.split("/")[0];
	if (["image", "video", "audio"].includes(type)) {
		return type as AttachmentType;
	}

	return "default";
}

function isSupportedImage(mimeType: string): boolean {
	return ["image/jpeg", "image/png", "image/bmp", "image/gif", "image/vnd.microsoft.icon", "image/webp"].includes(
		mimeType
	);
}
