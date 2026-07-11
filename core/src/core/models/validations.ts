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

import type { Annotation } from "@com.mgmtp.a12.base/base-model-api";

import { TreeModel } from "./tree-model.js";
import { InvalidTreeModelError, MissingPropertyError } from "./errors.js";

/**
 * Check if the input object is a valid instance of {@link TreeModel}
 */
export function isValidTreeModel(json: object): json is TreeModel {
	return !!validate(json, "tree model")
		.hasRequiredField("header", isValidModelHeader)
		.hasRequiredField("content", isValidTreeModelContent);
}

/** @internal */
export function isValidModelHeader(json: object): json is TreeModel.Header {
	return !!validate(json, "header")
		.hasRequiredFields("id", "modelVersion", "modelReferences")
		.hasRequiredField("modelType", (value) => value === "tree");
}

/** @internal */
export function isValidTreeModelContent(json: object): json is TreeModel.Content {
	return !!validate(json, "content")
		.hasRequiredField("nodes", isValidNodes)
		.hasRequiredField("columns", isValidColumns)
		.hasRequiredField("footerBox", isValidFooterType)
		.hasRequiredField("subHeaderBox", isValidSubHeaderType)
		.hasRequiredField("configuration", isValidConfiguration);
}

/** @internal */
export function isValidSubHeaderType(json: object): json is TreeModel.SubHeaderType {
	const object = json as TreeModel.SubHeaderType;
	return !!validate(object, "subHeader")
		.hasRequiredField("leftSlot", isValidElementList)
		.hasRequiredField("rightSlot", isValidElementList);
}

/** @internal */
export function isValidFooterType(json: object): json is TreeModel.FooterType {
	const object = json as TreeModel.FooterType;
	return !!validate(object, "footerBox")
		.hasRequiredField("leftSlot", isValidButtonElementList)
		.hasRequiredField("rightSlot", isValidButtonElementList);
}

/** @internal */
export function isValidConfiguration(json: object): json is TreeModel.Configuration {
	return (
		!!validate(json, "tree configuration")
			.hasRequiredFields("rootRef", "hierarchicalColumnRef")
			.hasOptionalField("dnd", isValidDndConfiguration)
			.hasOptionalField("labelHidden", isBoolean)
			.hasOptionalField("wholeTreeExpansion", isBoolean)
			.hasOptionalField("initialExpansion", isValidInitialExpansion)
			.hasOptionalField("multiSelection", isValidMultiSelectionConfiguration)
			.hasOptionalField("enableVirtualScroll", isBoolean)
			.hasOptionalField("rowHeight", Boolean)
			.hasOptionalField("actionColumnWidth", Boolean) && isValidVirtualScroll(json)
	);
}

/** @internal */
export function isValidVirtualScroll(json: object): json is TreeModel.Configuration {
	if ("enableVirtualScroll" in json) {
		return !!validate(json, "tree configuration for virtualScroll").hasRequiredFields("rowHeight", "actionColumnWidth");
	}
	return true;
}

/** @internal */
export function isValidMultiSelectionConfiguration(json: object): json is TreeModel.MultiSelectionConfiguration {
	return !!validate(json, "multi selection configuration")
		.hasRequiredField("collapseOption", (collapseOption) =>
			[
				TreeModel.MultiSelectionConfiguration.CollapseOption.NON_COLLAPSIBLE,
				TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_COLLAPSED,
				TreeModel.MultiSelectionConfiguration.CollapseOption.COLLAPSIBLE_EXPANDED
			].includes(collapseOption)
		)
		.hasRequiredField("counterOption", (counterOption) =>
			[
				TreeModel.MultiSelectionConfiguration.CounterOption.SIMPLE,
				TreeModel.MultiSelectionConfiguration.CounterOption.NONE
			].includes(counterOption)
		)
		.hasOptionalField("buttons", (buttons) => !buttons || isValidButtonArray(buttons))
		.hasOptionalField(
			"clearConfirmation",
			(obj) => !!validate(obj, "multi selection clear confirmation").hasRequiredField("enabled", isBoolean)
		)
		.hasOptionalField("selectParent", isBoolean);
}

/** @internal */
export function isValidDndConfiguration(json: object): json is TreeModel.DndConfiguration {
	const object = json as TreeModel.DndConfiguration;

	return (
		!!validate(object, "dnd").hasRequiredField("onDrag") &&
		!!validate(object.onDrag, "dnd.onDrag").hasRequiredField("expandHoveredNode")
	);
}

/** @internal */
export function isValidColumns(json: object): json is TreeModel.Column[] {
	if (!isArray<TreeModel.Column>(json) || !isDistinctArray(json)) {
		throw InvalidTreeModelError({ location: "columns", reason: "invalid array", object: json });
	}
	if (!json.every(isValidColumn)) {
		throw InvalidTreeModelError({ location: "column", object: json });
	}
	return true;
}

