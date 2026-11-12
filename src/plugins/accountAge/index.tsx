/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import type { Channel, User } from "@endcord/discord-types";
import { copyToClipboard } from "@utils/clipboard";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Menu, showToast } from "@webpack/common";

import { getCreatedAtOverride } from "./overrides";

// Discord snowflakes encode the creation time in their high bits
const DISCORD_EPOCH = 1420070400000n;

function getCreationDate(id: string) {
    if (!/^\d{5,25}$/.test(id)) return null;

    try {
        const timestamp = Number((BigInt(id) >> 22n) + DISCORD_EPOCH);
        const date = new Date(timestamp);
        return Number.isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
}

function formatDate(date: Date) {
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function accountAge(date: Date) {
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days < 1) return "less than a day old";

    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const parts = [
        years ? `${years} year${years === 1 ? "" : "s"}` : "",
        months ? `${months} month${months === 1 ? "" : "s"}` : "",
        !years && !months ? `${days} day${days === 1 ? "" : "s"}` : ""
    ].filter(Boolean);

    return `~${parts.join(", ")} old`;
}

interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user: User;
}

const UserContextPatch: NavContextMenuPatchCallback = (children, { user }: UserContextProps) => {
    if (!user?.id) return;

    // Fake profil (DevcordCustomProfile) tarihi ezmisse o geçerli
    const override = getCreatedAtOverride(user.id);
    const created = override ? new Date(override) : getCreationDate(user.id);
    if (!created) return;

    children.push(
        <Menu.MenuItem
            id="vc-account-age"
            label={`Account created ${formatDate(created)} (${accountAge(created)})`}
            action={() => {
                copyToClipboard(created.toISOString());
                showToast({ text: "Account creation date copied", variant: "success" });
            }}
        />
    );
};

export default definePlugin({
    name: "AccountAge",
    description: "Shows when a user's account was created in the user context menu — handy for spotting fresh accounts.",
    tags: ["Utility", "Friends"],
    authors: [Devs.Devcord],
    contextMenus: {
        "user-context": UserContextPatch
    }
});
