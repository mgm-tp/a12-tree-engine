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

import { generateUid } from "@com.mgmtp.a12.widgets/widgets-core";

import { Identifier, type ModelsState, type TreeEngineState } from "../../../../../core/store/store.js";
import { ModelSelector } from "../../../../../core/store/selectors/models.js";
import { TreeDataUtils } from "../../../../../core/store/utils.js";
import { TreeEngineDataHolder } from "../../../../client/data-holder.js";
import type { DataOperation } from "../../../data-loaders/data-loader.js";
import { TreeEngineError } from "../../../../../core/error/tree-engine-error.js";
import { RelationshipModelUtils } from "../../../../../core/models/utils/relationship-utils.js";

/** @internal */
export function resolveTreeQueryResults(params: {
	queries: DataOperation.Query.TreeNodes.Query[];
	queryResults: DataOperation.Query.TreeNodes.Result[];
	dataHolders: TreeEngineDataHolder[];
	models: ModelsState;
	preloadChildNodes?: boolean;
}): TreeEngineDataHolder[] {
	const { queries, queryResults, dataHolders, models, preloadChildNodes } = params;

	const queryWithResult: [DataOperation.Query.TreeNodes.Query, DataOperation.Query.TreeNodes.Result][] = [];
	for (const query of queries) {
		const queryResult = queryResults.find((result) => result.id === query.id);
		if (queryResult) {
			queryWithResult.push([query, queryResult]);
		}
	}

	let updatedDataHolders = dataHolders;
	for (const [query, queryResult] of queryWithResult) {
		updatedDataHolders = resolveTreeQueryResult({
			query,
			queryResult,
			models,
			dataHolders: updatedDataHolders,
			preloadChildNodes
		});
	}

	return updatedDataHolders;
}
/** @internal */
export function resolveTreeQueryResult(params: {
	query: DataOperation.Query.TreeNodes.Query;
	queryResult: DataOperation.Query.TreeNodes.Result;
	dataHolders: TreeEngineDataHolder[];
	models: ModelsState;
	preloadChildNodes?: boolean;
}): TreeEngineDataHolder[] {
	const { query, queryResult, dataHolders, models, preloadChildNodes } = params;

	const { entries, links } = queryResult;

	// Intentionally minimal logging: enable DEBUG_TREE_TO_DATA_HOLDERS above for targeted diagnostics

	const linkGroups = new Map<string, DataOperation.Query.TreeNodes.Link[]>();
	for (const link of links) {
		const existingGroup = linkGroups.get(link.sourceDocRef);
		linkGroups.set(link.sourceDocRef, [...(existingGroup ?? []), link]);
	}

	// Sort the links by their child relationship model order from the UI model.
	for (const [sourceDocRef, linkGroup] of linkGroups.entries()) {
		const sourceNodeModel = ModelSelector.nodeModel(Identifier.from(sourceDocRef).type)(models);
		const newLinkGroups = [];

		for (const { relationshipModelRef } of sourceNodeModel?.childRelationshipConfigurations ?? []) {
			const childLinkGroup = linkGroup.filter((link) => link.relationshipModel === relationshipModelRef);
			newLinkGroups.push(...childLinkGroup);
		}

		linkGroups.set(sourceDocRef, newLinkGroups);
	}

	let nextDataHolders = dataHolders;

	if (!("source" in query.entry)) {
		if (dataHolders.some(({ descriptor }) => TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(descriptor))) {
			nextDataHolders = nextDataHolders.map((dataHolder) => {
				return TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(dataHolder.descriptor)
					? addRootNodesToDataHolder(dataHolder, entries)
					: dataHolder;
			});
		} else {
			nextDataHolders.push(addRootNodesToDataHolder(createRootDataHolder(), entries));
		}
	}

	if (
		dataHolders.some(({ descriptor }) => TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor))
	) {
		nextDataHolders = nextDataHolders.map((dataHolder) => {
			return TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(dataHolder.descriptor)
				? addHiddenRootNodesToDataHolder(models, dataHolder, entries)
				: dataHolder;
		});
	}

	// Traverse level-by-level while tracking a branch-specific path
	type Parent = {
		entity: DataOperation.Query.TreeNodes.Entry | DataOperation.Query.TreeNodes.Link;
		nodePath: TreeEngineState.NodePath;
	};
	const levelLimiter = createLevelLimiter({ preloadChildNodes }).initialize(query);
	let parents: Parent[] = entries.map((entry) => ({ entity: entry, nodePath: levelLimiter.createRootNodePath(entry) }));

	while (parents.length > 0) {
		const newParents: Parent[] = [];
		for (const { entity, nodePath } of parents) {
			const childNodes = linkGroups.get(entity.docRef);
			if (!childNodes) {
				continue;
			}

			// Filter children by branch-aware depth limiting; propagate depth along the path.
			// Note: even if children are not traversable further, we still add all of them as
			// child nodes for the current parent so they appear in the UI.
			for (const childLink of childNodes) {
				const childNodePath = levelLimiter.isTraversable(nodePath, childLink);
				if (childNodePath) {
					newParents.push({ entity: childLink, nodePath: childNodePath });
				}
			}

			const existingDataHolder = nextDataHolders.find(({ descriptor }) => {
				const { source } = descriptor;
				return (
					!TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(descriptor) &&
					!TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor) &&
					source === entity.docRef
				);
			});
			if (existingDataHolder) {
				nextDataHolders = nextDataHolders.map((dataHolder) => {
					if (
						!TreeEngineDataHolder.Descriptor.RootNodes.isAssignableFrom(dataHolder.descriptor) &&
						!TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(dataHolder.descriptor) &&
						dataHolder.descriptor.source === entity.docRef
					) {
						return addChildNodesToDataHolder(models, dataHolder, childNodes);
					}
					return dataHolder;
				});
			} else {
				nextDataHolders.push(addChildNodesToDataHolder(models, createChildDataHolder(entity.docRef), childNodes));
			}
		}

		parents = newParents;
	}

	return nextDataHolders.map((dataHolder) => {
		return { ...dataHolder, busy: false, loadingState: "loaded" };
	});
}

