#!/bin/bash
# 24/7 старт - для Railway/Docker и для хоста
set -e
mkdir -p /var/run/sshd
/usr/sbin/sshd 2>/dev/null || true
# если есть systemd - юзай его, если нет - луп
if command -v systemctl >/dev/null 2>&1; then
  echo "systemd detected, use: sudo ./systemd/install.sh"
fi
while true; do
  echo "[$(date)] starting VPS web..."
  node server.js
  echo "[$(date)] crashed, restart in 2s"
  sleep 2
done
