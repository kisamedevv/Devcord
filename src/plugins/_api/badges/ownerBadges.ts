/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Devcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DEVCORD_OWNER_ID } from "@utils/constants";
import { Logger } from "@utils/Logger";

const BADGES_URL = "https://raw.githubusercontent.com/kisamedevv/Devcord/main/devcord-badges.json";
const REFRESH_INTERVAL = 5 * 60 * 1000;

export interface OwnerBadgeData {
    owner: string[];
    helped: string[];
}

const logger = new Logger("OwnerBadges");
let cachedData: OwnerBadgeData = { owner: [DEVCORD_OWNER_ID], helped: [] };

function isIdList(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(id => typeof id === "string" && /^\d{17,20}$/.test(id));
}

export async function fetchOwnerBadges(): Promise<OwnerBadgeData> {
    try {
        const res = await fetch(BADGES_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isIdList(data?.owner) && isIdList(data?.helped)) {
            cachedData = { owner: data.owner, helped: data.helped };
        } else {
            logger.warn("Ignoring badge data with an unexpected shape");
        }
    } catch (e) {
        logger.warn("Failed to fetch owner badges, using cached data", e);
    }
    return cachedData;
}

export function getOwnerBadgeData(): OwnerBadgeData {
    return cachedData;
}

export function cacheOwnerBadgeData(data: OwnerBadgeData) {
    cachedData = data;
}

export function isOwnerBadgeUser(userId: string): boolean {
    return cachedData.owner.includes(userId);
}

export function isHelpedBuildUser(userId: string): boolean {
    return cachedData.helped.includes(userId);
}

let timer: ReturnType<typeof setInterval> | undefined;
export function startOwnerBadgeSync() {
    void fetchOwnerBadges();
    timer = setInterval(() => void fetchOwnerBadges(), REFRESH_INTERVAL);
    timer.unref?.();
}

export function stopOwnerBadgeSync() {
    if (timer) clearInterval(timer);
    timer = undefined;
}
