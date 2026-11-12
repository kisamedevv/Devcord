/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Endcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { Paragraph } from "@components/Paragraph";
import { Span } from "@components/Span";
import type { RenderModalProps } from "@endcord/discord-types";
import { Margins } from "@utils/margins";
import { Modal, openModal, showToast, useState } from "@webpack/common";

import { buildIconSrc } from "./icons";
import { settings } from "./settings";
import { BadgeEntry, normalizeBadges } from "./store";

interface BadgePickerProps extends RenderModalProps {
    userId: string;
    /** Görüntülenecek isim, örn. "kullanıcı adı" */
    label: string;
}

/** Sağ tık menüsünden açılan rozet seçici. */
export function openBadgePicker(userId: string, label: string) {
    openModal(props => <BadgePickerModal {...props} userId={userId} label={label} />);
}

function BadgePickerModal({ userId, label, transitionState, onClose }: BadgePickerProps) {
    const [badges, setBadges] = useState<BadgeEntry[]>(() => normalizeBadges(settings.store.badges));

    function commit(next: BadgeEntry[]) {
        setBadges(next);
        settings.store.badges = next;
    }

    function toggle(badge: BadgeEntry) {
        const assigned = badge.userIds.includes(userId);
        const next = badges.map(entry => entry.id === badge.id
            ? { ...entry, userIds: assigned ? entry.userIds.filter(id => id !== userId) : [...entry.userIds, userId] }
            : entry);

        commit(next);
        showToast({
            text: assigned
                ? `“${badge.name}” kaldırıldı`
                : `“${badge.name}” verildi`,
            variant: "success"
        });
    }

    function createBadge() {
        const badge: BadgeEntry = {
            id: `endcord-badge-${Date.now().toString(36)}`,
            name: "Yeni Rozet",
            icon: "nitro",
            color: "#6c8cff",
            description: "",
            userIds: [userId]
        };

        commit([...badges, badge]);
        showToast({ text: "Rozet oluşturuldu ve verildi", variant: "success" });
        onClose();
    }

    const owned = badges.filter(badge => badge.userIds.includes(userId));

    return (
        <Modal
            transitionState={transitionState}
            onClose={onClose}
            title="Devcord Rozeti"
            size="lg"
        >
            <Flex flexDirection="column" gap={10}>
                <Paragraph>
                    <b>{label}</b> için rozet seç. Seçtiğin rozet profilinde, üye listesinde
                    ve sohbette görünür. Rozetler tamamen yerelde kalır.
                </Paragraph>

                {badges.length === 0 && (
                    <Paragraph>Henüz rozet yok. Aşağıdan ilk rozetini oluştur.</Paragraph>
                )}

                {badges.map(badge => {
                    const assigned = owned.some(entry => entry.id === badge.id);

                    return (
                        <Flex
                            key={badge.id}
                            alignItems="center"
                            gap={10}
                            className={assigned ? "vc-ecb-picker-row selected" : "vc-ecb-picker-row"}
                        >
                            <img
                                src={buildIconSrc(badge.icon, badge.color)}
                                alt=""
                                width={30}
                                height={30}
                                style={{ width: 30, height: 30, borderRadius: "50%" }}
                            />
                            <Flex flexDirection="column" gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <Span weight="semibold" size="md">{badge.name}</Span>
                                <Span size="sm" className="vc-ecb-muted">
                                    {badge.description || "açıklama yok"}
                                </Span>
                            </Flex>
                            <Button
                                size="small"
                                variant={assigned ? "dangerSecondary" : "primary"}
                                onClick={() => toggle(badge)}
                            >
                                {assigned ? "Kaldır" : "Ver"}
                            </Button>
                        </Flex>
                    );
                })}

                <Flex gap={8} className={Margins.top16}>
                    <Button variant="secondary" onClick={createBadge}>
                        Yeni rozet oluştur
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Kapat
                    </Button>
                </Flex>

                {owned.length > 0 && (
                    <Paragraph size="sm" className="vc-ecb-muted">
                        Şu an: {owned.map(badge => badge.name).join(" · ")}
                    </Paragraph>
                )}
            </Flex>
        </Modal>
    );
}
