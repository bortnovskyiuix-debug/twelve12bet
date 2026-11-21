"""1xBet Poker Telegram bot on Vercel (serverless, stdlib only).

POST /api/bot                    Telegram webhook: answers /start with the welcome message.
GET  /api/bot?setup=1            One-time setup (safe to repeat): custom emoji pack, webhook, menu button.

Vercel env: BOT_TOKEN, OWNER_ID, optional PLAY_URL.
"""
import hashlib, json, os, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

TOKEN = os.environ.get("BOT_TOKEN", "").strip()
OWNER_ID = os.environ.get("OWNER_ID", "").strip()
PLAY_URL = os.environ.get("PLAY_URL", "https://bortnovskyiuix-debug.github.io/twelve12bet/1xbet/tg/")
SECRET = hashlib.sha256(TOKEN.encode()).hexdigest()[:32]

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


def api(method, params=None):
    req = urllib.request.Request(f"https://api.telegram.org/bot{TOKEN}/{method}",
                                 json.dumps(params or {}).encode(), {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            res = json.load(r)
    except urllib.error.HTTPError as e:
        res = json.load(e)
    if not res.get("ok"):
        raise RuntimeError(f"{method}: {res.get('description')}")
    return res["result"]


def set_name():
    return f"x1poker_by_{api('getMe')['username']}"


def emoji_ids():
    try:
        pack = api("getStickerSet", {"name": set_name()})
        return {n: s["custom_emoji_id"] for (n, _), s in zip(EMOJI, pack["stickers"])}
    except Exception:
        return {}


def send_welcome(chat_id, host):
    ids = emoji_ids()
    tags = {n: (f'<tg-emoji emoji-id="{ids[n]}">{fb}</tg-emoji>' if n in ids else fb) for n, fb in EMOJI}
    button = {"text": BUTTON_TEXT, "web_app": {"url": PLAY_URL}}
    if "play" in ids:
        button["icon_custom_emoji_id"] = ids["play"]
    p = {"chat_id": chat_id, "animation": f"https://{host}/welcome.mp4",
         "caption": WELCOME.format(**tags), "parse_mode": "HTML",
         "reply_markup": {"inline_keyboard": [[button]]}}
    try:
        api("sendAnimation", p)
    except RuntimeError:
        # Custom emoji need Telegram Premium on the bot owner's account: fall back to plain emoji.
        button.pop("icon_custom_emoji_id", None)
        p["caption"] = WELCOME.format(**FALLBACK)
        api("sendAnimation", p)


def setup(host):
    log = []
    name = set_name()
    try:
        api("getStickerSet", {"name": name})
        log.append(f"Emoji pack already exists: t.me/addemoji/{name}")
    except RuntimeError:
        stickers = [{"sticker": f"https://{host}/emoji/{n}.png", "format": "static",
                     "emoji_list": [fb.replace("️", "")]} for n, fb in EMOJI]
        try:
            api("createNewStickerSet", {"user_id": int(OWNER_ID), "name": name, "title": "1xBet Poker",
                                        "sticker_type": "custom_emoji", "stickers": stickers})
            log.append(f"Emoji pack created: t.me/addemoji/{name}")
        except RuntimeError as e:
            log.append(f"Emoji pack NOT created ({e}). Open your bot in Telegram, press Start, then run setup again.")
    api("setWebhook", {"url": f"https://{host}/api/bot", "secret_token": SECRET,
                       "allowed_updates": ["message"], "drop_pending_updates": True})
    log.append("Webhook set")
    try:
        api("setChatMenuButton", {"menu_button": {"type": "web_app", "text": "Play", "web_app": {"url": PLAY_URL}}})
        log.append("Menu button set")
    except RuntimeError as e:
        log.append(f"Menu button: {e}")
    log.append("Done. Send /start to the bot.")
    return "\n".join(log)


class handler(BaseHTTPRequestHandler):
    def _reply(self, code, text):
        body = text.encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not TOKEN or not OWNER_ID:
            return self._reply(500, "Set BOT_TOKEN and OWNER_ID in Vercel → Settings → Environment Variables, then redeploy.")
        q = parse_qs(urlparse(self.path).query)
        if "setup" not in q:
            return self._reply(200, "1xBet Poker bot is running. Open /api/bot?setup=1 to (re)run setup.")
        try:
            self._reply(200, setup(self.headers.get("Host")))
        except Exception as e:
            self._reply(500, f"Setup failed: {e}")

    def do_POST(self):
        if self.headers.get("X-Telegram-Bot-Api-Secret-Token") != SECRET:
            return self._reply(403, "forbidden")
        try:
            n = int(self.headers.get("Content-Length") or 0)
            upd = json.loads(self.rfile.read(n) or b"{}")
            msg = upd.get("message") or {}
            text = (msg.get("text") or "").split(" ")[0].split("@")[0]
            if text == "/start":
                send_welcome(msg["chat"]["id"], self.headers.get("Host"))
        except Exception as e:
            print("update error:", e)
        self._reply(200, "ok")
