#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Setting up Kotoba Tag for local development..."

if [[ ! -d .venv ]]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

echo "Installing Python dependencies..."
.venv/bin/pip install -r requirements.txt

echo "Installing Node dependencies..."
npm install

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo ""
  echo "Created .env from .env.example."
  echo "Edit .env and set HUGGINGFACE_TOKEN before starting the API server."
else
  echo ".env already exists — leaving it unchanged."
fi

echo ""
echo "Setup complete. Next steps:"
echo "  1. Add your HUGGINGFACE_TOKEN to .env"
echo "  2. npm run dev:all        # start frontend + API together"
echo "     — or run separately —"
echo "     npm run dev             # frontend at http://localhost:5173"
echo "     npm run dev:server      # API at http://127.0.0.1:8000"
