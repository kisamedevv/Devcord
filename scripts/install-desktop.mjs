#!/usr/bin/node
/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Discord masaüstü istemcisine Endcord'u yerleştirir (veya kaldırır).
 *
 * Yöntem (upstream Vencord ile aynı): Discord'un `resources/app.asar` dosyası
 * Endcord'un kendi asar'ı ile değiştirilir, orijinal asar `_app.asar` olarak
 * saklanır. Electron asar'ı çalıştırdığı için orijinal kod da çalışmaya
 * devam eder; kaldırmak `_app.asar` dosyasını geri almaktır.
 *
 * Kullanım:
 *   node scripts/install-desktop.mjs --install [--all] [--channel=stable]
 *   node scripts/install-desktop.mjs --uninstall [--all]
 */

import { createPackage } from "@electron/asar";
import { execFileSync } from "child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const DIST = join(ROOT, "dist");
const STAGING = join(DIST, ".inject-staging");

const CHANNELS = {
    stable: "Discord",
    ptb: "DiscordPTB",
    canary: "DiscordCanary",
    development: "DiscordDevelopment"
};

const BOOTSTRAP_INDEX = `// Endcord injector. Orijinal Discord kodu resources/_app.asar icinde durur.
require("./patcher.js");
`;

const BOOTSTRAP_PACKAGE = {
    name: "discord",
    productName: "Discord",
    version: "1.0.0",
    main: "index.js"
};

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
        const appAsar = join(resources, "app.asar");
        const backup = join(resources, "_app.asar");

        // Yarım kalmış kurulum: asar silinmiş ama yedek duruyor → geri al
        if (!existsSync(appAsar) && existsSync(backup)) {
            cpSync(backup, appAsar);
            console.log(`[Endcord] ${channel}: app.asar yedekten geri alındı`);
        }

        if (!existsSync(appAsar)) continue;

        found.push({ channel, version: latest, resources });
    }

    return found;
}

function stageInjection() {
    if (!existsSync(join(DIST, "patcher.js"))) {
        fail("dist/patcher.js yok — önce `pnpm build` çalıştır.");
    }

    rmSync(STAGING, { recursive: true, force: true });
    mkdirSync(STAGING, { recursive: true });

    // Only the four files the client loads. Maps, desktop builds and the installer stay on disk.
    for (const entry of ["patcher.js", "preload.js", "renderer.js", "renderer.css"]) {
        const source = join(DIST, entry);
        if (!existsSync(source)) fail(`dist/${entry} yok — önce \`pnpm build\` çalıştır.`);

        cpSync(source, join(STAGING, entry));

        const legal = `${entry}.LEGAL.txt`;
        if (existsSync(join(DIST, legal))) cpSync(join(DIST, legal), join(STAGING, legal));
    }

    writeFileSync(join(STAGING, "index.js"), BOOTSTRAP_INDEX);
    writeFileSync(join(STAGING, "package.json"), `${JSON.stringify(BOOTSTRAP_PACKAGE, null, 4)}\n`);

    return STAGING;
}

/** Discord çalışıyorsa app.asar kilitli olur; tüm süreçleri kapatıp bekliyoruz. */
function closeDiscord() {
    if (process.platform !== "win32") return;

    let pids = [];
    try {
        const output = execFileSync("tasklist", ["/FI", "IMAGENAME eq Discord.exe", "/NH", "/FO", "CSV"], { encoding: "utf-8" });
        pids = output
            .split("\n")
            .map(line => line.split(",")[1]?.replace(/"/g, "").trim())
            .filter(pid => pid && /^\d+$/.test(pid));
    } catch {
        return;
    }

    if (pids.length === 0) return;

    log(`Discord çalışıyor (${pids.length} süreç), kapatılıyor...`);
    for (const pid of pids) {
        try {
            execFileSync("taskkill", ["/PID", pid, "/F"], { stdio: "ignore" });
        } catch {
            // süreç zaten kapanmış olabilir
        }
    }

    // dosya kilidi bırakılana kadar bekle
    for (let i = 0; i < 30; i++) {
        let stillRunning = false;
        try {
            const output = execFileSync("tasklist", ["/FI", "IMAGENAME eq Discord.exe", "/NH", "/FO", "CSV"], { encoding: "utf-8" });
            stillRunning = output.includes("Discord.exe");
        } catch {
            stillRunning = false;
        }

        if (!stillRunning) break;

        execFileSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]);
    }
}

/**
 * Kilitli dosyayı değiştirmek için birkaç kez dener.
 * Hedef önce silinmez: kopya üzerine yazılır, böylece bir hata olursa
 * Discord'un asar'ı yerinde kalır (yarım kurulum bırakmaz).
 */
function replaceFile(source, target) {
    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            cpSync(source, target, { force: true });
            return;
        } catch (err) {
            if (attempt === 9) throw err;
            execFileSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]);
        }
    }
}


async function install(installInfo) {
    const { channel, version, resources } = installInfo;

    closeDiscord();

    const staging = stageInjection();
    const target = join(resources, "app.asar");
    const backup = join(resources, "_app.asar");
    const staged = join(resources, "app.asar.endcord-tmp");

    rmSync(staged, { force: true });
    await createPackage(staging, staged);

    // Orijinal Discord asar'ı ilk seferde yedekle
    if (!existsSync(backup)) {
        cpSync(target, backup);
        log(`orijinal asar yedeklendi → ${backup}`);
    }

    // Klasör (resources/app) yöntemiyle kalmış eski kurulum varsa temizle
    const legacyFolder = join(resources, "app");
    if (existsSync(legacyFolder)) {
        rmSync(legacyFolder, { recursive: true, force: true });
        log("eski klasör yöntemi temizlendi");
    }

    replaceFile(staged, target);
    rmSync(staged, { force: true });
    rmSync(STAGING, { recursive: true, force: true });

    log(`${channel} ${version} → ${target}`);
}

function uninstall(installInfo) {
    const { channel, version, resources } = installInfo;

    const target = join(resources, "app.asar");
    const backup = join(resources, "_app.asar");
    const legacyFolder = join(resources, "app");

    if (existsSync(legacyFolder)) {
        rmSync(legacyFolder, { recursive: true, force: true });
        log(`${channel} ${version}: eski klasör yöntemi temizlendi`);
    }

    if (existsSync(backup)) {
        cpSync(backup, target);
        rmSync(backup, { force: true });
        log(`${channel} ${version}: orijinal app.asar geri alındı`);
    } else {
        log(`${channel} ${version}: yedek bulunamadı, dokunulmadı`);
    }
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
    if (mode === "--install") await install(info);
    else uninstall(info);
}

log("Bitti. Discord açıksa yeniden başlat.");
