/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Devcord's two badges are pixel art on a 22 grid, the size of a badge, so every pixel lands on a screen pixel in the
// badge row, and are kept as squares so they stay sharp on the badge page too
const SIZE = 22;

function pixelArt(rows: string[], palette: Record<string, string>) {
    const left = (SIZE - rows[0].length) / 2;
    const top = Math.floor((SIZE - rows.length) / 2);
    const pixels = rows.flatMap((row, y) => [...row].map((cell, x) => palette[cell] ? `<rect x="${left + x}" y="${top + y}" width="1" height="1" fill="${palette[cell]}"/>` : ""));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges">${pixels.join("")}</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// The developer badge: Devcord's pixel D on a 22 grid, about the size of the art in Discord's own badges. Its
// outline is Devcord's ice blue so it stays legible on dark profiles
export const DEVELOPER_ICON = pixelArt([
    "..LLLLLLLLLL..",
    "..LFFFFFFFFL..",
    "..LFFLLLLFFL..",
    "..LFFL..LFFL..",
    "..LFFL..LFFL..",
    "..LFFL..LFFL..",
    "..LFFL..LFFL..",
    "..LFFL..LFFL..",
    "..LFFL..LFFL..",
    "..LFFL..LFFL..",
    "..LFFLLLLFFL..",
    "..LFFFFFFFFL..",
    "..LLLLLLLLLL.."
], { L: "#9ccbff", F: "#e8f4ff" });

// The owner badge: a pixel crown in Devcord's gold, for the person who owns Devcord. Only they have it, and every
// Devcord client shows it for them no matter where they are
export const OWNER_ICON = pixelArt([
    "..OOOOOOOOOO..",
    ".OYYYYYYYYYYO.",
    "OY...........YO",
    "OY.OO.....OO.YO",
    "OY.OO.....OO.YO",
    "OY...........YO",
    "OY.OOOOOOOOO.YO",
    "OY.O.......O.YO",
    "OY.O.......O.YO",
    "OY.OOOOOOOOO.YO",
    "OY...........YO",
    "OYYYYYYYYYYYO.",
    "..OOOOOOOOOO.."
], { O: "#8a6a1f", Y: "#ffd86b" });
export const CONTRIBUTOR_ICON = pixelArt([
    ".......O.......",
    ".......O.......",
    "......OFO......",
    "......OFO......",
    ".....OFFFO.....",
    ".....OFFFO.....",
    "OOOOOOFFFOOOOOO",
    "OFFFFFFFFFFFFFO",
    "OFFFFFFFFFFFFFO",
    "OOOOOOFFFOOOOOO",
    ".....OFFFO.....",
    ".....OFFFO.....",
    "......OFO......",
    "......OFO......",
    ".......O......."
], { O: "#1f5c3f", F: "#74d49a" });
