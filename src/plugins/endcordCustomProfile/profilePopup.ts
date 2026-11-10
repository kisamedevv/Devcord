/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Profil açılırındaki "Şu Tarihten Beri Üye" satırını fake tarihle değiştirir.
 *
 * Discord bu tarihi kullanıcı ID'sinden (snowflake) hesaplayıp bir
 * <time datetime="..."> elemanına basıyor. Biz o elemanı bulup içeriğini
 * fake tarihle değiştiriyoruz — sadece bizim istemcimizde, gerçek veri
 * yerinde duruyor.
 */

const SNOWFLAKE_EPOCH = 1420070400000n;

export function creationTimestamp(userId: string): number | null {
    if (!/^\d{5,25}$/.test(userId)) return null;

    try {
        return Number((BigInt(userId) >> 22n) + SNOWFLAKE_EPOCH);
    } catch {
        return null;
    }
}

/** Profil açılırındaki tarihi fake tarihle değiştiren gözlemci. */
export function installDateOverride(userId: string, fakeIso: string): () => void {
    const created = creationTimestamp(userId);
    if (!created) return () => { };

    const fakeDate = new Date(fakeIso);
    if (Number.isNaN(fakeDate.getTime())) return () => { };

    const realIso = new Date(created).toISOString();
    const fakeText = fakeDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit"
    });

    const apply = (root: ParentNode) => {
        for (const el of root.querySelectorAll<HTMLTimeElement>("time[datetime]")) {
            const value = el.getAttribute("datetime") ?? "";
            if (!value.startsWith(realIso.slice(0, 10))) continue;

            el.textContent = fakeText;
            el.setAttribute("title", fakeDate.toISOString());
            el.dataset.endcordFakeDate = "true";
        }
    };

    const observer = new MutationObserver(() => apply(document));

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    });

    const timer = window.setInterval(() => apply(document), 1000);
    apply(document);

    return () => {
        observer.disconnect();
        window.clearInterval(timer);
    };
}
