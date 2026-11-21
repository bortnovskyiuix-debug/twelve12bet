"""Second poker bot (Neon table in /1win/), served by the SITE project as /api/onewin, so it needs no project of its own.

POST /api/onewin                 Telegram webhook: answers /start with the welcome message.
GET  /api/onewin?setup=1         One-time setup (safe to repeat): custom emoji pack, webhook, menu button.

Site project env: ONEWIN_BOT_TOKEN (required), optional ONEWIN_BRAND, ONEWIN_PLAY_URL, ONEWIN_WELCOME_VIDEO, ONEWIN_OWNER_ID.
"""
import hashlib, json, os, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

TOKEN = os.environ.get("ONEWIN_BOT_TOKEN", "").strip()
OWNER_ID = os.environ.get("ONEWIN_OWNER_ID", "").strip()
OWNER_ID = OWNER_ID if OWNER_ID.isdigit() else ""   # optional: without it the pack is made on the first /start
PLAY_URL = os.environ.get("ONEWIN_PLAY_URL", "").strip()   # default: /1win/ on this same site
BRAND = os.environ.get("ONEWIN_BRAND", "Poker").strip()          # shown in the welcome text and pack title
BRAND_LOGO = "none"  # "1x" = 1X mark emoji + 1xBet banner; anything else = neutral
WELCOME_VIDEO = os.environ.get("ONEWIN_WELCOME_VIDEO", "").strip()     # optional animation URL or file_id; defaults to the 1win welcome video
LAST_ERROR = None
SECRET = hashlib.sha256(TOKEN.encode()).hexdigest()[:32]

EMOJI = [("logo", "🔵"), ("spade", "♠️"), ("heart", "♥️"), ("chip", "🪙"),
         ("cards", "🃏"), ("trophy", "🏆"), ("bolt", "⚡"), ("play", "▶️")]
FALLBACK = dict(EMOJI)

WELCOME = """{logo} <b>Welcome to {brand}</b>

{spade} Real tables, real action. Right inside Telegram.

{cards} <b>NLH · PLO</b>: cash tables 24/7
{bolt} <b>Spin &amp; Go</b>: fast 3-max jackpot games
{trophy} Tournaments with guaranteed prize pools
{chip} Welcome bonus for new players

{play} Tap <b>Play now</b> and take your seat."""
BUTTON_TEXT = "Play now"

# /post: the ready-to-forward announcement, sent with real Telegram formatting (bold, quotes, text links) and
# custom emoji from the NewsEmoji pack. Copy the message inside Telegram and the formatting comes along.
POST_PACK = "NewsEmoji"
POST = """{fire} <b>Покер, который открывается в один тап</b>

Три концепт-демо покерного стола — каждый в своём стиле.
<blockquote>Живая игра с ботами, без регистрации и загрузок.</blockquote>

{bolt} <b>1xBet</b> · классика
{web} <a href="https://twelve12bet.vercel.app/">Открыть в браузере</a>

{bolt} <b>PokerDom</b> · lounge
{web} <a href="https://twelve12bet.vercel.app/pokerdom/">Открыть в браузере</a>
{chat} <a href="https://t.me/pokedomtesprod_bot">Открыть в Telegram</a>

{bolt} <b>1win</b> · неон
{web} <a href="https://twelve12bet.vercel.app/1win/">Открыть в браузере</a>
{chat} <a href="https://t.me/onewin_poker_demo_bot">Открыть в Telegram</a>

<blockquote expandable>{spark} <b>Что внутри</b>
{ok} NL Hold’em 6-max, раздача за 3 секунды
{ok} Полный экран в Telegram
{ok} Работает с телефона и компьютера
{ok} Свой стол, карты, фишки и прелоадер под каждый бренд</blockquote>"""
POST_EMOJI = {"fire": "🔥", "bolt": "⚡", "web": "🌐", "chat": "💬", "spark": "✨", "ok": "✔️"}


def send_post(chat_id):
    ids = {}
    try:
        for st in api("getStickerSet", {"name": POST_PACK})["stickers"]:
            ids.setdefault((st.get("emoji") or "").replace("\ufe0f", ""), st["custom_emoji_id"])
    except Exception as e:
        print("post pack:", safe(e))
    rich = {k: (f'<tg-emoji emoji-id="{ids[v.replace(chr(0xfe0f), "")]}">{v}</tg-emoji>' if v.replace(chr(0xfe0f), "") in ids else v)
            for k, v in POST_EMOJI.items()}
    p = {"chat_id": chat_id, "parse_mode": "HTML", "link_preview_options": {"is_disabled": True}}
    try:
        api("sendMessage", dict(p, text=POST.format(**rich)))
    except RuntimeError:
        api("sendMessage", dict(p, text=POST.format(**POST_EMOJI)))   # no Premium on the owner's account: plain emoji



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


def safe(e):
    return str(e).replace(TOKEN, "***") if TOKEN else str(e)


def set_name():
    return f"neonpoker_by_{api('getMe')['username']}"


