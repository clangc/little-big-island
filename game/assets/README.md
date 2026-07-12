# assets/ — drop-in sprite overrides

Any `<key>.png` you drop in this folder **replaces** the hand-drawn sprite
with that key, everywhere it appears in the game (world, drawer, thumbnails).
No code change needed — `build.sh` records which PNGs exist and the game
loads them at startup, falling back to the built-in drawing until the image
arrives (so the game is always playable).

This is where Bianca's hand-drawn art goes.

## How to add art
1. Draw the thing. Square-ish images work best (they're drawn from the
   ground up, so keep the "feet" of the object near the bottom edge).
2. Save it as a PNG named exactly after the sprite key, e.g. `tree.png`,
   `fox.png`, `kazoo.png`.
3. Run `bash build.sh` and reload. Done.

Transparent backgrounds are recommended so the sprite sits nicely on the
island instead of in a box.

## Sprite keys
The keys are the `k:` values in the `ITEMS`, `FURN`, `NPCS` and companion
lists inside `src/index.html`. A few common ones:

- Nature: `tree`, `palm`, `pine`, `cactus`, `blossom`, `hibiscus`,
  `sunflower`, `tulip`, `rose`, `mushroom`, `rock`, `mountain`, `volcano`
- Animals: `fox`, `bunny`, `deer`, `owl`, `dolphin`, `whale`, `turtle`, `cat`
- Companions: `bright`, `kazoo`, `patch`, `grit`, `shaky`, `thread`
- Homes: `house`, `castle`, `hut`, `tent`, `library`

(Every key is listed next to its drawing in `src/index.html` — search for
`reg("<key>"`.)