function createRootDataHolder(): TreeEngineDataHolder {
	return {
		descriptor: { type: "ROOT_NODES" },
		savingState: "not_saved",
		loadingState: "loaded",
		dirty: false,
		data: {},
		slices: {}
	};
}

function addRootNodesToDataHolder(
	dataHolder: TreeEngineDataHolder,
	entries: DataOperation.Query.TreeNodes.Result["entries"]
): TreeEngineDataHolder {
	let data: TreeEngineState.Data = {};
	const meta: TreeEngineDataHolder.Meta = {
		children: []
	};

	for (const entry of entries) {
		const node: TreeEngineState.Node = {
			identifier: Identifier.from(entry.docRef),
			document: entry.document,
			children: []
		};
		data = TreeDataUtils.addNodeData(data, node, TreeDataUtils.MutationType.MUTABLE);
		meta.children.push(node.identifier);
	}
	const totalChildren = meta.children.length;
	const withSizeMeta: TreeEngineDataHolder.Meta = {
		...meta,
		fullSize: meta.fullSize ?? totalChildren
	};

	return {
		...dataHolder,
		data,
		slices: TreeEngineDataHolder.Slices.toSlices(withSizeMeta)
	};
}

function addHiddenRootNodesToDataHolder(
	models: ModelsState,
	dataHolder: TreeEngineDataHolder,
	entries: DataOperation.Query.TreeNodes.Result["entries"]
): TreeEngineDataHolder {
	const { descriptor } = dataHolder;

	if (
		!TreeEngineDataHolder.Descriptor.HiddenRootNodes.isAssignableFrom(descriptor) ||
		!descriptor.relationshipModel ||
		!descriptor.relationshipRole
	) {
		throw TreeEngineError.TypeError("TreeEngine.DataHolder", {
			actual: JSON.stringify(dataHolder),
			expect: "HiddenRootNodes descriptor expected."
		});
	}

	const relationshipModel = ModelSelector.relationshipModelByName(descriptor.relationshipModel)(models);
	if (!relationshipModel) {
		throw TreeEngineError.NotFoundError("RelationshipModel", descriptor.relationshipModel);
	}
	const childEntity = RelationshipModelUtils.getEntityCharacteristicByReversedRole(
		relationshipModel,
		descriptor.relationshipRole
	);
	if (!childEntity) {
		throw TreeEngineError.NotFoundError(
			"RelationshipModel.EntityCharacteristic",
			`reversed entity of ${descriptor.relationshipRole} in ${descriptor.relationshipModel}`
		);
	}
	const parentEntity = RelationshipModelUtils.getEntityCharacteristicByRole(
		relationshipModel,
		descriptor.relationshipRole
	);

	let data: TreeEngineState.Data = {};
	const meta: TreeEngineDataHolder.Meta = {
		children: [],
		identifier: descriptor.source ? Identifier.from(descriptor.source) : undefined
	};
	for (const entry of entries) {
		const node: TreeEngineState.Node = {
			identifier: Identifier.from(entry.docRef),
			document: entry.document,
			children: []
		};

		const generatedId = `generated_id_${generateUid()}`;
		const treeEngineLink: TreeEngineState.Link = {
			identifier: {
				type: descriptor.relationshipModel,
				id: generatedId
			},
			linkRef: {
				id: generatedId,
				linkDescriptor: {
					relationshipModel: descriptor.relationshipModel,
					entities: [
						{
							role: descriptor.relationshipRole,
							docRef: descriptor.source,
							modelName: parentEntity?.documentModel ?? ""
						},
						{ role: childEntity.role, docRef: entry.docRef, modelName: childEntity.documentModel }
					]
				}
			}
		};

		data = TreeDataUtils.addNodeData(data, node, TreeDataUtils.MutationType.MUTABLE);
		data = TreeDataUtils.addLinkData(data, treeEngineLink, TreeDataUtils.MutationType.MUTABLE);
		meta.children.push(treeEngineLink.identifier);
	}

	const totalChildren = meta.children.length;
	const withSizeMeta: TreeEngineDataHolder.Meta = {
		...meta,
		fullSize: meta.fullSize ?? totalChildren
	};

	return {
		...dataHolder,
		data,
		slices: TreeEngineDataHolder.Slices.toSlices(withSizeMeta)
	};
}

