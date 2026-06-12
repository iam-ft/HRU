#!/bin/bash
set -euo pipefail

# ── Paths auto-descubiertos desde la ubicación del script ────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

TODAY=$(date +%Y-%m-%d)
LOG_FILE="$REPO_DIR/logs/clipping-$TODAY.log"

# ── Solo corre los lunes (1) y miércoles (3) ─────────────────────────────────
DAY=$(date +%u)
if [ "$DAY" != "1" ] && [ "$DAY" != "3" ]; then
  exit 0
fi

# ── Evita doble ejecución si la Mac se reinicia el mismo día ─────────────────
if [ -f "$LOG_FILE" ]; then
  exit 0
fi

mkdir -p "$REPO_DIR/logs"
exec > "$LOG_FILE" 2>&1
echo "[HRU] Inicio: $(date)"

cd "$REPO_DIR"

# ── Buscar el binario de Claude ──────────────────────────────────────────────
CLAUDE_BIN="claude"
CLAUDE_BASE="$HOME/Library/Application Support/Claude/claude-code"
if [ -d "$CLAUDE_BASE" ]; then
  for version in $(ls -r "$CLAUDE_BASE" 2>/dev/null); do
    candidate="$CLAUDE_BASE/$version/claude.app/Contents/MacOS/claude"
    if [ -x "$candidate" ]; then
      CLAUDE_BIN="$candidate"
      break
    fi
  done
fi
echo "[HRU] Claude bin: $CLAUDE_BIN"

# ── Extraer el prompt del ROUTINE.md (todo después del segundo ---) ───────────
PROMPT=$(awk 'BEGIN{c=0} /^---/{c++; next} c>=2{print}' "$REPO_DIR/ROUTINE.md")

if [ -z "$PROMPT" ]; then
  echo "[HRU] ERROR: no se pudo extraer el prompt de ROUTINE.md"
  exit 1
fi

echo "[HRU] Prompt extraído (${#PROMPT} chars). Iniciando Claude..."

"$CLAUDE_BIN" --print --dangerously-skip-permissions "$PROMPT"

echo "[HRU] Fin: $(date)"
