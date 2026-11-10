#!/usr/bin/node
/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Discord masaüstü istemcisine Endcord'u yerleştirir (veya kaldırır).
 *
 * Yöntem: Electron `resources/` altında önce `app` klasörüne bakar, sonra
 * `app.asar`'a. Bu yüzden `resources/app/index.js` yazmak yeterli — orijinal
 * `app.asar` dosyasına dokunulmaz, Discord güncellemesi onu bozamaz, kaldırmak
 * için tek klasör silinir.
 *
 * Kullanım:
 *   node scripts/install-desktop.mjs --install [--all]
 *   node scripts/install-desktop.mjs --uninstall [--all]
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const DIST = join(ROOT, "dist");

const CHANNELS = {
    stable: "Discord",
    ptb: "DiscordPTB",
    canary: "DiscordCanary",
    development: "DiscordDevelopment"
};

const BOOTSTRAP_INDEX = `// Endcord injector. Orijinal Discord app.asar bu dosyanın bir üst dizininde durur.
require("./patcher.js");
`;

const BOOTSTRAP_PACKAGE = JSON.stringify({
    name: "endcord-desktop",
    productName: "Endcord",
    version: "1.0.0",
    main: "index.js"
}, null, 4) + "\n";

function log(message) {
    console.log(`[Endcord] ${message}`);
}

function fail(message) {
    console.error(`[Endcord] ${message}`);
    process.exit(1);
}

function versionParts(name) {
    return name.slice(4).split(".").map(n => Number.parseInt(n, 10) || 0);
}

function isNewer(candidate, reference) {
    const a = versionParts(candidate);
    const b = versionParts(reference);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const left = a[i] ?? 0;
        const right = b[i] ?? 0;
        if (left !== right) return left > right;
    }

    return false;
}

/** Kurulu her kanal için en güncel app-* klasörünü döndürür */
function findInstalls() {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) fail("LOCALAPPDATA bulunamadı — bu betik Windows içindir.");

    const found = [];

    for (const [channel, folder] of Object.entries(CHANNELS)) {
        const base = join(localAppData, folder);
        if (!existsSync(base)) continue;

        const versions = readdirSync(base).filter(name => {
            if (!name.startsWith("app-")) return false;
            return statSync(join(base, name)).isDirectory();
        });
        if (versions.length === 0) continue;

        const latest = versions.reduce((prev, curr) => (isNewer(curr, prev) ? curr : prev));
        const resources = join(base, latest, "resources");

        if (!existsSync(join(resources, "app.asar"))) continue;

        found.push({ channel, version: latest, resources, target: join(resources, "app") });
    }

    return found;
}

function copyDist(target) {
    mkdirSync(target, { recursive: true });

    for (const entry of readdirSync(DIST)) {
        // Installer ikili dosyaları uygulama klasörüne girmesin
        if (entry === "Installer") continue;

        const source = join(DIST, entry);
        if (statSync(source).isDirectory()) continue;

        cpSync(source, join(target, entry));
    }

    writeFileSync(join(target, "package.json"), BOOTSTRAP_PACKAGE);
    writeFileSync(join(target, "index.js"), BOOTSTRAP_INDEX);
}

function install(installInfo) {
    const { channel, version, target } = installInfo;

    if (!existsSync(join(DIST, "patcher.js"))) {
        fail("dist/patcher.js yok — önce `corepack pnpm build` çalıştır.");
    }

    copyDist(target);
    log(`${channel} ${version} → ${target}`);
}

function uninstall(installInfo) {
    const { channel, version, target } = installInfo;

    if (!existsSync(target)) {
        log(`${channel} ${version}: zaten temiz`);
        return;
    }

    rmSync(target, { recursive: true, force: true });
    log(`${channel} ${version}: kaldırıldı`);
}

const argv = process.argv.slice(2);
const mode = argv.find(arg => arg === "--install" || arg === "--uninstall");
const all = argv.includes("--all");
const channelArg = argv.find(arg => arg.startsWith("--channel="))?.split("=")[1];

if (!mode) fail("Kullanım: node scripts/install-desktop.mjs --install [--all] [--channel=stable|ptb|canary]");

const installs = findInstalls();
if (installs.length === 0) fail("Kurulu Discord bulunamadı (%LOCALAPPDATA%\\Discord*).");

const selected = installs.filter(info => {
    if (all) return true;
    if (channelArg) return info.channel === channelArg;
    return info.channel === "stable" || info.channel === "ptb";
});

if (selected.length === 0) {
    fail(`Seçilen kanal bulunamadı. Bulunanlar: ${installs.map(i => i.channel).join(", ")}`);
}

for (const info of selected) {
    if (mode === "--install") install(info);
    else uninstall(info);
}

log("Bitti. Discord açıksa yeniden başlat.");
