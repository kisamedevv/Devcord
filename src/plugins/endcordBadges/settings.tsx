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
import { classNameFactory } from "@utils/css";
import { copyWithToast } from "@utils/discord";
import { Margins } from "@utils/margins";
import { OptionType } from "@utils/types";
import { showToast, TextInput, useMemo, UserStore, useState } from "@webpack/common";

import { BADGE_COLORS, BADGE_ICONS, BADGE_IMAGE_ICONS, buildIconSrc, isImageIcon, isImageSource } from "./icons";
import { BadgeEntry, badgesForUser, cloneBadges, createBadge, createStarterBadges, normalizeBadges, parseUserIds } from "./store";

const cl = classNameFactory("vc-ecb-");

export const settings = definePluginSettings({
    panel: {
        type: OptionType.COMPONENT,
        component: BadgeManager
    },
    badges: {
        type: OptionType.CUSTOM,
        default: createStarterBadges(),
        description: "Your custom badges. Edit them in the manager above."
    },
    showInMemberList: {
        type: OptionType.BOOLEAN,
        description: "Also show custom badges next to names in the member list",
        default: false
    },
    showInChat: {
        type: OptionType.BOOLEAN,
        description: "Also show custom badges next to author names in chat",
        default: false
    },
    badgeSize: {
        type: OptionType.SLIDER,
        description: "Badge size on profiles",
        markers: [16, 18, 20, 22, 24, 26, 28, 32],
        default: 22,
        stickToMarkers: true
    }
});

function BadgePreview({ badge, size = 26 }: { badge: BadgeEntry; size?: number; }) {
    return (
        <img
            className={cl("preview")}
            src={buildIconSrc(badge.icon, badge.color)}
            alt=""
            width={size}
            height={size}
            style={{ width: size, height: size }}
        />
    );
}

