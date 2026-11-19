/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { frameRateForPressure, type ResourcePressure } from "@shared/resourceGuard";

import { setFrameCap } from "./frameLimiter";

const ATTRIBUTE = "data-ec-resource-saver";

let current: ResourcePressure = "none";

function apply(pressure: ResourcePressure) {
    current = pressure;

    const root = document.documentElement;
    if (root) {
        if (pressure === "none") root.removeAttribute(ATTRIBUTE);
        else root.setAttribute(ATTRIBUTE, pressure);
    }

    setFrameCap("resourceGuard", frameRateForPressure(pressure));
}

export function getResourcePressure() {
    return current;
}

export function isUnderResourcePressure() {
    return current !== "none";
}

export function initResourceSaver() {
    if (!IS_DISCORD_DESKTOP) return;

    EndcordNative.native.onResourcePressure(apply);

    if (document.documentElement) apply(current);
    else document.addEventListener("DOMContentLoaded", () => apply(current), { once: true });
}
