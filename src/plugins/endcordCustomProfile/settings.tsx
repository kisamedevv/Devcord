/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Span } from "@components/Span";
import { BADGE_IMAGE_ICONS, buildIconSrc } from "@plugins/endcordBadges/icons";
import { classNameFactory } from "@utils/css";
import { Margins } from "@utils/margins";
import { OptionType } from "@utils/types";
import { showToast, TextInput, useState } from "@webpack/common";

import { FakeProfile, shareProfile } from "./profile";

const cl = classNameFactory("vc-ecp-");

export const settings = definePluginSettings({
    fakeName: {
        type: OptionType.STRING,
        description: "Sahte görünen isim (boş bırakılırsa gerçek isim kalır)",
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
        description: "Sahte profili paylaş — profil açıklamana görünmez kod yazılır, sadece Endcord kullananlar çözer",
        default: false
    },
    panel: {
        type: OptionType.COMPONENT,
        component: ProfileEditor
    }
});

function ProfileEditor() {
    const [name, setName] = useState(settings.store.fakeName ?? "");
    const [date, setDate] = useState(settings.store.fakeCreatedAt ?? "");
    const [badges, setBadges] = useState<string[]>(settings.store.fakeBadges ?? []);
    const [busy, setBusy] = useState(false);

    function toggleBadge(id: string) {
        const next = badges.includes(id) ? badges.filter(entry => entry !== id) : [...badges, id];
        setBadges(next);
        settings.store.fakeBadges = next;
    }

    function commitName(value: string) {
        setName(value);
        settings.store.fakeName = value;
    }

    function commitDate(value: string) {
        setDate(value);
        settings.store.fakeCreatedAt = value;
    }

    async function share() {
        setBusy(true);
        try {
            const profile: FakeProfile = {
                name: name.trim(),
                badges,
                createdAt: date.trim() || null
            };

            await shareProfile(profile);
            settings.store.shareProfile = true;
            showToast({ text: "Fake profil paylaşıldı — sadece Endcord kullananlar görecek", variant: "success" });
        } catch (err) {
            showToast({ text: `Paylaşma başarısız: ${String(err)}`, variant: "critical" });
        } finally {
            setBusy(false);
        }
    }

    return (
        <Flex flexDirection="column" gap={10} className={cl("root")}>
            <div>
                <Heading className={Margins.bottom8}>Fake Profil</Heading>
                <Paragraph>
                    Sahte isim, sahte rozetler ve sahte hesap oluşturma tarihi. Bunlar sadece
                    Endcord kullanan istemcilerde görünür — normal Discord bunları okumaz.
                    Paylaş butonu veriyi profil açıklamana görünmez karakterlerle gömülü yazar.
                </Paragraph>
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Sahte isim</Span>
                <TextInput
                    placeholder="Endcord Legend"
                    value={name}
                    onChange={commitName}
                />
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Sahte oluşturma tarihi</Span>
                <TextInput
                    placeholder="2019-04-01T12:00:00.000Z"
                    value={date}
                    onChange={commitDate}
                />
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Sahte rozetler</Span>
                <div className={cl("badge-grid")}>
                    {BADGE_IMAGE_ICONS.map(icon => (
                        <button
                            key={icon.id}
                            type="button"
                            title={icon.label}
                            aria-label={icon.label}
                            className={cl("badge-button", { selected: badges.includes(icon.id) })}
                            onClick={() => toggleBadge(icon.id)}
                        >
                            <img src={buildIconSrc(icon.id, "#a970ff")} alt="" width={28} height={28} />
                        </button>
                    ))}
                </div>
                <Paragraph size="sm" className={cl("muted")}>
                    Seçilen: {badges.length ? badges.join(", ") : "yok"}
                </Paragraph>
            </div>

            <Flex gap={8}>
                <Button onClick={share} disabled={busy}>
                    {busy ? "Paylaşılıyor…" : "Fake profili paylaş"}
                </Button>
            </Flex>
        </Flex>
    );
}
