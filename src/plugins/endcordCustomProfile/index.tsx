/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { addProfileBadge, BadgePosition, BadgeRarity, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { SettingsStore } from "@api/Settings";
import { setCreatedAtOverride } from "@plugins/accountAge/overrides";
import { BADGE_IMAGE_ICONS, buildIconSrc } from "@plugins/endcordBadges/icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { UserStore } from "@webpack/common";

import { mountTopRightButton } from "./button";
import { applyFakeIdentities, decodeSharedProfiles, getSharedProfiles, keepFakeIdentitiesFresh, profileFor, restoreFakeIdentities, setLocalProfile, shareProfile } from "./profile";
import { installDateOverride } from "./profilePopup";
import { settings } from "./settings";

const BADGE_GROUP_ID = "endcord-fake-profile";

let unmountButton: (() => void) | undefined;
let unmountNameKeeper: (() => void) | undefined;
let unmountDate: (() => void) | undefined;

/** Fake profilin uygulanacağı kullanıcı (boşsa kendi hesabımız). */
function targetUserId(): string {
    const configured = settings.store.targetUserId?.trim();
    if (configured) return configured;

    return UserStore.getCurrentUser()?.id ?? "";
}

/** Hedef kullanıcı için fake profili kurar. */
function applyTargetProfile() {
    const userId = targetUserId();
    if (!userId) return;

    const { fakeUsername, fakeDisplayName, fakeBadges, fakeCreatedAt } = settings.store;

    const profile = {
        username: fakeUsername?.trim() || "",
        name: fakeDisplayName?.trim() || "",
        badges: Array.isArray(fakeBadges) ? fakeBadges : [],
        createdAt: fakeCreatedAt?.trim() || null
    };

    const hasSomething = profile.username || profile.name || profile.badges.length || profile.createdAt;

    if (!hasSomething) {
        // Her şey sıfırlandı — gerçek kimliği geri yaz
        setLocalProfile(userId, null);
        setCreatedAtOverride(userId, null);
        restoreFakeIdentities();
        unmountDate?.();
        unmountDate = undefined;
        return;
    }

    setLocalProfile(userId, profile);
    setCreatedAtOverride(userId, profile.createdAt);

    applyFakeIdentities();

    // Profil açılırındaki "Şu Tarihten Beri Üye" satırı
    unmountDate?.();
    unmountDate = profile.createdAt ? installDateOverride(userId, profile.createdAt) : undefined;
}

/** Fake profil rozetleri — sadece Devcord istemcisinde basılır. */
const FakeProfileBadges: ProfileBadge = {
    id: BADGE_GROUP_ID,
    description: "Devcord fake profil rozeti",
    position: BadgePosition.START,
    getBadges({ userId }) {
        const profile = profileFor(userId);
        if (!profile) return [];

        return profile.badges.map(badgeId => ({
            id: `endcord-fake-${badgeId}`,
            key: `endcord-fake-${badgeId}`,
            name: badgeId,
            description: "Devcord fake profil rozeti",
            infoLabel: "Devcord",
            rarity: BadgeRarity.MYTHIC,
            iconSrc: buildIconSrc(badgeId, "#a970ff"),
            largeIconSrc: buildIconSrc(badgeId, "#a970ff"),
            position: BadgePosition.START
        }));
    }
};

export default definePlugin({
    name: "DevcordCustomProfile",
    description: "Sahte profil: seçtiğin kullanıcıya sahte kullanıcı adı, sahte rozetler ve sahte oluşturma tarihi. Sadece bu istemcide görünür.",
    tags: ["Customisation", "Fun"],
    authors: [Devs.Devcord],
    settings,

    start() {
        addProfileBadge(FakeProfileBadges);

        decodeSharedProfiles();
        applyTargetProfile();

        unmountNameKeeper = keepFakeIdentitiesFresh();

        // Sağ üstteki Devcord logosu -> fake profil paneli
        unmountButton = mountTopRightButton();

        // Panelden/ayarlardan değişince anında uygula
        const apply = () => applyTargetProfile();

        for (const key of ["targetUserId", "fakeUsername", "fakeDisplayName", "fakeBadges", "fakeCreatedAt"]) {
            SettingsStore.addChangeListener(`plugins.DevcordCustomProfile.${key}` as never, apply);
        }

        // Otomatik paylaş açıksa her değişiklikte bio'yu güncelle (tüm Devcord kullanıcıları görür)
        let shareTimer: number | undefined;
        const autoShare = () => {
            if (!settings.store.autoShareProfile) return;
            if (shareTimer) window.clearTimeout(shareTimer);
            shareTimer = window.setTimeout(() => {
                const me = UserStore.getCurrentUser();
                if (!me) return;
                shareProfile({
                    username: settings.store.fakeUsername?.trim() || "",
                    name: settings.store.fakeDisplayName?.trim() || "",
                    badges: settings.store.fakeBadges ?? [],
                    createdAt: settings.store.fakeCreatedAt?.trim() || null
                }).catch(err => console.error("[Devcord] Failed to auto-share fake profile", err));
            }, 600);
        };
        for (const key of ["targetUserId", "fakeUsername", "fakeDisplayName", "fakeBadges", "fakeCreatedAt", "autoShareProfile"]) {
            SettingsStore.addChangeListener(`plugins.DevcordCustomProfile.${key}` as never, autoShare);
        }

        // Paylaşılmış (bio) profillerin tarihlerini de yaz
        for (const [userId, profile] of [...getSharedProfiles()]) {
            setCreatedAtOverride(userId, profile.createdAt);
        }

        if (settings.store.shareProfile || settings.store.autoShareProfile) {
            const me = UserStore.getCurrentUser();
            if (me) {
                shareProfile({
                    username: settings.store.fakeUsername?.trim() || "",
                    name: settings.store.fakeDisplayName?.trim() || "",
                    badges: settings.store.fakeBadges ?? [],
                    createdAt: settings.store.fakeCreatedAt?.trim() || null
                }).catch(err => console.error("[Devcord] Failed to share fake profile", err));
            }
        }
    },

    stop() {
        removeProfileBadge(FakeProfileBadges);
        unmountButton?.();
        unmountButton = undefined;
        unmountNameKeeper?.();
        unmountNameKeeper = undefined;
        unmountDate?.();
        unmountDate = undefined;
        setCreatedAtOverride(targetUserId(), null);
    }
});

export { BADGE_IMAGE_ICONS };
