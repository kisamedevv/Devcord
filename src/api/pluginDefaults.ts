/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// A settings file records every plugin as on or off, so turning a plugin on by default never reaches anyone who already
// has one. These get turned on once instead, which leaves them off for good if the person turns them off afterwards.
// Add the plugin under a new version whenever an existing plugin becomes on by default. Keeping one list per version
// means an upgrade never turns a plugin back on that someone deliberately turned off in an earlier one.
const DEFAULTS_VERSION = 2;
const NEW_DEFAULTS: Record<number, string[]> = {
    1: ["DevcordToolbox", "ThemeLibrary"],
    2: ["GameMode"]
};

interface StoredSettings {
    pluginDefaultsVersion: number;
    plugins: Record<string, { enabled: boolean; }>;
}

export function applyNewPluginDefaults(settings: StoredSettings) {
    const from = settings.pluginDefaultsVersion ?? 0;
    if (from >= DEFAULTS_VERSION) return;

    settings.plugins ??= {};

    for (let version = from + 1; version <= DEFAULTS_VERSION; version++) {
        for (const name of NEW_DEFAULTS[version] ?? []) {
            settings.plugins[name] ??= { enabled: false };
            settings.plugins[name].enabled = true;
        }
    }

    settings.pluginDefaultsVersion = DEFAULTS_VERSION;
}
