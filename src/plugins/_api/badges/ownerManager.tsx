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
import { classNameFactory } from "@utils/css";
import { TextInput, UserStore, useState, useMemo } from "@webpack/common";

import { DEVCORD_OWNER_ID } from "@utils/constants";
import { fetchOwnerBadges, getOwnerBadgeData } from "./ownerBadges";

const cl = classNameFactory("vc-owner-badge-mgr-");

const GITHUB_REPO = "kisamedevv/Devcord";
const BADGES_FILE = "devcord-badges.json";

interface GitHubFileResponse {
    content: string;
    sha: string;
}

async function getBadgesFile(token: string): Promise<{ data: { owner: string[]; helped: string[] }; sha: string } | null> {
    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${BADGES_FILE}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" }
        });
        if (!res.ok) return null;
        const file: GitHubFileResponse = await res.json();
        const content = atob(file.content.replace(/\n/g, ""));
        const data = JSON.parse(content);
        return { data, sha: file.sha };
    } catch (e) {
        return null;
    }
}

async function updateBadgesFile(token: string, data: { owner: string[]; helped: string[] }, sha: string): Promise<boolean> {
    try {
        const content = btoa(JSON.stringify(data, null, 2));
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${BADGES_FILE}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Update owner badges: ${data.helped.length} helped build`,
                content,
                sha
            })
        });
        return res.ok;
    } catch (e) {
        return false;
    }
}

export function OwnerBadgeManager({ githubToken }: { githubToken: string }) {
    const [helped, setHelped] = useState<string[]>(() => getOwnerBadgeData().helped);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const searchResults = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        return UserStore.filter((u: any) => u.username.toLowerCase().includes(q)).slice(0, 10);
    }, [searchQuery]);

    async function refreshData() {
        setLoading(true);
        await fetchOwnerBadges();
        setHelped(getOwnerBadgeData().helped);
        setLoading(false);
        setStatus("Veriler yenilendi");
        setTimeout(() => setStatus(""), 2000);
    }

    async function grantBadge(userId: string) {
        if (!githubToken) { setStatus("GitHub token gerekli"); return; }
        setLoading(true);
        const file = await getBadgesFile(githubToken);
        if (!file) { setStatus("Dosya okunamadi"); setLoading(false); return; }
        if (file.data.helped.includes(userId)) { setStatus("Zaten badge var"); setLoading(false); return; }
        file.data.helped = [...file.data.helped, userId];
        const ok = await updateBadgesFile(githubToken, file.data, file.sha);
        if (ok) {
            setHelped(file.data.helped);
            setStatus("Badge verildi! 5 dk icinde tum istemciler gorecek.");
        } else {
            setStatus("Guncelleme basarisiz");
        }
        setLoading(false);
        setTimeout(() => setStatus(""), 3000);
    }

    async function revokeBadge(userId: string) {
        if (!githubToken) { setStatus("GitHub token gerekli"); return; }
        setLoading(true);
        const file = await getBadgesFile(githubToken);
        if (!file) { setStatus("Dosya okunamadi"); setLoading(false); return; }
        file.data.helped = file.data.helped.filter((id: string) => id !== userId);
        const ok = await updateBadgesFile(githubToken, file.data, file.sha);
        if (ok) {
            setHelped(file.data.helped);
            setStatus("Badge kaldirildi!");
        } else {
            setStatus("Guncelleme basarisiz");
        }
        setLoading(false);
        setTimeout(() => setStatus(""), 3000);
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
                <Span weight="medium" size="md">Kullanici Ara (ad veya ID)</Span>
                <TextInput
                    placeholder="kullanici_adi veya 123456789012345678"
                    value={searchQuery}
                    onChange={value => setSearchQuery(value)}
                />
                {searchQuery.trim().length > 0 && (
                    <div className={cl("user-results")}>
                        {searchResults.length === 0
                            ? <Span size="sm" className={cl("muted")}>Kullanici bulunamadi.</Span>
                            : searchResults.map((user: any) => (
                                <Button
                                    key={user.id}
                                    size="small"
                                    variant="secondary"
                                    onClick={() => { setSelectedUserId(user.id); setSearchQuery(""); }}
                                >
                                    {user.username} ({user.id})
                                </Button>
                            ))}
                    </div>
                )}
            </div>

            {selectedUserId && (
                <Flex flexDirection="column" gap={8} className={cl("selected")}>
                    <Span weight="medium" size="md">Secili Kullanici: {selectedUserId}</Span>
                    <Flex gap={8}>
                        <Button size="small" variant="primary" onClick={() => grantBadge(selectedUserId)} disabled={loading}>
                            Helped Build Rozeti Ver
                        </Button>
                        <Button size="small" variant="dangerSecondary" onClick={() => revokeBadge(selectedUserId)} disabled={loading}>
                            Rozeti Kaldir
                        </Button>
                    </Flex>
                </Flex>
            )}

            <div className={cl("list")}>
                <Span weight="medium" size="md">Mevcut "Helped Build Devcord" rozetli kullanicilar ({helped.length})</Span>
                {helped.length === 0
                    ? <Paragraph className={cl("muted")}>Henuz kimse yok.</Paragraph>
                    : helped.map((id: string) => (
                        <Flex key={id} gap={8} alignItems="center" className={cl("list-item")}>
                            <Span size="sm">{id}</Span>
                            <Button size="small" variant="dangerSecondary" onClick={() => revokeBadge(id)} disabled={loading}>
                                Kaldir
                            </Button>
                        </Flex>
                    ))}
            </div>
        </Flex>
    );
}
