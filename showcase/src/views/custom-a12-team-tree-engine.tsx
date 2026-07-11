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

import { get } from "lodash-es";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import * as KeyCode from "keycode-js";

import {
	TreeDataUtils,
	TreeEngineState,
	type ComponentMap,
	DefaultComponentMap,
	DefaultWidgetMap,
	type FlattenNodeRow,
	RootNodeRow,
	type RowActionStateGetter,
	type RowStyleGetter,
	useTreeEngineContext,
	useTreeEngineRowContext,
	useInitialViewContextMenuModel,
	type WidgetMap,
	KeyboardShortcut,
	TreeModel,
	TreeEngineFactories,
	TreeEngineSelectors
} from "@com.mgmtp.a12.treeengine/treeengine-core";
import {
	ActionContentbox,
	ContentBoxElements,
	DefaultTreeTableComponentRenderers,
	TreeTable,
	type TreeTableComponentRenderers,
	addPrefix,
	type A11yDefinition,
	A11YLanguageContext,
	type Container
} from "@com.mgmtp.a12.widgets/widgets-core";
import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { NotificationActions, LOCALE_RESOURCE_KEYS } from "@com.mgmtp.a12.client/client-core";

import { assert, EDIT_NODE_EVENT, EDIT_ENGINE_EVENT, INFO_NODE_EVENT } from "../helpers.js";
import { engineShortcuts } from "../utils.js";
import { SHOWCASE_RESOURCE_KEYS } from "../config/resources.js";
import { useShowcaseContext } from "../context.js";

export namespace CustomA12TeamTreeEngine {
	export type Props = TreeEngineFactories.ViewComponentProps;
}

