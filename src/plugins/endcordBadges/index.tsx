/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { addProfileBadge, BadgePosition, BadgeRarity, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { addMemberListDecorator, MemberListDecoratorFactory, removeMemberListDecorator } from "@api/MemberListDecorators";
import { addMessageDecoration, MessageDecorationFactory, removeMessageDecoration } from "@api/MessageDecorations";
import type { User } from "@endcord/discord-types";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Menu, UserStore } from "@webpack/common";

import { buildIconSrc } from "./icons";
import { openBadgePicker } from "./picker";
import { settings } from "./settings";
import { BadgeEntry,badgesForUser } from "./store";

const BADGE_GROUP_ID = "endcord-custom-badges";
const MEMBER_LIST_ID = "DevcordBadges";
const CHAT_DECORATION_ID = "DevcordBadges";

function currentBadges(): BadgeEntry[] {
    return settings.store.badges ?? [];
}

const CustomBadges: ProfileBadge = {
    id: BADGE_GROUP_ID,
    description: "Devcord badge",
    position: BadgePosition.START,
    getBadges({ userId }) {
        const size = `${settings.store.badgeSize ?? 22}px`;

        return badgesForUser(currentBadges(), userId).map(badge => ({
            id: `endcord-badge-${badge.id}`,
            key: `endcord-badge-${badge.id}`,
            title: badge.name,
            description: badge.description || badge.name,
            rarity: BadgeRarity.MYTHIC,
            iconSrc: buildIconSrc(badge.icon, badge.color),
            position: BadgePosition.START,
            props: {
                style: {
                    width: size,
                    height: size,
                    borderRadius: "50%"
                }
            }
        } satisfies ProfileBadge));
    }
};

function InlineBadges({ userId }: { userId: string; }) {
    const badges = badgesForUser(currentBadges(), userId);
    if (!badges.length) return null;

    return (
        <div className="vc-ecb-inline">
            {badges.map(badge => (
                <img
                    key={badge.id}
                    src={buildIconSrc(badge.icon, badge.color)}
                    alt=""
                    title={badge.name}
                />
            ))}
        </div>
    );
}

const MemberListBadges: MemberListDecoratorFactory = ({ user }) => {
    if (!settings.store.showInMemberList) return null;
    return <InlineBadges userId={user.id} />;
};

const ChatBadges: MessageDecorationFactory = ({ message }) => {
    if (!settings.store.showInChat) return null;
    return <InlineBadges userId={message.author.id} />;
};

/** Sağ tık menüsü: "Rozet ver" → modal açılır. */
const UserContextPatch: NavContextMenuPatchCallback = (children, { user }: { user?: User; }) => {
    if (!user?.id) return;

    const isSelf = user.id === UserStore.getCurrentUser()?.id;

    children.push(
        <Menu.MenuItem
            id="vc-endcord-badges-picker"
            label={isSelf ? "Kendine Devcord Rozeti Ver" : "Devcord Rozeti Ver (sadece sende görünür)"}
            action={() => openBadgePicker(user.id, user.username)}
        />
    );
};

export default definePlugin({
    name: "DevcordBadges",
    description: "Add your own badges — with a built-in icon library — to any profile. Purely local, no server needed.",
    tags: ["Customisation", "Fun"],
    authors: [Devs.Devcord],
    settings,
    contextMenus: {
        "user-context": UserContextPatch,
        "user-profile-actions": UserContextPatch,
        "user-profile-overflow-menu": UserContextPatch
    },

    start() {
        addProfileBadge(CustomBadges);
        addMemberListDecorator(MEMBER_LIST_ID, MemberListBadges);
        addMessageDecoration(CHAT_DECORATION_ID, ChatBadges);
    },

    stop() {
        removeProfileBadge(CustomBadges);
        removeMemberListDecorator(MEMBER_LIST_ID);
        removeMessageDecoration(CHAT_DECORATION_ID);
    }
});
