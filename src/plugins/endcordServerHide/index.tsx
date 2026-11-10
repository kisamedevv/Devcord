/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Sunucu listesini gizle — tek tıkla aç/kapa",
        default: false
    },
    showToggleButton: {
        type: OptionType.BOOLEAN,
        description: "Sağ alt köşede aç/kapa düğmesi göster",
        default: true
    }
});

const BUTTON_ID = "endcord-serverhide-toggle";
const SIDEBAR_SELECTORS = [
    'nav[aria-label="Sunucular"]',
    'nav[aria-label="Servers"]',
    '[class*="guilds"][class*="wrapper"]',
    '[class*="sidebar"][class*="guild"]'
];

let styleEl: HTMLStyleElement | null = null;
let toggleBtn: HTMLButtonElement | null = null;
let hidden = false;
let observer: MutationObserver | null = null;

function setHidden(next: boolean) {
    hidden = next;

    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "endcord-serverhide-style";
        document.documentElement.appendChild(styleEl);
    }

    if (next) {
        styleEl.textContent = `
${SIDEBAR_SELECTORS.join(",\n")} {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    flex: 0 0 auto !important;
    overflow: hidden !important;
}
body, #app-mount, [class*="layers"], [class*="app"] {
    margin-left: 0 !important;
    padding-left: 0 !important;
    left: 0 !important;
}
`;
        if (toggleBtn) toggleBtn.classList.add("vc-esh-hidden");
    } else {
        styleEl.textContent = "";
        if (toggleBtn) toggleBtn.classList.remove("vc-esh-hidden");
    }

    settings.store.enabled = next;
}

function createToggleButton() {
    if (toggleBtn) return;

    toggleBtn = document.createElement("button");
    toggleBtn.id = BUTTON_ID;
    toggleBtn.type = "button";
    toggleBtn.title = "Sunucu listesini aç/kapa";
    toggleBtn.setAttribute("aria-label", "Sunucu listesini aç/kapa");
    toggleBtn.className = "vc-esh-button";
    toggleBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
        </svg>
    `;
    toggleBtn.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: 0;
        background: rgba(13, 18, 29, 0.85);
        color: #ccd4e3;
        backdrop-filter: blur(12px);
        cursor: pointer;
        display: grid;
        place-items: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        transition: transform 120ms ease, background 120ms ease;
        user-select: none;
        pointer-events: auto;
    `;
    toggleBtn.addEventListener("click", () => setHidden(!hidden));
    toggleBtn.addEventListener("mouseenter", () => {
        toggleBtn!.style.background = "rgba(20, 27, 42, 0.95)";
        toggleBtn!.style.transform = "scale(1.05)";
    });
    toggleBtn.addEventListener("mouseleave", () => {
        toggleBtn!.style.background = "rgba(13, 18, 29, 0.85)";
        toggleBtn!.style.transform = "scale(1)";
    });

    document.body.appendChild(toggleBtn);

    if (hidden) toggleBtn.classList.add("vc-esh-hidden");
}

function removeToggleButton() {
    if (toggleBtn) {
        toggleBtn.remove();
        toggleBtn = null;
    }
}

function keepHidden() {
    if (!hidden) return;
    for (const sel of SIDEBAR_SELECTORS) {
        for (const el of document.querySelectorAll<HTMLElement>(sel)) {
            el.style.setProperty("display", "none", "important");
            el.style.setProperty("visibility", "hidden", "important");
        }
    }
}

export default definePlugin({
    name: "EndcordServerHide",
    description: "Sunucu listesini tek tıkla gizler — odaklanmak için ekranı boşalt, geri getirmek için tekrar tıkla.",
    tags: ["Appearance", "Utility"],
    authors: [Devs.Endcord],
    settings,

    start() {
        if (settings.store.enabled) setHidden(true);
        if (settings.store.showToggleButton) createToggleButton();

        observer = new MutationObserver(() => keepHidden());
        observer.observe(document.documentElement, { childList: true, subtree: true });
        keepHidden();
    },

    stop() {
        observer?.disconnect();
        observer = null;
        setHidden(false);
        removeToggleButton();
        if (styleEl) {
            styleEl.remove();
            styleEl = null;
        }
    }
});
