#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "⚛️ Building Frontend static assets..."
cd frontend
npm install
npm run build
cd ..

echo "✅ QuantumRoute Full-Stack build successful!"
