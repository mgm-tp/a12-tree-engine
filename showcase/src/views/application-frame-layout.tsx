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
import { useDispatch, useSelector } from "react-redux";

import {
	Model,
	FrameViews,
	ActivityMap,
	ActivitySelectors,
	addLayout,
	type A12ApplicationConfig
} from "@com.mgmtp.a12.client/client-core";
import { GlobalMessageBox, HeaderTrigger, PopUpMenu, List, Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { Commands, TreeEngineActions } from "@com.mgmtp.a12.treeengine/treeengine-core";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

import { isWdyrEnabled, setWdyr } from "../config/wdyr.js";
import { isReactScanEnabled, setReactScanEnabled } from "../config/react-scan.js";
import { LOCALE_KEY, THEME_KEY, THEMES, useShowcaseContext } from "../context.js";
import { getShowcaseDisabled, setShowcaseDisabled } from "../utils.js";

declare const __VERSION__: string;
const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "Unknown version";

export const withApplicationFrameLayout = <T extends A12ApplicationConfig>(cfg: T) =>
	addLayout<T>("ApplicationFrame", { component: ApplicationFrameLayout })(cfg);

export const ApplicationFrameLayout: React.FC<FrameViews.LayoutProps> = (props) => {
	const locales = useShowcaseContext((context) => context.locales);

	const settingItem: FrameViews.HeaderItemProps = {
		orientation: "rightSlots-left",
		item: (
			<PopUpMenu
				triggerElement={
					<HeaderTrigger>
						<Icon>info</Icon>
						<span>{version}</span>
						<Icon>arrow_drop_down</Icon>
					</HeaderTrigger>
				}>
				<List>
					<List.SubHeader fill>Locale</List.SubHeader>
					{locales.map((item) => (
						<LocaleItem locale={item} key={Locale.toString(item)} />
					))}
					<List.SubHeader fill>Interaction</List.SubHeader>
					<DisableEngineItem />
					<DisableDndItem />
					<ReadonlyItem />

					<List.SubHeader fill>Theme</List.SubHeader>
					{Object.keys(THEMES).map((item) => (
						<ThemeItem key={item} theme={item} />
					))}
					<List.SubHeader fill>Devtools</List.SubHeader>
					<WhyDidYouRenderItem />
					<ReactScanItem />
				</List>
			</PopUpMenu>
		)
	};

	const errors = useSelector(ModelSlice.selectErrors());
	const errorModels = React.useMemo(() => errors?.map((error) => error.name).join(", "), [errors]);

	React.useEffect(() => {
		if (errors) {
			// eslint-disable-next-line no-console
			console.error(errors);
		}
	}, [errors]);

	return (
		<FrameViews.ApplicationFrameLayout
			{...props}
			additionalHeaderItems={[settingItem]}
			globalMessageBox={
				errors && <GlobalMessageBox variant="error" content={`Invalid models found: ${errorModels}.`} />
			}
		/>
	);
};

const LocaleItem: React.FC<{ locale: Locale }> = ({ locale }) => {
	const { locale: currentLocale } = React.useContext(LocalizerContext);
	const setLocale = useShowcaseContext((context) => context.setLocale);

	const isCurrentLocale = React.useMemo(() => {
		return Locale.toString(locale) === Locale.toString(currentLocale);
	}, [currentLocale, locale]);

	const onClick = React.useCallback(() => {
		setLocale(locale);
		localStorage.setItem(LOCALE_KEY, Locale.toString(locale));
	}, [locale, setLocale]);

	return (
		<List.Item
			text={Locale.toString(locale)}
			meta={isCurrentLocale ? <Icon>check</Icon> : undefined}
			onClick={onClick}
		/>
	);
};

const DisableEngineItem: React.FC = React.memo(() => {
	const topLevelActivities = useSelector(ActivitySelectors.topLevelActivities());
	const activities = ActivityMap.toList(topLevelActivities);

	const dispatch = useDispatch();

	const disabled = getShowcaseDisabled();

	const toggleDisabled = React.useCallback(() => {
		dispatch(
			TreeEngineActions.command({
				activityId: activities[0].id,
				engineAction: Commands.setDisabled({ disabled: !disabled || undefined })
			})
		);
		setShowcaseDisabled(!disabled);
	}, [activities, disabled, dispatch]);

	return (
		<List.Item
			disabled={activities.length === 0}
			text={"Disable Engine"}
			meta={disabled ? <Icon>check</Icon> : undefined}
			onClick={toggleDisabled}
		/>
	);
});

const WhyDidYouRenderItem: React.FC = React.memo(() => {
	const whyDidYouRender = React.useMemo(isWdyrEnabled, []);
	const handleClick = React.useCallback(() => {
		setWdyr(!whyDidYouRender);
	}, [whyDidYouRender]);

	return (
		<List.Item
			text="wdyr"
			title="Toggle @welldone-software/why-did-you-render"
			meta={whyDidYouRender ? <Icon>check</Icon> : undefined}
			onClick={handleClick}
		/>
	);
});

const ReactScanItem: React.FC = React.memo(() => {
	const reactScanEnabled = React.useMemo(isReactScanEnabled, []);
	const handleClick = React.useCallback(() => {
		setReactScanEnabled(!reactScanEnabled);
	}, [reactScanEnabled]);

	return (
		<List.Item
			text="react-scan"
			title="Toggle react-scan toolbar"
			meta={reactScanEnabled ? <Icon>check</Icon> : undefined}
			onClick={handleClick}
		/>
	);
});

const DisableDndItem: React.FC = React.memo(() => {
	const topLevelActivities = useSelector(ActivitySelectors.topLevelActivities());
	const activities = ActivityMap.toList(topLevelActivities);

	const enableDnd = useShowcaseContext((context) => context.enableDnd);
	const setEnableDnd = useShowcaseContext((context) => context.setEnableDnd);

	const handleClick = React.useCallback(() => {
		setEnableDnd(!enableDnd);
	}, [enableDnd, setEnableDnd]);

	return (
		<List.Item
			disabled={activities.length === 0}
			text={"Disable Dnd"}
			meta={enableDnd ? undefined : <Icon>check</Icon>}
			onClick={handleClick}
		/>
	);
});

const ReadonlyItem: React.FC = React.memo(() => {
	const readonly = useShowcaseContext((context) => context.readonly);
	const setReadonly = useShowcaseContext((context) => context.setReadonly);
	const dispatch = useDispatch();
	const topLevelActivities = useSelector(ActivitySelectors.topLevelActivities());
	const activities = ActivityMap.toList(topLevelActivities);

	const onClick = React.useCallback(() => {
		dispatch(
			TreeEngineActions.command({
				activityId: activities[0].id,
				engineAction: Commands.setReadonly({ readonly: !readonly || undefined })
			})
		);
		setReadonly(!readonly);
	}, [activities, dispatch, readonly, setReadonly]);

	return <List.Item text={"Readonly"} meta={readonly ? <Icon>check</Icon> : undefined} onClick={onClick} />;
});

const ThemeItem: React.FC<{
	theme: string;
}> = React.memo(({ theme }) => {
	const currentTheme = useShowcaseContext((context) => context.theme);
	const setTheme = useShowcaseContext((context) => context.setTheme);
	const handleClick = React.useCallback(() => {
		setTheme(theme);
		localStorage.setItem(THEME_KEY, theme);
	}, [setTheme, theme]);
	return (
		<List.Item text={theme} onClick={handleClick} meta={currentTheme === theme ? <Icon>check</Icon> : undefined} />
	);
});

export interface ModelSlice {
	models: ModelSlice.ModelMap;
}

export namespace ModelSlice {
	export function isInstance(slice: unknown): slice is ModelSlice {
		if (typeof slice !== "object" || slice === null) {
			return false;
		}
		return "models" in slice && ModelMap.isInstance(slice.models);
	}

	export interface ModelMap {
		readonly [id: string]: Model.Error | unknown | undefined;
	}

	export namespace ModelMap {
		export function isInstance(map: unknown): map is ModelMap {
			return typeof map === "object";
		}
	}

	export const selectErrors = () => {
		return (state: object) => {
			if (!("models" in state) || !ModelSlice.isInstance(state.models)) {
				return undefined;
			}
			const modelMap = state.models.models;
			const result = Object.entries(modelMap)
				.filter(([, details]) => {
					return Model.Error.isInstance(details);
				})
				.map(([model, details]) => {
					if (!Model.Error.isInstance(details)) {
						throw new Error("Invalid model error, expect an error.");
					}
					return { name: model, message: details.message };
				});

			if (result.length === 0) {
				return undefined;
			}
			return result;
		};
	};
}
