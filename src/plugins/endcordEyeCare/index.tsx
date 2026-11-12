/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, SettingsStore } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    reduceMotion: {
        type: OptionType.BOOLEAN,
        description: "Animasyonları kapat — enerji tasarrufu ve göz yorması için",
        default: true
    },
    performanceMode: {
        type: OptionType.BOOLEAN,
        description: "Performans modu: gölgeleri ve arka plan görsellerini kapatır, boyama yükünü düşürür",
        default: true
    },
    dropBlur: {
        type: OptionType.BOOLEAN,
        description: "Cam bulanıklığını da kapat — en düşük GPU yükü, cam efekti gider",
        default: false
    },
    iconScale: {
        type: OptionType.SLIDER,
        description: "İkon boyutu (%) — küçük ikon daha az görsel gürültü demek",
        markers: [70, 80, 90, 100, 110],
        default: 90,
        stickToMarkers: false
    },
    emojiScale: {
        type: OptionType.SLIDER,
        description: "Emoji boyutu (%)",
        markers: [60, 75, 88, 100],
        default: 88,
        stickToMarkers: false
    },
    avatarScale: {
        type: OptionType.SLIDER,
        description: "Avatar boyutu (%)",
        markers: [70, 85, 95, 100],
        default: 95,
        stickToMarkers: false
    },
    textSoftness: {
        type: OptionType.SLIDER,
        description: "Metin yumuşaklığı — düşük değer daha sakin, yüksek değer daha okunur",
        markers: [0, 25, 50, 75, 100],
        default: 50,
        stickToMarkers: false
    },
    dimDecorations: {
        type: OptionType.BOOLEAN,
        description: "Ayırıcıları ve dekoratif öğeleri soluklaştır",
        default: true
    },
    contentVisibility: {
        type: OptionType.BOOLEAN,
        description: "Uzun kanallarda görünmeyen mesajları çizme (performans, çok uzun sohbetler için)",
        default: false
    }
});

const STYLE_ID = "endcord-eyecare-style";

const BLUR_TARGETS = [
    "[class*=\"chatContent\"]",
    "[class*=\"membersWrap\"]",
    "[class*=\"peopleColumn\"]",
    "[class*=\"pageWrapper\"]",
    "[class*=\"contentRegion\"]",
    "[class*=\"sidebar\"]",
    "[class*=\"navList\"]",
    "[class*=\"panels\"]",
    "[class*=\"titleBar\"]",
    "[class*=\"modal\"]",
    "[class*=\"popout\"]"
].join(",\n");

/** Metin rengi: yumuşaklık 0 = çok sakin, 100 = keskin okunur. */
function textColors(softness: number) {
    const lightness = 62 + Math.round((softness / 100) * 14);
    const mutedLightness = 46 + Math.round((softness / 100) * 10);

    return {
        normal: `hsl(218 14% ${lightness}%)`,
        muted: `hsl(218 10% ${mutedLightness}%)`,
        bright: `hsl(216 18% ${Math.min(96, lightness + 12)}%)`
    };
}

function buildCss(): string {
    const {
        reduceMotion,
        performanceMode,
        dropBlur,
        iconScale,
        emojiScale,
        avatarScale,
        textSoftness,
        dimDecorations,
        contentVisibility
    } = settings.store;

    const parts: string[] = [];

    if (reduceMotion) {
        parts.push(`
*, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
}`);
    }

    if (performanceMode) {
        parts.push(`
[class*="modal"],
[class*="popout"],
[class*="tooltip"] {
    box-shadow: none !important;
}

[class*="backgroundImage"],
[class*="chatBackground"] {
    background-image: none !important;
}`);
    }

    if (dropBlur) {
        // backdrop-filter en pahalı kalem: her karede ekranı yeniden örnekler
        parts.push(`
${BLUR_TARGETS} {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
}`);
    }

    if (iconScale !== 100) {
        const scale = Math.max(0.5, iconScale / 100);
        parts.push(`
svg[class*="icon"],
[class*="icon"] > svg {
    transform: scale(${scale});
    transform-box: fill-box;
    transform-origin: center;
}`);
    }

    if (emojiScale !== 100) {
        const scale = Math.max(0.5, emojiScale / 100);
        parts.push(`
img[class*="emoji"] {
    zoom: ${scale};
}`);
    }

    if (avatarScale !== 100) {
        const scale = Math.max(0.5, avatarScale / 100);
        parts.push(`
[class*="avatar"] {
    transform: scale(${scale});
    transform-origin: center;
}`);
    }

    const colors = textColors(textSoftness);
    parts.push(`
html:root {
    --text-normal: ${colors.normal};
    --text-muted: ${colors.muted};
    --header-primary: ${colors.bright};
}`);
    if (dimDecorations) {
        parts.push(`
[class*="divider"],
hr {
    opacity: 0.35;
}

[class*="separator"] {
    opacity: 0.5;
}`);
    }

    if (contentVisibility) {
        parts.push(`
[role="log"] > li,
[class*="messageList"] > li {
    content-visibility: auto;
    contain-intrinsic-size: auto 54px;
}`);
    }

    return parts.join("\n");
}

export default definePlugin({
    name: "DevcordEyeCare",
    description: "Göz yormasın diye Discord'u sadeleştirir: küçük ikonlar, sakin metin, kapalı animasyonlar ve düşük boyama yükü.",
    tags: ["Appearance", "Utility", "Accessibility"],
    authors: [Devs.Devcord],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = buildCss();
        document.documentElement.appendChild(style);

        const apply = () => {
            style.textContent = buildCss();
        };

        for (const key of ["reduceMotion", "performanceMode", "dropBlur", "iconScale", "emojiScale", "avatarScale", "textSoftness", "dimDecorations", "contentVisibility"]) {
            SettingsStore.addChangeListener(`plugins.DevcordEyeCare.${key}` as never, apply);
        }
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    }
});
