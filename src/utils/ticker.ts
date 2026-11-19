/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

type Ticker = () => void;

const listeners = new Set<Ticker>();
let timer: ReturnType<typeof setInterval> | null = null;
let lastFire = 0;

function fire() {
    // Nothing on screen needs a new timestamp while Discord is minimised or in the tray
    if (typeof document !== "undefined" && document.hidden) return;

    // Every listener paints; under heavy pressure a few seconds between updates is enough to keep clocks honest
    const saver = typeof document !== "undefined" ? document.documentElement?.getAttribute("data-ec-resource-saver") : null;
    if (saver === "critical") {
        const now = Date.now();
        if (now - lastFire < 4000) return;
        lastFire = now;
    }

    for (const listener of listeners) {
        try {
            listener();
        } catch (error) {
            // One component blowing up must not stop the clock for the rest
            console.error("[Ticker] listener threw", error);
        }
    }
}

/**
 * A single interval shared by everything that re-renders on a clock.
 *
 * Timestamps, countdowns and live badges all used to allocate their own `setInterval`, which on a busy channel means
 * hundreds of timers waking the main thread every second. They now ride this one, and it stops once the last
 * subscriber leaves.
 */
export function subscribeSecondTick(listener: Ticker): () => void {
    listeners.add(listener);
    timer ??= setInterval(fire, 1000);

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    };
}
