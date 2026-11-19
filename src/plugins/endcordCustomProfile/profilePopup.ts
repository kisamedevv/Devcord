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

    const realDay = new Date(created).toISOString().slice(0, 10);
    const fakeText = fakeDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit"
    });
    const fakeTitle = fakeDate.toISOString();

    let writing = false;

    const apply = (root: ParentNode) => {
        for (const el of root.querySelectorAll<HTMLTimeElement>("time[datetime]")) {
            if (!el.getAttribute("datetime")?.startsWith(realDay)) continue;
            if (el.textContent === fakeText && el.getAttribute("title") === fakeTitle) continue;

            el.textContent = fakeText;
            el.setAttribute("title", fakeTitle);
            el.dataset.endcordFakeDate = "true";
        }
    };

    // Only walk the nodes Discord just touched. Rescanning the whole document on every mutation was the previous
    // behaviour and it turned each render tick into a full-tree querySelectorAll.
    const observer = new MutationObserver(records => {
        if (writing) return;

        writing = true;
        try {
            for (const record of records) {
                if (record.type === "characterData") {
                    const parent = record.target.parentElement;
                    if (parent) apply(parent);
                    continue;
                }

                for (const node of record.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;

                    const el = node as Element;
                    if (el.matches("time[datetime]")) apply(el.parentElement ?? el);
                    else apply(el);
                }
            }
        } finally {
            writing = false;
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // The popout may already be mounted when the override is installed, and Discord rewrites the row on refetch
    writing = true;
    try {
        apply(document.body);
    } finally {
        writing = false;
    }

    return () => observer.disconnect();
}
