# SHIFT

Game Off 2026 entry (theme: **SHIFT**). A tiny puzzle-platformer where the Shift key swaps between two worlds, Day and Night. Gold blocks exist only by day, teal blocks only by night.

## Play
Open `index.html` in a browser (or serve the folder), no build step.

| Key | Action |
|---|---|
| Arrows / A D | move |
| Space / W / Up | jump |
| **Shift / E** | swap world (also slides purple blocks) |
| R | restart level (does not count as a death) |

Night has **low gravity** (higher, floatier jumps) and **slows time** by half, so saws and platforms move slower. Purple blocks slide along their rails each shift. Some levels limit your shifts. You cannot shift if it would leave you inside a wall or on top of spikes.

### Tiles
| Obstacle | Behaviour |
|---|---|
| Gold / teal blocks | solid only by day / only by night |
| Orange spikes | deadly only in one world (the other shows a ghost outline) |
| Red spikes (floor or ceiling) | always deadly |
| Purple blocks on rails | slide one tile per shift and carry you |
| Green pads | launch you upward (night gravity makes it far higher) |
| Thin platforms | solid only when you land on them from above |
| Saws (grey, spinning) | patrol a horizontal or vertical track; always deadly |
| Moving platforms | ferry or lift you; land on them from above |
| Lever + gates | touching the lever toggles every gate: striped gates open, ghost gates close |

## Verify levels
`tools/verify-parallel.sh` (all cores) or `node tools/verify-levels.js [n ...]` runs the real game code headlessly and searches for a winning input sequence in every level (exit code 1 if any level is unsolvable).

## Develop
Vanilla JS + Canvas. Levels live in `src/levels.js` as ASCII maps, so adding one is just a new entry.

## Release (itch.io)
`zip -r shift.zip index.html src` and upload as an HTML5 game.

## License
MIT
