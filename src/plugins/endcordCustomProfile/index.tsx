/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { addProfileBadge, BadgePosition, BadgeRarity, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { setCreatedAtOverride } from "@plugins/accountAge/overrides";
import { BADGE_IMAGE_ICONS, buildIconSrc } from "@plugins/endcordBadges/icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { UserStore } from "@webpack/common";

import { applyLocalName, decodeSharedProfiles, getSharedProfile, getSharedProfiles, shareProfile } from "./profile";
import { settings } from "./settings";

const BADGE_GROUP_ID = "endcord-fake-profile";

/** Local (kendi) fake profil. */
function localProfile() {
    const { fakeName, fakeBadges, fakeCreatedAt } = settings.store;

    return {
        name: fakeName?.trim() || "",
        badges: Array.isArray(fakeBadges) ? fakeBadges : [],
        createdAt: fakeCreatedAt?.trim() || null
    };
}

/** Kullanıcının fake profili: önce paylaşılmış kod, yoksa yerel ayar. */
function profileFor(userId: string) {
    const me = UserStore.getCurrentUser();
    if (me && userId === me.id) return localProfile();

    return getSharedProfile(userId) ?? null;
}

/** Fake profil rozetleri — sadece Endcord istemcisinde basılır. */
const FakeProfileBadges: ProfileBadge = {
    id: BADGE_GROUP_ID,
    description: "Endcord fake profil rozeti",
    position: BadgePosition.START,
    getBadges({ userId }) {
        const profile = profileFor(userId);
        if (!profile) return [];

        return profile.badges.map(badgeId => ({
            id: `endcord-fake-${badgeId}`,
            key: `endcord-fake-${badgeId}`,
            name: badgeId,
            description: "Endcord fake profil rozeti",
            infoLabel: "Endcord",
            rarity: BadgeRarity.MYTHIC,
            iconSrc: buildIconSrc(badgeId, "#a970ff"),
            largeIconSrc: buildIconSrc(badgeId, "#a970ff"),
            position: BadgePosition.START
        }));
    }
};

export default definePlugin({
    name: "EndcordCustomProfile",
    description: "Sahte profil: sahte isim, sahte rozetler ve sahte hesap oluşturma tarihi. Paylaşıldığında sadece Endcord kullananlar görür.",
    tags: ["Customisation", "Fun"],
    authors: [Devs.Endcord],
    settings,

    start() {
        addProfileBadge(FakeProfileBadges);

        const me = UserStore.getCurrentUser();
        applyLocalName(localProfile());

        decodeSharedProfiles();

        // Fake tarihleri AccountAge'in okuduğu tabloya yaz
        if (me) {
            const local = localProfile();
            setCreatedAtOverride(me.id, local.createdAt);
        }

        for (const [userId, profile] of [...getSharedProfiles()]) {
            setCreatedAtOverride(userId, profile.createdAt);
        }

        if (settings.store.shareProfile) {
            shareProfile(localProfile()).catch(err => console.error("[Endcord] Failed to share fake profile", err));
        }
    },

    stop() {
        removeProfileBadge(FakeProfileBadges);
        setCreatedAtOverride(UserStore.getCurrentUser()?.id ?? "", null);
    }
});

export { BADGE_IMAGE_ICONS };
