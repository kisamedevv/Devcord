"""
Devcord Discord server bootstrap script.

Usage:
    DISCORD_BOT_TOKEN=... GUILD_ID=... python scripts/create_devcord_server.py

Notes:
    Discord bots cannot create guilds. This script configures an existing
    guild (GUILD_ID) with Devcord community structure: roles, categories,
    channels, topics and permission overwrites.
"""

import os
import sys

try:
    import discord
    from discord import PermissionOverwrite
except ImportError:
    print("discord.py is not installed. Install with: pip install discord.py")
    sys.exit(1)


TOKEN = os.getenv("DISCORD_BOT_TOKEN")
GUILD_ID = os.getenv("GUILD_ID")

if not TOKEN or not GUILD_ID:
    print("DISCORD_BOT_TOKEN and GUILD_ID environment variables are required.")
    sys.exit(1)

GUILD_ID = int(GUILD_ID)


ROLES = [
    ("Devcord Owner", 0xFFD700, True, discord.Permissions.all()),
    ("Admin", 0xE74C3C, True, discord.Permissions(
        manage_guild=True, manage_roles=True, manage_channels=True,
        kick_members=True, ban_members=True, manage_messages=True,
        send_messages=True, view_channel=True)),
    ("Moderator", 0x3498DB, True, discord.Permissions(
        manage_messages=True, kick_members=True, ban_members=True,
        send_messages=True, view_channel=True, read_message_history=True)),
    ("Helper", 0x2ECC71, True, discord.Permissions(
        manage_messages=True, send_messages=True, view_channel=True,
        read_message_history=True, add_reactions=True)),
    ("Member", 0x95A5A6, False, discord.Permissions(
        send_messages=True, view_channel=True, read_message_history=True,
        add_reactions=True, connect=True, speak=True)),
    ("Bot", 0x9B59B6, False, discord.Permissions.all()),
]


CATEGORIES = {
    "Info": [
        ("announcements", "text", "Official Devcord announcements.", "read-only"),
        ("rules", "text", "Server rules.", "read-only"),
        ("welcome", "text", "Welcome channel for new members.", "read-only"),
    ],
    "General": [
        ("general", "text", "General chat.", "default"),
        ("media", "text", "Images, videos and links.", "default"),
        ("commands", "text", "Bot commands.", "default"),
    ],
    "Support": [
        ("support", "text", "Help and questions.", "default"),
        ("bug-reports", "text", "Bug reports.", "default"),
        ("suggestions", "text", "Feature suggestions.", "default"),
    ],
    "Development": [
        ("development", "text", "Development notes.", "default"),
        ("release-notes", "text", "New releases and changelogs.", "read-only"),
        ("source-code", "text", "Source code and PR discussion.", "default"),
    ],
    "Voice": [
        ("general-voice", "voice", None, "default"),
        ("help-voice", "voice", None, "default"),
    ],
}


intents = discord.Intents.default()
intents.guilds = True
intents.members = True
client = discord.Client(intents=intents)


async def ensure_role(guild, name, color, hoist, permissions):
    for role in guild.roles:
        if role.name == name:
            await role.edit(color=discord.Color(color), hoist=hoist, permissions=permissions,
                            reason="Devcord setup")
            return role
    return await guild.create_role(
        name=name, color=discord.Color(color), hoist=hoist,
        permissions=permissions, reason="Devcord setup")


async def ensure_category(guild, name):
    for category in guild.categories:
        if category.name == name:
            return category
    return await guild.create_category(name, reason="Devcord setup")


async def ensure_text_channel(guild, name, category, topic, mode):
    for channel in guild.text_channels:
        if channel.name == name and channel.category == category:
            await channel.edit(topic=topic, reason="Devcord setup")
            return channel
    channel = await guild.create_text_channel(name, category=category, topic=topic,
                                             reason="Devcord setup")
    return channel


async def ensure_voice_channel(guild, name, category):
    for channel in guild.voice_channels:
        if channel.name == name and channel.category == category:
            return channel
    return await guild.create_voice_channel(name, category=category, reason="Devcord setup")


