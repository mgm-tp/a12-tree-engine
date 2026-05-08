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
import { vi } from "vitest";

import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/api.js";
import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { Attachment } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { TextOutput } from "@com.mgmtp.a12.widgets/widgets-core/lib/text-output/main/text-output.view.js";
import { CssEllipsis } from "@com.mgmtp.a12.widgets/widgets-core/lib/css-ellipsis/main/css-ellipsis.view.js";

import { de } from "../../../../../../../core/services/localization/internal/languages/de.js";
import { en } from "../../../../../../../core/services/localization/internal/languages/en.js";
import { type TreeEngineState, type Models } from "../../../../../../../core/store/index.js";
import {
	AttachmentCell,
	BodyCellUIValue,
	DefaultComponentMap,
	MultiSelectCell,
	type TreeEngineContextProvider,
	type TreeEngineRowContext
} from "../../../../../../../core/view/index.js";
import { deLocale, defaultEngineState } from "../../../../../../setup/basic.spec.js";
import { mockType } from "../../../../../../utils/mock-utils.js";
import { createDocumentModel, createEngineState, createMultiSelectGroup } from "../../../../../../utils/model-utils.js";
import { testIsNullComponent } from "../../../../../../utils/test-utils.js";
import { MultiSelectGroup } from "../../../../../../../core/services/multi-select/index.js";

import { teamCellProps, BodyCellWrapper, CustomWidget } from "./shared.js";

