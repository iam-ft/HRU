#!/bin/bash
# Genera el Launch Agent con la ruta real del repo e instala en ~/Library/LaunchAgents/
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

TEMPLATE="$SCRIPT_DIR/com.hru.clipping.plist.template"
PLIST_OUT="$SCRIPT_DIR/com.hru.clipping.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.hru.clipping.plist"

echo "[setup] Repo: $REPO_DIR"

sed "s|__REPO_DIR__|$REPO_DIR|g" "$TEMPLATE" > "$PLIST_OUT"
echo "[setup] Plist generado: $PLIST_OUT"

cp "$PLIST_OUT" "$PLIST_DEST"

launchctl unload "$PLIST_DEST" 2>/dev/null || true
launchctl load "$PLIST_DEST"

echo "[setup] Launch Agent instalado."
echo "[setup] Verificá con: launchctl list | grep hru"
