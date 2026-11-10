/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { BADGE_ICONS, DEFAULT_BADGE_COLOR } from "./icons";

export interface BadgeEntry {
    /** Stable id, used for React keys and the badge id Discord sees */
    id: string;
    name: string;
    /** Built-in icon id (see BADGE_ICONS) or an http(s)/data: image URL */
    icon: string;
    color: string;
    description: string;
    /** Discord user ids that should be given this badge. "*" means everyone. */
    userIds: string[];
}

export const ANY_USER = "*";

export function createId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createBadge(overrides: Partial<BadgeEntry> = {}): BadgeEntry {
    const icon = BADGE_ICONS[Math.floor(Math.random() * BADGE_ICONS.length)];

    return {
        id: createId(),
        name: "New Badge",
        icon: icon.id,
        color: icon.color ?? DEFAULT_BADGE_COLOR,
        description: "",
        userIds: [],
        ...overrides
    };
}

export function createStarterBadges(): BadgeEntry[] {
    return [
        {
            id: "endcord-starter",
            name: "Endcord",
            icon: "eye",
            color: "#a970ff",
            description: "Made with Endcord",
            userIds: []
        }
    ];
}

function asString(value: unknown, fallback = "") {
    return typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "bigint"
            ? String(value)
            : fallback;
}

export function parseUserIds(input: string) {
    const ids = input
        .split(/[\s,;]+/)
        .map(id => id.trim())
        .filter(id => id === ANY_USER || /^\d{5,25}$/.test(id));

    return Array.from(new Set(ids));
}

export function normalizeBadges(raw: unknown): BadgeEntry[] {
    if (!Array.isArray(raw)) return createStarterBadges();

    const seen = new Set<string>();
    const result: BadgeEntry[] = [];

    for (const item of raw) {
        if (!item || typeof item !== "object") continue;

        const entry = item as Partial<BadgeEntry>;
        let id = asString(entry.id).trim() || createId();
        if (seen.has(id)) id = createId();
        seen.add(id);

        result.push({
            id,
            name: asString(entry.name).trim() || "Unnamed Badge",
            icon: asString(entry.icon).trim() || "star",
            color: asString(entry.color).trim() || DEFAULT_BADGE_COLOR,
            description: asString(entry.description),
            userIds: Array.isArray(entry.userIds)
                ? parseUserIds(entry.userIds.map(id => asString(id)).join(" "))
                : []
        });
    }

    return result;
}

export function cloneBadges(badges: BadgeEntry[]) {
    return JSON.parse(JSON.stringify(badges)) as BadgeEntry[];
}

/** Badges that should be rendered for the given user. */
export function badgesForUser(badges: BadgeEntry[], userId: string) {
    return badges.filter(badge => badge.userIds.includes(ANY_USER) || badge.userIds.includes(userId));
}
