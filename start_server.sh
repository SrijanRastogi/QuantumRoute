#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Locate libgomp in virtual environment or site-packages if present
LIBGOMP=$(find . -name "libgomp*.so*" 2>/dev/null | head -n 1 || true)
if [ -n "$LIBGOMP" ]; then
    export LD_PRELOAD="$LIBGOMP $LD_PRELOAD"
fi

export PYTHONPATH="$SCRIPT_DIR/src:$PYTHONPATH"
PORT="${PORT:-8000}"

echo "🚀 Starting QuantumRoute V2 Full-Stack Server on port $PORT..."
exec uvicorn backend.main:app --host 0.0.0.0 --port "$PORT"
