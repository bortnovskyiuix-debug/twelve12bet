# 1xBet Poker bot on Vercel

Serverless welcome bot: `/start` → animated banner + text with custom emoji + "Play now" button.

1. vercel.com → Add New → Project → import `twelve12bet`, **Root Directory: `tgbot`**, Framework: Other.
2. Environment Variables: `BOT_TOKEN` (from @BotFather), `OWNER_ID` (from @userinfobot). Deploy.
3. Open `https://<project>.vercel.app/api/bot?setup=1` once.
4. Send `/start` to the bot.

Custom emoji show only if the bot owner's account has Telegram Premium; otherwise plain emoji are used.
