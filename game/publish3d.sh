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
cp -r assets ../play3d/assets
rm -rf ../play3d/assets/models   # 3D lifts stay out of the shipped bundle for now (painted look won)
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
