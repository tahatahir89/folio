#!/usr/bin/env bash
# One-step launcher for macOS / Linux.
#   ./start.sh            install, configure and start the dev server
#   ./start.sh --docker   also start a local MongoDB container first
#   ./start.sh --prod     build and start the production server
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18.18 or newer is required. Install it from https://nodejs.org and run this again."; exit 1
fi
node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>18||(a===18&&b>=18)?0:1)" || {
  echo "Node.js $(node -v) is too old. Folio needs 18.18 or newer."; exit 1; }

if [[ " $* " == *" --docker "* ]]; then
  docker compose up -d
fi

node scripts/setup-env.mjs
if [ ! -d node_modules/next ]; then
  echo "Installing dependencies (first run only)..."
  npm install
fi

if [[ " $* " == *" --prod "* ]]; then
  npm run build && npm run start
else
  npm run dev
fi