function createChildDataHolder(source: string): TreeEngineDataHolder {
	return {
		descriptor: { type: "CHILD_NODES", source },
		savingState: "not_saved",
		loadingState: "loaded",
		dirty: false,
		data: {},
		slices: {}
	};
}

function addChildNodesToDataHolder(
	models: ModelsState,
	dataHolder: TreeEngineDataHolder,
	links: DataOperation.Query.TreeNodes.Link[]
): TreeEngineDataHolder {
	let data: TreeEngineState.Data = {};
	const meta: TreeEngineDataHolder.Meta = {
		children: []
	};

	const linkGroupsByLinkId = new Map<string, DataOperation.Query.TreeNodes.Link[]>();
	for (const link of links) {
		const existingGroup = linkGroupsByLinkId.get(link.linkId);
		if (existingGroup) {
			linkGroupsByLinkId.set(link.linkId, [...existingGroup, link]);
		} else {
			linkGroupsByLinkId.set(link.linkId, [link]);
		}
	}

	for (const linkGroup of linkGroupsByLinkId.values()) {
		const [linkEntry, link] = createLink(models, linkGroup);

		const node: TreeEngineState.Node = {
			identifier: Identifier.from(linkEntry.docRef),
			document: linkEntry.document,
			children: []
		};
		data = TreeDataUtils.addNodeData(data, node, TreeDataUtils.MutationType.MUTABLE);
		data = TreeDataUtils.addLinkData(data, link, TreeDataUtils.MutationType.MUTABLE);
		meta.children.push(link.identifier);
	}

	const totalChildren = meta.children.length;
	const withSizeMeta: TreeEngineDataHolder.Meta = {
		...meta,
		fullSize: meta.fullSize ?? totalChildren
	};

	return {
		...dataHolder,
		data,
		slices: TreeEngineDataHolder.Slices.toSlices(withSizeMeta)
	};
}

