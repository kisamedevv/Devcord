/*
 * Endcord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ConfirmModal, openModal } from "@webpack/common";

interface ConfirmActionOptions {
    title: string;
    subtitle: string;
    confirmText: string;
    onConfirm?(): void | Promise<void>;
}

export function confirmAction({ title, subtitle, confirmText, onConfirm }: ConfirmActionOptions) {
    return new Promise<boolean>(resolve => {
        openModal(modalProps => (
            <ConfirmModal
                {...modalProps}
                variant="critical-primary"
                title={title}
                subtitle={subtitle}
                confirmText={confirmText}
                cancelText="Cancel"
                onConfirm={() => {
                    resolve(true);
                    onConfirm?.();
                }}
                onCancel={() => resolve(false)}
            />
        ));
    });
}
