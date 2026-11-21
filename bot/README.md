# 1xBet Poker: велкам-повідомлення з кастомними емодзі

На `/start` бот надсилає анімований банер (`welcome.mp4`), текст із кастомними емодзі і кнопку **Play now**, яка відкриває Mini App.

## Що потрібно

- **Telegram Premium на акаунті, з якого створено бота** (власник у @BotFather). Без Premium Telegram не покаже кастомні емодзі від бота. Тоді бот автоматично надішле той самий текст зі звичайними емодзі.
- Python 3.9+. Залежностей немає.

## Запуск

```bash
export BOT_TOKEN="токен від @BotFather"
export OWNER_ID="твій Telegram user id"   # дізнатись: @userinfobot
# export PLAY_URL="https://..."           # якщо Mini App на іншій адресі

python3 bot.py setup   # один раз: створює пак емодзі x1poker_by_<бот>, зберігає emoji_ids.json, ставить кнопку меню Play
python3 bot.py run     # бот слухає /start
python3 bot.py test <chat_id>   # надіслати велкам вручну
```

Після `setup` пак можна додати собі за посиланням, яке скрипт виведе в консоль (`t.me/addemoji/...`).

## Файли

- `bot.py`: скрипт
- `welcome.mp4`: банер (анімація заливки лого)
- `emoji/*.png`: 8 емодзі 100×100: logo, spade, heart, chip, cards, trophy, bolt, play
- `emoji_ids.json`: з'явиться після `setup`

## Важливо

Якщо в цього бота вже є свій сервер, який відповідає на `/start`, не запускай `run` паралельно, бо обидва забиратимуть оновлення. Тоді візьми з `bot.py` функцію `send_welcome` у свій код.
