/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, SettingsStore } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    opacity: {
        type: OptionType.SLIDER,
        description: "Panel opaklığı — düşük değer arkasını daha çok gösterir",
        markers: [20, 35, 50, 62, 75, 90],
        default: 62,
        stickToMarkers: false
    },
    blur: {
        type: OptionType.SLIDER,
        description: "Cam bulanıklığı (px)",
        markers: [0, 8, 16, 22, 30, 40],
        default: 22,
        stickToMarkers: false
    },
    accent: {
        type: OptionType.STRING,
        description: "Vurgu rengi (hex, örn. #6c8cff) — boş bırakılırsa temadaki varsayılan kullanılır",
        default: ""
    }
});

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const STYLE_ID = "endcord-appearance-overrides";

/**
 * Tema değişkenlerini çalışma anında değiştirir.
 * Tema CSS'i kendi token'larını :root üzerinde tanımlar; burada aynı
 * değişkenleri daha yüksek özgüllükle eziyoruz ki tema dosyasına dokunmaya
 * gerek kalmadan canlı ayar yapılabilsin.
 */
function buildOverrides(): string {
    const { opacity, blur, accent } = settings.store;
    const rules: string[] = [];

    rules.push(`--ecs-alpha: ${Math.max(0, Math.min(100, opacity)) / 100};`);
    rules.push(`--ecs-blur: ${Math.max(0, Math.min(60, blur))}px;`);

    if (accent && HEX.test(accent.trim())) {
        rules.push(`--ecs-accent: ${accent.trim()};`);
    }

    return `html:root, body:root, :root:where(.theme-dark, .theme-darker, .theme-midnight) {
${rules.map(rule => `    ${rule}`).join("\n")}
}`;
}

export default definePlugin({
    name: "EndcordAppearance",
    description: "Cam temanın opaklık, bulanıklık ve vurgu rengini anında ayarla. Tema dosyasını düzenlemeye gerek kalmaz.",
    tags: ["Appearance", "Customisation"],
    authors: [Devs.Endcord],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = buildOverrides();
        document.documentElement.appendChild(style);

        const apply = () => {
            style.textContent = buildOverrides();
        };

        for (const key of ["opacity", "blur", "accent"]) {
            SettingsStore.addChangeListener(`plugins.EndcordAppearance.${key}` as never, apply);
        }
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    }
});
