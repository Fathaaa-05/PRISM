#!/bin/bash
# Double-click to run the PRISM demo on Mac (also works on Linux: bash "Start PRISM (Mac).command").
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js is not installed. Install the LTS version from https://nodejs.org, then double-click this file again."
  open "https://nodejs.org" 2>/dev/null || xdg-open "https://nodejs.org" 2>/dev/null
  read -r -p "  Press Enter to close." _; exit 1
fi
if [ ! -f .env ]; then
  echo ""
  echo "  First run: no API key needed. Just press Enter to use PRISM's built-in AI."
  echo "  (Optional: paste a Claude API key, starting with sk-ant-, to use Claude instead.)"
  read -r -p "  Claude API key (optional): " KEY
  printf 'ANTHROPIC_API_KEY=%s\nACCESS_CODE=\nCLAUDE_MODEL=claude-opus-5-5\nCLAUDE_EFFORT=medium\n' "$KEY" > .env
fi
if [ ! -d node_modules ]; then
  echo ""
  echo "  Installing PRISM (first run only, needs internet)..."
  npm install --no-audit --no-fund || { echo "  npm install failed. Check your internet connection."; read -r -p "  Press Enter to close." _; exit 1; }
fi
node server.mjs --open
