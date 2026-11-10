/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { addProfileBadge, BadgePosition, BadgeRarity, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { addMemberListDecorator, MemberListDecoratorFactory, removeMemberListDecorator } from "@api/MemberListDecorators";
import { addMessageDecoration, MessageDecorationFactory, removeMessageDecoration } from "@api/MessageDecorations";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

import { buildIconSrc } from "./icons";
import { settings } from "./settings";
import { BadgeEntry,badgesForUser } from "./store";

const BADGE_GROUP_ID = "endcord-custom-badges";
const MEMBER_LIST_ID = "EndcordBadges";
const CHAT_DECORATION_ID = "EndcordBadges";

function currentBadges(): BadgeEntry[] {
    return settings.store.badges ?? [];
}

const CustomBadges: ProfileBadge = {
    id: BADGE_GROUP_ID,
    description: "Endcord badge",
    position: BadgePosition.START,
    getBadges({ userId }) {
        const size = `${settings.store.badgeSize ?? 22}px`;

        return badgesForUser(currentBadges(), userId).map(badge => ({
            id: `endcord-badge-${badge.id}`,
            key: `endcord-badge-${badge.id}`,
            name: badge.name,
            description: badge.description || badge.name,
            infoLabel: "Endcord",
            rarity: BadgeRarity.MYTHIC,
            iconSrc: buildIconSrc(badge.icon, badge.color),
            largeIconSrc: buildIconSrc(badge.icon, badge.color),
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

export default definePlugin({
    name: "EndcordBadges",
    description: "Add your own badges — with a built-in icon library — to any profile. Purely local, no server needed.",
    tags: ["Customisation", "Fun"],
    authors: [Devs.Endcord],
    settings,

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
