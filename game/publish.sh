#!/usr/bin/env bash
# Build the game and publish it to /play at the repo root, where Vercel
# serves it at thelittlebigisland.com/play (alongside the marketing site).
set -euo pipefail
cd "$(dirname "$0")"
bash build.sh
rm -rf ../play && cp -r site ../play
# Inject a <base> tag so the game's relative asset paths (assets/, sw.js,
# manifest.json) resolve correctly at /play even when the URL has no
# trailing slash (Vercel cleanUrls serves it as ".../play").
node -e '
const fs=require("fs"),p="../play/index.html";
let h=fs.readFileSync(p,"utf8");
if(!h.includes("<base ")) h=h.replace("<head>","<head>\n<base href=\"/play/\">");
fs.writeFileSync(p,h);
console.log("  injected <base href=\"/play/\">");
'
echo "✓ published game → ../play  (live at /play once merged to main)"