/** @internal */
export function isValidColumn(json: object): json is TreeModel.Column {
	return !!validate(json, "column")
		.hasRequiredFields("id", "name", "label", "width", "fixedWidth")
		.hasOptionalField("labelHidden", isBoolean);
}

/** @internal */
export function isValidNodes(json: object): json is TreeModel.TreeNode[] {
	if (!isArray<TreeModel.TreeNode>(json) || !isDistinctArray(json)) {
		throw InvalidTreeModelError({
			location: "nodes",
			reason: "invalid array",
			object: json
		});
	}

	const optionalNodeFieldKeys: (keyof NonNullable<TreeModel.TreeNodeConfiguration["inherit"]>)[] = [
		"icon",
		"contextMenu",
		"rowActivation",
		"styles"
	];

	const isEmptyArray = (object: unknown) => object instanceof Array && object.length === 0;

	return json.every((node) => {
		return (
			!!validate(node, "node")
				.hasOptionalField("rowActivation", isValidRowActivation)
				.hasRequiredFields("id", "documentModelRef")
				.hasRequiredField("configuration", isValidNodeConfiguration)
				.hasRequiredField("actions", (actions) => {
					if (node.configuration.inherit?.actions) {
						return isEmptyArray(actions);
					}
					return isValidNodeActionList(actions);
				})
				.hasRequiredField("columns", (columns) => {
					if (node.configuration.inherit?.columns) {
						return isEmptyArray(columns);
					}
					return !isEmptyArray(columns) && isValidColumnsMapping(columns);
				})
				.hasRequiredField("childRelationshipConfigurations", (configs) => {
					if (node.configuration.inherit?.childRelationshipConfigurations) {
						return isEmptyArray(configs);
					}
					return isValidChildRelationshipConfigurations(configs);
				}) && optionalNodeFieldKeys.every((key) => !(node[key] && node.configuration.inherit?.[key]))
		);
	});
}

/** @internal */
export function isValidNodeConfiguration(json: object): json is TreeModel.TreeNodeConfiguration {
	return !!validate(json, "node configuration")
		.hasRequiredField("dnd")
		.hasOptionalField("inherit", isValidNodeInheritConfiguration);
}

/** @internal */
export function isValidNodeInheritConfiguration(
	json: object
): json is NonNullable<TreeModel.TreeNodeConfiguration["inherit"]> {
	return !!validate(json, "node inherit configuration")
		.hasOptionalField("icon", isObject)
		.hasOptionalField("styles", isArray)
		.hasOptionalField("columns", isArray)
		.hasOptionalField("actions", isArray)
		.hasOptionalField("contextMenu", isObject)
		.hasOptionalField("rowActivation", isObject)
		.hasOptionalField("childRelationshipConfigurations", isArray);
}

/** @internal */
export function isValidChildRelationshipConfigurations(
	json: object
): json is TreeModel.ChildRelationshipConfiguration[] {
	if (!isArray<TreeModel.ChildRelationshipConfiguration>(json) || !isDistinctArray(json)) {
		throw InvalidTreeModelError({
			location: "childRelationshipConfiguration",
			reason: "invalid array",
			object: json
		});
	}
	return json.every((childRelationshipConfiguration) => {
		return !!validate(childRelationshipConfiguration, "child relationship configuration")
			.hasRequiredFields("id", "relationshipModelRef", "parentRole")
			.hasOptionalField("columns", isValidColumnsMapping);
	});
}

/** @internal */
export function isValidColumnsMapping(json: object): json is TreeModel.TreeNodeColumn[] {
	if (!isArray<TreeModel.TreeNodeColumn>(json)) {
		return false;
	}
	return json.every((treeNodeColumn) => {
		return !!validate(treeNodeColumn, "columns mapping").hasRequiredFields("columnRef", "elementRef");
	});
}

/** @internal */
export function isValidButtonArray(json: object): json is TreeModel.ButtonType[] {
	const button = json as TreeModel.ButtonType[];
	if (!isArray(button) || !isDistinctArray(button)) {
		throw InvalidTreeModelError({ location: "buttons", reason: "invalid array", object: json });
	}
	return button.every(isValidButton);
}

/** @internal */
export function isValidElementList(json: object): json is TreeModel.Element[] {
	const elements = json as TreeModel.BaseElement[];
	if (!isArray(elements)) {
		throw InvalidTreeModelError({ location: "subHeaderElement", reason: "invalid array", object: json });
	}

	return elements.every(
		(element) =>
			!!validate(element, "subHeaderElement").hasRequiredField("type", (type) =>
				Object.values(TreeModel.ElementType).includes(type)
			)
	);
}

