/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, SettingsStore } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    blurRadius: {
        type: OptionType.SLIDER,
        description: "Cam bulanıklığı (px) — 0 yaparak tamamen kapatabilirsin",
        markers: [0, 6, 12, 18, 26, 36],
        default: 18,
        stickToMarkers: false
    },
    saturation: {
        type: OptionType.SLIDER,
        description: "Arkadaki renklerin canlılığı (%)",
        markers: [50, 80, 100, 115, 130, 150],
        default: 115,
        stickToMarkers: false
    },
    brightness: {
        type: OptionType.SLIDER,
        description: "Arkadaki renklerin parlaklığı (%)",
        markers: [60, 80, 100, 110, 120],
        default: 100,
        stickToMarkers: false
    },
    transitions: {
        type: OptionType.BOOLEAN,
        description: "Ekran geçişlerinde yumuşak fade",
        default: true
    },
    transitionDuration: {
        type: OptionType.SLIDER,
        description: "Geçiş süresi (ms)",
        markers: [0, 120, 200, 280, 400, 600],
        default: 220,
        stickToMarkers: false
    }
});

const STYLE_ID = "endcord-glass-style";

/**
 * Bulanıklık ve geçiş için hedef yüzeyler.
 * Sınıf adları Discord'da hash ile geliyor, bu yüzden eşleşme parça bazlı;
 * bir sürüm güncellemesinde hash değişse bile isim kısmı korunuyor.
 */
const BLUR_TARGETS = [
    "[class*=\"chatContent\"]",
    "[class*=\"membersWrap\"]",
    "[class*=\"peopleColumn\"]",
    "[class*=\"pageWrapper\"]",
    "[class*=\"sidebar\"]",
    "[class*=\"navList\"]"
].join(",\n");

const FADE_TARGETS = [
    "[class*=\"chatContent\"]",
    "[class*=\"pageWrapper\"]",
    "[class*=\"contentRegion\"] > div",
    "[role=\"dialog\"]",
    "[class*=\"popout\"]"
].join(",\n");

function buildCss(): string {
    const { blurRadius, saturation, brightness, transitions, transitionDuration } = settings.store;

    const blur = Math.max(0, Math.min(60, blurRadius));
    const sat = Math.max(0, Math.min(200, saturation));
    const bright = Math.max(0, Math.min(200, brightness));
    const duration = Math.max(0, Math.min(1200, transitionDuration));

    const parts: string[] = [];

    if (blur > 0) {
        parts.push(`
${BLUR_TARGETS} {
    backdrop-filter: blur(${blur}px) saturate(${sat}%) brightness(${bright}%);
    -webkit-backdrop-filter: blur(${blur}px) saturate(${sat}%) brightness(${bright}%);
}`);
    }

    if (transitions && duration > 0) {
        // EndcordEyeCare tum animasyonlari susturuyor; bu yumusak gecis
        // ayakta kalsin diye sureyi daha yuksek ozgullukle ve !important ile
        // geri veriyoruz (important kurallarinda ozgulluk belirleyici).
        parts.push(`
@keyframes endcord-soft-fade {
    from {
        opacity: 0;
        transform: translateY(6px) scale(0.996);
    }
    to {
        opacity: 1;
        transform: none;
    }
}

${FADE_TARGETS} {
    animation: endcord-soft-fade ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

html:root ${FADE_TARGETS} {
    animation-duration: ${duration}ms !important;
}`);
    }

    return parts.join("\n");
}

export default definePlugin({
    name: "EndcordGlass",
    description: "Ekranlar arasında yumuşak geçiş ve cam bulanıklığı — kaydırıcılardan ayarlanır.",
    tags: ["Appearance", "Customisation"],
    authors: [Devs.Endcord],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = buildCss();
        document.documentElement.appendChild(style);

        const apply = () => {
            style.textContent = buildCss();
        };

        for (const key of ["blurRadius", "saturation", "brightness", "transitions", "transitionDuration"]) {
            SettingsStore.addChangeListener(`plugins.EndcordGlass.${key}` as never, apply);
        }
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    }
});
