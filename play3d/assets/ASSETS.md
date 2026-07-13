# Painterly art set — how to drop it into the game

The game reads any `assets/<key>.png` and uses it in place of the built-in drawing
(see `../src/index.html`, search `loadSpriteOverrides`). Special hooks also exist for
the sky and the first-person hands. Below is what each generated Higgsfield image is
for, and the **exact filename** to save it as in this `assets/` folder.

After adding files, run `bash build.sh` (from `game/`) and reload.

## Generated core set (batch 1)

| Higgsfield image        | Save as            | How it's used                                   |
|-------------------------|--------------------|-------------------------------------------------|
| Dusk sky panorama       | `sky.png`          | Panning painted sky (sky hook — already wired). |
| Meadow grass texture    | `grass_ground.png` | Ground texture — needs the ground hook (todo).  |
| Lush green tree         | `tree.png`         | Sprite override for every "Tree".               |
| Autumn-gold tree        | `tree_autumn.png`  | Extra tree variant (optional new item).         |
| Pine tree               | `pine.png`         | Sprite override for "Pine".                     |
| Cozy cottage            | `house.png`        | Sprite override for "House" (also `hut`,`ghouse`).|
| Glowing cave            | `cave.png`         | Sprite override for the cave discovery.         |
| Mossy boulder           | `rock.png`         | Sprite override for "Rock".                     |
| Six-character lineup    | (reference only)   | Style anchor for the cast — not a game sprite.  |
| First-person hands      | `hands.png`        | Painted hands (hands hook — already wired).     |

## Notes on cutouts
Object sprites (tree, pine, house, cave, rock, hands) look best with a **transparent
background**. They were generated on white — remove the white background before saving
(Higgsfield's "remove background", or any photo tool). The sky and grass textures keep
their background.

## Companions (next batch)
The cast lineup is a *style reference*. For in-game use each companion needs its own
isolated cutout, saved as its sprite key: `bright.png`, `kazoo.png`, `patch.png`,
`grit.png`, `shaky.png`, `thread.png`.

## Still to generate (long tail)
palm, bamboo, bush/shrub, mountain/cliff, flowers (blossom/sunflower/rose/tulip/daisy),
animals (fox, deer, owl, cat, bunny, dolphin, whale…), and the special trophies
(the bubble vehicle, waterfall, lighthouse).
