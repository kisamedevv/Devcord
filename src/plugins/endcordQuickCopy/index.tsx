/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import type { User } from "@endcord/discord-types";
import { copyToClipboard } from "@utils/clipboard";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Menu, showToast } from "@webpack/common";

// Discord snowflakes encode the creation time in their high bits
const DISCORD_EPOCH = 1420070400000n;

function creationDate(id: string) {
    if (!/^\d{5,25}$/.test(id)) return null;

    try {
        const timestamp = Number((BigInt(id) >> 22n) + DISCORD_EPOCH);
        const date = new Date(timestamp);
        return Number.isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
}

function copy(text: string, label: string) {
    copyToClipboard(text);
    showToast({ text: `${label} kopyalandı`, variant: "success" });
}

const UserContextPatch: NavContextMenuPatchCallback = (children, { user }: { user: User; }) => {
    if (!user?.id) return;

    const created = creationDate(user.id);

    children.push(
        <Menu.MenuItem
            id="vc-endcord-copy-id"
            label="Kullanıcı ID'sini Kopyala"
            action={() => copy(user.id, "Kullanıcı ID")}
        />
    );

    children.push(
        <Menu.MenuItem
            id="vc-endcord-copy-mention"
            label="@mention Kopyala"
            action={() => copy(`<@${user.id}>`, "Mention")}
        />
    );

    if (created) {
        children.push(
            <Menu.MenuItem
                id="vc-endcord-copy-created"
                label="Hesap Oluşturma Tarihini Kopyala"
                action={() => copy(created.toISOString(), "Tarih")}
            />
        );
    }
};

export default definePlugin({
    name: "EndcordQuickCopy",
    description: "Sağ tık menüsünden kullanıcı ID, @mention ve hesap oluşturma tarihini kopyala.",
    tags: ["Utility", "Friends"],
    authors: [Devs.Endcord],
    contextMenus: {
        "user-context": UserContextPatch
    }
});
