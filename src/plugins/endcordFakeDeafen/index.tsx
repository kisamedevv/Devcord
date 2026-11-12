/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { UserStore, VoiceStateStore } from "@webpack/common";

export const settings = definePluginSettings({
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Kulaklığını takmış gibi göster — sadece bu istemcide, gerçek sunucu durumu değişmez",
        default: false
    },
    fakeMute: {
        type: OptionType.BOOLEAN,
        description: "Mikrofonu kapatmış gibi de göster",
        default: false
    }
});

const ORIGINAL_GET_VOICE_STATE = Symbol("endcord-fake-deafen-original-get-voice-state");

let myUserId: string | null = null;
let originalGetVoiceState: ((guildId: string | null, userId: string) => any) | null = null;

function patchStore() {
    const store = VoiceStateStore;
    if (!store) return;

    if (!(ORIGINAL_GET_VOICE_STATE in store)) {
        const orig = store.getVoiceState.bind(store);
        (store as any)[ORIGINAL_GET_VOICE_STATE] = orig;
        originalGetVoiceState = orig;

        store.getVoiceState = function (guildId: string | null, userId: string) {
            const state = originalGetVoiceState!(guildId, userId);
            if (!state || userId !== myUserId) return state;

            const fake = { ...state } as any;
            if (settings.store.enabled) {
                fake.deaf = true;
                fake.selfDeaf = true;
            }
            if (settings.store.fakeMute) {
                fake.mute = true;
                fake.selfMute = true;
            }
            return fake;
        };
    }
}

function unpatchStore() {
    const store = VoiceStateStore;
    if (!store) return;

    if (originalGetVoiceState) {
        store.getVoiceState = originalGetVoiceState;
        originalGetVoiceState = null;
    }
}

export default definePlugin({
    name: "DevcordFakeDeafen",
    description: "Kulaklığını (ve istersen mikrofona) takmış gibi gösterir — diğer kullanıcılar bunu göremez, sadece bu Discord istemcinde görünür.",
    tags: ["Utility", "Fun", "Appearance"],
    authors: [Devs.Devcord],
    settings,

    start() {
        myUserId = UserStore.getCurrentUser()?.id ?? null;
        patchStore();
    },

    stop() {
        unpatchStore();
        myUserId = null;
    }
});
