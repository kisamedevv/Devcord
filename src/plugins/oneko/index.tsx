/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    size: {
        type: OptionType.SLIDER,
        description: "Cat size in pixels",
        markers: [24, 32, 40, 48, 64, 80, 96],
        default: 48,
        stickToMarkers: true
    },
    speed: {
        type: OptionType.SLIDER,
        description: "Chase speed (pixels per frame at 60fps)",
        markers: [2, 4, 6, 8, 12, 16, 24],
        default: 8,
        stickToMarkers: true
    },
    color: {
        type: OptionType.SELECT,
        description: "Cat colour",
        options: [
            { label: "Black", value: "#1e1f22", default: true },
            { label: "Orange", value: "#ffa14a" },
            { label: "White", value: "#e8e9eb" },
            { label: "Purple", value: "#a970ff" },
            { label: "Pink", value: "#ff6bd6" }
        ]
    },
    keepDistance: {
        type: OptionType.SLIDER,
        description: "How close the cat is allowed to get to the cursor",
        markers: [0, 16, 32, 48, 64],
        default: 48,
        stickToMarkers: true
    }
});

function catImage(color: string) {
    const svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 26\" width=\"64\" height=\"52\">"
        + `<path fill="${color}" d="M5.5 8.5 7.5 2.5 11 7.5h10L24.5 2.5l2 6v9.5a6.5 6.5 0 0 1-6.5 6.5h-8a6.5 6.5 0 0 1-6.5-6.5z"/>`
        + "<circle cx=\"13\" cy=\"12.5\" r=\"1.7\" fill=\"#0f1013\"/><circle cx=\"19.5\" cy=\"12.5\" r=\"1.7\" fill=\"#0f1013\"/>"
        + `<path fill="${color}" d="M15 17.5h2l-1 1.6z"/>`
        + `<path stroke="${color}" stroke-width="2.2" stroke-linecap="round" fill="none" d="M20.5 21.5c3.5.6 6-.6 7-3"/>`
        + "</svg>";

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

let cat: HTMLImageElement | null = null;
let frame = 0;
let lastFrameTime = 0;
let lastTransform = "";
let lastSize = -1;

const cursor = { x: 0, y: 0, seen: false };
const position = { x: 0, y: 0 };

function onMouseMove(event: MouseEvent) {
    cursor.x = event.clientX;
    cursor.y = event.clientY;

    if (!cursor.seen) {
        cursor.seen = true;
        position.x = cursor.x;
        position.y = cursor.y;
    }
}

function render(frames = 1) {
    if (!cat) return;

    const size = settings.store.size ?? 48;

    if (lastSize !== size) {
        cat.style.width = `${size}px`;
        cat.style.height = `${size * 0.8}px`;
        lastSize = size;
    }

    let transform: string;

    if (!cursor.seen) {
        // Sit near the bottom centre of the window until the mouse moves
        position.x = window.innerWidth / 2;
        position.y = window.innerHeight - size;
        transform = `translate3d(${position.x - size / 2}px, ${position.y - size / 2}px, 0)`;
    } else {
        const dx = cursor.x - position.x;
        const dy = cursor.y - position.y;
        const distance = Math.hypot(dx, dy);
        const keepDistance = settings.store.keepDistance ?? 48;

        if (distance > keepDistance) {
            const step = Math.min((settings.store.speed ?? 8) * frames, distance - keepDistance);
            position.x += (dx / distance) * step;
            position.y += (dy / distance) * step;

            transform = `translate3d(${position.x - size / 2}px, ${position.y - size / 2}px, 0) scaleX(${dx < 0 ? -1 : 1})`;
        } else {
            transform = "";
        }
    }

    // Sadece gerçekten değiştiğinde yaz — her karede DOM yazmak pahalı
    if (transform && transform !== lastTransform) {
        cat.style.transform = transform;
        lastTransform = transform;
    }
}

function loop(time: number) {
    // Clamp so the cat doesn't teleport after the tab was throttled
    const delta = Math.min(time - lastFrameTime, 100);
    lastFrameTime = time;

    render(delta / 16.67);
    frame = requestAnimationFrame(loop);
}

/** Pencere görünmüyorken döngüyü durdur — boşta CPU/GPU yiyen kedi yok. */
function setRunning(running: boolean) {
    if (running) {
        if (!frame) {
            lastFrameTime = performance.now();
            frame = requestAnimationFrame(loop);
        }
    } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
    }
}

export default definePlugin({
    name: "Oneko",
    description: "A little cat that chases your cursor around the window.",
    tags: ["Fun", "Appearance"],
    authors: [Devs.Endcord],
    settings,

    start() {
        cat = document.createElement("img");
        cat.className = "vc-oneko";
        cat.alt = "";
        cat.draggable = false;
        cat.src = catImage(settings.store.color ?? "#1e1f22");
        document.body.appendChild(cat);

        window.addEventListener("mousemove", onMouseMove);
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("blur", onWindowBlur);
        window.addEventListener("focus", onWindowBlur);

        lastFrameTime = performance.now();
        frame = requestAnimationFrame(loop);
    },

    stop() {
        cancelAnimationFrame(frame);
        frame = 0;
        window.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("blur", onWindowBlur);
        window.removeEventListener("focus", onWindowBlur);
        cat?.remove();
        cat = null;
        cursor.seen = false;
        lastTransform = "";
        lastSize = -1;
    }
});

function onVisibilityChange() {
    setRunning(!document.hidden);
}

function onWindowBlur() {
    setRunning(document.visibilityState === "visible" && document.hasFocus());
}
