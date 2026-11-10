# Endcord

A Discord client mod, forked from [Vencord](https://github.com/Vendicated/Vencord) and rebranded end to end.
Everything that ships as `Endcord` in this repository — package names, globals, build output, data directory,
user plugin folder, installer, UI strings — is Endcord. No leftover `vencord` identifiers.

```
Data dir      : %appdata%/Endcord        (~/.config/Endcord on Linux)
User plugins  : <data dir>/userplugins
Build output  : dist/
```

## Install (from source)

```bash
corepack pnpm install
corepack pnpm build          # build + inject into your Discord install
corepack pnpm build --standalone   # build only, no injection
```

After injecting, start Discord. Settings → Endcord Settings to configure plugins.

## What's in the box

Everything upstream Vencord ships, plus three plugins written for this fork:

### EndcordBadges — custom badges, with icons

Give any user a badge with an icon and colour of your choice. Fully local: badges live in your
Endcord settings, are rendered client-side on profiles, and never leave your machine.

* 20 built-in icons (crown, star, heart, gem, flame, bolt, leaf, moon, skull, cat, shield,
  sparkle, ghost, rocket, sword, coffee, music, paw, eye, chef) drawn as inline SVG — no network,
  no CDN, no CSP holes.
* Any `https://` or `data:` image URL works as a custom icon too.
* Per-badge colour picker plus a preset palette.
* Assign badges by Discord user ID (comma separated). `*` gives the badge to everyone.
* Optional display in the member list and next to names in chat.
* Export/import as JSON so you can back up or share a badge set.

How to use:

1. Settings → Plugins → EndcordBadges.
2. Press **Add badge**, name it, pick an icon and colour.
3. Press **Add me** to put your own ID in (or paste IDs manually).
4. Open your profile — the badge is there.

Badges are client-side only. Other people only see them if they run Endcord with the same badge set.

### Oneko — the cursor cat

A little cat that chases your mouse around the window. Size, speed, colour and follow distance
are configurable. Pure DOM/CSS, no patches.

### AccountAge — snowflake account age

Adds an entry to the user context menu showing when an account was created (decoded from the
snowflake ID), plus how old it is. Click it to copy the ISO timestamp.

## Notes on Kernixcord

A handful of plugin *ideas* were taken from
[kanvekin/Kernixcord](https://github.com/kanvekin/Kernixcord) as reference only — badges
(`BadgesSelector`/`clientSideBadges`/`showBadgesInChat`), the cursor cat (`oneko`) and the user ID
tool (`idTranslater`). None of its code was imported, copied or vendored: this fork treats that
repository as untrusted, so every plugin here was written from scratch against Endcord's own
plugin APIs. That is why there is no remote plugin loader in this build — loading arbitrary code
from an untrusted repository is exactly the attack surface worth avoiding.

## Structure

```
src/
  api/            public plugin APIs (badges, chat buttons, context menus, settings, ...)
  components/     shared React components
  main/           Electron main process (patcher, CSP, updater, settings)
  plugins/        every bundled plugin
  plugins/endcordBadges/   icons.tsx · store.ts · settings.tsx · index.tsx · styles.css
  plugins/oneko/
  plugins/accountAge/
  webpack/        module finder + patcher
packages/         @endcord/discord-types, @endcord/types
scripts/          build pipeline + installer
```

## Adding your own plugin

Drop a folder into `src/plugins/<name>/` (or `<data dir>/userplugins/<name>/` for a private one)
with an `index.tsx` exporting `definePlugin({ ... })`. See `.skills/authoring-plugins.md` and any
existing plugin for the shape.

## License

GPL-3.0-or-later. Endcord is a fork of Vencord, Copyright (c) 2022 Vendicated and contributors;
the original copyright notices are kept in every file.