/* eslint-disable @typescript-eslint/ban-ts-comment */
describe.skip("@com.mgmtp.a12.tree-engine.core.view.components.tree-engine.sub-components.body-cell.body-cell-ui-value", () => {
	const basicEngineState = defaultEngineState;
	const basicComponentMap = DefaultComponentMap;

	interface FieldBodyCellProps<FieldType extends DocumentModel.FieldType> extends BodyCellUIValue.Props {
		element: DocumentModel.Field & {
			fieldType: FieldType;
		};
	}

	function setupTest(
		props: BodyCellUIValue.Props,
		customEngineState?: Partial<TreeEngineState>,
		customEngineContextProps?: Partial<TreeEngineContextProvider.Props>,
		locale?: Locale
	) {
		return mount(
			<BodyCellUIValue {...props} />,
			{
				wrappingComponent: BodyCellWrapper,
				wrappingComponentProps: {
					customEngineState,
					customEngineContextProps,
					rowContextProps: mockType<TreeEngineRowContext.Type>()
				}
			},
			locale
		);
	}

	describe("when not found the column by columnRef", () => {
		beforeAll(() => {
			vi.spyOn(console, "error").mockImplementation(() => {});
		});

		afterAll(() => {
			vi.restoreAllMocks();
		});

		it("should throw an error", () => {
			const props = mockType<BodyCellUIValue.Props>({
				columnRef: "1024"
			});

			expect(() => setupTest(props)).toThrow();
		});
	});

	describe("given a field element", () => {
		const basicFieldProps: FieldBodyCellProps<DocumentModel.FieldType> = {
			...teamCellProps,
			element: {
				type: "Field",
				id: "1024",
				name: "NameOfField",
				fieldType: {
					type: "BooleanType"
				}
			},
			documentId: "1024",
			value: true,
			documentModelName: "DomainTeam",
			documentModelPath: [{ elementName: "root" }]
		};
		const basicEnumFieldProps: FieldBodyCellProps<DocumentModel.EnumerationType> = {
			...basicFieldProps,
			value: "Munich",
			element: {
				...basicFieldProps.element,
				fieldType: {
					type: "EnumerationType",
					values: [
						{
							value: "Munich",
							label: [
								{ locale: "en", text: "Munich en" },
								{ locale: "de", text: "Munich de" }
							]
						},
						{
							value: "NewYork",
							label: [
								{ locale: "en", text: "NewYork en" },
								{ locale: "de", text: "NewYork de" }
							]
						}
					]
				}
			}
		};

		const basicBooleanFieldProps: FieldBodyCellProps<DocumentModel.BooleanType> = {
			...basicFieldProps,
			value: true,
			element: {
				...basicFieldProps.element,
				fieldType: {
					type: "BooleanType"
				}
			}
		};

		const basicConfirmFieldProps: FieldBodyCellProps<DocumentModel.ConfirmType> = {
			...basicFieldProps,
			value: true,
			element: {
				...basicFieldProps.element,
				fieldType: {
					type: "ConfirmType"
				}
			}
		};

		const basicStringFieldProps: FieldBodyCellProps<DocumentModel.StringType> = {
			...basicFieldProps,
			value: "Lorem",
			element: {
				...basicFieldProps.element,
				fieldType: {
					type: "StringType"
				}
			}
		};

		const basicNumberFieldProps: FieldBodyCellProps<DocumentModel.NumberType> = {
			...basicFieldProps,
			value: 0,
			element: {
				...basicFieldProps.element,
				fieldType: {
					type: "NumberType"
				}
			}
		};

		const basicDateFieldProps: FieldBodyCellProps<DocumentModel.DateType> = {
			...basicFieldProps,
			value: 0,
			element: {
				...basicFieldProps.element,
				fieldType: {
					type: "DateType",
					format: "yyyy-MM-dd"
				}
			}
		};

		const basicTimeFieldProps: FieldBodyCellProps<DocumentModel.TimeType> = {
			...basicFieldProps,
			value: 0,
			element: {
				...basicFieldProps.element,
				fieldType: {
					type: "TimeType",
					format: "HH:mm:ss"
				}
			}
		};

		const basicDateTimeFieldProps: FieldBodyCellProps<DocumentModel.DateTimeType> = {
			...basicFieldProps,
			value: 0,
			element: {
				...basicFieldProps.element,
				fieldType: {
					type: "DateTimeType",
					format: "yyyy-MM-dd'T'HH:mm:ss"
				}
			}
		};

		describe("given enumeration type", () => {
			describe("when props.value is null", () => {
				it("should render empty TextOutput", () => {
					const result = setupTest({ ...basicEnumFieldProps, value: null });
					const textOutput = result.find(TextOutput);

					expect(result).toHaveLength(1);
					expect(textOutput.text()).toBe("");
				});
			});

			describe("when not found value in element.fieldType.values", () => {
				it("should render empty TextOutput", () => {
					const result = setupTest({ ...basicEnumFieldProps, value: "test" });
					const textOutput = result.find(TextOutput);

					expect(result).toHaveLength(1);
					expect(textOutput.text()).toBe("");
				});
			});

			describe("when the result from localizer.getLocalizedEnumerationValue is empty", () => {
				it("should use the props.value as its text", () => {
					const result = setupTest({
						...basicEnumFieldProps,
						element: {
							...basicEnumFieldProps.element,
							fieldType: {
								...basicEnumFieldProps.element.fieldType,
								values: [
									{
										value: "Munich",
										label: [
											{ locale: "en", text: "" },
											{ locale: "de", text: "Munich de" }
										]
									}
								]
							}
						}
					});

					const textOutput = result.find(TextOutput);

					expect(result).toHaveLength(1);
					expect(textOutput.text()).toBe("Munich");
				});
			});

			describe("when the result from localizer.getLocalizedEnumerationValue is not empty", () => {
				it("should use the the result as its text", () => {
					const result = setupTest(basicEnumFieldProps);

					const textOutput = result.find(TextOutput);

					expect(result).toHaveLength(1);
					expect(textOutput.text()).toBe("Munich en");
				});
			});

			describe("when the locale is german", () => {
				it("should use the the german result as its text", () => {
					const result = setupTest(basicEnumFieldProps, undefined, undefined, deLocale);

					const textOutput = result.find(TextOutput);

					expect(result).toHaveLength(1);
					expect(textOutput.text()).toBe("Munich de");
				});
			});
		});

		describe("given boolean type", () => {
			describe("given enLocale", () => {
				const testCases = [
					{ value: false, expect: en.false },
					{ value: true, expect: en.true },
					{ value: null, expect: en.null }
				];
				testCases.forEach((testCase) => {
					describe("given props.value = " + testCase.value, () => {
						it(`should use RESOURCE_KEYS.${testCase.value} as its text`, () => {
							const result = setupTest({
								...basicBooleanFieldProps,
								value: testCase.value
							});
							const textOutput = result.find(TextOutput);

							expect(textOutput).toHaveLength(1);
							expect(textOutput.text()).toBe(testCase.expect);
						});
					});
				});
			});

			describe("given deLocale", () => {
				const testCases = [
					{ value: false, expect: de.false },
					{ value: true, expect: de.true },
					{ value: null, expect: de.null }
				];
				testCases.forEach((testCase) => {
					describe("given props.value = " + testCase.value, () => {
						it(`should use RESOURCE_KEYS.${testCase.value} as its text`, () => {
							const result = setupTest(
								{
									...basicBooleanFieldProps,
									value: testCase.value
								},
								undefined,
								undefined,
								deLocale
							);
							const textOutput = result.find(TextOutput);

							expect(textOutput).toHaveLength(1);
							expect(textOutput.text()).toBe(testCase.expect);
						});
					});
				});
			});
		});

		describe("given confirm type", () => {
			describe("given enLocale", () => {
				const testCases = [
					{ value: true, expect: en.true },
					{ value: null, expect: en.null }
				];
				testCases.forEach((testCase) => {
					describe("given props.value = " + testCase.value, () => {
						it(`should use RESOURCE_KEYS.${testCase.value} as its text`, () => {
							const result = setupTest({
								...basicConfirmFieldProps,
								value: testCase.value
							});
							const textOutput = result.find(TextOutput);

							expect(textOutput).toHaveLength(1);
							expect(textOutput.text()).toBe(testCase.expect);
						});
					});
				});
			});

			describe("given deLocale", () => {
				const testCases = [
					{ value: true, expect: de.true },
					{ value: null, expect: de.null }
				];
				testCases.forEach((testCase) => {
					describe("given props.value = " + testCase.value, () => {
						it(`should use RESOURCE_KEYS.${testCase.value} as its text`, () => {
							const result = setupTest(
								{
									...basicConfirmFieldProps,
									value: testCase.value
								},
								undefined,
								undefined,
								deLocale
							);
							const textOutput = result.find(TextOutput);

							expect(textOutput).toHaveLength(1);
							expect(textOutput.text()).toBe(testCase.expect);
						});
					});
				});
			});
		});

		describe("given string type", () => {
			describe.skip("when convert.formatValue return null", () => {
				it("should render empty string", () => {
					const result = setupTest(basicStringFieldProps, undefined, {
						// @ts-expect-error converter
						converter: { formatValue: () => null }
					});
					const textOutput = result.find(TextOutput);

					expect(textOutput).toHaveLength(1);
					expect(textOutput.text()).toBe("");
				});
			});

			describe.skip("when convert.formatValue return empty string", () => {
				it("should render empty string", () => {
					const result = setupTest(basicStringFieldProps, undefined, {
						// @ts-expect-error converter
						converter: { formatValue: () => "" }
					});
					const textOutput = result.find(TextOutput);

					expect(textOutput).toHaveLength(1);
					expect(textOutput.text()).toBe("");
				});
			});

			describe.skip("when convert.formatValue return non-empty string and no permit lineBreaks", () => {
				it("should render textOutput whose text = xyz", () => {
					const result = setupTest(
						{
							...basicStringFieldProps,
							element: {
								...basicStringFieldProps.element,
								fieldType: {
									...basicStringFieldProps.element.fieldType,
									lineBreaksPermitted: false
								}
							}
						},
						undefined,
						{
							// @ts-expect-error converter
							converter: { formatValue: () => "xyz" }
						}
					);
					const textOutput = result.find(TextOutput);

					expect(textOutput).toHaveLength(1);
					expect(textOutput.text()).toBe("xyz");
				});
			});

			describe.skip("when convert.formatValue return non-empty string and permit lineBreaks", () => {
				it("should split the formatted value by line break, then use the br element as the splitter", () => {
					const result = setupTest(
						{
							...basicStringFieldProps,
							element: {
								...basicStringFieldProps.element,
								fieldType: {
									...basicStringFieldProps.element.fieldType,
									lineBreaksPermitted: true
								}
							}
						},
						undefined,
						{
							// @ts-expect-error converter
							converter: { formatValue: () => "Lorem \nipsum\n dolor\n sit" }
						}
					);
					const textOutput = result.find(TextOutput);
					const breaks = textOutput.find(HTMLBRElement);

					expect(textOutput).toHaveLength(1);
					expect(breaks).toHaveLength(4);
					["Lorem", "ipsum", "dolor", "sit"].forEach((word) => {
						expect(textOutput.text()).toContain(word);
					});
				});
			});
		});

		describe.skip("given number type", () => {
			[-1, 0, 1024, 3.14].forEach((value) => {
				describe("when props.value = " + value, () => {
					it("should render TextOutput with text = " + value, () => {
						const result = setupTest(
							{
								...basicNumberFieldProps,
								value
							},
							undefined,
							{
								// @ts-expect-error converter
								converter: {
									formatValue: () => String(value)
								}
							}
						);

						const textOutput = result.find(TextOutput);

						expect(textOutput).toHaveLength(1);
						expect(textOutput.text()).toBe(String(value));
					});
				});
			});
		});

		describe("given date & time types", () => {
			const returnValueStub = String(new Date(2020, 11, 24));

			[basicDateFieldProps, basicTimeFieldProps, basicDateTimeFieldProps].forEach((props) => {
				describe.skip(`when field type = ${props.element.fieldType.type} and returned value of converter = ${returnValueStub}`, () => {
					it("should render TextOutput with text = " + returnValueStub, () => {
						const result = setupTest(
							{
								...props,
								value: new Date()
							},
							undefined,
							{
								// @ts-expect-error converter
								converter: {
									formatValue: () => returnValueStub
								}
							}
						);

						const textOutput = result.find(TextOutput);

						expect(textOutput).toHaveLength(1);
						expect(textOutput.text()).toBe(returnValueStub);
					});
				});
			});

			describe.skip(`when field type = DateRange`, () => {
				it("should render proper TextOutput", () => {
					const dateRangeFieldProps: FieldBodyCellProps<DocumentModel.DateRangeType> = {
						...basicFieldProps,
						value: [new Date(2020, 1, 29), new Date(2020, 2, 20)],
						element: {
							...basicFieldProps.element,
							fieldType: {
								type: "DateRangeType",
								format: "yyyy-MM-dd",
								rangeSeparator: "/"
							}
						}
					};

					const result = setupTest(dateRangeFieldProps, undefined, {
						// @ts-expect-error converter
						converter: { formatValue: () => "02/29/2020-03/20/2020" }
					});

					const textOutput = result.find(TextOutput);

					expect(textOutput).toHaveLength(1);
					expect(textOutput.text()).toBe("02/29/2020-03/20/2020");
				});
			});
		});

		describe.skip("given rowHeight", () => {
			const engineState = createEngineState
				.from(basicEngineState)
				.withConfigurations({
					...basicEngineState.models.uiModel.content.configuration,
					rowHeight: 80
				})
				.create();

			it("content should be contained in CssEllipsis component", () => {
				[
					basicEnumFieldProps,
					basicBooleanFieldProps,
					basicConfirmFieldProps,
					basicStringFieldProps,
					basicNumberFieldProps
				].forEach((props) => {
					const result = setupTest(props, engineState, {
						// @ts-expect-error converter
						converter: { formatValue: () => "MockValue" }
					});
					const cssEllipsis = result.find(CssEllipsis);
					expect(cssEllipsis.exists()).toBe(true);
					expect(cssEllipsis.props().useTooltip).toBe(true);
				});
			});
		});
	});

	describe("given an attachment", () => {
		interface GroupProps extends BodyCellUIValue.Props {
			element: DocumentModel.Group;
		}
		const basicAttachmentCellProps: GroupProps = {
			...teamCellProps,
			element: {
				type: "Group",
				id: "1024",
				name: "GroupName",
				repeatability: 1,
				elements: [],
				usageType: "attachment"
			},
			value: {
				key: "value"
			},
			documentModelName: "DomainTeam",
			documentModelPath: [{ elementName: "root" }],
			documentId: "2048"
		};

		afterEach(() => {
			vi.restoreAllMocks();
		});

		describe("when props.value is not a JSON object", () => {
			it("should render nothing", () => {
				const result = setupTest({
					...basicAttachmentCellProps,
					value: -1
				});

				testIsNullComponent(result);
			});
		});

		describe("when props.value is a JSON object, but not an instance of Attachment", () => {
			beforeAll(() => {
				vi.spyOn(Attachment, "isInstance").mockReturnValue(false);
			});
			it("should render nothing", () => {
				const result = setupTest(basicAttachmentCellProps);

				testIsNullComponent(result);
			});
		});

		describe("when props.value is a JSON object and instance of Attachment", () => {
			beforeEach(() => {
				vi.spyOn(Attachment, "isInstance").mockReturnValue(true);
			});

			describe("when given a custom AttachmentCell", () => {
				it("should use that component", () => {
					const result = setupTest(basicAttachmentCellProps, undefined, {
						componentMap: {
							...basicComponentMap,
							AttachmentCell: () => <CustomWidget />
						}
					});
					const attachmentCell = result.find(CustomWidget);

					expect(attachmentCell).toHaveLength(1);
				});
			});

			describe("when not given a custom AttachmentCell", () => {
				it("should use the default component", () => {
					const result = setupTest(basicAttachmentCellProps);
					const attachmentCell = result.find(AttachmentCell);

					expect(attachmentCell).toHaveLength(1);
					expect(attachmentCell.props().documentId).toBe(basicAttachmentCellProps.documentId);
					expect(attachmentCell.props().attachment).toBe(basicAttachmentCellProps.value);
				});
			});
		});
	});

	describe("given an multi-select ", () => {
		const basicMultiSelectCellProps: BodyCellUIValue.Props = {
			...teamCellProps,
			element: mockType<DocumentModel.Group>(),
			value: [{ value: "1" }],
			documentModelName: "DomainTeam",
			documentModelPath: [
				{
					elementName: "root"
				}
			],
			documentId: "2048"
		};

		beforeEach(() => {
			vi.spyOn(MultiSelectGroup, "isInstance").mockReturnValue(true);
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		describe("when props.value is not array", () => {
			it("should render nothing", () => {
				const result = setupTest({ ...basicMultiSelectCellProps, value: 1024 });

				testIsNullComponent(result);
			});
		});

		describe("when props.value is array", () => {
			describe("when given a custom MultiSelectCell", () => {
				it("should use that component", () => {
					const result = setupTest(basicMultiSelectCellProps, undefined, {
						componentMap: {
							...basicComponentMap,
							MultiSelectCell: () => <CustomWidget />
						}
					});
					const multiSelectCell = result.find(CustomWidget);

					expect(multiSelectCell).toHaveLength(1);
				});
			});

			describe.skip("when no given a custom MultiSelectCell", () => {
				it("should use the default component", () => {
					const models: Models = {
						...basicEngineState.models,
						documentModels: [createDocumentModel("DomainTeam", [createMultiSelectGroup()])]
					};

					const result = setupTest(
						{
							...basicMultiSelectCellProps,
							documentModelPath: [...basicMultiSelectCellProps.documentModelPath, { elementName: "multi-select" }]
						},
						{ ...basicEngineState, models },
						// @ts-expect-error converter
						{ converter: { formatValue: () => "2" } }
					);
					const multiSelectCell = result.find(MultiSelectCell);

					expect(multiSelectCell).toHaveLength(1);
					expect(multiSelectCell.props().data).toEqual([{ value: "1" }]);
				});
			});
		});
	});
});