export const CustomA12TeamTreeEngine: React.FC<CustomA12TeamTreeEngine.Props> = (props) => {
	// tag::CustomA12TeamTreeEngineComponentMap[]
	const componentMap: ComponentMap = React.useMemo(() => {
		return {
			...DefaultComponentMap,
			DocumentBodyCell: (documentBodyCellProps) => {
				const rowState = useTreeEngineRowContext((context) => context.rowState);
				let className = "";
				if (rowState?.node?.identifier.type === "DomainTeam") {
					className = addPrefix("-u-font-bold");
				}
				return <DefaultComponentMap.DocumentBodyCell {...documentBodyCellProps} className={className} />;
			},
			BodyCellUIValue: (bodyCellUIValueProps) => {
				const { documentModelPath } = bodyCellUIValueProps;
				if (ModelPath.equal(documentModelPath, ModelPath.fromString("Person/PersonalData/FirstName"))) {
					return (
						<DefaultComponentMap.BodyCellUIValue
							{...bodyCellUIValueProps}
							className={addPrefix("-u-background-purple-light")}
						/>
					);
				}
				return <DefaultComponentMap.BodyCellUIValue {...bodyCellUIValueProps} />;
			},
			/**
			 * By default, the {@link HeterogeneousInsertChildNodeDialog} is always returned when running under Client context.
			 * Below example show a way to render your own Insert child node dialog component
			 */
			InsertChildNodeDialog: (dialogProps) => {
				const onDialogConfirmed = useTreeEngineContext((context) => context.eventHandlers.onDialogConfirmed);
				const { options, insertPosition, button } = dialogProps.dialogState;

				return (
					<DefaultWidgetMap.ModalOverlay>
						<ActionContentbox padding="12px" headingElements={<ContentBoxElements.Title text="Insert child dialog" />}>
							<DefaultWidgetMap.List>
								{options.map(({ documentModelId, childRelationshipConfiguration }) => {
									const customDocumentModelId = documentModelId.startsWith("DomainPerson")
										? "DomainPerson"
										: documentModelId;
									return (
										<DefaultWidgetMap.ListItem
											key={customDocumentModelId}
											onClick={() =>
												onDialogConfirmed({
													payload: {
														type: TreeEngineState.Dialog.Type.INSERT_CHILD_NODE,
														documentModelId: customDocumentModelId,
														insertPosition,
														childRelationshipConfiguration,
														button
													}
												})
											}
											text={customDocumentModelId}
										/>
									);
								})}
							</DefaultWidgetMap.List>
						</ActionContentbox>
					</DefaultWidgetMap.ModalOverlay>
				);
			},
			InitialViewBody: () => {
				const dispatch = useDispatch();
				const ContextMenu = useTreeEngineContext((context) => context.componentMap.ContextMenu);
				const contextMenuModel = useInitialViewContextMenuModel();

				return contextMenuModel ? (
					<DefaultWidgetMap.Message className={addPrefix("-u-height-full -u-flex -u-flex-col -u-items-center")}>
						<ContextMenu
							contextMenuModel={contextMenuModel}
							row={RootNodeRow.create()}
							triggerElement={
								<DefaultWidgetMap.Button
									label={"Add a new element"}
									icon={<DefaultWidgetMap.Icon>add_circle</DefaultWidgetMap.Icon>}
								/>
							}
						/>
						or
						<DefaultWidgetMap.Button
							label={"Paste from Clipboard"}
							onClick={() => {
								dispatch({
									...NotificationActions.add({
										severity: "info",
										title: { key: LOCALE_RESOURCE_KEYS.application.title },
										message: { key: SHOWCASE_RESOURCE_KEYS.showcase.button.pasteFromClipboard }
									})
								});
							}}
						/>
					</DefaultWidgetMap.Message>
				) : null;
			}
		};
	}, []);
	// end::CustomA12TeamTreeEngineComponentMap[]

	// tag::CustomA12TeamTreeEngineWidgetMap[]
	const widgetMap: WidgetMap = React.useMemo(() => {
		return {
			...DefaultWidgetMap,
			TreeTable: (treeTableProps) => {
				const componentRenderers: Partial<TreeTableComponentRenderers<FlattenNodeRow>> = React.useMemo(
					() => ({
						...treeTableProps.componentRenderers,
						headRowRenderer: (params) => {
							return DefaultTreeTableComponentRenderers.headRowRenderer({
								...params,
								style: { background: "lavender" }
							});
						}
					}),
					[treeTableProps.componentRenderers]
				);
				return <TreeTable {...treeTableProps} componentRenderers={componentRenderers} />;
			}
		};
	}, []);
	// end::CustomA12TeamTreeEngineWidgetMap[]

	// tag::CustomA12TeamTreeEngineRowActionStateGetter[]
	const dataStateSelector = React.useMemo(() => {
		return TreeEngineSelectors.dataState(props.activityId);
	}, [props.activityId]);
	const data = useSelector((state: object) => dataStateSelector(state)?.data);

	const rowActionStateGetter: RowActionStateGetter = React.useCallback(
		({ row, action }) => {
			if (!data) {
				return {};
			}

			let hidden = false,
				disabled = false;
			const node = TreeDataUtils.readNodeData(data, row.data.nodeIdentifier);

			if (node?.identifier.type === "DomainPerson") {
				const married = get(node.document, "Person.PersonalData.Married");
				if (married === true && action.type === "event" && action.event === "event_delete_link") {
					hidden = true;
				}
				const confirmed = get(node.document, "Person.PersonalData.Confirm");
				if (confirmed === true && action.type === "event" && action.event === EDIT_NODE_EVENT) {
					disabled = true;
				}
			} else if (node?.identifier.type === "DomainTeam") {
				const teamName = get(node.document, "TeamDetails.TeamName");
				if (teamName === "UP" && action.type === "event") {
					hidden = action.event === "event_copy";
					disabled = action.event === INFO_NODE_EVENT;
				}
				if (teamName === "Engines" && action.type === "insert") {
					disabled = true;
				}
			}

			return { hidden, disabled };
		},
		[data]
	);
	// end::CustomA12TeamTreeEngineRowActionStateGetter[]

	// tag::CustomA12TeamTreeEngineRowStyling[]
	const rowStyling: RowStyleGetter = React.useCallback(
		({ row }) => {
			if (!data) {
				return {};
			}
			const node = TreeDataUtils.readNodeData(data, row.data.nodeIdentifier);

			if (node?.identifier.type === "DomainPerson") {
				const firstName = get(node.document, "Person.PersonalData.FirstName");
				if (firstName === "Nicolas" || firstName === "Levi") {
					return { interactive: false };
				}
			}

			return {};
		},
		[data]
	);
	// end::CustomA12TeamTreeEngineRowStyling[]

	const keyboardShortcuts: KeyboardShortcut[] = React.useMemo(() => {
		return [
			{
				keyCombinations: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: KeyCode.CODE_E }],
				target: { type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: EDIT_NODE_EVENT },
				stopIfUnavailable: true
			},
			{
				keyCombinations: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: KeyCode.CODE_DELETE }],
				target: { type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: "event_delete_link" },
				stopIfUnavailable: {
					key: SHOWCASE_RESOURCE_KEYS.showcase.keyboardShortcut.nodeTarget.eventDeleteLink.unavailable
				}
			},
			{
				keyCombinations: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: KeyCode.CODE_I }],
				target: { type: KeyboardShortcut.TargetType.NODE_EVENT_ACTION, event: INFO_NODE_EVENT },
				stopIfUnavailable: (params) => {
					const document = params.node?.document;
					assert(document);

					return {
						key: SHOWCASE_RESOURCE_KEYS.showcase.keyboardShortcut.nodeTarget.eventInfo.unavailable,
						args: { nodeName: { type: "plain", value: get(document, "TeamDetails.TeamName") } }
					};
				}
			},
			{
				keyCombinations: [
					{
						modifierKeys: [KeyboardShortcut.ModifierKey.Alt, KeyboardShortcut.ModifierKey.Shift],
						eventCode: KeyCode.CODE_I
					}
				],
				target: { type: KeyboardShortcut.TargetType.NODE_INSERT_ACTION, position: TreeModel.InsertPosition.AS_CHILD },
				stopIfUnavailable: true
			},
			{
				keyCombinations: [{ modifierKeys: [KeyboardShortcut.ModifierKey.Alt], eventCode: KeyCode.CODE_E }],
				target: { type: KeyboardShortcut.TargetType.ENGINE_EVENT_ACTION, event: EDIT_ENGINE_EVENT }
			},
			...engineShortcuts
		];
	}, []);

	const enableDnd = useShowcaseContext((context) => (context.enableDnd ? undefined : false));

	return (
		<CustomA11YLanguageContextProvider>
			<TreeEngineFactories.ViewComponent
				{...props}
				componentMap={componentMap}
				widgetMap={widgetMap}
				keyboardShortcuts={keyboardShortcuts}
				rowActionStateGetter={rowActionStateGetter}
				rowStyling={rowStyling}
				dndConfiguration={enableDnd}
			/>
		</CustomA11YLanguageContextProvider>
	);
};

export const CustomA11YLanguageContextProvider: React.FC<Container> = (props) => {
	const languageContext = React.useContext(A11YLanguageContext);

	const customContextValue: A11yDefinition = React.useMemo(() => {
		return {
			...languageContext,
			treeTableTitles: {
				...languageContext.treeTableTitles,
				treeTableLabel: "CustomizedText"
			}
		};
	}, [languageContext]);

	return <A11YLanguageContext.Provider value={customContextValue}>{props.children}</A11YLanguageContext.Provider>;
};
