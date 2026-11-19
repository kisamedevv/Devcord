/*
 * Endcord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings, useSettings } from "@api/Settings";
import { Divider } from "@components/Divider";
import { Heading, HeadingPrimary } from "@components/Heading";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { Devs } from "@utils/constants";
import { t } from "@utils/i18n";
import { Margins } from "@utils/margins";
import { useSecondTick } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import { moment, TextInput, useState } from "@webpack/common";

import { DemoMessageContainer, timeFormats } from "./utils";

type TimeFormat = {
    name: string;
    description: string;
    default: string;
    offset: number;
};
type TimeRowProps = {
    id: string;
    format: TimeFormat;
    onChange: (key: string, value: string) => void;
    pluginSettings: any;
};

// moment's relative thresholds are process-wide, so set them once at import instead of on every rendered timestamp
moment.relativeTimeThreshold("s", 60);
moment.relativeTimeThreshold("ss", -1);
moment.relativeTimeThreshold("m", 60);

const format = (date: Date, formatTemplate: string): string => {
    const mmt = moment(date);

    const sameDayFormat = settings.store?.formats?.sameDayFormat || timeFormats.sameDayFormat.default;
    const lastDayFormat = settings.store?.formats?.lastDayFormat || timeFormats.lastDayFormat.default;
    const lastWeekFormat = settings.store?.formats?.lastWeekFormat || timeFormats.lastWeekFormat.default;
    const sameElseFormat = settings.store?.formats?.sameElseFormat || timeFormats.sameElseFormat.default;

    return mmt.format(formatTemplate)
        .replace("calendar", () => mmt.calendar(undefined, {
            sameDay: sameDayFormat,
            lastDay: lastDayFormat,
            lastWeek: lastWeekFormat,
            sameElse: sameElseFormat
        }))
        .replace("relative", () => mmt.fromNow());
};

type FormatType = "cozy" | "compact" | "tooltip" | "ariaLabel";

/** Formats with `[calendar]` or `[relative]` change on their own, so only those need a live clock. */
function needsTick(template: string) {
    return template.includes("calendar") || template.includes("relative");
}

function templateFor(type: FormatType): string {
    const formats = settings.store?.formats;

    switch (type) {
        case "cozy": return formats?.cozyFormat || timeFormats.cozyFormat.default;
        case "compact": return formats?.compactFormat || timeFormats.compactFormat.default;
        case "tooltip": return formats?.tooltipFormat || timeFormats.tooltipFormat.default;
        case "ariaLabel": return formats?.ariaLabelFormat || timeFormats.ariaLabelFormat.default;
    }
}

// Every timestamp landing in the same second with the same template renders the same string, so a busy channel turns
// into one moment() call per unique second instead of one per message. Bounded so it can't grow without limit.
const formatCache = new Map<string, string>();
const FORMAT_CACHE_MAX = 512;

function renderCached(date: Date, type: FormatType, template: string): string {
    const key = `${type}|${Math.floor(date.getTime() / 1000)}|${template}`;

    const cached = formatCache.get(key);
    if (cached !== undefined) return cached;

    const out = format(date, template);

    if (formatCache.size >= FORMAT_CACHE_MAX) {
        const oldest = formatCache.keys().next().value;
        if (oldest !== undefined) formatCache.delete(oldest);
    }
    formatCache.set(key, out);

    return out;
}

const TimeRow = (props: TimeRowProps) => {
    const [state, setState] = useState(props.pluginSettings?.[props.id] || props.format.default);

    const handleChange = (value: string) => {
        setState(value);
        props.onChange(props.id, value);
    };

    return (
        <>
            <Heading>{props.format.name}</Heading>
            <Paragraph>{props.format.description}</Paragraph>
            <TextInput value={state} onChange={handleChange} />
        </>
    );
};

