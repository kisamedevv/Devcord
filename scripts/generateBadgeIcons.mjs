#!/usr/bin/node
/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * assets/discord-badges/*.png dosyalarını renderer'da kullanılabilir data URI
 * tablosuna çevirir. PNG'ler build'e gömülür, çalışma anında hiçbir ağ isteği yapılmaz.
 *
 * Kaynak: https://github.com/merlinfuchs/discord-badges (PNG klasörü)
 *
 * Kullanım: node scripts/generateBadgeIcons.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const SOURCE = join(ROOT, "assets", "discord-badges");
const TARGET = join(ROOT, "src", "plugins", "endcordBadges", "badges.generated.ts");

function labelize(name) {
    return name
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

const files = readdirSync(SOURCE).filter(name => name.endsWith(".png")).sort();

const entries = files.map(file => {
    const id = file.replace(/\.png$/i, "");
    const base64 = readFileSync(join(SOURCE, file)).toString("base64");

    return `    {
        id: ${JSON.stringify(id)},
        label: ${JSON.stringify(labelize(id))},
        src: "data:image/png;base64,${base64}"
    }`;
});

const contents = `/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// OTOMATİK ÜRETİLDİ — elle düzenleme.
// Kaynak: scripts/generateBadgeIcons.mjs
// Görseller: assets/discord-badges (github.com/merlinfuchs/discord-badges)

export interface DiscordBadgeImage {
    id: string;
    label: string;
    /** Gömülü PNG, data URI olarak */
    src: string;
}

export const DISCORD_BADGE_IMAGES: DiscordBadgeImage[] = [
${entries.join(",\n")}
];
`;

writeFileSync(TARGET, contents);
console.log(`[Endcord] ${files.length} rozet ikonu üretildi → ${TARGET}`);