function createLink(
	models: ModelsState,
	links: DataOperation.Query.TreeNodes.Link[]
): [DataOperation.Query.TreeNodes.Link, TreeEngineState.Link] {
	let linkEntry: DataOperation.Query.TreeNodes.Link | undefined;
	let linkDocumentEntry: DataOperation.Query.TreeNodes.Link | undefined;

	for (const link of links) {
		const relationshipModel = ModelSelector.relationshipModelByName(link.relationshipModel)(models);
		if (relationshipModel?.content.linkDocumentModel === link.documentModelName) {
			linkDocumentEntry = link;
		} else {
			linkEntry = link;
		}
	}
	if (linkEntry === undefined) {
		throw TreeEngineError.TypeError("TreeEngine.Link", { actual: JSON.stringify(links) });
	}

	const sourceRelationshipModel = ModelSelector.relationshipModelByName(linkEntry.relationshipModel)(models);
	const sourceEntity = sourceRelationshipModel
		? RelationshipModelUtils.getEntityCharacteristicByRole(sourceRelationshipModel, linkEntry.sourceRole)
		: undefined;

	const link: TreeEngineState.Link = {
		identifier: { type: linkEntry.relationshipModel, id: linkEntry.linkId },
		linkRef: {
			id: linkEntry.linkId,
			linkDescriptor: {
				relationshipModel: linkEntry.relationshipModel,
				entities: [
					{ role: linkEntry.sourceRole, docRef: linkEntry.sourceDocRef, modelName: sourceEntity?.documentModel ?? "" },
					{ role: linkEntry.targetRole, docRef: linkEntry.targetDocRef, modelName: linkEntry.documentModelName }
				]
			}
		},
		linkDocument: linkDocumentEntry?.document
	};

	return [linkEntry, link];
}

/**
 * Branch-aware level limiter for Tree strategy.
 *
 * Why it exists?
 * Data Services Query API links doesn't always return every child node but rather categorized into different relationship types.
 *
 * Example scenario:
 *
 *   TeamA
 *   |-- Person A
 *   |-- Team B
 *   |--|-- Person B
 *   |--|-- Team C
 *   |--|--|-- Person C1
 *   |--|--|-- Person C2
 *   |--|--|-- Team D
 *
 * Then if a query is sent with maxDepth config as TeamTeam = 2 and TeamPerson = 1. The result will look like this:
 *   ==TeamTeam==
 *   TeamA
 *   |-- Team B
 *   |--|-- Team C (maxDepth reached)
 *
 *   ==TeamPerson==
 *   TeamA
 *   |-- Person A
 *   Team B
 *   |-- Person B
 *   Team C
 *   |-- Person C1
 *   |-- Person C2
 *
 * This will result in the Team D to be missing from the "Team C", even though is has its children loaded.
 * Therefore, it is necessary to limit the child data holders creation for "Team C" when the limit has been reached.
 *
 * - When NOT preloading child nodes:
 *   The Query response always omits links at the terminal level (e.g., Team C => TeamTeam => Team D), so
 *   we avoid traversing into that level to prevent creating child data holders that can't be completed.
 *   To be concretely:
 *   + Always block beyond maxDepth.
 *   + At exactly maxDepth, block if the step is a self-repeat (e.g., TeamTeam) or if the step is terminal
 *     (has no deeper LinkQuery children, e.g., TeamPerson).
 *   + Otherwise allow (e.g., non-self step with deeper configured children), so follow-up expands can continue.
 *   We still add the immediate children to the current parent's data holder..
 *
 * - When preloading child nodes:
 *   The configured maxDepth in this mode will always got +1, so the result could be able to
 *   include all possible children at the terminal level.
 *   However, the tree always blocks traversing beyond the configured maxDepth, so it will only visit the terminal level
 *   and stop traversing deeper.
 *
 * What it does
 * - Tracks, per branch, where we are in the query's LinkQuery tree (which relationships are allowed next).
 * - Counts depth against the specific LinkQuery node (not just relationship name), so different
 *   segments of the subtree with the same relationship model are handled independently.
 * - Decides traversal using that node's maxDepth and whether deeper LinkQuery steps exist.
 *   - Non-preload: omit only the terminal last level to preserve expand-on-demand.
 *   - Preload: include the last level so the UI data is complete in one shot.
 *
 * Important notes
 * - Depth is tracked per branch (subtree) and per LinkQuery chain.
 * - "Last level" means a terminal level in that subtree (no deeper LinkQuery children with maxDepth > 0).
 * - Preload-child mode visits the last level; non-preload omits it to keep follow-up expands functional.
 */