const settings = definePluginSettings({
    formats: {
        type: OptionType.COMPONENT,
        description: "Customize the timestamp formats",
        component: componentProps => {
            const [settingsState, setSettingsState] = useState(useSettings().plugins?.CustomTimestamps?.formats ?? {});

            const setNewValue = (key: string, value: string) => {
                const newSettings = { ...settingsState, [key]: value };
                setSettingsState(newSettings);
                componentProps.setValue(newSettings);
            };

            return (
                <>
                    <DemoMessageContainer />
                    {Object.entries(timeFormats).map(([key, value]) => (
                        <section key={key}>
                            {key === "sameDayFormat" && (
                                <div className={Margins.bottom20}>
                                    <Divider style={{ marginBottom: "10px" }} />
                                    <Heading tag="h1">{t("Calendar formats")}</Heading>
                                    <Paragraph>
                                        {t("How to format the [calendar] value if used in the above timestamps.")}</Paragraph>
                                </div>
                            )}
                            <TimeRow
                                id={key}
                                format={value}
                                onChange={setNewValue}
                                pluginSettings={settingsState}
                            />
                        </section>
                    ))}
                </>);
        }
    }
}).withPrivateSettings<{
    formats: {
        cozyFormat: string;
        compactFormat: string;
        tooltipFormat: string;
        ariaLabelFormat: string;
        sameDayFormat: string;
        lastDayFormat: string;
        lastWeekFormat: string;
        sameElseFormat: string;
    };
}>();

export default definePlugin({
    name: "CustomTimestamps",
    description: "Custom timestamps on messages and tooltips",
    tags: ["Appearance", "Customisation"],
    authors: [Devs.rootpoi, Devs.kraethis, Devs.ewlle],
    settings,
    settingsAboutComponent: () => (
        <div className={"vc-cmt-info-card"}>
            <HeadingPrimary>{t("How to use:")}</HeadingPrimary>
            <Paragraph>
                <Link href="https://momentjs.com/docs/#/displaying/format/">{t("Moment.js formatting documentation")}</Link>
                <div className={Margins.top8}>
                    {t("Additionally you can use these in your inputs:")}<br />
                    <b>{t("[calendar]")}</b> {" "}{t("enables dynamic date formatting such as \"Today\" or \"Yesterday\".")}<br />
                    <b>{t("[relative]")}</b> {" "}{t("gives you times such as \"4 hours ago\".")}<br />
                </div>
            </Paragraph>
        </div>
    ),
    patches: [
        {
            find: "#{intl::MESSAGE_EDITED_TIMESTAMP_A11Y_LABEL}",
            replacement: [
                {
                    // Ride the shared 1s tick instead of each timestamp allocating its own interval
                    match: /(?<=\.memo\(function\(\i\)\{)/,
                    replace: "$self.useTick($self.needsLiveClock());",
                },
                {
                    // Aria label on timestamps
                    match: /\i.useMemo\(.{0,10}\i\.\i\)\(.{0,10}\]\)/,
                    replace: "$self.renderTimestamp(arguments[0].timestamp,'ariaLabel')"
                },
                {
                    // Timestamps on messages
                    match: /\i\.useMemo\(.{0,50}"LT".{0,30}\]\)/,
                    replace: "$self.renderTimestamp(arguments[0].timestamp,arguments[0].compact?'compact':'cozy')",
                },
                {
                    // Tooltips when hovering over message timestamps
                    match: /(__unsupportedReactNodeAsText:).{0,25}"LLLL"\)/,
                    replace: "$1$self.renderTimestamp(arguments[0].timestamp,'tooltip')",
                },
            ]
        },
        {
            find: ".full,ariaHidden:!0",
            replacement: {
                // Tooltips for timestamp markdown (e.g. <t:1234567890>)
                match: /(__unsupportedReactNodeAsText:)\i.full/,
                replace: "$1$self.renderTimestamp(new Date(arguments[0].node.timestamp*1000),'tooltip')"
            }
        }
    ],

    /** True when at least one visible format renders something that changes by itself. */
    needsLiveClock: () => (["cozyFormat", "compactFormat", "tooltipFormat", "ariaLabelFormat"] as const)
        .some(key => needsTick(settings.store?.formats?.[key] || timeFormats[key].default)),

    useTick: (enabled: boolean) => useSecondTick(enabled),

    renderTimestamp: (date: Date, type: FormatType) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

        return renderCached(date, type, templateFor(type));
    }
});