function BadgeEditor({ badge, onChange, onDelete }: {
    badge: BadgeEntry;
    onChange(patch: Partial<BadgeEntry>): void;
    onDelete(): void;
}) {
    // Keep the raw text around so commas & spaces survive typing
    const [userInput, setUserInput] = useState(badge.userIds.join(", "));
    const [userQuery, setUserQuery] = useState("");
    const me = UserStore.getCurrentUser();

    const userResults = useMemo(() => {
        const query = userQuery.trim().toLowerCase();
        if (!query) return [];

        return UserStore.filter(user => user.username.toLowerCase().includes(query)).slice(0, 8);
    }, [userQuery]);

    function updateUserIds(value: string) {
        setUserInput(value);
        onChange({ userIds: parseUserIds(value) });
    }

    function addMe() {
        const ids = Array.from(new Set([...badge.userIds, me.id]));
        setUserInput(ids.join(", "));
        onChange({ userIds: ids });
    }

    const customIcon = isImageSource(badge.icon);

    return (
        <Flex flexDirection="column" gap={8} className={cl("editor")}>
            <div className={cl("field")}>
                <Span weight="medium" size="md">Badge name</Span>
                <TextInput
                    placeholder="Devcord Legend"
                    value={badge.name}
                    onChange={value => onChange({ name: value })}
                />
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Tooltip / description</Span>
                <TextInput
                    placeholder="Shown when hovering the badge"
                    value={badge.description}
                    onChange={value => onChange({ description: value })}
                />
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Discord rozetleri</Span>
                <div className={cl("icon-grid")}>
                    {BADGE_IMAGE_ICONS.map(icon => (
                        <button
                            key={icon.id}
                            type="button"
                            title={icon.label}
                            aria-label={icon.label}
                            className={cl("icon-button", { selected: badge.icon === icon.id })}
                            onClick={() => onChange({ icon: icon.id })}
                        >
                            <img src={buildIconSrc(icon.id, badge.color)} alt="" width={26} height={26} />
                        </button>
                    ))}
                </div>
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Sade ikonlar</Span>
                <div className={cl("icon-grid")}>
                    {BADGE_ICONS.filter(icon => !icon.src).map(icon => (
                        <button
                            key={icon.id}
                            type="button"
                            title={icon.label}
                            aria-label={icon.label}
                            className={cl("icon-button", { selected: badge.icon === icon.id })}
                            onClick={() => onChange({ icon: icon.id })}
                        >
                            <img src={buildIconSrc(icon.id, badge.color)} alt="" width={26} height={26} />
                        </button>
                    ))}
                </div>
            </div>

            {!isImageIcon(badge.icon) && (
                <div className={cl("field")}>
                    <Span weight="medium" size="md">Colour</Span>
                    <Flex gap={6} alignItems="center" className={cl("color-row")}>
                        <input
                            type="color"
                            className={cl("color-input")}
                            value={/^#[0-9a-f]{6}$/i.test(badge.color) ? badge.color : "#a970ff"}
                            onChange={e => onChange({ color: e.currentTarget.value })}
                        />
                        {BADGE_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                title={color}
                                aria-label={color}
                                className={cl("color-swatch", { selected: badge.color.toLowerCase() === color })}
                                style={{ background: color }}
                                onClick={() => onChange({ color })}
                            />
                        ))}
                    </Flex>
                </div>
            )}

            <div className={cl("field")}>
                <Span weight="medium" size="md">Custom icon URL</Span>
                <TextInput
                    placeholder="https://example.com/badge.png — leave empty to use the icon above"
                    value={customIcon ? badge.icon : ""}
                    onChange={value => onChange({ icon: value.trim() || "crown" })}
                />
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Who gets this badge?</Span>
                <TextInput
                    placeholder="Discord user IDs, comma separated — * for everyone"
                    value={userInput}
                    onChange={updateUserIds}
                />
                <Flex gap={6} className={Margins.top8}>
                    <Button size="small" variant="secondary" onClick={addMe}>
                        Add me ({me.username})
                    </Button>
                    <Button size="small" variant="secondary" onClick={() => copyWithToast(me.id)}>
                        Copy my ID
                    </Button>
                    {badge.userIds.length > 0 && (
                        <Button size="small" variant="dangerSecondary" onClick={() => updateUserIds("")}>
                            Clear
                        </Button>
                    )}
                </Flex>
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Kullanıcı ara (ad veya etiket)</Span>
                <TextInput
                    placeholder="kullanici_adi veya ad#1234"
                    value={userQuery}
                    onChange={value => setUserQuery(value)}
                />
                {userQuery.trim().length > 0 && (
                    <div className={cl("user-results")}>
                        {userResults.length === 0
                            ? <Span size="sm" className={cl("muted")}>Eşleşen kullanıcı yok.</Span>
                            : userResults.map(user => (
                                <Button
                                    key={user.id}
                                    size="small"
                                    variant="secondary"
                                    onClick={() => {
                                        if (!badge.userIds.includes(user.id)) {
                                            onChange({ userIds: [...badge.userIds, user.id] });
                                        }
                                        setUserQuery("");
                                    }}
                                >
                                    {user.username}
                                </Button>
                            ))}
                    </div>
                )}
            </div>

            <Flex gap={8} className={Margins.top8}>
                <Button size="small" variant="dangerPrimary" onClick={onDelete}>
                    Delete badge
                </Button>
            </Flex>
        </Flex>
    );
}

