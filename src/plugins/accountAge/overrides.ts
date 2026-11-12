/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Sahte hesap oluşturma tarihleri.
 * DevcordCustomProfile bu tabloyu doldurur, AccountAge okur.
 * Böylece sahte tarih hem profil kartında hem sağ tık menüsünde tutarlı.
 */
const overrides = new Map<string, string>();

export function setCreatedAtOverride(userId: string, isoDate: string | null) {
    if (!isoDate) {
        overrides.delete(userId);
        return;
    }

    overrides.set(userId, isoDate);
}

export function getCreatedAtOverride(userId: string): string | null {
    return overrides.get(userId) ?? null;
}

export function clearCreatedAtOverrides() {
    overrides.clear();
}
