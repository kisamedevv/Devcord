/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** Feed it keys as they're pressed. It calls onMatch whenever the latest ones are the sequence, whatever came before */
export function createKeySequence(sequence: string[], onMatch: () => void) {
    const len = sequence.length;
    if (len === 0) return (_key: string) => { };

    // A rolling buffer of the last `len` keys, written in place so a keystroke allocates nothing.
    const recent = new Array<string>(len);
    let pos = 0;
    let filled = 0;

    return (key: string) => {
        recent[pos] = key;
        pos = (pos + 1) % len;
        if (filled < len) filled++;

        if (filled !== len) return;

        // The oldest key now sits at `pos`; check the buffer against the sequence without allocating.
        for (let i = 0; i < len; i++) {
            if (recent[(pos + i) % len] !== sequence[i]) return;
        }

        filled = 0;
        pos = 0;
        onMatch();
    };
}
