/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface BadgeIconDef {
    id: string;
    label: string;
    /** Inner markup of a 24x24 viewBox. Rendered with the badge colour as fill. */
    glyph: string;
    /** Colour used when the icon is picked for the first time. */
    color: string;
}

export const BADGE_ICONS: BadgeIconDef[] = [
    {
        id: "crown",
        label: "Crown",
        color: "#f5c542",
        glyph: "<path d=\"M3 8.6 7.2 12 12 5l4.8 7L21 8.6V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z\"/>"
    },
    {
        id: "star",
        label: "Star",
        color: "#f5c542",
        glyph: "<path d=\"M12 2.4l2.95 6.02 6.55.93-4.75 4.63 1.12 6.52L12 17.42 6.13 20.5l1.12-6.52L2.5 9.35l6.55-.93z\"/>"
    },
    {
        id: "heart",
        label: "Heart",
        color: "#ff6bd6",
        glyph: "<path d=\"M12 21S3.5 15.6 3.5 9.9A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 8.5 3.3C20.5 15.6 12 21 12 21z\"/>"
    },
    {
        id: "gem",
        label: "Gem",
        color: "#ff8ad8",
        glyph: "<path d=\"M7 3h10l4 6-9 12L3 9z\"/>"
    },
    {
        id: "flame",
        label: "Flame",
        color: "#ff7a45",
        glyph: "<path d=\"M12 2c.95 4.2 5 5.7 5 10.3A5 5 0 0 1 7 12.4c0-2.2 1.1-3.5 1.1-3.5s.15 2.4 1.65 2.4c1.4 0 .85-3.6 2.25-9.3z\"/>"
    },
    {
        id: "bolt",
        label: "Bolt",
        color: "#4fd8ff",
        glyph: "<path d=\"M13.6 2 5 13.6h5.6L9.4 22 18 10.4h-5.6z\"/>"
    },
    {
        id: "leaf",
        label: "Leaf",
        color: "#4ade80",
        glyph: "<path d=\"M20.5 3.5C10 3.5 3.5 9.7 3.5 18.5c9 0 17-6.2 17-15z\"/>"
    },
    {
        id: "moon",
        label: "Moon",
        color: "#c9d4ff",
        glyph: "<path d=\"M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a9 9 0 1 0 11.1 11.1z\"/>"
    },
    {
        id: "skull",
        label: "Skull",
        color: "#e7e7ea",
        glyph: "<path fill-rule=\"evenodd\" d=\"M12 2a8 8 0 0 0-8 8c0 2.1 1 3.7 2 4.7V19h4v2h4v-2h4v-4.3c1-1 2-2.6 2-4.7a8 8 0 0 0-8-8zM9 10.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zm6 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z\"/>"
    },
    {
        id: "cat",
        label: "Cat",
        color: "#ffb3d9",
        glyph: "<path d=\"M4.5 10.6c0-3.2 1-5.6 1-5.6l4 3h5l4-3s1 2.4 1 5.6c0 5.4-3.4 9-8 9s-8-3.6-8-9z\"/>"
    },
    {
        id: "shield",
        label: "Shield",
        color: "#5b8dff",
        glyph: "<path d=\"M12 2.5 20 5v6.5c0 5-3.6 8.3-8 10-4.4-1.7-8-5-8-10V5z\"/>"
    },
    {
        id: "sparkle",
        label: "Sparkle",
        color: "#c084fc",
        glyph: "<path d=\"M12 2.5l1.9 6.1 6.1 1.9-6.1 1.9L12 18.5l-1.9-6.1L4 10.5l6.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z\"/>"
    },
    {
        id: "ghost",
        label: "Ghost",
        color: "#d6d6e3",
        glyph: "<path d=\"M12 2.5a7 7 0 0 0-7 7V21l3-2 2 2 2-2 2 2 3-2V9.5a7 7 0 0 0-7-7z\"/>"
    },
    {
        id: "rocket",
        label: "Rocket",
        color: "#ffa14a",
        glyph: "<path d=\"M14.6 2.4c4.5 1 7 3.5 7 8l-4.5 4.6-6-6zM3.4 20.6l4.5-1 1-4.5 3 3-4.5 1z\"/>"
    },
    {
        id: "sword",
        label: "Sword",
        color: "#a6b3c9",
        glyph: "<path d=\"M20.5 2.5 10.8 12.2l1 1 9.7-9.7zM9.4 13.6 5 18l1 1 4.4-4.4z\"/>"
    },
    {
        id: "coffee",
        label: "Coffee",
        color: "#c9a17a",
        glyph: "<path d=\"M3.5 8.5h12v5.5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 9.5h1.5a2.5 2.5 0 0 1 0 5H17z\"/>"
    },
    {
        id: "music",
        label: "Music",
        color: "#7ee0c2",
        glyph: "<path d=\"M9 4.5 20 2.5v12a3 3 0 1 1-2-2.83V6L11 7.5V16a3 3 0 1 1-2-2.83z\"/>"
    },
    {
        id: "paw",
        label: "Paw",
        color: "#f7a8c8",
        glyph: "<path d=\"M7.2 11.2a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6zm9.6 0a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6zM12 12.6c-3 0-5.6 2.2-5.6 4.5S8.6 20.4 12 20.4s5.6-.9 5.6-3.3-2.6-4.5-5.6-4.5z\"/>"
    },
    {
        id: "eye",
        label: "Eye",
        color: "#a970ff",
        glyph: "<path fill-rule=\"evenodd\" d=\"M12 5.5c5.5 0 9.5 6.5 9.5 6.5s-4 6.5-9.5 6.5S2.5 12 2.5 12 6.5 5.5 12 5.5zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z\"/>"
    },
    {
        id: "chef",
        label: "Chef",
        color: "#ffffff",
        glyph: "<path d=\"M7 12.5A3.5 3.5 0 1 1 8.6 6 3.7 3.7 0 0 1 12 3.4 3.7 3.7 0 0 1 15.4 6 3.5 3.5 0 1 1 17 12.5V20H7z\"/>"
    }
];

const ICON_BY_ID = new Map(BADGE_ICONS.map(icon => [icon.id, icon]));

export const BADGE_COLORS = [
    "#a970ff",
    "#f5c542",
    "#ff6bd6",
    "#ff7a45",
    "#4ade80",
    "#4fd8ff",
    "#5b8dff",
    "#c084fc",
    "#e7e7ea"
];

export const DEFAULT_BADGE_COLOR = "#a970ff";

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isImageSource(icon: string) {
    return /^(?:https?:\/\/|data:image\/)/i.test(icon.trim());
}

export function getIconDef(icon: string) {
    return ICON_BY_ID.get(icon);
}

/**
 * Turns an icon id (or a custom image URL / data URI) into something an <img> can render.
 * Built-in icons are inlined as SVG data URIs so badges work without any network access.
 */
export function buildIconSrc(icon: string, color: string) {
    if (isImageSource(icon)) return icon.trim();

    const def = getIconDef(icon) ?? BADGE_ICONS[1];
    const accent = HEX_COLOR.test(color) ? color : def.color;

    const svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"72\" height=\"72\">"
        + "<defs><linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">"
        + "<stop offset=\"0\" stop-color=\"#313338\"/><stop offset=\"1\" stop-color=\"#101114\"/>"
        + "</linearGradient></defs>"
        + `<circle cx="12" cy="12" r="11.1" fill="url(#bg)" stroke="${accent}" stroke-width="1.6"/>`
        + `<g fill="${accent}" transform="translate(4.5 4.5) scale(0.625)">${def.glyph}</g>`
        + "</svg>";

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
