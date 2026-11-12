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
import { showToast, TextInput, UserStore, useState } from "@webpack/common";

import { FakeProfile, shareProfile } from "./profile";
import { settings } from "./settings";

const cl = classNameFactory("vc-ecp-");

/**
 * Fake profil düzenleyici.
 * Hem ayarlar sekmesinde hem sağ üstteki logodan açılan panelde kullanılır.
 */
export function FakeProfileEditor() {
    const [username, setUsername] = useState(settings.store.fakeUsername ?? "");
    const [displayName, setDisplayName] = useState(settings.store.fakeDisplayName ?? "");
    const [date, setDate] = useState(settings.store.fakeCreatedAt ?? "");
    const [badges, setBadges] = useState<string[]>(settings.store.fakeBadges ?? []);
    const [target, setTarget] = useState(settings.store.targetUserId ?? "");
    const [busy, setBusy] = useState(false);

    const me = UserStore.getCurrentUser();
    const targetId = target.trim() || me?.id || "";

    // Arkadaşlar: kullanıcı ID'si girmek zorunda kalmayalım
    const friends = Object.values(UserStore.getUsers())
        .filter(user => user.id !== me?.id && !user.bot)
        .slice(0, 12);

    function toggleBadge(id: string) {
        const next = badges.includes(id) ? badges.filter(entry => entry !== id) : [...badges, id];
        setBadges(next);
        settings.store.fakeBadges = next;
    }

    function commitUsername(value: string) {
        setUsername(value);
        settings.store.fakeUsername = value;
    }

    function commitDisplayName(value: string) {
        setDisplayName(value);
        settings.store.fakeDisplayName = value;
    }

    function commitDate(value: string) {
        setDate(value);
        settings.store.fakeCreatedAt = value;
    }

    function commitTarget(value: string) {
        setTarget(value);
        settings.store.targetUserId = value;
    }

    async function share() {
        setBusy(true);
        try {
            const profile: FakeProfile = {
                username: username.trim(),
                name: displayName.trim(),
                badges,
                createdAt: date.trim() || null
            };

            await shareProfile(profile);
            settings.store.shareProfile = true;
            showToast({ text: "Fake profil paylaşıldı — sadece Devcord kullananlar görecek", variant: "success" });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            showToast({ text: `Paylaşma başarısız: ${message}`, variant: "critical" });
        } finally {
            setBusy(false);
        }
    }

    function reset() {
        setUsername("");
        setDisplayName("");
        setDate("");
        setBadges([]);

        settings.store.fakeUsername = "";
        settings.store.fakeDisplayName = "";
        settings.store.fakeCreatedAt = "";
        settings.store.fakeBadges = [];
        settings.store.shareProfile = false;

        showToast({ text: "Fake profili sıfırlandı — gerçek kimliğin geri geldi", variant: "success" });
    }

    const targetUser = targetId ? UserStore.getUser(targetId) : null;

    return (
        <Flex flexDirection="column" gap={14} className={cl("root")}>
            <div>
                <Heading tag="h3" className={Margins.bottom8}>Fake Profil</Heading>
                <Paragraph>
                    Seçtiğin kullanıcıya sahte isim, sahte rozetler ve sahte oluşturma tarihi
                    uygulanır. Değişiklikler sadece <b>bu istemcide</b> görünür — gerçek Discord
                    verisine dokunulmaz. Paylaş butonu, veriyi profil açıklamana görünmez kodla
                    yazar; onu da yalnızca Devcord kullananlar çözebilir.
                </Paragraph>
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Kime uygulansın</Span>
                <TextInput
                    placeholder="Kullanıcı ID (boş = kendin)"
                    value={target}
                    onChange={commitTarget}
                />
                <Paragraph size="sm" className={cl("muted")}>
                    Hedef: {targetUser ? `${targetUser.username} (${targetUser.id})` : targetId || "kendi hesabın"}
                </Paragraph>
                {friends.length > 0 && (
                    <Flex gap={6} className={Margins.top8} style={{ flexWrap: "wrap" }}>
                        {friends.map(user => (
                            <Button
                                key={user.id}
                                size="small"
                                variant={targetId === user.id ? "primary" : "secondary"}
                                onClick={() => commitTarget(user.id)}
                            >
                                {user.username}
                            </Button>
                        ))}
                    </Flex>
                )}
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Sahte kullanıcı adı</Span>
                <TextInput
                    placeholder="ihaneteder_fake"
                    value={username}
                    onChange={commitUsername}
                />
                <Paragraph size="sm" className={cl("muted")}>
                    Profil açılırındaki "@..." satırı ve üye listesindeki etiket buna çevrilir.
                    Görünen ismin değişmez.
                </Paragraph>
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Sahte görünen isim</Span>
                <TextInput
                    placeholder="haram geceler"
                    value={displayName}
                    onChange={commitDisplayName}
                />
                <Paragraph size="sm" className={cl("muted")}>
                    Boş bırakırsan gerçek görünen ismin kalır — sadece kullanıcı adı fake olur.
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
                    Profil açılırındaki "Şu Tarihten Beri Üye" satırı ve sağ tık menüsündeki
                    hesap yaşı bu tarihi kullanır.
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
                        <Span weight="semibold" size="md">{displayName.trim() || targetUser?.globalName || "Gerçek isim"}</Span>
                        <Span size="sm" className={cl("muted")}>@{username.trim() || targetUser?.username || "gercek_kullanici"}</Span>
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
                <Button variant="dangerSecondary" onClick={reset}>
                    Sıfırla
                </Button>
            </Flex>
        </Flex>
    );
}
