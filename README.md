# Endcord

A Discord client mod, forked from [Vencord](https://github.com/Vendicated/Vencord) and rebranded end to end.
Everything that ships as `Endcord` in this repository — package names, globals, build output, data directory,
user plugin folder, installer, UI strings — is Endcord. No leftover `vencord` identifiers.

```
Data dir      : %appdata%/Endcord        (~/.config/Endcord on Linux)
User plugins  : <data dir>/userplugins
Build output  : dist/
```

## Install (Windows, one click)

Double-click `inject.bat`. It checks dependencies, builds, injects into every installed Discord
channel it finds, copies the bundled theme into `%appdata%/Endcord/themes` and enables it.

```
inject.bat            full: deps + build + inject + theme
inject.bat quick      inject + theme only (no rebuild)
inject.bat uninstall  remove the injection
```

Then restart Discord. The window title reads **Endcord**, the theme is **Endcord Soft**.

Injection is a folder (`resources/app`) — Electron loads it before `app.asar`, so Discord's own
`app.asar` is never modified and a Discord update cannot corrupt the install. Either way, re-run
`inject.bat` after a Discord update to point the loader at the new `app-x.y.z` folder.

## Install (from source)

```bash
corepack pnpm install
corepack pnpm build --standalone   # build only
node scripts/install-desktop.mjs --install    # inject (add --all for PTB/Canary too)
node scripts/install-theme.mjs                # theme + default plugins
```

After injecting, start Discord. Settings → Endcord Settings to configure plugins.

## What's in the box

Everything upstream Vencord ships, plus three plugins written for this fork:

### EndcordBadges — custom badges, with icons

Give any user a badge with an icon and colour of your choice. Fully local: badges live in your
Endcord settings, are rendered client-side on profiles, and never leave your machine.

* 22 Discord rozeti (Active Developer, Early Supporter, Nitro, HypeSquad, Bug Hunter, Boosting
  1/2/3/6/9/12/15/18/24 months, Staff, Certified Moderator, Partnered Server Owner,
  Early Verified Developer) — PNG olarak gömülür, çalışma anında ağ isteği yok.
* 20 sade SVG ikon (taç, yıldız, kalp, elmas, alev, şimşek, yaprak, ay, kafatası, kedi,
  kalkan, parıltı, hayalet, roket, kılıç, kahve, müzik, pati, göz, şef) — renk seçiciyle boyanır.
* Herhangi bir `https://` veya `data:` görsel URL'i özel ikon olarak da kullanılabilir.
* Per-badge colour picker plus a preset palette.
* Assign badges by Discord user ID (comma separated) or by searching the username in the editor.
  `*` gives the badge to everyone.
* **Right-click a user → "Endcord Rozeti Ver"** opens a picker: give or take any badge, or create
  a new one for that user on the spot.
* Optional display in the member list and next to names in chat.
* Export/import as JSON so you can back up or share a badge set.

How to use:

1. Settings → Plugins → EndcordBadges.
2. Press **Add badge**, name it, pick an icon and colour.
3. Press **Add me** to put your own ID in (or paste IDs manually).
4. Open your profile — the badge is there.

Or right-click any user and pick **Endcord Rozeti Ver**.

Badges are client-side only. Other people only see them if they run Endcord with the same badge set.

### Oneko — the cursor cat

A little cat that chases your mouse around the window. Size, speed, colour and follow distance
are configurable. Pure DOM/CSS, no patches.

### AccountAge — snowflake account age

Adds an entry to the user context menu showing when an account was created (decoded from the
snowflake ID), plus how old it is. Click it to copy the ISO timestamp.

### EndcordQuickCopy — ID / mention / creation date

Right-click any user and copy their ID, their `@mention` or their account creation date in one
click.

### EndcordGlass — soft screen transitions

Every view (channel switch, guild pages, modals, popouts) fades in softly instead of popping —
duration is a slider. The optional backdrop blur is **off by default**; raise the blur slider if
you want the frosted look back.

### EndcordEyeCare — less strain, less icon

Discord dialled down for long sessions:

* animations and transitions cut to a minimum (the standard reduced-motion recipe) — the single
  biggest CPU/GPU win
* icons, emoji and avatars scaled down, so the interface reads quieter
* softer text ramp, dimmed separators, no drop shadows
* performance mode drops backdrop filters, shadows and server background images
* optional `content-visibility` for very long channels

### EndcordCustomProfile — fake profile, Endcord-only

Fake display name, fake badges and a fake account creation date.

* every badge from `github.com/merlinfuchs/discord-badges` is selectable
* the fake creation date also shows in the AccountAge context menu entry
* **sharing**: the profile is written into your bio as invisible characters (27 invisible code
  points, ~4.75 bits each). A normal Discord client sees an empty bio; an Endcord client decodes
  it and renders your fake name, badges and date. So the fake identity is only ever seen by people
  running Endcord

### EndcordAppearance — live glass tuning

Sliders for panel opacity and backdrop blur plus a hex field for the accent colour. The theme
file is never touched; the plugin overrides the theme's variables live.

### EndcordTitle — window and tab name

Keeps Discord's window title (taskbar, alt-tab, browser tab) as **Endcord** instead of "Discord".
The unread counter is preserved — `(3) Endcord`. Text and counter are both configurable.

## Endcord Soft theme

`themes/endcord-soft.theme.css` — a quiet blue-black glass theme built for Windows 11:

* translucent panels over the desktop, hairline borders instead of heavy outlines
* single muted accent (`#6c8cff`) instead of Discord's saturated brand blue
* low-contrast, eye-friendly text ramp; softer scrollbars and selection colour
* every surface derives from one alpha (`--ecs-alpha`), so the whole theme can be turned
  more or less transparent in one place

**The theme is applied before Discord's own CSS loads.** The preload script asks the main
process for the enabled themes and injects them into `document.head` before the first paint, so
there is no flash of the default theme while Discord boots.

**Full transparency.** The installer sets `transparent: true` and `windowsMaterial: "acrylic"` in
the settings file, so the window itself is see-through and Win11's acrylic blur shows behind the
panels — including the empty space when the window is not maximised. Toggle it any time in
Endcord Settings → "Enable window transparency" / "Background Material".

It is copied into the themes folder and enabled by `inject.bat` / `scripts/install-theme.mjs`.
Tweak the `--ecs-*` tokens at the top of the file to shift the tone, or use the
**EndcordAppearance** plugin to change opacity, blur and accent live.

## Notes on Kernixcord

A handful of plugin *ideas* were taken from
[kanvekin/Kernixcord](https://github.com/kanvekin/Kernixcord) as reference only — badges
(`BadgesSelector`/`clientSideBadges`/`showBadgesInChat`), the cursor cat (`oneko`) and the user ID
tool (`idTranslater`). None of its code was imported, copied or vendored: this fork treats that
repository as untrusted, so every plugin here was written from scratch against Endcord's own
plugin APIs. That is why there is no remote plugin loader in this build — loading arbitrary code
from an untrusted repository is exactly the attack surface worth avoiding.

**Every plugin Kernixcord ships is already in Endcord.** Kernixcord is a Vencord fork: its plugin
list is Vencord's list, and Endcord bundles all of it. The only Kernixcord-exclusive piece is
`kernixcordRemoteLoader`, which fetches a manifest from GitHub and injects the URLs it returns as
`<script>` tags — i.e. it executes whatever the network hands it, at runtime, in the renderer. That
specific mechanism is not going into this build.

The convenience it offered is available here in a shape you can inspect: drop a plugin folder in
and it gets compiled into the build, from disk, with nothing fetched at runtime.

```bash
node scripts/add-plugin.mjs <eklenti-klasörü> [--rebuild]
node scripts/add-plugin.mjs --list
node scripts/add-plugin.mjs --remove <ad>
```

Plugins land in `src/userplugins/` (a first-class folder the build already globs), so you can read
every line that is about to run before you build.

## Structure

```
src/
  api/            public plugin APIs (badges, chat buttons, context menus, settings, ...)
  components/     shared React components
  main/           Electron main process (patcher, CSP, updater, settings)
  plugins/        every bundled plugin
  plugins/endcordBadges/   icons.tsx · store.ts · settings.tsx · picker.tsx · index.tsx · styles.css
  plugins/endcordAppearance/
  plugins/endcordCustomProfile/   payload.ts · profile.ts · settings.tsx · index.tsx
  plugins/endcordEyeCare/
  plugins/endcordGlass/
  plugins/endcordQuickCopy/
  plugins/endcordTitle/
  plugins/oneko/
  plugins/accountAge/    index.tsx · overrides.ts
  userplugins/      drop-in plugins compiled into the build (see scripts/add-plugin.mjs)
  webpack/        module finder + patcher
packages/         @endcord/discord-types, @endcord/types
scripts/          build pipeline + installer
  install-desktop.mjs   Discord injector (asar swap, original kept as _app.asar)
  install-theme.mjs     themes + default plugin enablement
  add-plugin.mjs        install a plugin folder into src/userplugins
  generateBadgeIcons.mjs  PNG rozetleri data URI tablosuna çevirir
themes/           bundled themes (Endcord Soft)
assets/           bundled badge PNGs (github.com/merlinfuchs/discord-badges)
inject.bat        Windows one-click install
```

## Adding your own plugin

Drop a folder into `src/plugins/<name>/` (or `<data dir>/userplugins/<name>/` for a private one)
with an `index.tsx` exporting `definePlugin({ ... })`. See `.skills/authoring-plugins.md` and any
existing plugin for the shape.

## License

GPL-3.0-or-later. Endcord is a fork of Vencord, Copyright (c) 2022 Vendicated and contributors;
the original copyright notices are kept in every file.
