/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Modal, openModal } from "@webpack/common";

import { FakeProfileEditor } from "./editor";

/**
 * Sağ üstteki Endcord logosu — basınca fake profil paneli açılır.
 * Panel okunur olsun diye başlık, önizleme ve bölümler düzgün dizilmiş.
 */
export function openFakeProfilePanel() {
    openModal(props => (
        <Modal {...props} title="Endcord — Fake Profil" size="lg">
            <FakeProfileEditor />
        </Modal>
    ));
}

/** Endcord logosu (SVG, data URI). */
export function endcordLogo(): string {
    const svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\" width=\"28\" height=\"28\">"
        + "<defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">"
        + "<stop offset=\"0\" stop-color=\"#7f9bff\"/><stop offset=\"1\" stop-color=\"#4d68d8\"/>"
        + "</linearGradient></defs>"
        + "<rect x=\"1.5\" y=\"1.5\" width=\"29\" height=\"29\" rx=\"9\" fill=\"url(#g)\"/>"
        + "<path fill=\"#0d1220\" d=\"M11 22V10h3.2l3.3 6.6 3.3-6.6H24v12h-3v-7.2L17.6 22h-3.2L14 14.8V22z\"/>"
        + "</svg>";

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Sağ üst barın arama kutusunun bulunduğu yere butonu yerleştirir. */
export function mountTopRightButton(): () => void {
    const button = document.createElement("button");
    button.className = "vc-ecp-logo-button";
    button.type = "button";
    button.title = "Endcord — Fake Profil";
    button.setAttribute("aria-label", "Endcord Fake Profil");
    button.innerHTML = `<img src="${endcordLogo()}" alt="" width="22" height="22">`;
    button.addEventListener("click", openFakeProfilePanel);

    // Discord'un arama kutusu dile göre değişiyor; birkaç aday deniyoruz
    const CANDIDATES = [
        "[aria-label=\"Search\"]",
        "[aria-label=\"Ara\"]",
        "[class*=\"searchBar\"]",
        "[class*=\"search\"]"
    ];

    const place = () => {
        if (button.isConnected && button.parentElement?.contains(button)) return;

        for (const selector of CANDIDATES) {
            const anchor = document.querySelector(selector);
            if (!anchor?.parentElement) continue;

            anchor.parentElement.insertBefore(button, anchor);
            button.classList.remove("vc-ecp-logo-button-fixed");
            return;
        }

        // Bulamazsak sabit konumlu düşüyoruz — her durumda sağ üstte
        document.body.appendChild(button);
        button.classList.add("vc-ecp-logo-button-fixed");
    };

    place();

    // Discord üst barı bazen yeniden kuruyor — hafif bir yoklamayla yerini koruyoruz
    const timer = window.setInterval(place, 2000);

    return () => {
        window.clearInterval(timer);
        button.remove();
    };
}