function createLevelLimiter(params: { preloadChildNodes?: boolean }) {
	type LinkQuery = DataOperation.Query.TreeNodes.LinkQuery;
	type NodePath = TreeEngineState.NodePath;
	// For each branch, track how many times each LinkQuery node was taken.
	const depthCountByPath: Map<NodePath, Map<LinkQuery, number>> = new Map();
	// For each branch, track which LinkQuery nodes can be taken next.
	const nextCandidatesByPath: Map<NodePath, LinkQuery[]> = new Map();
	// For each nodePath, store the LinkQuery node used to arrive here (to allow self-repetition decisions).
	const currentStepByPath = new Map<NodePath, LinkQuery | undefined>();
	const makeRootNodePath = (entry: DataOperation.Query.TreeNodes.Entry): NodePath => [Identifier.from(entry.docRef)];
	const makeChildNodePath = (parentPath: NodePath, link: DataOperation.Query.TreeNodes.Link): NodePath => {
		const linkIdentifier: Identifier = { id: link.linkId, type: link.relationshipModel };
		return [...parentPath, linkIdentifier];
	};
	// Root-level candidates from the query
	let rootCandidates: LinkQuery[] = [];

	const instance = {
		initialize: (query: DataOperation.Query.TreeNodes.Query) => {
			rootCandidates = query.links ?? [];
			return instance;
		},
		createRootNodePath: (entry: DataOperation.Query.TreeNodes.Entry): NodePath => {
			const rootPath = makeRootNodePath(entry);
			depthCountByPath.set(rootPath, new Map());
			nextCandidatesByPath.set(rootPath, rootCandidates);
			currentStepByPath.set(rootPath, undefined);
			return rootPath;
		},
		isTraversable: (nodePath: NodePath, linkQuery: DataOperation.Query.TreeNodes.Link): NodePath | undefined => {
			const parentCounts = depthCountByPath.get(nodePath) ?? new Map<LinkQuery, number>();
			const candidates = nextCandidatesByPath.get(nodePath) ?? [];
			// Prefer the current step when it repeats the same relationship model; else match from candidates
			const currentStep = currentStepByPath.get(nodePath);
			const matchedStep =
				currentStep?.relationshipModel === linkQuery.relationshipModel
					? currentStep
					: candidates.find((c) => c.relationshipModel === linkQuery.relationshipModel);
			if (!matchedStep) {
				return undefined; // not part of the configured subtree
			}

			const nextCount = (parentCounts.get(matchedStep) ?? 0) + 1;
			const maxDepth = matchedStep.maxDepth;
			const isSelfRepeat = currentStep === matchedStep;
			const hasDeeper = matchedStep.childNodes?.some((childNode) => childNode.maxDepth > 0);

			let allowed = true;

			if (params.preloadChildNodes) {
				// Preload mode: traverse into last level (<= max)
				if (nextCount > maxDepth) {
					allowed = false;
				}
			} else {
				// Normal mode: omit only terminal last level; always block beyond max
				if (nextCount > maxDepth) {
					allowed = false;
				} else if (nextCount === maxDepth && (isSelfRepeat || !hasDeeper)) {
					allowed = false;
				}
			}

			if (!allowed) {
				return undefined;
			}

			// Create a new child path with updated counters and candidates
			const childPath = makeChildNodePath(nodePath, linkQuery);
			const childCounts = new Map(parentCounts);
			childCounts.set(matchedStep, nextCount);
			depthCountByPath.set(childPath, childCounts);
			nextCandidatesByPath.set(childPath, matchedStep.childNodes ?? []);
			currentStepByPath.set(childPath, matchedStep);
			return childPath;
		}
	};

	return instance;
}
