#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .venv ]]; then
  echo "Virtual environment not found. Run: npm run setup"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo ".env not found. Run: cp .env.example .env && add HUGGINGFACE_TOKEN"
  exit 1
fi

exec .venv/bin/uvicorn src.server:app --host 127.0.0.1 --port 8000 --reload
