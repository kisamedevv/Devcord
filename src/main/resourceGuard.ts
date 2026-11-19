/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcEvents } from "@shared/IpcEvents";
import { frameRateForPressure, mergeResourceLimits, type ResourcePressure, type ResourceStats } from "@shared/resourceGuard";
import { app, type BrowserWindow, webContents } from "electron";
import { cpus } from "os";

import { trimAndMeasure } from "./memoryTrim";
import { RendererSettings } from "./settings";

const CPU_COUNT = Math.max(1, cpus().length);

// Five seconds is long enough to smooth out a single busy frame and short enough to notice a game starting
const SAMPLE_INTERVAL = 5_000;
// Discord allocates a lot while it starts; holding it back then would only make starting slower
const STARTUP_GRACE = 45_000;
// A trim walks every process, so it must not run on every sample
const TRIM_INTERVAL = 20_000;
// One sample over the line slows drawing, three in a row free memory and pause animations
const CRITICAL_SAMPLES = 3;

let win: BrowserWindow | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
let pressure: ResourcePressure = "none";
let overSamples = 0;
let enabledAt = 0;
let wasEnabled = false;
let lastSample = { usedMb: 0, cpuPercent: 0 };
let lastTrim = 0;
let running = false;
let watchingSettings = false;

function readMetrics() {
    let usedKilobytes = 0;
    let cpuPercent = 0;

    for (const metric of app.getAppMetrics()) {
        usedKilobytes += metric.memory?.workingSetSize ?? 0;
        cpuPercent += metric.cpu?.percentCPUUsage ?? 0;
    }

    return {
        usedMb: Math.round(usedKilobytes / 1024),
        // Electron reports each process against one core, so this is a share of the whole machine
        cpuPercent: Math.round(cpuPercent / CPU_COUNT * 10) / 10
    };
}

function broadcast(next: ResourcePressure) {
    for (const contents of webContents.getAllWebContents()) {
        if (contents.isDestroyed()) continue;
        try {
            contents.send(IpcEvents.RESOURCE_PRESSURE, next);
        } catch { }
    }
}

function setPressure(next: ResourcePressure) {
    if (pressure === next) return;
    pressure = next;
    broadcast(next);
}

async function tick() {
    if (running) return;
    running = true;

    try {
        if (!win || win.isDestroyed()) {
            if (timer) clearInterval(timer);
            timer = undefined;
            win = undefined;
            return;
        }

        const limits = mergeResourceLimits(RendererSettings.store.resourceGuard);
        lastSample = readMetrics();

        if (!limits.enabled) {
            wasEnabled = false;
            overSamples = 0;
            setPressure("none");
            return;
        }

        if (!wasEnabled) {
            wasEnabled = true;
            enabledAt = Date.now();
            overSamples = 0;
            setPressure("none");
            return;
        }

        if (Date.now() - enabledAt < STARTUP_GRACE) return;

        const overRam = lastSample.usedMb >= limits.ramLimitMb;
        const overCpu = lastSample.cpuPercent >= limits.cpuLimitPercent;

        if (overRam || overCpu) overSamples++;
        else overSamples = Math.max(0, overSamples - 1);

        setPressure(overSamples >= CRITICAL_SAMPLES ? "critical" : overSamples > 0 ? "high" : "none");

        // Freeing memory only helps the RAM side, and only once the app has stayed over the line
        if (pressure === "critical" && overRam && Date.now() - lastTrim >= TRIM_INTERVAL) {
            lastTrim = Date.now();
            await trimAndMeasure(win);
            lastSample = readMetrics();
        }
    } finally {
        running = false;
    }
}

export function getResourceStats(): ResourceStats {
    const limits = mergeResourceLimits(RendererSettings.store.resourceGuard);

    return {
        enabled: limits.enabled,
        usedMb: lastSample.usedMb,
        cpuPercent: lastSample.cpuPercent,
        ramLimitMb: limits.ramLimitMb,
        cpuLimitPercent: limits.cpuLimitPercent,
        pressure,
        frameRate: frameRateForPressure(pressure)
    };
}

export function initResourceGuard(mainWindow: BrowserWindow) {
    // The first window with Discord's preload is the one whose process count matters
    if (timer) return;

    win = mainWindow;
    enabledAt = Date.now();

    timer = setInterval(() => void tick(), SAMPLE_INTERVAL);
    timer.unref?.();
    void tick();

    // Applying the switch or a new ceiling shouldn't wait for the next sample
    if (!watchingSettings) {
        watchingSettings = true;
        RendererSettings.addChangeListener("resourceGuard.enabled", () => void tick());
        RendererSettings.addChangeListener("resourceGuard.ramLimitMb", () => void tick());
        RendererSettings.addChangeListener("resourceGuard.cpuLimitPercent", () => void tick());

        // A page that reloads misses the event that set the current level, so it gets it once it can listen
        app.on("web-contents-created", (_event, contents) => {
            contents.on("did-finish-load", () => {
                if (pressure === "none" || contents.isDestroyed()) return;
                try {
                    contents.send(IpcEvents.RESOURCE_PRESSURE, pressure);
                } catch { }
            });
        });
    }
}
