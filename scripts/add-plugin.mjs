#!/usr/bin/node
/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Yerel eklenti klasörünü Endcord'un `src/userplugins` dizinine kopyalar.
 *
 * Neden bu yol var: Kernixcord'in `kernixcordRemoteLoader` eklentisi manifesti
 * internetten çekip uzak bir <script> etiketi olarak çalıştırıyor. Yani
 * çalıştırma anında ne gelirse kod olarak işliyor — hesap çalması/veri sızdırma
 * riski tam olarak orada. Biz aynı rahatlığı (bir klasör bırak, eklenti gelsin)
 * vermek için kodu derleme zamanında, diskteki dosyadan alıyoruz: ne çalıştığı
 * görülebilir, ne çalıştığı denetlenebilir, uzaktan hiçbir şey gelmiyor.
 *
 * Kullanım:
 *   node scripts/add-plugin.mjs <eklenti-klasörü> [--rebuild]
 *   node scripts/add-plugin.mjs --list
 *   node scripts/add-plugin.mjs --remove <ad>
 */

import { execFileSync } from "child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const USER_PLUGINS = join(ROOT, "src", "userplugins");

function log(message) {
    console.log(`[Endcord] ${message}`);
}

function fail(message) {
    console.error(`[Endcord] ${message}`);
    process.exit(1);
}

function listPlugins() {
    if (!existsSync(USER_PLUGINS)) return [];

    return readdirSync(USER_PLUGINS).filter(name => {
        const dir = join(USER_PLUGINS, name);
        return statSync(dir).isDirectory() && existsSync(join(dir, "index.ts")) || existsSync(join(dir, "index.tsx"));
    });
}

const argv = process.argv.slice(2);

if (argv.includes("--list")) {
    const plugins = listPlugins();
    if (plugins.length === 0) {
        log("kurulu kullanıcı eklentisi yok");
    } else {
        log(`kurulu kullanıcı eklentileri: ${plugins.join(", ")}`);
    }
    process.exit(0);
}

const removeIndex = argv.indexOf("--remove");
if (removeIndex !== -1) {
    const name = argv[removeIndex + 1];
    if (!name) fail("--remove için eklenti adı gerekli");

    const target = join(USER_PLUGINS, name);
    if (!existsSync(target)) fail(`${name} bulunamadı`);

    rmSync(target, { recursive: true, force: true });
    log(`${name} kaldırıldı — yeniden derleme gerekli`);
    process.exit(0);
}

const source = argv.find(arg => !arg.startsWith("--"));
if (!source) {
    fail("kullanım: node scripts/add-plugin.mjs <eklenti-klasörü> [--rebuild] | --list | --remove <ad>");
}

const sourceDir = resolve(source);
if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
    fail(`klasör bulunamadı: ${sourceDir}`);
}

const hasEntry = existsSync(join(sourceDir, "index.ts")) || existsSync(join(sourceDir, "index.tsx"));
if (!hasEntry) {
    fail("bu klasörde index.ts veya index.tsx yok — eklenti klasörü olmalı");
}

const name = basename(sourceDir);
const target = join(USER_PLUGINS, name);

if (existsSync(target)) {
    fail(`${name} zaten kurulu — önce --remove ${name} yap`);
}

mkdirSafe(USER_PLUGINS);
cpSync(sourceDir, target, { recursive: true });

log(`${name} → ${target}`);
log("derlemek için: pnpm build --standalone  (veya inject.bat)");

if (argv.includes("--rebuild")) {
    log("derleniyor...");
    const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    execFileSync(pnpm, ["build", "--standalone"], { stdio: "inherit", cwd: ROOT });
    log("derleme bitti — pnpm inject ile Discord'a uygula");
}

function mkdirSafe(dir) {
    if (existsSync(dir)) return;
    mkdirSync(dir, { recursive: true });
}
