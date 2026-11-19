/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** How hard the resource guard is currently holding the app back */
export type ResourcePressure = "none" | "high" | "critical";

export type ResourceLimits = {
    enabled: boolean;
    ramLimitMb: number;
    cpuLimitPercent: number;
};

export const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
    enabled: false,
    ramLimitMb: 2048,
    cpuLimitPercent: 25
};

export const RESOURCE_RAM_MIN_MB = 512;
export const RESOURCE_RAM_MAX_MB = 16384;
export const RESOURCE_CPU_MIN_PERCENT = 5;
export const RESOURCE_CPU_MAX_PERCENT = 100;

/** Frames per second the page is allowed to draw at. 0 leaves the limit alone */
export function frameRateForPressure(pressure: ResourcePressure) {
    if (pressure === "critical") return 10;
    if (pressure === "high") return 30;
    return 0;
}

export interface ResourceStats {
    enabled: boolean;
    usedMb: number;
    cpuPercent: number;
    ramLimitMb: number;
    cpuLimitPercent: number;
    pressure: ResourcePressure;
    frameRate: number;
}

export function mergeResourceLimits(value: Partial<ResourceLimits> | undefined): ResourceLimits {
    const limits = { ...DEFAULT_RESOURCE_LIMITS };
    if (!value || typeof value !== "object") return limits;

    if (typeof value.enabled === "boolean") limits.enabled = value.enabled;
    if (Number.isFinite(value.ramLimitMb)) limits.ramLimitMb = Math.min(RESOURCE_RAM_MAX_MB, Math.max(RESOURCE_RAM_MIN_MB, value.ramLimitMb!));
    if (Number.isFinite(value.cpuLimitPercent)) limits.cpuLimitPercent = Math.min(RESOURCE_CPU_MAX_PERCENT, Math.max(RESOURCE_CPU_MIN_PERCENT, value.cpuLimitPercent!));

    return limits;
}
