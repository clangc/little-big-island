#!/usr/bin/env bash
# Build the game and publish it to /play at the repo root, where Vercel
# serves it at thelittlebigisland.com/play (alongside the marketing site).
set -euo pipefail
cd "$(dirname "$0")"
bash build.sh
rm -rf ../play && cp -r site ../play
echo "✓ published game → ../play  (live at /play once merged to main)"
