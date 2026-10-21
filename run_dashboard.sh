#!/usr/bin/env bash
# QuantumRoute Dashboard Launcher
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -d ".venv" ]; then
    export VIRTUAL_ENV="$SCRIPT_DIR/.venv"
    export PATH="$VIRTUAL_ENV/bin:$PATH"
    LIBGOMP=$(find "$VIRTUAL_ENV" -name "libgomp*.so*" 2>/dev/null | head -n 1)
    if [ -n "$LIBGOMP" ]; then
        export LD_PRELOAD="$LIBGOMP"
    fi
fi

export PYTHONPATH="$SCRIPT_DIR/src:$PYTHONPATH"

# Dynamic port handling (12-Factor App pattern):
# Respect $PORT environment variable if assigned by cloud host / container
PORT_ARGS=()
if [ -n "$PORT" ]; then
    PORT_ARGS+=(--server.port "$PORT")
fi

echo "⚛️ Starting QuantumRoute Dashboard 2.0..."
exec streamlit run src/quantumroute/app.py "${PORT_ARGS[@]}" "$@"
