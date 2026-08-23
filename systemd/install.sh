#!/bin/bash
set -e
# Установка 24/7 через systemd (для ПК/VPS без Docker)
if [ "$EUID" -ne 0 ]; then echo "запусти sudo ./systemd/install.sh"; exit 1; fi
mkdir -p /opt/VPSFREE
cp -r server.js package.json public systemd/vps-web.service /opt/VPSFREE/ 2>/dev/null; cp -r public /opt/VPSFREE/ 2>/dev/null || true
cp systemd/vps-web.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable vps-web
systemctl restart vps-web
systemctl status vps-web --no-pager
echo "24/7 ворк: systemctl status vps-web | journalctl -u vps-web -f"
