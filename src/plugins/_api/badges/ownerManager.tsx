/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Devcord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Span } from "@components/Span";
import { DEVCORD_OWNER_ID } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { TextInput, useMemo, UserStore, useState } from "@webpack/common";

import { cacheOwnerBadgeData, fetchOwnerBadges, getOwnerBadgeData, OwnerBadgeData } from "./ownerBadges";

const cl = classNameFactory("vc-owner-badge-mgr-");

const GITHUB_REPO = "kisamedevv/Devcord";
const BADGES_FILE = "devcord-badges.json";
const DISCORD_ID = /^\d{17,20}$/;

interface GitHubFileResponse {
    content: string;
    sha: string;
}

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Bilinmeyen hata";
}

function isBadgeData(value: unknown): value is OwnerBadgeData {
    return !!value && typeof value === "object"
        && Array.isArray((value as OwnerBadgeData).owner)
        && Array.isArray((value as OwnerBadgeData).helped)
        && (value as OwnerBadgeData).owner.every(id => DISCORD_ID.test(id))
        && (value as OwnerBadgeData).helped.every(id => DISCORD_ID.test(id));
}

async function getBadgesFile(token: string): Promise<{ data: OwnerBadgeData; sha: string; }> {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${BADGES_FILE}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" }
    });

    if (!res.ok) throw new Error(res.status === 401 ? "GitHub token gecersiz" : `GitHub dosyasi okunamadi (${res.status})`);

    const file: GitHubFileResponse = await res.json();
    const data = JSON.parse(atob(file.content.replace(/\n/g, "")));
    if (!isBadgeData(data)) throw new Error("Rozet dosyasinin formati gecersiz");

    return { data, sha: file.sha };
}

async function updateBadgesFile(token: string, data: OwnerBadgeData, sha: string): Promise<void> {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${BADGES_FILE}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            message: `Update owner badges: ${data.helped.length} helped build`,
            content: btoa(JSON.stringify(data, null, 2)),
            sha
        })
    });

    if (res.status === 409) throw new Error("Rozet dosyasi baska biri tarafindan guncellendi, tekrar deneyin");
    if (!res.ok) throw new Error(`GitHub guncellemesi basarisiz (${res.status})`);
}

