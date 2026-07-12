# The Island Explorer — Design Constitution
*The Little Big Island · world & words © Bianca Lang*

This file is the source of truth for every design and engineering decision.
If a change fights this document, the change is wrong.

## The premise (why this game exists)
The island is the inside of the player. It is an analogy for how beautiful
the real world becomes as they grow, become better, and expand their island.
Kids progress **only** by doing real things in the real world — kindness,
courage, laughter, imagination, persistence — confirmed by a grown-up or by
their own honest word. You win by putting the game down.

## The four pillars
1. **A living painting.** Every frame looks like the book cover: painterly,
   warm, magical. One world, one light, zero seams, nothing floating.
2. **Real deeds, magical consequences.** A real kind act makes something on
   the island visibly, memorably change. The link must feel mystical.
3. **A portrait, not a sandbox.** Every island is seeded per child and
   reflects who they are becoming (the mirror engine). No two alike.
4. **Gentle by design.** Short sessions. No streaks, no FOMO, no dark
   patterns. The island waits patiently.

## The four locked decisions (2026-07-12, with the founder)
1. **Signature light: THE LIGHT GROWS WITH THE CHILD.**
   Chapter 1 = pale, misty, tender dawn. By Chapter 10 the island has *earned*
   the golden book-cover dusk. The world literally becomes more beautiful as
   the child does. Growth value t = (chapter-1)/9 drives the entire lighting
   rig (sun color/angle, fog color/density, saturation, sky gradient).
2. **Lead device: PHONE, PORTRAIT.** Pixel-perfect one-handed portrait first;
   landscape/tablet/desktop adapt from it. UI reachable by a child's thumb.
3. **Social: SOLO + POSTCARDS.** Private islands. Kids can send framed painted
   "postcards" of their island (canvas snapshot + island name + chapter).
   No accounts in v1.
4. **World-class at: BEAUTY & WONDER.** When trading off, beauty wins.
   The screenshot must look impossible for a web game.

## Engine direction
The 2.5D flat-billboard renderer is retired: it cannot connect land to
horizon (scenery floats; scenes look stitched). The game runs on the 3D
engine (`three.js`, vendored): a seeded heightmap island in a real ocean,
toon/painterly shading, painted art as textures/billboards anchored in the
world, real cave + waterfall geometry, fog of undiscovery. All existing game
logic (quests, deeds, mirror engine, catalog, saves) carries over unchanged.

## Canon rules (unbreakable)
- Never show the player — hands only.
- Never reorder the `ITEMS` array (kids' saves depend on indices).
- `localStorage` key `tlbi_explorer_v2` keeps working forever.
- The island hides in fog and clears where it "gets to see you."
- Companions arrive by chapter: Bright 1, Kazoo 2, Patch 3, Grit 5,
  Shaky 7, Thread 9. The cat is rescued, then follows.
- Kid-safe forever: no ads, no chat, no purchases without a grown-up.

## Art pipeline
Painted assets (Higgsfield, in the book-cover style — or Bianca's own art,
which always wins) drop into `game/assets/<key>.png` and override anything.
`tools/process-assets.js` keys/crops/optimizes uploads.
