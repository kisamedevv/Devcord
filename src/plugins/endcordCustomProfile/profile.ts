/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RestAPI, UserStore } from "@webpack/common";

import { decodeProfile, encodeProfile, FakeProfile } from "./payload";

export type { FakeProfile };

/** Kullanıcının bio'sundaki görünmez koddan çözülen profiller. */
const sharedProfiles = new Map<string, FakeProfile>();

export function getSharedProfile(userId: string): FakeProfile | undefined {
    return sharedProfiles.get(userId);
}

export function getSharedProfiles(): Map<string, FakeProfile> {
    return sharedProfiles;
}

/** Tüm kullanıcıların bio alanlarını tarar, gömülü profilleri çözer. */
export function decodeSharedProfiles() {
    sharedProfiles.clear();

    for (const user of Object.values(UserStore.getUsers())) {
        const { bio } = user as unknown as { bio?: string };
        const profile = decodeProfile(bio);
        if (profile) sharedProfiles.set(user.id, profile);
    }
}

/**
 * Sahte profili profil açıklamasına görünmez kod olarak yazar.
 * Normal Discord istemcisi açıklamayı boş görür; Endcord çözer.
 */
export async function shareProfile(profile: FakeProfile): Promise<void> {
    const me = UserStore.getCurrentUser();
    if (!me) return;

    const body = { bio: encodeProfile(profile) };

    // Discord profil güncelleme ucu sürüme göre PATCH ya da PUT olabiliyor
    try {
        await RestAPI.patch({ url: "/users/@me/profile", body });
        return;
    } catch (err) {
        console.error("[Endcord] PATCH /users/@me/profile failed, trying PUT", err);
    }

    await RestAPI.put({ url: "/users/@me/profile", body });
}

/** Kendi kullanıcı nesnemizin görünen ismini değiştirir (sadece yerelde). */
export function applyLocalName(profile: FakeProfile | null) {
    const me = UserStore.getCurrentUser();
    if (!me || !profile?.name) return;

    (me as unknown as { globalName: string }).globalName = profile.name;
}
