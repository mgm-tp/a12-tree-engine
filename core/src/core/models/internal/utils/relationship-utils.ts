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

import { type Relationship, type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { TreeEngineError } from "../../../error/index.js";
import { Identifier } from "../../../store/index.js";

export namespace LinkDescriptorUtils {
	export function getLinkEntitySpecByRole(
		linkDescriptor: Relationship.LinkDescriptorResponse,
		role: string
	): Relationship.LinkEntitySpecResponse | undefined {
		return linkDescriptor.entities.find((entity) => entity.role === role);
	}

	export function getLinkEntitySpecByReversedRole(
		linkDescriptor: Relationship.LinkDescriptorResponse,
		role: string
	): Relationship.LinkEntitySpecResponse | undefined {
		if (!getLinkEntitySpecByRole(linkDescriptor, role)) {
			return undefined;
		}
		return linkDescriptor.entities.find((entity) => entity.role !== role);
	}

	export function getNodeIdentifierByRole(
		linkDescriptor: Relationship.LinkDescriptorResponse,
		role: string
	): Identifier | undefined {
		const entity = getLinkEntitySpecByRole(linkDescriptor, role);
		if (!entity?.docRef) {
			return undefined;
		}
		return Identifier.from(entity);
	}

	export function getNodeIdentifierByReversedRole(
		linkDescriptor: Relationship.LinkDescriptorResponse,
		role: string
	): Identifier | undefined {
		const entity = getLinkEntitySpecByReversedRole(linkDescriptor, role);
		if (!entity?.docRef) {
			return undefined;
		}
		return Identifier.from(entity);
	}

	export function getNodeIdentifiers(linkDescriptor: Relationship.LinkDescriptorResponse): Identifier[] {
		return linkDescriptor.entities.map((entity) => {
			if (!entity.docRef) {
				throw TreeEngineError.TypeError("RelationshipModel.LinkEntitySpec", { expect: "Non-null docRef" });
			}
			return Identifier.from(entity);
		});
	}

	export function getNodeIdentifierFromOtherSide(
		linkDescriptor: Relationship.LinkDescriptorResponse,
		nodeIdentifier: Identifier
	): Identifier | undefined {
		const [identifierA, identifierB] = getNodeIdentifiers(linkDescriptor);
		if (!Identifier.areEqual(nodeIdentifier, identifierA) && !Identifier.areEqual(nodeIdentifier, identifierB)) {
			return undefined;
		}
		return Identifier.areEqual(nodeIdentifier, identifierA) ? identifierB : identifierA;
	}

	export function getNodeIdentifierFromRootNode(
		linkDescriptor: Relationship.LinkDescriptorResponse,
		rootIdentifier: Identifier
	): Identifier {
		const entity = linkDescriptor.entities.find(({ docRef }) => {
			return docRef && !Identifier.areEqual(rootIdentifier, Identifier.from(docRef));
		});
		if (!entity?.docRef) {
			throw TreeEngineError.NotFoundError("RelationshipModel.LinkEntitySpec", rootIdentifier.id);
		}

		return Identifier.from(entity);
	}
}

export namespace RelationshipModelUtils {
	export function getEntityCharacteristicByRole(relationshipModel: RelationshipModel, role: string) {
		return relationshipModel.content.entityCharacteristics.find(
			(entityCharacteristic) => entityCharacteristic.role === role
		);
	}

	export function getEntityCharacteristicByReversedRole(relationshipModel: RelationshipModel, role: string) {
		if (!getEntityCharacteristicByRole(relationshipModel, role)) {
			return undefined;
		}
		return relationshipModel.content.entityCharacteristics.find(
			(entityCharacteristic) => entityCharacteristic.role !== role
		);
	}
}
