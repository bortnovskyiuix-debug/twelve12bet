#!/usr/bin/env python3
"""1xBet Poker bot: welcome message with custom emoji.

No dependencies (Python 3.9+ stdlib only).

  BOT_TOKEN=... OWNER_ID=... python3 bot.py setup   # one time: creates the custom emoji pack
  BOT_TOKEN=... python3 bot.py run                    # long polling, answers /start

Env:
  BOT_TOKEN   bot token from @BotFather
  OWNER_ID    your Telegram user id (the pack is created on your account; needed only for setup)
  PLAY_URL    Mini App url (default: the GitHub Pages build of the demo)
"""
import json, os, sys, time, uuid, urllib.request, urllib.error

TOKEN = os.environ.get("BOT_TOKEN", "")
OWNER_ID = os.environ.get("OWNER_ID", "")
PLAY_URL = os.environ.get("PLAY_URL", "https://bortnovskyiuix-debug.github.io/twelve12bet/1xbet/tg/")
HERE = os.path.dirname(os.path.abspath(__file__))
EMOJI_DIR = os.path.join(HERE, "emoji")
IDS_FILE = os.path.join(HERE, "emoji_ids.json")
CACHE_FILE = os.path.join(HERE, ".cache.json")
WELCOME_VIDEO = os.path.join(HERE, "welcome.mp4")

# name -> fallback emoji (shown where custom emoji can't render: notifications, previews)
EMOJI = [("logo", "🔵"), ("spade", "♠️"), ("heart", "♥️"), ("chip", "🪙"),
         ("cards", "🃏"), ("trophy", "🏆"), ("bolt", "⚡"), ("play", "▶️")]
FALLBACK = dict(EMOJI)

WELCOME = """{logo} <b>Welcome to 1xBet Poker</b>

{spade} Real tables, real action. Right inside Telegram.

{cards} <b>NLH · PLO</b>: cash tables 24/7
{bolt} <b>Spin &amp; Go</b>: fast 3-max jackpot games
{trophy} Tournaments with guaranteed prize pools
{chip} Welcome bonus for new players

{play} Tap <b>Play now</b> and take your seat."""

BUTTON_TEXT = "Play now"


# ---------- Telegram API ----------
def api(method, params=None, files=None):
    url = f"https://api.telegram.org/bot{TOKEN}/{method}"
    params = params or {}
    if files:
        boundary = uuid.uuid4().hex
        body = b""
        for k, v in params.items():
            if not isinstance(v, str):
                v = json.dumps(v, ensure_ascii=False)
            body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n").encode()
        for field, path in files.items():
            with open(path, "rb") as f:
                data = f.read()
            body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"; "
                     f"filename=\"{os.path.basename(path)}\"\r\nContent-Type: application/octet-stream\r\n\r\n").encode()
            body += data + b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        req = urllib.request.Request(url, body, {"Content-Type": f"multipart/form-data; boundary={boundary}"})
    else:
        req = urllib.request.Request(url, json.dumps(params).encode(), {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=70) as r:
            res = json.load(r)
    except urllib.error.HTTPError as e:
        res = json.load(e)
    if not res.get("ok"):
        raise RuntimeError(f"{method}: {res.get('description')}")
    return res["result"]


def load(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ---------- setup: custom emoji pack ----------
def setup():
    if not OWNER_ID:
        sys.exit("Set OWNER_ID (your Telegram user id). Get it from @userinfobot.")
    me = api("getMe")
    set_name = f"x1poker_by_{me['username']}"
    try:
        pack = api("getStickerSet", {"name": set_name})
        print("Pack already exists:", set_name)
    except RuntimeError:
        stickers, files = [], {}
        for i, (name, fb) in enumerate(EMOJI):
            files[f"f{i}"] = os.path.join(EMOJI_DIR, f"{name}.png")
            stickers.append({"sticker": f"attach://f{i}", "format": "static", "emoji_list": [fb.replace("️", "")]})
        api("createNewStickerSet", {
            "user_id": OWNER_ID, "name": set_name, "title": "1xBet Poker",
            "sticker_type": "custom_emoji", "stickers": stickers,
        }, files)
        pack = api("getStickerSet", {"name": set_name})
        print("Pack created: https://t.me/addemoji/" + set_name)
    ids = {name: st["custom_emoji_id"] for (name, _), st in zip(EMOJI, pack["stickers"])}
    save(IDS_FILE, ids)
    print("Saved", IDS_FILE)
    menu_button()


def menu_button():
    try:
        api("setChatMenuButton", {"menu_button": {"type": "web_app", "text": "Play", "web_app": {"url": PLAY_URL}}})
    except RuntimeError as e:
        print("Menu button:", e)


# ---------- welcome ----------
def emoji_html(ids):
    out = {}
    for name, fb in EMOJI:
        out[name] = f'<tg-emoji emoji-id="{ids[name]}">{fb}</tg-emoji>' if name in ids else fb
    return out


def send_welcome(chat_id):
    ids = load(IDS_FILE, {})
    caption = WELCOME.format(**emoji_html(ids))
    button = {"text": BUTTON_TEXT, "web_app": {"url": PLAY_URL}}
    if "play" in ids:
        button["icon_custom_emoji_id"] = ids["play"]
    params = {"chat_id": chat_id, "caption": caption, "parse_mode": "HTML",
              "reply_markup": {"inline_keyboard": [[button]]}}
    cache = load(CACHE_FILE, {})
    try:
        if cache.get("video_id"):
            api("sendAnimation", {**params, "animation": cache["video_id"]})
        else:
            msg = api("sendAnimation", params, {"animation": WELCOME_VIDEO})
            vid = (msg.get("animation") or msg.get("video") or msg.get("document") or {}).get("file_id")
            if vid:
                save(CACHE_FILE, {"video_id": vid})
    except RuntimeError as e:
        # Custom emoji need Telegram Premium on the bot owner's account; if Telegram refuses,
        # resend with plain emoji so the user still gets the welcome.
        print("welcome failed, retrying with plain emoji:", e)
        button.pop("icon_custom_emoji_id", None)
        params["caption"] = WELCOME.format(**FALLBACK)
        if cache.get("video_id"):
            api("sendAnimation", {**params, "animation": cache["video_id"]})
        else:
            api("sendAnimation", params, {"animation": WELCOME_VIDEO})


def run():
    print("Bot is running. Ctrl+C to stop.")
    offset = 0
    while True:
        try:
            updates = api("getUpdates", {"offset": offset, "timeout": 50, "allowed_updates": ["message"]})
        except Exception as e:
            print("getUpdates:", e)
            time.sleep(3)
            continue
        for u in updates:
            offset = u["update_id"] + 1
            msg = u.get("message") or {}
            if (msg.get("text") or "").split("@")[0].split(" ")[0] == "/start":
                try:
                    send_welcome(msg["chat"]["id"])
                except Exception as e:
                    print("send_welcome:", e)


if __name__ == "__main__":
    if not TOKEN:
        sys.exit("Set BOT_TOKEN.")
    cmd = sys.argv[1] if len(sys.argv) > 1 else "run"
    {"setup": setup, "run": run, "test": lambda: send_welcome(int(sys.argv[2]))}.get(cmd, run)()