async def apply_channel_permissions(channel, mode, everyone_role, member_role, helper_role, moderator_role):
    if mode == "read-only":
        # @everyone ve Member rolü mesaj yazamasin; sadece okuyabilsin
        if everyone_role is not None:
            await channel.set_permissions(everyone_role, send_messages=False, add_reactions=True,
                                         reason="Devcord setup")
        if member_role is not None:
            await channel.set_permissions(member_role, send_messages=False, add_reactions=True,
                                         reason="Devcord setup")
    if mode == "default":
        if everyone_role is not None:
            await channel.set_permissions(everyone_role, send_messages=True, view_channel=True,
                                         reason="Devcord setup")
        if helper_role is not None:
            await channel.set_permissions(helper_role, manage_messages=True, reason="Devcord setup")
        if moderator_role is not None:
            await channel.set_permissions(moderator_role, manage_messages=True, reason="Devcord setup")


OLD_CATEGORY_MAP = {
    "Bilgi": "Info",
    "Genel": "General",
    "Destek": "Support",
    "Gelistirme": "Development",
    "Ses": "Voice",
}

OLD_CHANNEL_MAP = {
    "duyurular": "announcements",
    "kurallar": "rules",
    "hos-geldin": "welcome",
    "genel": "general",
    "medya": "media",
    "komutlar": "commands",
    "destek": "support",
    "hata-bildirimi": "bug-reports",
    "oneriler": "suggestions",
    "gelistirme": "development",
    "surum-notlari": "release-notes",
    "kaynak-kodu": "source-code",
    "genel-ses": "general-voice",
    "yardim-sesi": "help-voice",
}


async def cleanup_old_names(guild):
    for category in list(guild.categories):
        if category.name in OLD_CATEGORY_MAP:
            new_name = OLD_CATEGORY_MAP[category.name]
            if discord.utils.get(guild.categories, name=new_name) is None:
                await category.edit(name=new_name, reason="Devcord cleanup")
                print(f"  Category renamed: {category.name} -> {new_name}")
            else:
                await category.delete(reason="Devcord cleanup")
                print(f"  Old category deleted: {category.name}")

    for channel in list(guild.channels):
        if channel.name in OLD_CHANNEL_MAP:
            new_name = OLD_CHANNEL_MAP[channel.name]
            if discord.utils.get(guild.channels, name=new_name) is None:
                await channel.edit(name=new_name, reason="Devcord cleanup")
                print(f"  Channel renamed: {channel.name} -> {new_name}")
            else:
                await channel.delete(reason="Devcord cleanup")
                print(f"  Old channel deleted: {channel.name}")


@client.event
async def on_ready():
    print(f"Bot logged in as: {client.user}")

    guild = client.get_guild(GUILD_ID)
    if guild is None:
        print(f"Guild not found: {GUILD_ID}")
        await client.close()
        return

    print(f"Guild: {guild.name} ({guild.id})")

    await cleanup_old_names(guild)

    # Roles
    roles = {}
    for name, color, hoist, permissions in ROLES:
        role = await ensure_role(guild, name, color, hoist, permissions)
        roles[name] = role
        print(f"  Role ready: {role.name}")

    everyone_role = guild.default_role
    member_role = roles.get("Member")
    helper_role = roles.get("Helper")
    moderator_role = roles.get("Moderator")

    # Categories and channels
    for category_name, channels in CATEGORIES.items():
        category = await ensure_category(guild, category_name)
        print(f"  Category ready: {category.name}")
        for channel_name, channel_type, topic, mode in channels:
            if channel_type == "text":
                channel = await ensure_text_channel(guild, channel_name, category, topic, mode)
            else:
                channel = await ensure_voice_channel(guild, channel_name, category)
            await apply_channel_permissions(channel, mode, everyone_role, member_role, helper_role, moderator_role)
            print(f"    Channel ready: {channel.name}")

    print("Devcord server setup completed.")
    await client.close()


def main():
    client.run(TOKEN)


if __name__ == "__main__":
    main()
