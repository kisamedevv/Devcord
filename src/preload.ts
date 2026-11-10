/*
 * Endcord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { debounce } from "@shared/debounce";
import { IpcEvents } from "@shared/IpcEvents";
import { contextBridge, webFrame } from "electron/renderer";

import EndcordNative, { invoke, sendSync } from "./EndcordNative";


// Monaco popout
if (location.href === DESKTOP_MONACO_EDITOR_URL) {
    contextBridge.exposeInMainWorld("setCss", debounce(EndcordNative.quickCss.set));
    contextBridge.exposeInMainWorld("getCurrentCss", EndcordNative.quickCss.get);
    contextBridge.exposeInMainWorld("getTheme", EndcordNative.quickCss.getEditorTheme);
}
// Discord
else {
    contextBridge.exposeInMainWorld("EndcordNative", EndcordNative);
    invoke(IpcEvents.INIT_FILE_WATCHERS);

    if (IS_DISCORD_DESKTOP) {
        // Tema ve quickcss, Discord'un kendi CSS'i yüklenmeden önce basılır;
        // böylece açılışta tema flaşı olmaz, tema ilk kareden itibaren devrede.
        // Not: @import yerine düz metin basılıyor — dosya çekme yok, anında uygulanıyor.
        const startupCss = sendSync<string>(IpcEvents.GET_STARTUP_CSS);
        if (startupCss) {
            webFrame.executeJavaScript(`(() => {
                const ID = "endcord-startup-theme";
                let el = document.getElementById(ID);
                if (!el) {
                    el = document.createElement("style");
                    el.id = ID;
                }
                el.textContent = ${JSON.stringify(startupCss)};

                // Discord stilleri head'e eklemeye devam eder; bizim etiketimiz
                // her zaman en sonda kalmalı ki aynı özgüllükte bizim kuralımız kazansın.
                const keepLast = () => {
                    const head = document.head;
                    if (!head) return;
                    if (el.parentNode !== head || head.lastChild !== el) head.appendChild(el);
                };

                keepLast();
                if (document.head) {
                    new MutationObserver(keepLast).observe(document.head, { childList: true });
                }

                // Sayfa kurulduktan sonra etiketi documentElement'in sonuna taşı:
                // Discord'un kendi CSS'i head'de durur, biz sonrasında geliriz,
                // yani aynı özgüllükte bizim tema kurallarımız yener.
                document.addEventListener("DOMContentLoaded", () => {
                    document.documentElement.appendChild(el);
                });
            })();`);
        }

        webFrame.executeJavaScript(sendSync<string>(IpcEvents.PRELOAD_GET_RENDERER_JS));
        // Not supported in sandboxed preload scripts but Discord doesn't support it either so who cares
        require(process.env.DISCORD_PRELOAD!);
    }
}