export function OwnerBadgeManager({ githubToken }: { githubToken: string; }) {
    const [helped, setHelped] = useState<string[]>(() => getOwnerBadgeData().helped);
    const [searchQuery, setSearchQuery] = useState("");
    const [manualId, setManualId] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const searchResults = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];

        return UserStore.filter(user => user.username.toLowerCase().includes(q) || user.id.includes(q)).slice(0, 10);
    }, [searchQuery]);

    const targetId = selectedUserId || manualId.trim();
    const targetIsValid = DISCORD_ID.test(targetId);

    function showStatus(message: string) {
        setStatus(message);
        setTimeout(() => setStatus(""), 3000);
    }

    async function refreshData() {
        setLoading(true);
        await fetchOwnerBadges();
        setHelped(getOwnerBadgeData().helped);
        setLoading(false);
        showStatus("Veriler yenilendi");
    }

    async function grantBadge(userId: string) {
        if (!githubToken) {
            showStatus("GitHub token gerekli");
            return;
        }
        if (!DISCORD_ID.test(userId)) {
            showStatus("Gecerli bir Discord kullanici ID'si girin");
            return;
        }

        setLoading(true);
        try {
            const file = await getBadgesFile(githubToken);
            if (file.data.helped.includes(userId)) {
                showStatus("Bu kullanicida zaten badge var");
                return;
            }

            const data = { ...file.data, helped: [...file.data.helped, userId] };
            await updateBadgesFile(githubToken, data, file.sha);
            cacheOwnerBadgeData(data);
            setHelped(data.helped);
            showStatus("Badge verildi! Degisiklik 5 dakika icinde herkese yansir.");
        } catch (e) {
            showStatus(errorMessage(e));
        } finally {
            setLoading(false);
        }
    }

    async function revokeBadge(userId: string) {
        if (!githubToken) {
            showStatus("GitHub token gerekli");
            return;
        }
        if (!DISCORD_ID.test(userId)) {
            showStatus("Gecerli bir Discord kullanici ID'si girin");
            return;
        }

        setLoading(true);
        try {
            const file = await getBadgesFile(githubToken);
            const data = { ...file.data, helped: file.data.helped.filter(id => id !== userId) };
            await updateBadgesFile(githubToken, data, file.sha);
            cacheOwnerBadgeData(data);
            setHelped(data.helped);
            showStatus("Badge kaldirildi!");
        } catch (e) {
            showStatus(errorMessage(e));
        } finally {
            setLoading(false);
        }
    }

    const isOwner = UserStore.getCurrentUser()?.id === DEVCORD_OWNER_ID;

    if (!isOwner) {
        return (
            <Flex flexDirection="column" gap={8}>
                <Paragraph>Bu panel sadece Devcord Owner icin kullanilabilir.</Paragraph>
            </Flex>
        );
    }

    return (
        <Flex flexDirection="column" gap={12} className={cl("root")}>
            <Heading>Owner Badge Yonetimi</Heading>
            <Paragraph>
                "Helped Build Devcord" rozetini kullaniciya ver veya kaldir.
                Degisiklikler GitHub uzerinden yapilir ve 5 dakika icinde tum Devcord kullanicilarina yansir.
            </Paragraph>

            <Flex gap={8} alignItems="center">
                <Button size="small" variant="secondary" onClick={refreshData} disabled={loading}>
                    {loading ? "Yukleniyor..." : "Yenile"}
                </Button>
                {status && <Span size="sm" className={cl("status")}>{status}</Span>}
            </Flex>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Kullanici ara (ad veya ID)</Span>
                <TextInput
                    placeholder="kullanici_adi veya 123456789012345678"
                    value={searchQuery}
                    onChange={value => setSearchQuery(value)}
                />
                {searchQuery.trim().length > 0 && (
                    <div className={cl("user-results")}>
                        {searchResults.length === 0
                            ? <Span size="sm" className={cl("muted")}>Kullanici bulunamadi.</Span>
                            : searchResults.map(user => (
                                <Button
                                    key={user.id}
                                    size="small"
                                    variant="secondary"
                                    onClick={() => {
                                        setSelectedUserId(user.id);
                                        setManualId("");
                                        setSearchQuery("");
                                    }}
                                >
                                    {user.username} ({user.id})
                                </Button>
                            ))}
                    </div>
                )}
            </div>

            <div className={cl("field")}>
                <Span weight="medium" size="md">Kullanici ID</Span>
                <TextInput
                    placeholder="123456789012345678"
                    value={manualId}
                    onChange={value => {
                        setManualId(value);
                        setSelectedUserId("");
                    }}
                />
            </div>

            {targetId && (
                <Flex flexDirection="column" gap={8} className={cl("selected")}>
                    <Span weight="medium" size="md">Secili Kullanici: {targetId}</Span>
                    {targetIsValid ? (
                        <Flex gap={8}>
                            <Button size="small" variant="primary" onClick={() => grantBadge(targetId)} disabled={loading}>
                                Helped Build Rozeti Ver
                            </Button>
                            <Button size="small" variant="dangerSecondary" onClick={() => revokeBadge(targetId)} disabled={loading}>
                                Rozeti Kaldir
                            </Button>
                        </Flex>
                    ) : (
                        <Span size="sm" className={cl("muted")}>Gecerli bir Discord kullanici ID'si girin.</Span>
                    )}
                </Flex>
            )}

            <div className={cl("list")}>
                <Span weight="medium" size="md">Mevcut "Helped Build Devcord" rozetli kullanicilar ({helped.length})</Span>
                {helped.length === 0
                    ? <Paragraph className={cl("muted")}>Henuz kimse yok.</Paragraph>
                    : helped.map(id => {
                        const user = UserStore.getUser(id);

                        return (
                            <Flex key={id} gap={8} alignItems="center" className={cl("list-item")}>
                                <Span size="sm">{user ? `${user.username} (${id})` : id}</Span>
                                <Button size="small" variant="dangerSecondary" onClick={() => revokeBadge(id)} disabled={loading}>
                                    Kaldir
                                </Button>
                            </Flex>
                        );
                    })}
            </div>
        </Flex>
    );
}
