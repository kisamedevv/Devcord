/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Span } from "@components/Span";
import { BADGE_IMAGE_ICONS, buildIconSrc } from "@plugins/endcordBadges/icons";
import { classNameFactory } from "@utils/css";
import { Margins } from "@utils/margins";
import { showToast, TextInput, useState } from "@webpack/common";

import { FakeProfile, shareProfile } from "./profile";
import { settings } from "./settings";

const cl = classNameFactory("vc-ecp-");

/**
 * Fake profil düzenleyici.
 * Hem ayarlar sekmesinde hem sağ üstteki logodan açılan panelde kullanılır.
 */
export function FakeProfileEditor() {
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
        <Flex flexDirection="column" gap={14} className={cl("root")}>
            <div>
                <Heading size="md" className={Margins.bottom8}>Fake Profil</Heading>
                <Paragraph>
                    Sahte isim, sahte rozetler ve sahte hesap oluşturma tarihi. Veri profil
                    açıklamana görünmez karakterlerle gömülür — normal Discord istemcisi açıklamayı
                    boş görür, yalnızca Endcord kullananlar çözüp fake profili görür.
                </Paragraph>
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Sahte isim</Span>
                <TextInput
                    placeholder="Endcord Legend"
                    value={name}
                    onChange={commitName}
                />
                <Paragraph size="sm" className={cl("muted")}>
                    Kendi profilinde görünen isim bu olur. Boş bırakırsan gerçek ismin kalır.
                </Paragraph>
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Sahte oluşturma tarihi</Span>
                <TextInput
                    placeholder="2019-04-01T12:00:00.000Z"
                    value={date}
                    onChange={commitDate}
                />
                <Paragraph size="sm" className={cl("muted")}>
                    Sağ tık menüsündeki hesap yaşı bilgisi de bu tarihi kullanır.
                </Paragraph>
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

            <div className={cl("preview")}>
                <Span weight="medium" size="md">Önizleme</Span>
                <Flex alignItems="center" gap={8} className={Margins.top8}>
                    <img
                        className={cl("preview-avatar")}
                        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                            "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"16\" fill=\"#3b4a7a\"/><circle cx=\"16\" cy=\"12\" r=\"5.5\" fill=\"#9fb0e6\"/><path d=\"M4 32a12 12 0 0 1 24 0z\" fill=\"#9fb0e6\"/></svg>"
                        )}`}
                        alt=""
                        width={32}
                        height={32}
                    />
                    <Flex flexDirection="column" gap={2}>
                        <Span weight="semibold" size="md">{name.trim() || "Gerçek ismin"}</Span>
                        <Flex gap={4}>
                            {badges.map(id => (
                                <img key={id} src={buildIconSrc(id, "#a970ff")} alt="" width={18} height={18} />
                            ))}
                            {date.trim() && (
                                <Span size="sm" className={cl("muted")}>
                                    · {new Date(date.trim()).toLocaleDateString("tr-TR")}
                                </Span>
                            )}
                        </Flex>
                    </Flex>
                </Flex>
            </div>

            <Flex gap={8}>
                <Button onClick={share} disabled={busy}>
                    {busy ? "Paylaşılıyor…" : "Fake profili paylaş"}
                </Button>
            </Flex>
        </Flex>
    );
}
