#!/usr/bin/env bash
# 1xBet Poker welcome bot: one-line installer for a Linux server (Ubuntu/Debian).
#   bash <(curl -fsSL https://raw.githubusercontent.com/bortnovskyiuix-debug/twelve12bet/welcome-bot/bot/install.sh)
set -euo pipefail
BASE="https://raw.githubusercontent.com/bortnovskyiuix-debug/twelve12bet/welcome-bot/bot"
DIR=/opt/x1poker-bot
SVC=x1poker-bot

echo "== 1xBet Poker welcome bot =="
command -v python3 >/dev/null || { apt-get update -qq && apt-get install -y -qq python3; }
command -v curl >/dev/null || { apt-get update -qq && apt-get install -y -qq curl; }

mkdir -p "$DIR/emoji"
cd "$DIR"
echo "Downloading files..."
curl -fsSL "$BASE/bot.py" -o bot.py
curl -fsSL "$BASE/welcome.mp4" -o welcome.mp4
for e in logo spade heart chip cards trophy bolt play; do
  curl -fsSL "$BASE/emoji/$e.png" -o "emoji/$e.png"
done

if [ ! -f .env ]; then
  read -rsp "Bot token from @BotFather (hidden): " TOKEN; echo
  read -rp  "Your Telegram user id (from @userinfobot): " OWNER
  printf 'BOT_TOKEN=%s\nOWNER_ID=%s\n' "$TOKEN" "$OWNER" > .env
  chmod 600 .env
fi
set -a; . ./.env; set +a

echo "Creating custom emoji pack..."
python3 bot.py setup

cat > /etc/systemd/system/$SVC.service <<EOF
[Unit]
Description=1xBet Poker welcome bot
After=network-online.target
Wants=network-online.target

[Service]
WorkingDirectory=$DIR
EnvironmentFile=$DIR/.env
ExecStart=/usr/bin/python3 $DIR/bot.py run
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now $SVC
sleep 2
systemctl --no-pager --lines=5 status $SVC || true
echo
echo "Done. Send /start to your bot."
echo "Logs: journalctl -u $SVC -f"
