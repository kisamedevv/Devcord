/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { FakeProfileEditor } from "./editor";

export const settings = definePluginSettings({
    targetUserId: {
        type: OptionType.STRING,
        description: "Fake profil kime uygulansın — kullanıcı ID (boş bırakılırsa kendi hesabın)",
        default: ""
    },
    fakeUsername: {
        type: OptionType.STRING,
        description: "Sahte kullanıcı adı (@xxx) — görünen isim ayrı tutulur",
        default: ""
    },
    fakeDisplayName: {
        type: OptionType.STRING,
        description: "Sahte görünen isim (display name) — boş bırakılırsa gerçek isim kalır",
        default: ""
    },
    fakeBadges: {
        type: OptionType.CUSTOM,
        description: "Sahte rozetler",
        default: [] as string[]
    },
    fakeCreatedAt: {
        type: OptionType.STRING,
        description: "Sahte hesap oluşturma tarihi (ISO, örn. 2019-04-01T12:00:00.000Z)",
        default: ""
    },
    shareProfile: {
        type: OptionType.BOOLEAN,
        description: "Sahte profili paylaş — profil açıklamana görünmez kod yazılır, sadece Devcord kullananlar çözer",
        default: false
    },
    panel: {
        type: OptionType.COMPONENT,
        component: FakeProfileEditor
    }
});
