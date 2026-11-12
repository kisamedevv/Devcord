/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RestAPI, UserStore } from "@webpack/common";

import { decodeProfile, encodeProfile, FakeProfile } from "./payload";

export type { FakeProfile };

/** Bio'daki görünmez koddan çözülen profiller (paylaşılmış fake profiller). */
const sharedProfiles = new Map<string, FakeProfile>();

/** Yerel olarak fake'lenen profiller — kullanıcı ID -> profil. */
const localProfiles = new Map<string, FakeProfile>();

export function getSharedProfile(userId: string): FakeProfile | undefined {
    return sharedProfiles.get(userId);
}

export function getSharedProfiles(): Map<string, FakeProfile> {
    return sharedProfiles;
}

export function getLocalProfile(userId: string): FakeProfile | undefined {
    return localProfiles.get(userId);
}

/** Yerel fake profil kaydeder (seçili kullanıcı için). */
export function setLocalProfile(userId: string, profile: FakeProfile | null) {
    if (!profile) {
        localProfiles.delete(userId);
        return;
    }

    localProfiles.set(userId, profile);
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
 * Kullanıcı için gösterilecek fake profil.
 * Önce yerel ayar, sonra paylaşılmış (bio) kod.
 */
export function profileFor(userId: string): FakeProfile | null {
    return localProfiles.get(userId) ?? sharedProfiles.get(userId) ?? null;
}

/** Yazmadan önceki gerçek değerler — sıfırlama için saklanıyor. */
const originals = new Map<string, { username: string; globalName: string; discriminator: string }>();

/**
 * Fake kullanıcı adını ve görünen ismi store nesnesine yazar.
 *
 * Kullanıcı adı (@handle) ve görünen isim (display name) ayrı ayrıdır:
 * sadece @handle'i değiştirmek isteyen biri ismini kaybetmez.
 *
 * NOT: Discord'un getDisplayName fonksiyonunu yamalamıyoruz — getDisplayName
 * kendi içinde kendini çağırdığı için yama sonsuz döngüye
 * (Maximum call stack size exceeded) yol açıp istemciyi çökertiyordu.
 * Store nesnesi üzerinden yazmak aynı sonucu verir: profil açılırındaki
 * kullanıcı adı, alt sol panel, mesajlar ve üye listesi hepsi fake ismi görür.
 */
export function applyFakeIdentities() {
    const write = (userId: string, profile: FakeProfile) => {
        const user = UserStore.getUser(userId);
        if (!user) return;

        const target = user as unknown as { username: string; globalName: string; discriminator: string };

        if (!originals.has(userId)) {
            originals.set(userId, {
                username: target.username,
                globalName: target.globalName,
                discriminator: target.discriminator
            });
        }

        if (profile.username) {
            target.username = profile.username;
            // Yeni kullanıcı adı sisteminde etiket yok
            target.discriminator = "0";
        }

        if (profile.name) target.globalName = profile.name;
    };

    for (const [userId, profile] of localProfiles) write(userId, profile);
    for (const [userId, profile] of sharedProfiles) write(userId, profile);
}

/** Gerçek kullanıcı adı/isim geri yazılır — fake profili sıfırlarken kullanılır. */
export function restoreFakeIdentities() {
    for (const [userId, original] of originals) {
        const user = UserStore.getUser(userId);
        if (!user) continue;

        const target = user as unknown as { username: string; globalName: string; discriminator: string };
        target.username = original.username;
        target.globalName = original.globalName;
        target.discriminator = original.discriminator;
    }

    originals.clear();
}

/**
 * Discord kullanıcı nesnelerini store güncellemelerinde değiştirdiği için
 * fake kimlikleri tazeleriz (sürüm değiştiğinde).
 */
export function keepFakeIdentitiesFresh(): () => void {
    let lastVersion = -1;

    const tick = () => {
        try {
            const version = UserStore.getUserStoreVersion();
            if (version === lastVersion) return;

            lastVersion = version;
            applyFakeIdentities();
        } catch {
            // store henüz hazır değil, sonraki turda dener
        }
    };

    tick();

    const timer = window.setInterval(tick, 1500);
    return () => window.clearInterval(timer);
}

/** RestAPI hataları nesne geliyor; okunur hale getiriyoruz. */
function describeError(err: unknown): string {
    const any = err as { status?: number; message?: string; body?: { message?: string; code?: number } };

    const detail = any?.body?.message
        ?? any?.message
        ?? (any?.status ? `HTTP ${any.status}` : "");

    return detail || JSON.stringify(err);
}

/**
 * Sahte profili profil açıklamasına görünmez kod olarak yazar.
 * Normal Discord istemcisi açıklamayı boş görür; Devcord çözer.
 */
export async function shareProfile(profile: FakeProfile): Promise<void> {
    const me = UserStore.getCurrentUser();
    if (!me) return;

    const payload = encodeProfile(profile);
    const body = { bio: payload };

    // Discord profil guncelleme ucu surume gore degisiyor ve bazi surumler
    // 405 (method not allowed) donduruyor; birkac yontem/uc deniyoruz.
    const attempts: Array<() => Promise<unknown>> = [
        () => RestAPI.put({ url: "/users/@me/profile", body }),
        () => RestAPI.patch({ url: "/users/@me/profile", body }),
        () => RestAPI.put({ url: "/users/@me", body }),
        () => RestAPI.patch({ url: "/users/@me", body }),
        () => RestAPI.put({ url: "/users/@me/status", body: { custom_status: { text: payload } } }),
        () => RestAPI.patch({ url: "/users/@me/status", body: { custom_status: { text: payload } } })
    ];

    const errors: string[] = [];

    for (const attempt of attempts) {
        try {
            await attempt();
            return;
        } catch (err) {
            errors.push(describeError(err));
        }
    }

    throw new Error(errors.join(" | ") || "bilinmeyen hata");
}
