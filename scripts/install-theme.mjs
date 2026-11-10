#!/usr/bin/node
/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Depodaki temaları Endcord veri klasörüne kopyalar ve varsayılan olarak açar.
 * Aynı anda Endcord'un kendi eklentilerini (rozet, başlık, kedi) etkinleştirir.
 *
 * Kullanım: node scripts/install-theme.mjs [--no-enable]
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const THEME_SOURCE = join(ROOT, "themes");

const PLUGINS_ON_BY_DEFAULT = ["EndcordBadges", "EndcordTitle", "EndcordAppearance", "EndcordGlass"];

function log(message) {
    console.log(`[Endcord] ${message}`);
}

function dataDir() {
    if (process.env.ENDCORD_USER_DATA_DIR) return process.env.ENDCORD_USER_DATA_DIR;

    if (process.platform === "win32") {
        const appData = process.env.APPDATA;
        if (!appData) throw new Error("APPDATA bulunamadı");
        return join(appData, "Endcord");
    }

    const home = process.env.HOME;
    if (!home) throw new Error("HOME bulunamadı");

    return process.platform === "darwin"
        ? join(home, "Library", "Application Support", "Endcord")
        : join(home, ".config", "Endcord");
}

const DATA_DIR = dataDir();
const THEMES_DIR = join(DATA_DIR, "themes");
const SETTINGS_DIR = join(DATA_DIR, "settings");
const SETTINGS_FILE = join(SETTINGS_DIR, "settings.json");

mkdirSync(THEMES_DIR, { recursive: true });
mkdirSync(SETTINGS_DIR, { recursive: true });

// ---- Temaları kopyala ----
const themeFiles = existsSync(THEME_SOURCE)
    ? readdirSync(THEME_SOURCE).filter(name => name.endsWith(".css"))
    : [];

for (const file of themeFiles) {
    copyFileSync(join(THEME_SOURCE, file), join(THEMES_DIR, file));
    log(`tema → ${join(THEMES_DIR, file)}`);
}

if (themeFiles.length === 0) log("tema dosyası bulunamadı, atlandı");

// ---- Ayarları oku ----
let settings = {};
if (existsSync(SETTINGS_FILE)) {
    try {
        settings = JSON.parse(readFileSync(SETTINGS_FILE, "utf-8"));
    } catch (err) {
        throw new Error(`settings.json okunamadı: ${err.message}`);
    }
}

if (process.argv.includes("--no-enable")) {
    log("ayarlar değiştirilmedi (--no-enable)");
    process.exit(0);
}

// ---- Temayı aç ----
const enabledThemes = new Set(Array.isArray(settings.enabledThemes) ? settings.enabledThemes : []);
for (const file of themeFiles) enabledThemes.add(file);
settings.enabledThemes = [...enabledThemes];

// ---- Eklentileri aç (kullanıcı ayarları korunur) ----
settings.plugins ??= {};
for (const plugin of PLUGINS_ON_BY_DEFAULT) {
    settings.plugins[plugin] = { ...(settings.plugins[plugin] ?? {}), enabled: true };
}

// ---- Windows 11 cam efekti ----
// transparent: Discord'un kendi penceresi saydam olur, temadaki yarı saydam
// panellerin arkasından masaüstü/akrilik görünür.
// windowsMaterial: Win11 akrilik bulanıklığı.
// Discord ayarları açılışta varsayılanları yazdığı için "tanımsızsa" kontrolü
// işe yaramıyor; olması istenen değerler doğrudan yazılıyor.
if (process.platform === "win32") {
    settings.transparent = true;
    settings.windowsMaterial = "acrylic";
}

writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 4) + "\n");
log(`ayarlar → ${SETTINGS_FILE}`);
log("tema açıldı, eklentiler etkinleştirildi");
