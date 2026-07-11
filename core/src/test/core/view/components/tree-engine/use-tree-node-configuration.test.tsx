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

import type { FlattenNodeRow } from "../../../../../core/view/index.js";
import { type RuntimeTreeModel, TreeModel } from "../../../../../core/models/index.js";
import { defaultEngineState } from "../../../../setup/basic.spec.js";
import { mockType } from "../../../../utils/mock-utils.js";
import { testHook } from "../../../../utils/test-utils.js";
import { NodeConfigurationHook } from "../../../../../core/view/components/tree-engine/sub-components/hooks/node-configuration-hook.js";

describe("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.hooks.node-configuration-hook", () => {
	const basicEngineState = defaultEngineState;
	const [teamNodeModel, personNodeModel] = basicEngineState.models.uiModel.content.nodes;

	const basicColumnRef = "enum";

	describe("useTreeNodeConfiguration", () => {
		const customPersonNodeModel = mockType<RuntimeTreeModel.TreeNode>({
			...personNodeModel,
			columns: [
				mockType<RuntimeTreeModel.TreeNodeColumn>({
					columnRef: basicColumnRef,
					configuration: { multiSelectDisplayMode: TreeModel.MultiSelectDisplayMode.COMMA_SEPARATED }
				})
			]
		});

		describe("multiSelectDisplayMode", () => {
			function testUseDisplayMode(row: FlattenNodeRow) {
				const params: { row?: FlattenNodeRow; columnRef?: string } = {
					row,
					columnRef: basicColumnRef
				};
				return (
					testHook(
						NodeConfigurationHook.useTreeNodeConfiguration,
						[{ ...params }],
						basicEngineState
					)("multiSelectDisplayMode") || TreeModel.MultiSelectDisplayMode.DEFAULT
				);
			}

			describe("when there is no config in node column mapping", () => {
				it("should return DEFAULT value as default", () => {
					const row = mockType<FlattenNodeRow>({ nodeModel: personNodeModel });
					const result = testUseDisplayMode(row);

					expect(result).toBe(TreeModel.MultiSelectDisplayMode.DEFAULT);
				});
			});

			describe("when there is a config in node column mapping", () => {
				it("should return the config", () => {
					const row = mockType<FlattenNodeRow>({ nodeModel: customPersonNodeModel });
					const result = testUseDisplayMode(row);

					expect(result).toBe(TreeModel.MultiSelectDisplayMode.COMMA_SEPARATED);
				});
			});

			describe("when there is a config in childRelationshipConfigurations of the parent node", () => {
				it("should return the config", () => {
					const customTeamNodeModel = mockType<RuntimeTreeModel.TreeNode>({
						...teamNodeModel,
						childRelationshipConfigurations: [
							mockType<RuntimeTreeModel.ChildRelationshipConfiguration>({
								relationshipModelRef: "TeamPerson",
								columns: [
									{
										columnRef: basicColumnRef,
										configuration: { multiSelectDisplayMode: TreeModel.MultiSelectDisplayMode.COMMA_SEPARATED }
									}
								]
							})
						]
					});
					const row = mockType<FlattenNodeRow>({
						nodeModel: customPersonNodeModel,
						parent: { nodeModel: customTeamNodeModel }
					});
					const result = testUseDisplayMode(row);

					expect(result).toBe(TreeModel.MultiSelectDisplayMode.COMMA_SEPARATED);
				});
			});
		});

		describe("attachmentDisplayMode", () => {
			const customPersonNodeModel = mockType<RuntimeTreeModel.TreeNode>({
				...personNodeModel,
				columns: [
					mockType<RuntimeTreeModel.TreeNodeColumn>({
						columnRef: basicColumnRef,
						configuration: { attachmentDisplayMode: TreeModel.AttachmentDisplayMode.ICON_WITH_FILE_NAME }
					})
				]
			});

			function testUseDisplayMode(row: FlattenNodeRow) {
				return (
					testHook(
						NodeConfigurationHook.useTreeNodeConfiguration,
						[{ row, columnRef: basicColumnRef }],
						basicEngineState
					)("attachmentDisplayMode") || TreeModel.AttachmentDisplayMode.PREVIEW
				);
			}

			describe("when there is no config in node column mapping", () => {
				it("should use PREVIEW as default", () => {
					const row = mockType<FlattenNodeRow>({ nodeModel: personNodeModel });
					const result = testUseDisplayMode(row);

					expect(result).toBe(TreeModel.AttachmentDisplayMode.PREVIEW);
				});
			});

			describe("when there is a config in node column mapping", () => {
				it("should return the config", () => {
					const row = mockType<FlattenNodeRow>({ nodeModel: customPersonNodeModel });
					const result = testUseDisplayMode(row);

					expect(result).toBe(TreeModel.AttachmentDisplayMode.ICON_WITH_FILE_NAME);
				});
			});

			describe("when there is a config in childRelationshipConfigurations of the parent node", () => {
				it("should return the config", () => {
					const customTeamNodeModel = mockType<RuntimeTreeModel.TreeNode>({
						...teamNodeModel,
						childRelationshipConfigurations: [
							mockType<RuntimeTreeModel.ChildRelationshipConfiguration>({
								relationshipModelRef: "TeamPerson",
								columns: [
									{
										columnRef: basicColumnRef,
										configuration: { attachmentDisplayMode: TreeModel.AttachmentDisplayMode.ICON }
									}
								]
							})
						]
					});
					const row = mockType<FlattenNodeRow>({
						nodeModel: customPersonNodeModel,
						parent: { nodeModel: customTeamNodeModel }
					});
					const result = testUseDisplayMode(row);

					expect(result).toBe(TreeModel.AttachmentDisplayMode.ICON);
				});
			});
		});
	});
});