function BadgeManager() {
    const [badges, setBadges] = useState<BadgeEntry[]>(() => normalizeBadges(settings.store.badges));
    const [expandedId, setExpandedId] = useState<string | null>(() => badges[0]?.id ?? null);
    const [importText, setImportText] = useState("");

    function commit(next: BadgeEntry[]) {
        setBadges(next);
        settings.store.badges = next;
    }

    function update(id: string, patch: Partial<BadgeEntry>) {
        commit(badges.map(badge => badge.id === id ? { ...badge, ...patch } : badge));
    }

    function addBadge() {
        const badge = createBadge();
        commit([...badges, badge]);
        setExpandedId(badge.id);
    }

    function deleteBadge(id: string) {
        commit(badges.filter(badge => badge.id !== id));
        if (expandedId === id) setExpandedId(null);
    }

    function importJson() {
        try {
            const parsed = JSON.parse(importText);
            const next = normalizeBadges(parsed);
            commit(next);
            setImportText("");
            showToast({ text: `Imported ${next.length} badge(s)`, variant: "success" });
        } catch (e) {
            showToast({ text: `Import failed: ${String(e)}`, variant: "critical" });
        }
    }

    const me = UserStore.getCurrentUser();
    const mine = badgesForUser(badges, me.id);

    return (
        <Flex flexDirection="column" gap={10} className={cl("root")}>
            <div>
                <Heading className={Margins.bottom8}>Devcord Badges</Heading>
                <Paragraph>
                    Give yourself — or anyone else — a badge with an icon of your choice.
                    Badges are stored locally on this device and rendered on profiles.
                    No server, no token, no upload.
                </Paragraph>
            </div>

            <div className={cl("mine")}>
                <Span weight="medium" size="md">Your badges</Span>
                {mine.length
                    ? (
                        <Flex gap={4} alignItems="center" className={Margins.top8}>
                            {mine.map(badge => <BadgePreview key={badge.id} badge={badge} size={24} />)}
                            <Span size="sm" className={cl("muted")}>{mine.map(b => b.name).join(" · ")}</Span>
                        </Flex>
                    )
                    : <Paragraph className={cl("muted")}>None yet. Add a badge and hit “Add me”.</Paragraph>
                }
            </div>

            {badges.map(badge => {
                const expanded = expandedId === badge.id;

                return (
                    <div key={badge.id} className={cl("card", { expanded })}>
                        <button
                            type="button"
                            className={cl("card-header")}
                            onClick={() => setExpandedId(expanded ? null : badge.id)}
                        >
                            <BadgePreview badge={badge} />
                            <Flex flexDirection="column" gap={2} className={cl("card-title")}>
                                <Span weight="semibold" size="md">{badge.name}</Span>
                                <Span size="sm" className={cl("muted")}>
                                    {badge.userIds.length === 0
                                        ? "not assigned"
                                        : badge.userIds.includes("*")
                                            ? "everyone"
                                            : `${badge.userIds.length} user${badge.userIds.length === 1 ? "" : "s"}`}
                                </Span>
                            </Flex>
                            <Span size="sm" className={cl("muted")}>{expanded ? "▲" : "▼"}</Span>
                        </button>

                        {expanded && (
                            <BadgeEditor
                                badge={badge}
                                onChange={patch => update(badge.id, patch)}
                                onDelete={() => deleteBadge(badge.id)}
                            />
                        )}
                    </div>
                );
            })}

            <Flex gap={8}>
                <Button onClick={addBadge}>Add badge</Button>
                <Button variant="secondary" onClick={() => copyWithToast(JSON.stringify(cloneBadges(badges), null, 4))}>
                    Copy JSON
                </Button>
                <Button
                    variant="dangerSecondary"
                    onClick={() => commit(normalizeBadges(createStarterBadges()))}
                >
                    Reset
                </Button>
            </Flex>

            <div className={cl("import")}>
                <Span weight="medium" size="md">Import badges</Span>
                <Paragraph className={cl("muted")}>
                    Paste exported badge JSON here. Only badges you made yourself are imported.
                </Paragraph>
                <textarea
                    className={cl("import-box")}
                    placeholder='[ { "name": "Legend", "icon": "crown", "userIds": ["123456789012345678"] } ]'
                    value={importText}
                    onChange={e => setImportText(e.currentTarget.value)}
                    spellCheck={false}
                />
                <Button size="small" variant="secondary" onClick={importJson} disabled={!importText.trim()}>
                    Import
                </Button>
            </div>
        </Flex>
    );
}
