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

import { Link, type LinkProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/link/index.js";
import {
	ActionContentbox,
	ContentBoxElements,
	type ActionContentboxProps,
	type ContentBoxProps,
	ContentBox
} from "@com.mgmtp.a12.widgets/widgets-core/lib/contentbox/index.js";
import { TreeTable, type TreeTableProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree-table/index.js";
import { Button, type ButtonProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { ButtonGroup, type ButtonGroupProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/button-group/index.js";
import {
	ButtonGroupContainer,
	type ButtonGroupContainerProps
} from "@com.mgmtp.a12.widgets/widgets-core/lib/layout/button-group-container/index.js";
import { ModalOverlay, type ModalOverlayProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/modal-overlay/index.js";
import {
	ModalNotification,
	type ModalNotificationProps
} from "@com.mgmtp.a12.widgets/widgets-core/lib/modal-notification/index.js";
import {
	ProgressIndicator,
	type ProgressIndicatorProps
} from "@com.mgmtp.a12.widgets/widgets-core/lib/progress-indicator/index.js";
import { TreeNode, type TreeNodeProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/tree/index.js";
import { Icon, type IconProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { List, type ListItemProps, type ListProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/list/index.js";
import { PopUpMenu, type PopUpMenuProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/pop-up-menu/index.js";
import { TextOutput, type TextOutputProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/text-output/index.js";
import {
	Checkbox,
	type CheckboxProps,
	type IndeterminateCheckboxProps
} from "@com.mgmtp.a12.widgets/widgets-core/lib/input/checkbox/index.js";
import type { CounterProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/counter/main/counter.api.js";
import { Counter } from "@com.mgmtp.a12.widgets/widgets-core/lib/counter/main/counter.view.js";
import { type CssEllipsisProps, CssEllipsis } from "@com.mgmtp.a12.widgets/widgets-core/lib/css-ellipsis/index.js";
import { Message, type MessageProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/message/index.js";
import {
	ResponsiveImageContainer,
	type ResponsiveImageContainerProps
} from "@com.mgmtp.a12.widgets/widgets-core/lib/responsive-image-container/index.js";
import { Tooltip, type TooltipProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/tooltip/index.js";
import { type ListSubHeaderProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/list/main/list.api.js";
import { type BulletListProps, BulletList } from "@com.mgmtp.a12.widgets/widgets-core/lib/bullet-list/index.js";
import { type HiddenTextProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/hidden-text/hidden-text.api.js";
import { HiddenText } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/hidden-text/hidden-text.view.js";

import { type FlattenNodeRow, type TreeEngineColumn } from "../components/tree-engine/sub-components/types.js";

import { arePropsWithDataEqual } from "./are-props-with-data-equal.js";

export interface WidgetMap {
	ActionContentBox: React.ComponentType<ActionContentboxProps>;
	HeadingAddon: React.ComponentType<ContentBoxProps.BaseProps>;
	SubActionBar: React.ComponentType<ContentBoxProps.BaseProps>;
	Footer: React.ComponentType<ContentBoxProps.FooterProps>;

	Title: React.ComponentType<ContentBoxProps.TitleProps>;
	Subtitle: React.ComponentType<ContentBoxProps.TitleProps>;
	Heading: React.ComponentType<ContentBoxProps.HeadingProps>;
	ContentBox: React.ComponentType<ContentBoxProps>;
	ContentBoxCloseButton: React.ComponentType<ContentBoxProps.CloseButtonProps>;
	SubHeading: React.ComponentType<ContentBoxProps.BaseProps>;
	ActionBarGroupArea: React.ComponentType<ContentBoxProps.ActionBarGroupAreaTplProps>;
	ActionBarGroup: React.ComponentType<ContentBoxProps.ActionBarGroupProps>;
	ActionBarGroupDivider: React.ComponentType<ContentBoxProps.BaseProps>;

	List: React.ComponentType<ListProps>;
	ListSubheader: React.ComponentType<ListSubHeaderProps>;
	ListItem: React.ComponentType<ListItemProps>;
	PopUpMenu: React.ComponentType<PopUpMenuProps>;
	Button: React.ComponentType<ButtonProps>;
	ButtonGroup: React.ComponentType<ButtonGroupProps>;
	ButtonGroupContainer: React.ComponentType<ButtonGroupContainerProps>;

	ModalNotification: React.ComponentType<ModalNotificationProps>;
	ModalOverlay: React.ComponentType<ModalOverlayProps>;

	TreeTable: React.ComponentType<TreeTableProps<FlattenNodeRow, TreeEngineColumn>>;
	TreeNode: React.ComponentType<TreeNodeProps>;

	Counter: React.ComponentType<CounterProps>;
	Checkbox: React.ComponentType<CheckboxProps>;
	IndeterminateCheckbox: React.ComponentType<IndeterminateCheckboxProps>;
	TextOutput: React.ComponentType<TextOutputProps>;
	Tooltip: React.ComponentType<TooltipProps>;
	CssEllipsis: React.ComponentType<CssEllipsisProps>;
	BulletListItem: React.ComponentType<BulletListProps.ItemProps>;
	UnorderedBulletList: React.ComponentType<BulletListProps.UnorderedProps>;
	ResponsiveImageContainer: React.ComponentType<ResponsiveImageContainerProps>;

	Icon: React.ComponentType<IconProps>;

	Link: React.ComponentType<LinkProps>;
	ProgressIndicator: React.ComponentType<ProgressIndicatorProps>;
	Message: React.ComponentType<MessageProps>;

	HiddenText: React.ComponentType<HiddenTextProps>;
}

export const DefaultWidgetMap: WidgetMap = {
	ActionContentBox: React.memo(ActionContentbox),
	HeadingAddon: React.memo(ContentBoxElements.HeadingAddon),
	SubActionBar: React.memo(ContentBoxElements.SubActionBar),
	Footer: React.memo(ContentBoxElements.Footer),

	Title: React.memo(ContentBoxElements.Title),
	Subtitle: React.memo(ContentBoxElements.Subtitle),
	Heading: React.memo(ContentBoxElements.Heading),
	ContentBox: React.memo(ContentBox),
	ContentBoxCloseButton: React.memo(ContentBoxElements.CloseButton),
	SubHeading: React.memo(ContentBoxElements.SubHeading),
	ActionBarGroupArea: React.memo(ContentBoxElements.ActionBarGroupArea),
	ActionBarGroupDivider: React.memo(ContentBoxElements.ActionBarGroupDivider),
	ActionBarGroup: React.memo(ContentBoxElements.ActionBarGroup),

	// The List is not wrapped by React.memo intentionally
	// since the PopupMenu needs to check its direct children is truly a List for rendering properly
	List,
	ListSubheader: React.memo(List.SubHeader),
	ListItem: React.memo(List.Item),
	PopUpMenu: React.memo(PopUpMenu),
	Button: React.memo(Button),
	ButtonGroup: React.memo(ButtonGroup),
	ButtonGroupContainer: React.memo(ButtonGroupContainer),

	ModalNotification: React.memo(ModalNotification),
	ModalOverlay: React.memo(ModalOverlay),

	TreeTable: React.memo<TreeTableProps<FlattenNodeRow, TreeEngineColumn>>(TreeTable, arePropsWithDataEqual),
	TreeNode: React.memo(TreeNode),

	Counter: React.memo(Counter),
	Checkbox: React.memo(Checkbox),
	IndeterminateCheckbox: React.memo(Checkbox.Indeterminate),
	TextOutput: React.memo(TextOutput),
	Tooltip: React.memo(Tooltip),
	CssEllipsis: React.memo(CssEllipsis),
	UnorderedBulletList: React.memo(BulletList.Unordered),
	BulletListItem: React.memo(BulletList.Item),
	ResponsiveImageContainer: React.memo(ResponsiveImageContainer),

	Icon: React.memo(Icon),
	Link: React.memo(Link),
	ProgressIndicator: React.memo(ProgressIndicator),
	Message: React.memo(Message),

	HiddenText: React.memo(HiddenText)
};