/** @internal */
export function isValidButtonElementList(json: object): json is TreeModel.ButtonElement[] {
	const buttons = json as TreeModel.ButtonElement[];
	if (!isArray(buttons)) {
		throw InvalidTreeModelError({ location: "footerBox", reason: "invalid array", object: json });
	}
	return buttons.every(
		(button) =>
			isValidButton(button) &&
			!!validate(button, "footerBox").hasRequiredField("type", (type) => type === TreeModel.ElementType.BUTTON)
	);
}

/** @internal */
export function isValidButton(json: object): json is TreeModel.ButtonType {
	return !!validate(json, "button")
		.hasRequiredFields("id", "event")
		.hasOptionalField("annotations", isValidAnnotationList);
}

/** @internal */
export function isValidNodeActionList(json: object): json is TreeModel.TreeNodeActionButton[] {
	if (!isArray<TreeModel.TreeNodeActionButton>(json)) {
		throw InvalidTreeModelError({ location: "actions", reason: "invalid array", object: json });
	}
	return json.every(isValidNodeAction);
}

/** @internal */
export function isValidNodeAction(json: object): json is TreeModel.TreeNodeActionButton {
	return !!validate(json, "node action")
		.hasRequiredField("type")
		.hasOptionalField("annotations", isValidAnnotationList);
}

/** @internal */
export function isValidRowActivation(json: object): json is TreeModel.RowActivation {
	validate(json, "row activation").hasRequiredField("type");
	if (TreeModel.EventRowActivation.isAssignableFrom(json)) {
		return !!validate(json, "row activation").hasRequiredField("event");
	}
	if (TreeModel.InsertRowActivation.isAssignableFrom(json)) {
		return !!validate(json, "row activation").hasRequiredField("position");
	}
	if (TreeModel.NonInteractiveRowActivation.isAssignableFrom(json)) {
		return true;
	}
	throw InvalidTreeModelError({ location: "row activation", reason: "invalid type", object: json });
}

/** @internal */
export function isValidAnnotationList(json: object): json is ReadonlyArray<Annotation> {
	if (!Array.isArray(json)) {
		throw InvalidTreeModelError({ location: "annotations", reason: "invalid array", object: json });
	}
	return json.every(isValidAnnotation);
}

function isValidInitialExpansion(json: object): json is TreeModel.ExpansionStrategy.LevelByLevel.InitialExpansion {
	const location = "initialExpansion";
	if (TreeModel.ExpansionStrategy.LevelByLevel.InitialExpansion.LevelLimit.isAssignableFrom(json)) {
		return !!validate(json, location).hasRequiredField("level").hasOptionalField("affectedNodeRefs", isArray);
	}
	if (TreeModel.ExpansionStrategy.LevelByLevel.InitialExpansion.AllLevels.isAssignableFrom(json)) {
		return !!validate(json, location).hasOptionalField("affectedNodeRefs", isArray);
	}
	throw InvalidTreeModelError({ location, reason: "invalid", object: json });
}

/** @internal */
export function isValidAnnotation(json: object): json is Annotation {
	if (!("name" in json)) {
		throw MissingPropertyError({ fields: "name", location: "annotation", object: json });
	}
	return true;
}

function isObject(json: unknown): json is object {
	return typeof json === "object";
}
function isArray<T = unknown>(json: object): json is T[] {
	return json instanceof Array;
}

function isBoolean(value: unknown): value is boolean {
	return typeof value === "boolean";
}

/** @internal */
export function isDistinctArray(array: { id: string }[]): boolean {
	array.forEach((object) => {
		const duplicatedItems = array.filter((item) => item.id === object.id);
		if (duplicatedItems.length >= 2) {
			throw new Error(`Found duplicated id "${object.id}" in ${JSON.stringify(array)}`);
		}
	});
	return true;
}

function validate(object: object, location: string) {
	type Validator = (obj: never) => boolean;

	const validateField = (field: string, validator?: Validator) => {
		if (validator && !validator((object as never)[field])) {
			throw InvalidTreeModelError({
				location: `${field} of ${location}`,
				reason: `invalid ${field}`,
				object
			});
		}
	};

	const validateRequiredField = (field: string, validator?: Validator) => {
		if (!(field in object)) {
			throw MissingPropertyError({ location, object, fields: field });
		}
		validateField(field, validator);
	};

	const validation = {
		hasRequiredFields: (...fields: string[]) => {
			fields.forEach((field) => validateRequiredField(field));
			return validation;
		},
		hasRequiredField: (field: string, validator?: Validator) => {
			validateRequiredField(field, validator);
			return validation;
		},

		hasOptionalField: (field: string, validator: Validator) => {
			if (field in object) {
				validateField(field, validator);
			}
			return validation;
		}
	};
	return validation;
}
