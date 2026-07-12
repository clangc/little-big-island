#!/usr/bin/env bash
# ------------------------------------------------------------------
# The Island Explorer — build
# Assembles the deployable site/ from src/ + assets/.
# A "build" here is mostly a copy + validate + generate the sprite
# override manifest, because the game is a single self-contained page.
# Run from the game/ directory:  bash build.sh
# ------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

SRC=src
OUT=site
ASSETS=assets

echo "· cleaning $OUT/"
rm -rf "$OUT"
mkdir -p "$OUT" "$OUT/assets"

echo "· copying source"
cp "$SRC"/index.html      "$OUT"/index.html
cp "$SRC"/logic.js        "$OUT"/logic.js
cp "$SRC"/manifest.json   "$OUT"/manifest.json
cp "$SRC"/sw.js           "$OUT"/sw.js
cp "$SRC"/icon-192.png    "$OUT"/icon-192.png
cp "$SRC"/icon-512.png    "$OUT"/icon-512.png

# --- sprite override manifest -------------------------------------
# Any <key>.png dropped into assets/ overrides the hand-drawn sprite
# with that key at runtime. build.sh records which ones exist so the
# game only fetches images that are actually there (no 404 noise).
echo "· scanning $ASSETS/ for PNG sprite overrides"
mkdir -p "$ASSETS"
keys=()
shopt -s nullglob
for f in "$ASSETS"/*.png; do
  base="$(basename "$f" .png)"
  keys+=("$base")
  cp "$f" "$OUT/assets/$base.png"
done
shopt -u nullglob

# write site/assets/manifest.json = ["key1","key2",...]
{
  printf '['
  for i in "${!keys[@]}"; do
    [ "$i" -gt 0 ] && printf ','
    printf '"%s"' "${keys[$i]}"
  done
  printf ']\n'
} > "$OUT/assets/manifest.json"
echo "  found ${#keys[@]} override(s): ${keys[*]:-(none)}"

# --- validation ---------------------------------------------------
echo "· validating"
grep -q 'tlbi_explorer_v2' "$OUT/index.html" || { echo "FAIL: save key tlbi_explorer_v2 missing!"; exit 1; }
grep -q 'id="c"'           "$OUT/index.html" || { echo "FAIL: game canvas missing!"; exit 1; }
node --check "$OUT/logic.js" || { echo "FAIL: logic.js has a syntax error"; exit 1; }
# extract the main inline scripts and syntax-check them
node - "$OUT/index.html" <<'NODE'
const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const re=/<script>([\s\S]*?)<\/script>/g;let m,i=0,bad=0;
while((m=re.exec(html))){
  i++;
  try{ new Function(m[1]); }
  catch(e){ console.error(`  script block #${i}: ${e.message}`); bad++; }
}
if(bad){ console.error(`FAIL: ${bad} inline script block(s) failed to parse`); process.exit(1); }
console.log(`  ${i} inline script block(s) parse OK`);
NODE

echo "✓ build complete → $OUT/"