def pack_emoji():
    return EMOJI if BRAND_LOGO == "1x" else [e for e in EMOJI if e[0] != "logo"]


def create_pack(user_id, host):
    stickers = [{"sticker": f"https://{host}/tgbot/public/emoji/{n}.png", "format": "static",
                 "emoji_list": [fb.replace("\ufe0f", "")]} for n, fb in pack_emoji()]
    api("createNewStickerSet", {"user_id": int(user_id), "name": set_name(), "title": BRAND[:64],
                                "sticker_type": "custom_emoji", "stickers": stickers})


def emoji_ids():
    try:
        pack = api("getStickerSet", {"name": set_name()})
        return {n: s["custom_emoji_id"] for (n, _), s in zip(pack_emoji(), pack["stickers"])}
    except Exception:
        return {}


def send_welcome(chat_id, host, user_id=None):
    ids = emoji_ids()
    if not ids and user_id:
        try:
            create_pack(OWNER_ID or user_id, host)
            ids = emoji_ids()
        except Exception as e:
            print("pack:", safe(e))
    tags = {n: (f'<tg-emoji emoji-id="{ids[n]}">{fb}</tg-emoji>' if n in ids else fb) for n, fb in EMOJI}
    if BRAND_LOGO != "1x":
        tags["logo"] = tags["heart"]
    tags["brand"] = BRAND.replace("&", "&amp;").replace("<", "&lt;")
    button = {"text": BUTTON_TEXT, "web_app": {"url": PLAY_URL or f"https://{host}/1win/"}}
    if "play" in ids:
        button["icon_custom_emoji_id"] = ids["play"]
    video = WELCOME_VIDEO or f"https://{host}/tgbot/public/welcome-1win.mp4"
    p = {"chat_id": chat_id, "parse_mode": "HTML", "reply_markup": {"inline_keyboard": [[button]]}}
    method, field = ("sendAnimation", "caption") if video else ("sendMessage", "text")
    if video:
        p["animation"] = video
    p[field] = WELCOME.format(**tags)
    try:
        api(method, p)
    except RuntimeError:
        # Custom emoji need Telegram Premium on the bot owner's account: fall back to plain emoji.
        button.pop("icon_custom_emoji_id", None)
        plain = dict(FALLBACK, brand=tags["brand"])
        if BRAND_LOGO != "1x":
            plain["logo"] = plain["heart"]
        p[field] = WELCOME.format(**plain)
        api(method, p)


def setup(host):
    log = []
    name = set_name()
    try:
        api("getStickerSet", {"name": name})
        log.append(f"Emoji pack already exists: t.me/addemoji/{name}")
    except RuntimeError:
        if not OWNER_ID:
            log.append("Emoji pack will be created on your first /start.")
        else:
            try:
                create_pack(OWNER_ID, host)
                log.append(f"Emoji pack created: t.me/addemoji/{name}")
            except RuntimeError as e:
                log.append(f"Emoji pack will be created on your first /start ({safe(e)}).")
    api("setWebhook", {"url": f"https://{host}/api/onewin", "secret_token": SECRET,
                       "allowed_updates": ["message"], "drop_pending_updates": True})
    log.append("Webhook set")
    try:
        api("setChatMenuButton", {"menu_button": {"type": "web_app", "text": "Play", "web_app": {"url": PLAY_URL or f"https://{host}/1win/"}}})
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
        if not TOKEN:
            return self._reply(500, "Set ONEWIN_BOT_TOKEN in the site project on Vercel → Settings → Environment Variables, then redeploy.")
        q = parse_qs(urlparse(self.path).query)
        if "info" in q:
            out = {}
            for m in ("getMe", "getWebhookInfo", "getChatMenuButton"):
                try:
                    out[m] = api(m)
                except Exception as e:
                    out[m] = safe(e)
            out["emoji_ids"] = emoji_ids()
            out["last_error"] = LAST_ERROR
            return self._reply(200, safe(json.dumps(out, ensure_ascii=False, indent=2)))
        if "setup" not in q:
            return self._reply(200, "Poker bot (Neon) is running. Open /api/onewin?setup=1 to (re)run setup.")
        try:
            self._reply(200, setup(self.headers.get("Host")))
        except Exception as e:
            self._reply(500, f"Setup failed: {safe(e)}")

    def do_POST(self):
        if self.headers.get("X-Telegram-Bot-Api-Secret-Token") != SECRET:
            return self._reply(403, "forbidden")
        try:
            n = int(self.headers.get("Content-Length") or 0)
            upd = json.loads(self.rfile.read(n) or b"{}")
            msg = upd.get("message") or {}
            text = (msg.get("text") or "").split(" ")[0].split("@")[0]
            if text == "/post":
                send_post(msg["chat"]["id"])
            if text == "/start":
                send_welcome(msg["chat"]["id"], self.headers.get("Host"), (msg.get("from") or {}).get("id"))
        except Exception as e:
            global LAST_ERROR
            LAST_ERROR = safe(e)
            print("update error:", safe(e))
        self._reply(200, "ok")
