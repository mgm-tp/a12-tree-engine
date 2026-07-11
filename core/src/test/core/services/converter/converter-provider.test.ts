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

//
// import { expect } from "chai";
// import * as Faker from "faker";
// import * as Sinon from "sinon";
// import * as TypeMoq from "typemoq";
//
// import {
// 	DocumentModel,
// 	FieldInstanceValue,
// 	IGeneratedCodeAccessor
// } from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/api";
// import { ModelPath } from "@com.mgmtp.a12.base/base-model-api/lib/main/model";
// import { DataFormats, defaultDataFormats, Locale } from "@com.mgmtp.a12.utils/utils-localization";
//
// import { defaultConverterProvider } from "../../../../core/services/converter";
// import { Models } from "../../../../core/store/index.js";
// import { defaultEngineState, deLocale } from "../../../setup/basic.spec.js";
// import { mockType } from "../../../utils/mock-utils.js";
//
// describe("@com.mgmtp.a12.tree-engine.core.services.converter.converter-provider", () => {
// 	describe("defaultConverterProvider", () => {
// 		const documentModelName = Faker.datatype.uuid();
// 		const documentModel = mockType<DocumentModel>();
// 		const documentModelPath: ModelPath = [{ elementName: "element-1" }, { elementName: "element-2" }];
// 		const documentModelPathString = ModelPath.toString(documentModelPath);
//
// 		const locale = deLocale;
//
// 		// mock validation code
// 		const convertFromBasicTypeStub = Sinon.stub();
// 		const metaFieldMock = TypeMoq.Mock.ofType<IMetaField>();
// 		const metaModelMock = TypeMoq.Mock.ofType<IMetaModel>();
// 		const validatorProviderMock = TypeMoq.Mock.ofType<IGeneratedCodeAccessor>();
//
// 		const models: Models = {
// 			...defaultEngineState.models,
// 			documentAndValidationModels: [
// 				...defaultEngineState.models.documentAndValidationModels,
// 				{
// 					name: documentModelName,
// 					validatorProvider: validatorProviderMock.object,
// 					documentModel
// 				}
// 			]
// 		};
//
// 		before(() => {
// 			metaFieldMock.setup((obj) => obj.convertFromBasicType).returns(() => convertFromBasicTypeStub);
// 			metaModelMock
// 				.setup((obj) => obj.getValue(IMetaKeys.MODEL_META_FIELD, documentModelPathString))
// 				.returns(() => metaFieldMock.object);
// 			validatorProviderMock.setup((obj) => obj.getMetaModel()).returns(() => metaModelMock.object);
// 		});
//
// 		beforeEach(() => {
// 			convertFromBasicTypeStub.resetHistory();
// 		});
//
// 		after(() => {
// 			Sinon.restore();
// 		});
//
// 		describe("given presentation information provider is not passed", () => {
// 			const converter = defaultConverterProvider(models, locale);
//
// 			describe("the created converter", () => {
// 				describe("given a valid value", () => {
// 					it("should use the correct validation code with default PresentationInformationProvider", () => {
// 						converter.formatValue(documentModelName, documentModelPath, "Test");
// 						Sinon.assert.calledOnceWithExactly(
// 							convertFromBasicTypeStub,
// 							"Test",
// 							defaultDataFormats(locale),
// 							Sinon.match.any,
// 							Locale.toString(locale)
// 						);
// 					});
// 				});
//
// 				describe("given a value which is not of FieldInstanceValue", () => {
// 					const value = TypeMoq.Mock.ofType<FieldInstanceValue | object>();
// 					it("should throw error", () => {
// 						expect(() => converter.formatValue(documentModelName, documentModelPath, value.object)).toThrow();
// 					});
// 				});
//
// 				describe("given a FieldInstanceValue value and invalid document model name", () => {
// 					const value = "theValue";
// 					it("should throw error", () => {
// 						expect(() => converter.formatValue("InvalidModelName", documentModelPath, value)).toThrow();
// 					});
// 				});
// 			});
// 		});
//
// 		describe("given presentation information provider is passed", () => {
// 			const piProviderStub = Sinon.stub();
// 			const dataFormats = mockType<DataFormats>();
// 			const converter = defaultConverterProvider(models, locale, dataFormats);
//
// 			before(() => {
// 				piProviderStub.withArgs(locale).returns(dataFormats);
// 			});
//
// 			describe("the created converter", () => {
// 				describe("given a valid value", () => {
// 					it("should use the correct validation with the passed presentation information", () => {
// 						converter.formatValue(documentModelName, documentModelPath, "TestValue");
// 						Sinon.assert.calledOnceWithExactly(
// 							convertFromBasicTypeStub,
// 							"TestValue",
// 							dataFormats,
// 							Sinon.match.any,
// 							Locale.toString(locale)
// 						);
// 					});
// 				});
//
// 				describe("given a value which is not of FieldInstanceValue", () => {
// 					const value = TypeMoq.Mock.ofType<FieldInstanceValue | object>();
// 					it("should throw error", () => {
// 						expect(() => converter.formatValue(documentModelName, documentModelPath, value.object)).toThrow();
// 					});
// 				});
//
// 				describe("given a FieldInstanceValue value and invalid document model name", () => {
// 					it("should throw error", () => {
// 						expect(() => converter.formatValue("InvalidDocumentModelName", documentModelPath, "value")).toThrow();
// 					});
// 				});
// 			});
// 		});
// 	});
// });
