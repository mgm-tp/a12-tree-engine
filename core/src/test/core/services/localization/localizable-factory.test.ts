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

import { LocalizableFactory, RESOURCE_KEYS } from "../../../../core/services/localization/index.js";

describe("com.mgmtp.a12.overview-engine.services.localization.internal.localizable-factory", () => {
	it("createResourceLocalizables", () => {
		expect(LocalizableFactory.createResourceLocalizables(RESOURCE_KEYS.treeEngine.notification.title.error)).toEqual([
			{ args: undefined, defaults: { de: "Fehler", en: "Error" }, key: "treeEngine.notification.title.error" },
			{
				args: undefined,
				defaults: { de: "treeEngine.notification.title.error", en: "treeEngine.notification.title.error" },
				key: "treeEngine.notification.title.error"
			}
		]);

		expect(LocalizableFactory.createResourceLocalizables("unknown.resource")).toEqual([
			{ args: undefined, defaults: { de: undefined, en: undefined }, key: "unknown.resource" },
			{ args: undefined, defaults: { de: "unknown.resource", en: "unknown.resource" }, key: "unknown.resource" }
		]);
	});

	it("createTreeElementLocalizables", () => {
		expect(
			LocalizableFactory.createTreeElementLocalizables(
				"product",
				["columns", "label"],
				[
					{ locale: "en", text: "label en" },
					{ locale: "de_DE", text: "label [de_DE]" }
				]
			)
		).toEqual([
			{ args: undefined, defaults: { de_DE: "label [de_DE]", en: "label en" }, key: "uiModel.product.columns.label" }
		]);

		expect(LocalizableFactory.createTreeElementLocalizables("product", ["columns", "label"], undefined)).toEqual([
			{ args: undefined, defaults: {}, key: "uiModel.product.columns.label" }
		]);
	});

	it("createEnumerationValueLocalizables", () => {
		expect(
			LocalizableFactory.createEnumerationValueLocalizables(
				"DomainPerson",
				[{ elementName: "person" }, { elementName: "PersonalData" }, { elementName: "Gender" }],
				{
					value: "MALE",
					label: [
						{ locale: "en", text: "Male" },
						{ locale: "de", text: "Männlich" }
					]
				}
			)
		).toEqual([
			{
				args: undefined,
				defaults: { de: "Männlich", en: "Male" },
				key: "documentModel.enumValue.DomainPerson.person.PersonalData.Gender.MALE"
			}
		]);
	});

	it("createBooleanValueLocalizables", () => {
		expect(
			LocalizableFactory.createBooleanValueLocalizables(
				"DomainPerson",
				[{ elementName: "person" }, { elementName: "PersonalData" }, { elementName: "Married" }],
				true
			)
		).toEqual([
			{
				args: undefined,
				defaults: { de: undefined, en: undefined },
				key: "documentModel.boolean.DomainPerson.person.PersonalData.Married.true"
			},
			{ args: undefined, defaults: { de: "ja", en: "yes" }, key: "true" },
			{
				args: undefined,
				defaults: { de: "true", en: "true" },
				key: "documentModel.boolean.DomainPerson.person.PersonalData.Married.true"
			}
		]);

		expect(
			LocalizableFactory.createBooleanValueLocalizables(
				"DomainPerson",
				[{ elementName: "person" }, { elementName: "PersonalData" }, { elementName: "Married" }],
				false
			)
		).toEqual([
			{
				args: undefined,
				defaults: { de: undefined, en: undefined },
				key: "documentModel.boolean.DomainPerson.person.PersonalData.Married.false"
			},
			{ args: undefined, defaults: { de: "nein", en: "no" }, key: "false" },
			{
				args: undefined,
				defaults: { de: "false", en: "false" },
				key: "documentModel.boolean.DomainPerson.person.PersonalData.Married.false"
			}
		]);

		expect(
			LocalizableFactory.createBooleanValueLocalizables(
				"DomainPerson",
				[{ elementName: "person" }, { elementName: "PersonalData" }, { elementName: "Married" }],
				null
			)
		).toEqual([
			{
				args: undefined,
				defaults: { de: undefined, en: undefined },
				key: "documentModel.boolean.DomainPerson.person.PersonalData.Married.null"
			},
			{ args: undefined, defaults: { de: "", en: "" }, key: "null" },
			{
				args: undefined,
				defaults: { de: "null", en: "null" },
				key: "documentModel.boolean.DomainPerson.person.PersonalData.Married.null"
			}
		]);
	});

	it("createConfirmValueLocalizables", () => {
		expect(
			LocalizableFactory.createConfirmValueLocalizables(
				"DomainPerson",
				[{ elementName: "person" }, { elementName: "PersonalData" }, { elementName: "Confirm" }],
				true
			)
		).toEqual([
			{
				args: undefined,
				defaults: { de: undefined, en: undefined },
				key: "documentModel.confirm.DomainPerson.person.PersonalData.Confirm.true"
			},
			{ args: undefined, defaults: { de: "ja", en: "yes" }, key: "true" },
			{
				args: undefined,
				defaults: { de: "true", en: "true" },
				key: "documentModel.confirm.DomainPerson.person.PersonalData.Confirm.true"
			}
		]);

		expect(
			LocalizableFactory.createConfirmValueLocalizables(
				"DomainPerson",
				[{ elementName: "person" }, { elementName: "PersonalData" }, { elementName: "Married" }],
				null
			)
		).toEqual([
			{
				args: undefined,
				defaults: { de: undefined, en: undefined },
				key: "documentModel.confirm.DomainPerson.person.PersonalData.Married.null"
			},
			{ args: undefined, defaults: { de: "", en: "" }, key: "null" },
			{
				args: undefined,
				defaults: { de: "null", en: "null" },
				key: "documentModel.confirm.DomainPerson.person.PersonalData.Married.null"
			}
		]);
	});

	it("createResourceLocalizable", () => {
		expect(LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.treeEngine.notification.title.error)).toEqual({
			args: undefined,
			defaults: { de: "Fehler", en: "Error" },
			key: "treeEngine.notification.title.error"
		});

		expect(
			LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.treeEngine.notification.title.error, {
				aKey: { value: "aValue", type: "plain" }
			})
		).toEqual({
			args: { aKey: { type: "plain", value: "aValue" } },
			defaults: { de: "Fehler", en: "Error" },
			key: "treeEngine.notification.title.error"
		});
	});

	it("createSingleTextLocalizable", () => {
		expect(LocalizableFactory.createSingleTextLocalizable(["model", "values", "false"], "false")).toEqual({
			args: undefined,
			defaults: { de: "false", en: "false" },
			key: "model.values.false"
		});
	});

	it("createTextsLocalizable", () => {
		expect(
			LocalizableFactory.createTextsLocalizable(
				["model", "button", "label"],
				[
					{ locale: "en", text: "button label" },
					{ locale: "de_DE", text: "button label [de_DE]" }
				]
			)
		).toEqual({
			args: undefined,
			defaults: { de_DE: "button label [de_DE]", en: "button label" },
			key: "model.button.label"
		});
	});
});
