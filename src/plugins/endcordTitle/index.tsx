/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    title: {
        type: OptionType.STRING,
        description: "Pencere ve sekme başlığında görünecek ad",
        default: "Endcord",
        restartNeeded: false
    },
    keepUnreadCount: {
        type: OptionType.BOOLEAN,
        description: "Okunmamış mesaj sayısını başlığın başında koru — (3) Endcord",
        default: true,
        restartNeeded: false
    }
});

/**
 * Discord başlığı sürekli kendisi yazar: "(3) Discord | #kanal".
 * Bu yüzden hem document.title setter'ı hem de <title> gözlemcisi kullanılır;
 * gelen değerden sayaç okunur, başlık bizim metnimizle yeniden yazılır.
 */
const nativeTitleDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "title")!;
let unreadCount = "";
let installedDescriptor: PropertyDescriptor | undefined;
let observer: MutationObserver | undefined;
let writing = false;

function buildTitle() {
    const name = settings.store.title?.trim() || "Endcord";
    return settings.store.keepUnreadCount && unreadCount ? `(${unreadCount}) ${name}` : name;
}

function writeTitle() {
    const next = buildTitle();
    if (document.title === next) return;

    writing = true;
    try {
        nativeTitleDescriptor.set!.call(document, next);
    } finally {
        writing = false;
    }
}

function ingest(raw: string) {
    const match = raw?.match(/^\((\d+)\)/);
    unreadCount = match ? match[1] : "";
}

export default definePlugin({
    name: "EndcordTitle",
    description: "Pencere/sekme başlığını \"Endcord\" yapar — istersen okunmamış mesaj sayısı başta kalır.",
    tags: ["Appearance", "Utility"],
    authors: [Devs.Endcord],
    settings,

    start() {
        // Discord yazdığında yakala, kendi metnimizi geri koy
        installedDescriptor = {
            configurable: true,
            enumerable: nativeTitleDescriptor.enumerable,
            get: () => nativeTitleDescriptor.get!.call(document),
            set(value: string) {
                if (writing) {
                    nativeTitleDescriptor.set!.call(document, value);
                    return;
                }

                ingest(String(value));
                writeTitle();
            }
        };
        Object.defineProperty(document, "title", installedDescriptor);

        // Bazı istemciler <title> düğümünü doğrudan değiştirir; o yol da kapatılır
        const titleEl = document.querySelector("title")
            ?? (document.head ?? document.documentElement).appendChild(document.createElement("title"));
        observer = new MutationObserver(() => {
            if (writing) return;
            ingest(titleEl.textContent ?? "");
            writeTitle();
        });
        observer.observe(titleEl, { childList: true, characterData: true, subtree: true });

        writeTitle();
    },

    stop() {
        observer?.disconnect();
        observer = undefined;

        if (installedDescriptor) {
            Object.defineProperty(document, "title", nativeTitleDescriptor);
            installedDescriptor = undefined;
        }

        unreadCount = "";
        nativeTitleDescriptor.set!.call(document, document.title.replace(/^\(\d+\)\s*/, ""));
    }
});
