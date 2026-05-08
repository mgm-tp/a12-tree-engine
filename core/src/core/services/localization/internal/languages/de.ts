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

import { type RESOURCE_KEYS } from "./keys.js";

// prettier-ignore
export const de: typeof RESOURCE_KEYS = {
	"true": "ja",
	"false": "nein",
	"null": "",
	"attachment-handler": {
		"error": {
			"unknown": "Ein unbekannter Fehler ist aufgetreten.",
			"internal": "Ein interner Fehler ist aufgetreten.",
			"abort": "Beim Abbrechen trat ein Fehler auf.",
			"not-found": "Die ausgewählte Datei kann nicht mehr gefunden werden.",
			"security": "Keinen Zugriff auf die ausgewählte Datei.",
			"no-preview": "Eine Vorschau existiert nicht.",
			"invalid-file": "Die letzte angegebene Datei konnte nicht verarbeitet werden.",
			"no-handler": "Kein AttachmentHandler wurde definiert."
		}
	},
	"treeEngine": {
		"error": {
			"requestLimitExceeded": {
				"title": "Anfragen-Limit überschritten",
				"message": "Zu viele Anfragen. Maximal erlaubt sind $maxRequests$. Bitte reduzieren Sie die Anzahl der Operationen."
			}
		},
		"notification": {
			"title": {
				"error": "Fehler",
				"warning": "Achtung",
			},
			"message": {
				"moveFromCycleToRootError": "Ein Knoten kann nicht aus einem Zyklus gezogen und zu einer Wurzel gemacht werden",
				"reorderRootNodeError": "Die Stammknoten können nicht neu angeordnet werden.",
				"unavailableNodeShortcut": "Diese Aktion kann auf diesem Knoten nicht durchgeführt werden.",
				"unavailableEngineShortcut": "Diese Aktion kann nicht durchgeführt werden."
			}
		},
		"dialog": {
			"delete":{
				"button": {
					"delete": "LÖSCHEN",
					"cancel": "ABBRECHEN"
				}
			},
			"confirmation": {
				"button": {
					"confirm": "Bestätigen",
					"close": "Schließen"
				},
			},
			"insertion": {
				"root": {
					/** Key of heading for root node insertion dialog */
					"heading": "Bitte wählen Sie ein Stammdokumentmodell aus"
				},
				"child": {
					/** Key of heading for child node insertion dialog */
					"heading": "Bitte ein Kinddokumentmodel auswählen",
				},
				"sibling": {
					/** Key of heading for sibling node insertion dialog */
					"heading": "Bitte wählen Sie ein nebengeordnetes Dokumentmodell aus",
				}
			},
			"makeRootNode": {
				"title": "Bestätigung",
				"message": `Möchten Sie den gewählten Knoten "$node$" wirklich als Wurzelknoten festlegen? Dadurch werden die $linksCount$ Verknüpfung(en) zwischen diesem Knoten und seinem Vaterknoten vollständig entfernt.`
			},
			"clearMultiSelection": {
				"title": "Warnung",
				"message": "Einklappen des Mehrfachauswahlfelds wird die Auswahl der Dokumente zurückgesetzt. Sind Sie sicher, dass Sie fortfahren möchten?",
				"button": {
					"clearSelection": "AUSWAHL LÖSCHEN",
					"cancel": "ABBRECHEN"
				}
			},
		},
		"wholeTreeExpansion": {
			"expandAll": "Alles aufklappen",
			"collapseAll": "Alles zuklappen"
		},
		"multiSelection": {
			"multiSelectionButton": {
				"expandTitle": "Öffne Funktionen für Massenbearbeitung	",
				"collapseTitle": "Schließe Funktionen für Massenbearbeitung",
			},
			"overallCheckboxTitle": "Alle auswählen / abwählen",
			"rowCheckboxTitle": "Auswählen",
			"summary": "$amount$ Knoten"
		},
		"circularWarning": "Eine kreisförmige Link-Struktur wurde entdeckt, dadurch sind bestimmte Funktionen für wiederholte Knoten nicht verfügbar.",
		"initialView": {
			"message": "Fügen Sie ein neues Element zum Baum hinzu.",
			"addButton": {
				"label": "Hinzufügen"
			}
		},
		"pagination": {
			"loadMore": "Laden Sie mehr",
			"loadMoreTitle": "Laden Sie mehr für $node$",
			"loadMoreForRootTitle": "Laden Sie mehr für Root",
			"loadAll": "Laden Sie alle $amount$ Knoten",
			"loadAllTitle": "Laden Sie alles für $node$",
			"loadAllForRootTitle": "Laden Sie alles für Root",
			"belongsTo": "Paginierung, gehört zu $node$",
			"belongsToRoot": "Paginierung, gehört zu Root"
		}
	}
};
