# Devcord

**Türkçe** | [English](#english)

Devcord, resmi Discord istemcisine yüklenen bir istemci modudur. 400'ten fazla eklenti, tema desteği, kaynak sınırı (RAM/CPU tavanı), oyun modu ve kendi ayar paneli ile Discord'u sizin kurallarınızla genişletir. Vencord fork'udur.

> **Uyarı:** İstemci modları Discord'un kullanım şartlarına aykırıdır. Kullanım riski size aittir.

## Özellikler

- 400+ yerleşik eklenti (sohbet, ses, görünüm, gizlilik, geliştirici araçları)
- Tema stüdyosu ve tema kütüphanesi
- **Kaynak sınırı**: RAM ve CPU için kullanıcı tarafından ayarlanan tavan; aşıldığında Devcord daha az çizim yapar, animasyonları durdurur ve önbellek belleğini geri verir
- **Oyun modu**: oyun çalışırken Discord 15 FPS'e düşer, animasyonlar durur, bellek geri verilir
- Gizli ve güvenli: tüm işlemler yerel makinede, hiçbir veri dışarı gönderilmez
- Türkçe, İngilizce, Rusça, İspanyolca, Fransızca dil desteği
- Discord sunucumuz: https://discord.gg/7gzKucpGBD

## Hızlı kurulum (Windows)

PowerShell'i **Yönetici olarak** açın ve şunu çalıştırın:

```powershell
irm https://raw.githubusercontent.com/kisamedevv/Devcord/main/install.ps1 | iex
```

Kurulum Discord'u kapatır, Devcord'u derler ve seçtiğiniz Discord kurulumuna (Stable/PTB/Canary) enjekte eder.

## Elle kurulum

1. [Node.js 22+](https://nodejs.org) ve [pnpm](https://pnpm.io) kurun.
2. Depoyu klonlayın:
   ```sh
   git clone https://github.com/kisamedevv/Devcord.git
   cd Devcord
   ```
3. Bağımlılıkları kurun ve derleyin:
   ```sh
   pnpm install
   pnpm build --standalone
   ```
4. Enjekte edin:
   ```sh
   node scripts/install-desktop.mjs --install --all
   ```
5. Discord'u yeniden başlatın.

`pnpm uninject` yerel kurulumu kaldırır. `pnpm watch` düzenleme sırasında yeniden derler.

## Kaldırma

Kurulumu geri almak için:
```sh
node scripts/install-desktop.mjs --uninstall --all
```
Orijinal `app.asar` geri konur. Devcord ayarlarınız diskte kalır.

## Geliştirme

```sh
pnpm build --dev      # hızlı geliştirme derlemesi
pnpm test             # tsc + lint + testler
pnpm watch            # izleme modu
```

## Lisans

GPL-3.0-or-later. © 2026 Devcord contributors. Discord, Inc.'ın markasıdır; Devcord bağımsız bir projedir.

---

<a id="english"></a>

# English

Devcord is a client mod for the official Discord desktop app. It adds 400+ plugins, themes, a user-set RAM/CPU ceiling, game mode and its own settings panel — Discord on your terms. Fork of Vencord.

> **Warning:** Client mods violate Discord's Terms of Service. Use at your own risk.

## Features

- 400+ built-in plugins (chat, voice, appearance, privacy, developer tools)
- Theme studio and theme library
- **Resource limit**: a user-set RAM/CPU ceiling; when exceeded Devcord redraws less often, pauses animations and gives cached memory back
- **Game mode**: while a game runs Discord drops to 15 FPS, pauses animations and frees memory
- Private and safe: everything runs locally, nothing is sent anywhere
- Turkish, English, Russian, Spanish, French
- Discord server: https://discord.gg/7gzKucpGBD

## Quick install (Windows)

Open **PowerShell as Administrator** and run:

```powershell
irm https://raw.githubusercontent.com/kisamedevv/Devcord/main/install.ps1 | iex
```

The installer closes Discord, builds Devcord and injects it into the Discord installs you pick (Stable/PTB/Canary).

## Manual install

1. Install [Node.js 22+](https://nodejs.org) and [pnpm](https://pnpm.io).
2. Clone the repo:
   ```sh
   git clone https://github.com/kisamedevv/Devcord.git
   cd Devcord
   ```
3. Install dependencies and build:
   ```sh
   pnpm install
   pnpm build --standalone
   ```
4. Inject:
   ```sh
   node scripts/install-desktop.mjs --install --all
   ```
5. Restart Discord.

`pnpm uninject` removes the local install. `pnpm watch` rebuilds while you edit.

## Uninstall

```sh
node scripts/install-desktop.mjs --uninstall --all
```

The original `app.asar` is restored. Your Devcord settings stay on disk.

## Development

```sh
pnpm build --dev      # fast dev build
pnpm test             # tsc + lint + tests
pnpm watch            # watch mode
```

## License

GPL-3.0-or-later. © 2026 Devcord contributors. Discord is a trademark of Discord, Inc.; Devcord is an independent project.
