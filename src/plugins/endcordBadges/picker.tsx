/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Devcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { Paragraph } from "@components/Paragraph";
import { Span } from "@components/Span";
import type { RenderModalProps } from "@endcord/discord-types";
import { Margins } from "@utils/margins";
import { Modal, openModal, showToast, useState } from "@webpack/common";

import { BADGE_COLORS, BADGE_ICONS, buildIconSrc, DEFAULT_BADGE_COLOR, isImageIcon } from "./icons";
import { settings } from "./settings";
import { BadgeEntry, createBadge, normalizeBadges } from "./store";

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
    const [name, setName] = useState("Yeni Rozet");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("star");
    const [color, setColor] = useState(DEFAULT_BADGE_COLOR);
    const [showCreate, setShowCreate] = useState(false);

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

    function createBadgeEntry() {
        const badge = createBadge({
            name: name.trim() || "Yeni Rozet",
            description: description.trim(),
            icon,
            color,
            userIds: [userId]
        });

        commit([...badges, badge]);
        showToast({ text: "Rozet oluşturuldu ve verildi", variant: "success" });
        setName("Yeni Rozet");
        setDescription("");
        setIcon("star");
        setColor(DEFAULT_BADGE_COLOR);
        setShowCreate(false);
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
                    ve sohbette görünür. Rozetler tamamen yerelde kalır; başkasına eklediğinde
                    yalnızca senin istemcinde görünür.
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
                            className={assigned ? "vc-ecb-picker-row vc-ecb-selected" : "vc-ecb-picker-row"}
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

                <div className="vc-ecb-field">
                    <Button variant="secondary" onClick={() => setShowCreate(value => !value)}>
                        {showCreate ? "Oluşturma alanını gizle" : "Yeni rozet oluştur ve ver"}
                    </Button>
                </div>

                {showCreate && (
                    <Flex flexDirection="column" gap={10} className="vc-ecb-create">
                        <div className="vc-ecb-field">
                            <Span weight="medium" size="md">Rozet adı</Span>
                            <input
                                className="vc-ecb-import-box"
                                style={{ minHeight: 0, padding: "0.5em 0.6em" }}
                                value={name}
                                onChange={event => setName(event.currentTarget.value)}
                            />
                        </div>

                        <div className="vc-ecb-field">
                            <Span weight="medium" size="md">Açıklama</Span>
                            <input
                                className="vc-ecb-import-box"
                                style={{ minHeight: 0, padding: "0.5em 0.6em" }}
                                value={description}
                                onChange={event => setDescription(event.currentTarget.value)}
                            />
                        </div>

                        <div className="vc-ecb-field">
                            <Span weight="medium" size="md">İkon</Span>
                            <div className="vc-ecb-icon-grid">
                                {BADGE_ICONS.filter(entry => !isImageIcon(entry.id)).map(entry => (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        title={entry.label}
                                        aria-label={entry.label}
                                        className={icon === entry.id ? "vc-ecb-icon-button vc-ecb-selected" : "vc-ecb-icon-button"}
                                        onClick={() => setIcon(entry.id)}
                                    >
                                        <img src={buildIconSrc(entry.id, color)} alt="" width={26} height={26} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="vc-ecb-field">
                            <Span weight="medium" size="md">Renk</Span>
                            <Flex gap={6} alignItems="center" className="vc-ecb-color-row">
                                <input
                                    type="color"
                                    className="vc-ecb-color-input"
                                    value={color}
                                    onChange={event => setColor(event.currentTarget.value)}
                                />
                                {BADGE_COLORS.map(entry => (
                                    <button
                                        key={entry}
                                        type="button"
                                        title={entry}
                                        aria-label={entry}
                                        className={color.toLowerCase() === entry ? "vc-ecb-color-swatch vc-ecb-selected" : "vc-ecb-color-swatch"}
                                        style={{ background: entry }}
                                        onClick={() => setColor(entry)}
                                    />
                                ))}
                            </Flex>
                        </div>

                        <Flex gap={8}>
                            <Button variant="primary" onClick={createBadgeEntry} disabled={!name.trim()}>
                                Oluştur ve ver
                            </Button>
                            <Button variant="secondary" onClick={() => setShowCreate(false)}>
                                İptal
                            </Button>
                        </Flex>
                    </Flex>
                )}

                <Flex gap={8} className={Margins.top16}>
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
