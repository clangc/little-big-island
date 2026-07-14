#!/usr/bin/env bash
# Publish the 3D world prototype to /play3d at the repo root, where Vercel
# serves it at thelittlebigisland.com/play3d — a walkable preview of the
# new engine. The live game at /play is untouched.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf ../play3d
mkdir -p ../play3d
cp proto3d/index.html ../play3d/index.html
cp -r vendor ../play3d/vendor
mkdir -p ../play3d/assets
cp -r assets/web ../play3d/assets/web   # the 3D game ships WebP only (~0.7MB of art)
# the prototype references ../assets and ../vendor; at /play3d they live inside
node -e '
const fs=require("fs"),p="../play3d/index.html";
let h=fs.readFileSync(p,"utf8");
h=h.replaceAll("../assets/","assets/").replaceAll("../vendor/","./vendor/");
if(!h.includes("<base ")) h=h.replace("<head>","<head>\n<base href=\"/play3d/\">");
fs.writeFileSync(p,h);
console.log("  rewrote asset paths + injected <base href=\"/play3d/\">");
'
echo "✓ published 3D preview → ../play3d (live at /play3d once merged to main)"
