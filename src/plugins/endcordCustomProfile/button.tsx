/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { SettingsStore } from "@api/Settings";
import { Modal, openModal, showToast } from "@webpack/common";

import { FakeProfileEditor } from "./editor";
import { shareProfile } from "./profile";
import { settings } from "./settings";

const SETTINGS_PATH = "plugins.DevcordCustomProfile";
const PROFILE_KEYS = ["targetUserId", "fakeUsername", "fakeDisplayName", "fakeBadges", "fakeCreatedAt"] as const;

/** Panel açıcı — sağ üstteki logodan, kısayoldan ve hızlı menüden çağrılır. */
export function openFakeProfilePanel() {
    openModal(props => (
        <Modal {...props} title="Devcord — Fake Profil" size="lg">
            <FakeProfileEditor />
        </Modal>
    ));
}

/** Devcord logosu (SVG, data URI) — halka gradyanı + monogram. */
export function endcordLogo(): string {
    const svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\" width=\"28\" height=\"28\">"
        + "<defs>"
        + "<linearGradient id=\"ring\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">"
        + "<stop offset=\"0\" stop-color=\"#8fb2ff\"/><stop offset=\".5\" stop-color=\"#5865f2\"/><stop offset=\"1\" stop-color=\"#a970ff\"/>"
        + "</linearGradient>"
        + "<linearGradient id=\"face\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">"
        + "<stop offset=\"0\" stop-color=\"#1b2140\"/><stop offset=\"1\" stop-color=\"#0b0f1f\"/>"
        + "</linearGradient>"
        + "</defs>"
        + "<circle cx=\"16\" cy=\"16\" r=\"15\" fill=\"url(#ring)\"/>"
        + "<circle cx=\"16\" cy=\"16\" r=\"12.4\" fill=\"url(#face)\"/>"
        + "<path fill=\"#e8eeff\" d=\"M12.2 22.5V9.5h7.9v2.6h-5.1v2.5h4.4v2.5h-4.4v2.8h5.3v2.6z\"/>"
        + "<circle cx=\"23.6\" cy=\"10\" r=\"1.9\" fill=\"#43d17c\"/>"
        + "</svg>";

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function hasFakeProfile(): boolean {
    const store = settings.store as Record<string, unknown>;
    const badges = store.fakeBadges;

    return Boolean(
        String(store.fakeUsername ?? "").trim()
        || String(store.fakeDisplayName ?? "").trim()
        || String(store.fakeCreatedAt ?? "").trim()
        || (Array.isArray(badges) && badges.length > 0)
        || String(store.targetUserId ?? "").trim()
    );
}

function resetProfile() {
    settings.store.targetUserId = "";
    settings.store.fakeUsername = "";
    settings.store.fakeDisplayName = "";
    settings.store.fakeCreatedAt = "";
    settings.store.fakeBadges = [];
    settings.store.shareProfile = false;
}

/** Sağ üst barın arama kutusunun bulunduğu yere butonu yerleştirir. */
export function mountTopRightButton(): () => void {
    // Discord'un arama kutusu dile göre değişiyor; birkaç aday deniyoruz
    const CANDIDATES = [
        "[aria-label=\"Search\"]",
        "[aria-label=\"Ara\"]",
        "[class*=\"searchBar\"]",
        "[class*=\"search\"]",
        "[class*=\"toolbar\"]"
    ];

    const button = document.createElement("button");
    button.className = "vc-ecp-logo-button";
    button.type = "button";
    button.title = "Devcord — Fake Profil (Ctrl+Shift+E)";
    button.setAttribute("aria-label", "Devcord Fake Profil");
    button.setAttribute("aria-haspopup", "dialog");

    const logo = document.createElement("img");
    logo.src = endcordLogo();
    logo.alt = "";
    logo.width = 22;
    logo.height = 22;

    const dot = document.createElement("span");
    dot.className = "vc-ecp-logo-dot";
    dot.setAttribute("aria-hidden", "true");

    button.append(logo, dot);

    const syncState = () => {
        const active = hasFakeProfile();
        button.classList.toggle("vc-ecp-logo-active", active);
        button.setAttribute("aria-label", active ? "Devcord Fake Profil — etkin" : "Devcord Fake Profil");
    };

    syncState();

    const listenedPaths = PROFILE_KEYS.map(key => `${SETTINGS_PATH}.${key}`);
    for (const path of listenedPaths) {
        SettingsStore.addChangeListener(path as never, syncState);
    }

    button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        openFakeProfilePanel();
    });

    // ——— hızlı menü (sağ tık) ———
    let menu: HTMLDivElement | null = null;

    function closeMenu() {
        if (!menu) return;
        menu.remove();
        menu = null;
        document.removeEventListener("pointerdown", onOutside, true);
        document.removeEventListener("keydown", onKey, true);
    }

    function onOutside(event: PointerEvent) {
        if (menu && event.target instanceof Node && !menu.contains(event.target) && !button.contains(event.target)) {
            closeMenu();
        }
    }

    function onKey(event: KeyboardEvent) {
        if (event.key === "Escape") closeMenu();
    }

    function menuItem(label: string, run: () => void) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "vc-ecp-menu-item";
        item.textContent = label;
        item.addEventListener("click", () => {
            closeMenu();
            run();
        });
        return item;
    }

    function toggleMenu() {
        if (menu) return closeMenu();

        menu = document.createElement("div");
        menu.className = "vc-ecp-menu";
        menu.setAttribute("role", "menu");

        menu.append(
            menuItem("Profili düzenle", openFakeProfilePanel),
            menuItem("Profili paylaş", () => {
                const store = settings.store as Record<string, any>;
                shareProfile({
                    username: String(store.fakeUsername ?? "").trim(),
                    name: String(store.fakeDisplayName ?? "").trim(),
                    badges: Array.isArray(store.fakeBadges) ? store.fakeBadges : [],
                    createdAt: String(store.fakeCreatedAt ?? "").trim() || null
                }).then(() => {
                    settings.store.shareProfile = true;
                    showToast({ text: "Fake profil paylaşıldı", variant: "success" });
                }).catch((err: unknown) => {
                    showToast({ text: `Paylaşma başarısız: ${String(err)}`, variant: "critical" });
                });
            }),
            menuItem("Hızlı sıfırla", () => {
                resetProfile();
                showToast({ text: "Fake profil sıfırlandı", variant: "success" });
            })
        );

        const rect = button.getBoundingClientRect();
        menu.style.top = `${Math.round(rect.bottom + 6)}px`;
        menu.style.right = `${Math.round(window.innerWidth - rect.right)}px`;
        document.body.appendChild(menu);

        document.addEventListener("pointerdown", onOutside, true);
        document.addEventListener("keydown", onKey, true);
        menu.querySelector<HTMLButtonElement>("button")?.focus();
    }

    button.addEventListener("contextmenu", event => {
        event.preventDefault();
        toggleMenu();
    });

    // ——— kısayol ———
    const onShortcut = (event: KeyboardEvent) => {
        if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) return;
        if (event.key.toLowerCase() !== "e") return;
        event.preventDefault();
        openFakeProfilePanel();
    };

    window.addEventListener("keydown", onShortcut);

    // ——— yerleşim ———
    let scheduled = 0;

    const place = () => {
        if (button.isConnected && button.parentElement?.contains(button)) return;

        for (const selector of CANDIDATES) {
            const anchor = document.querySelector(selector);
            if (!anchor?.parentElement) continue;

            anchor.parentElement.insertBefore(button, anchor);
            button.classList.remove("vc-ecp-logo-button-fixed");
            closeMenu();
            return;
        }

        // Bulamazsak sabit konumlu düşüyoruz — her durumda sağ üstte
        document.body.appendChild(button);
        button.classList.add("vc-ecp-logo-button-fixed");
    };

    const schedulePlace = () => {
        if (scheduled) return;
        scheduled = window.setTimeout(() => {
            scheduled = 0;
            place();
        }, 150);
    };

    place();

    // Discord üst barı yeniden kurduğunda hemen yerine dönüyor
    const observer = new MutationObserver(schedulePlace);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedulePlace);

    return () => {
        observer.disconnect();
        window.removeEventListener("resize", schedulePlace);
        window.removeEventListener("keydown", onShortcut);
        window.clearTimeout(scheduled);
        for (const path of listenedPaths) {
            SettingsStore.removeChangeListener(path, syncState);
        }
        closeMenu();
        button.remove();
    };
}
