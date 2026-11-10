/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Sahte profil verisini "görünmez" karakterlerle taşır.
 *
 * Amaç: fake isim / fake rozetler / fake oluşturma tarihi sadece Endcord
 * kullanan istemcilerde görünsün. Veri, kullanıcının profil açıklamasına
 * (bio) görünmez karakterler olarak gömülür — normal Discord istemcisi
 * açıklamayı boş görür, Endcord ise çözer ve fake profili çizer.
 *
 * 27 görünmez sembol, sembol başına ~4.75 bit. 190 karakterlik bio alanına
 * yaklaşık 85 bayt veri sığar — isim + birkaç rozet + tarih için fazlasıyla.
 */

/** Tamamen görünmez, çoğu fontta hiç çizilmeyen kod noktaları. */
const SYMBOL_CODEPOINTS = [
    0x200B, // zero width space
    0x200C, // zero width non-joiner
    0x200D, // zero width joiner
    0x2060, // word joiner
    0x2061, // function application
    0x2062, // invisible times
    0x2063, // invisible separator
    0x2064, // invisible plus
    0xFE00, // variation selector 1
    0xFE01,
    0xFE02,
    0xFE03,
    0xFE04,
    0xFE05,
    0xFE06,
    0xFE07,
    0xFE08,
    0xFE09,
    0xFE0A,
    0xFE0B,
    0xFE0C,
    0xFE0D,
    0xFE0E,
    0xFE0F,
    0x034F, // combining grapheme joiner
    0x00AD, // soft hyphen
    0x180E // mongolian vowel separator
];

const SYMBOLS = SYMBOL_CODEPOINTS.map(cp => String.fromCharCode(cp));

const BASE = BigInt(SYMBOLS.length);

/** Profil verisini başlık imzasıyla birlikte bayta çevirir. */
export interface FakeProfile {
    /** Sahte görünen isim */
    name: string;
    /** Rozet kimlikleri (endcordBadges ikon id'leri) */
    badges: string[];
    /** Sahte hesap oluşturma tarihi (ISO) */
    createdAt: string | null;
}

const MAGIC = "ec1";

function toBytes(text: string): number[] {
    return Array.from(new TextEncoder().encode(text));
}

function fromBytes(bytes: number[]): string {
    return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Ham baytları görünmez sembollere çevirir. */
export function encodeBytes(bytes: number[]): string {
    let value = 0n;
    for (const byte of bytes) value = (value << 8n) | BigInt(byte);

    if (value === 0n) return SYMBOLS[0];

    let out = "";
    while (value > 0n) {
        out = SYMBOLS[Number(value % BASE)] + out;
        value /= BASE;
    }
    return out;
}

/** Görünmez sembolleri bayta çevirir; tanımadığı karakter varsa null. */
export function decodeBytes(text: string): number[] | null {
    if (!text) return null;

    const indexes: number[] = [];
    for (const char of text) {
        const index = SYMBOLS.indexOf(char);
        if (index === -1) return null;
        indexes.push(index);
    }

    let value = 0n;
    for (const index of indexes) value = (value * BASE) + BigInt(index);

    const bytes: number[] = [];
    while (value > 0n) {
        bytes.unshift(Number(value & 0xffn));
        value >>= 8n;
    }
    return bytes;
}

export function encodeProfile(profile: FakeProfile): string {
    const payload = JSON.stringify({
        n: profile.name,
        b: profile.badges,
        d: profile.createdAt
    });

    return encodeBytes(toBytes(`${MAGIC}:${payload}`));
}

/** Bio içindeki görünmez veriyi çözer; Endcord verisi yoksa null. */
export function decodeProfile(text: string | undefined | null): FakeProfile | null {
    if (!text) return null;

    const bytes = decodeBytes(text);
    if (!bytes) return null;

    let decoded: string;
    try {
        decoded = fromBytes(bytes);
    } catch {
        return null;
    }

    if (!decoded.startsWith(`${MAGIC}:`)) return null;

    try {
        const parsed = JSON.parse(decoded.slice(MAGIC.length + 1));
        if (!parsed || typeof parsed.n !== "string") return null;

        return {
            name: parsed.n,
            badges: Array.isArray(parsed.b) ? parsed.b.filter((id: unknown): id is string => typeof id === "string") : [],
            createdAt: typeof parsed.d === "string" ? parsed.d : null
        };
    } catch {
        return null;
    }
}
