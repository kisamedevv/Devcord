"""
Devcord Discord sunucusu kurulum scripti.

Kullanim:
    DISCORD_BOT_TOKEN=... GUILD_ID=... python scripts/create_devcord_server.py

Not:
    Discord botlari yeni bir guild (sunucu) olusturamaz. Bu script mevcut bir
    sunucuyu (GUILD_ID) Devcord topluluk yapisina gore duzenler: roller,
    kategoriler ve kanallar olusturur. Sunucuyu once Discord uzerinden elle
    olusturup botu yönetici yetkisiyle ekleyin.
"""

import os
import sys

try:
    import discord
    from discord import PermissionOverwrite
except ImportError:
    print("discord.py kurulu degil. Kurmak icin: pip install discord.py")
    sys.exit(1)


TOKEN = os.getenv("DISCORD_BOT_TOKEN")
GUILD_ID = os.getenv("GUILD_ID")

if not TOKEN or not GUILD_ID:
    print("DISCORD_BOT_TOKEN ve GUILD_ID ortam degiskenleri gerekli.")
    sys.exit(1)

GUILD_ID = int(GUILD_ID)


ROLES = [
    ("Devcord Owner", 0xFFD700, True),
    ("Admin", 0xE74C3C, True),
    ("Moderator", 0x3498DB, True),
    ("Helper", 0x2ECC71, True),
    ("Member", 0x95A5A6, False),
    ("Bot", 0x9B59B6, False),
]


CATEGORIES = {
    "Bilgi": [
        ("duyurular", "text", "Resmi Devcord duyurulari."),
        ("kurallar", "text", "Sunucu kurallari."),
        ("hos-geldin", "text", "Yeni uyeler icin karsilama kanali."),
    ],
    "Genel": [
        ("genel", "text", "Genel sohbet."),
        ("medya", "text", "Gorsel, video ve link paylasimi."),
        ("komutlar", "text", "Bot komutlari."),
    ],
    "Destek": [
        ("destek", "text", "Yardim ve sorular."),
        ("hata-bildirimi", "text", "Bug raporlari."),
        ("oneriler", "text", "Ozellik onerileri."),
    ],
    "Gelistirme": [
        ("gelistirme", "text", "Gelistirme notlari."),
        ("surum-notlari", "text", "Yeni surum ve degisiklikler."),
        ("kaynak-kodu", "text", "Kaynak kod ve PR tartismalari."),
    ],
    "Ses": [
        ("genel-ses", "voice", "Genel ses kanali."),
        ("yardim-sesi", "voice", "Yardim ses kanali."),
    ],
}


intents = discord.Intents.default()
intents.guilds = True
intents.members = True
client = discord.Client(intents=intents)


async def ensure_role(guild, name, color, hoist):
    for role in guild.roles:
        if role.name == name:
            return role
    return await guild.create_role(name=name, color=discord.Color(color), hoist=hoist, reason="Devcord setup")


async def ensure_category(guild, name):
    for category in guild.categories:
        if category.name == name:
            return category
    return await guild.create_category(name, reason="Devcord setup")


async def ensure_text_channel(guild, name, category, topic):
    for channel in guild.text_channels:
        if channel.name == name and channel.category == category:
            return channel
    return await guild.create_text_channel(name, category=category, topic=topic, reason="Devcord setup")


async def ensure_voice_channel(guild, name, category):
    for channel in guild.voice_channels:
        if channel.name == name and channel.category == category:
            return channel
    return await guild.create_voice_channel(name, category=category, reason="Devcord setup")


@client.event
async def on_ready():
    print(f"Bot giris yapti: {client.user}")

    guild = client.get_guild(GUILD_ID)
    if guild is None:
        print(f"Sunucu bulunamadi: {GUILD_ID}")
        await client.close()
        return

    print(f"Sunucu: {guild.name} ({guild.id})")

    # Roller
    for name, color, hoist in ROLES:
        role = await ensure_role(guild, name, color, hoist)
        print(f"  Rol hazir: {role.name}")

    # Kategoriler ve kanallar
    for category_name, channels in CATEGORIES.items():
        category = await ensure_category(guild, category_name)
        print(f"  Kategori hazir: {category.name}")
        for channel_name, channel_type, topic in channels:
            if channel_type == "text":
                channel = await ensure_text_channel(guild, channel_name, category, topic)
            else:
                channel = await ensure_voice_channel(guild, channel_name, category)
            print(f"    Kanal hazir: {channel.name}")

    # Duyurular kanalini salt-okunur yap (Member rolune mesaj yazma yetkisi yok)
    try:
        member_role = discord.utils.get(guild.roles, name="Member")
        announce = discord.utils.get(guild.text_channels, name="duyurular")
        if member_role and announce:
            overwrite = PermissionOverwrite(send_messages=False, add_reactions=True)
            await announce.set_permissions(member_role, overwrite=overwrite, reason="Devcord setup")
            print("  Duyurular kanali salt-okunur yapildi.")
    except Exception as exc:
        print(f"  Uyari: duyurular izni ayarlanamadi: {exc}")

    print("Devcord sunucu kurulumu tamamlandi.")
    await client.close()


def main():
    client.run(TOKEN)


if __name__ == "__main__":
    main()
