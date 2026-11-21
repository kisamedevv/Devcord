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
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAQOSURBVFhH7dRbaBxVGAfwYpImO/cz95md2ZnZnd3NbrZJms2lbZpoQ9LmormRpNsmIV5KW9NWm/ShYpTFitRS82QwDSKIUCkq1QephmArSY23EuiDIIK+BBEVU1jQp539ZCqBdkAYQ8GX/cF5mHO+7z8zZw6zbVtRUVGRT49M/tnUerLQVZ/5qbeqe2Uw3nZlOLLr1RE9NTmiJSb69epn9tqdPwjevgcm1fnRhXT/dUjum4PorhkI7zwGocQQqJEOUMxWkM02kGOZDb3h/PuJ3u+aNvuGhlYDHQOL4v1pW4NEY9+GuWMU9HiXo1rNjqSnHUFJObwUdzipssDJ1SAabaAmnyoY6fNTbtPjZ1YGj76wdimdXigbOL4ojs18ZXmDfSvfjn1OIQM4OZXn5SqHE6MOK4QLLG8VEG86iLfyiLfzrBgDLrgHEo0z50ZPr94+deFHmL60cWIie6PiUPbOkcEX/2r2ZvuC49zHGIagIkDnMZwHnFQBI9whAkkpwLA60EjL0yiUZ9gQ0Ci2fiBz9fjB02tvTc0WAm7G7pGVl5rHvxn0ZvtCkNKnJCUDScmFCpz/GadiBwkm9XBpBd9aUhIYCODcJwzSgWaCjjsYzgJBaji1eXMtOWZHao/dMmqeZbzZvlCMvoS4MGC4ACWl+IJ33UVS6so/b6/nWSEKrJB4152n6RBipdT3klqf8fb4Jqj1n9GsDeUVNGC4+IZ33UXQ2hHEmYD4iCOotcBw9jWaDoUpZK7RtD7trfct+x5s54ItNwO4AAQpAkkq894aF0JGhpcqgZOqHJq1CkiqXheCjVcZ3urx1vqSzWYfGj+7FDpz8Rccw+VlnODdMwAkpb7prXUxXHiWV6pBDLU4aqwPJGv/Ldsepbx1vkzO/Uocnl4dPjp9g3evMZxbJkgJKDoIOKm87K3X4n07zGTvHbtuvBCM9zqsXAdIqD/nrfMlm4XSnicWL/Y//WVicw7D+a/dByAo9R2Gsw8zjDVGs/awGm3L2OmxV8I1g39o8XagOdsJYFxBNvsg2jBXe3+yTw37Z882dr2+dO9cWVn5tUCAeo0TKz/gpBS4W80Hd4KgpYGTq4CggoDhkkMhy9HiE1DZcuXyvf3/SaLxxM1k00mwEkMzWuyxTi2Z6RTN7qwSOfCtqO8BJCaBQoZDUIpDkLJD0iGH4WIOK6XBqHkOah5dWRteANqb65uVGGk3k/3LeqxrXYv2fBFKHpoXtN2/Iz529xC6n4KkVaAY3d1y4JUmUCufhGjr21A/un554kPY2s/m3+ABdoogpRxBqTmKMXMUsnIUiuQYsSYnGN2/adXP3452XJ9vmoS93t4HAsdFCcNCCiYYMiYk7w6er1MEY1gOty9tfauLior+b38D9ZY5EmfzpeUAAAAASUVORK5CYII=";
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

        const autoOn = Boolean((settings.store as Record<string, any>).autoShareProfile);

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
            menuItem(autoOn ? "Otomatik paylaş: AÇIK" : "Otomatik paylaş: KAPALI", () => {
                const next = !(settings.store as Record<string, any>).autoShareProfile;
                settings.store.autoShareProfile = next;
                showToast({ text: next ? "Otomatik paylaş açıldı" : "Otomatik paylaş kapatıldı", variant: "success" });
                if (next) {
                    const store = settings.store as Record<string, any>;
                    shareProfile({
                        username: String(store.fakeUsername ?? "").trim(),
                        name: String(store.fakeDisplayName ?? "").trim(),
                        badges: Array.isArray(store.fakeBadges) ? store.fakeBadges : [],
                        createdAt: String(store.fakeCreatedAt ?? "").trim() || null
                    }).catch((err: unknown) => {
                        showToast({ text: `Paylaşma başarısız: ${String(err)}`, variant: "critical" });
                    });
                }
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
