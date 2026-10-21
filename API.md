# Blob Arena plugin API

Core is `js/core.js`. Features are ES modules in `js/features/<name>.js`:

```js
export default { name: 'mything', init(A) { /* register hooks here */ } };
```

To enable one, add its name to the `FEATURES` list at the top of `core.js`. That one line is the only core edit allowed. Each `init` and every hook call is wrapped in try/catch, so a broken feature logs an error and the game keeps running. See `js/features/_example.js`.

## Team rules
- **Test only in `?room=qa-<yourname>`** (for example `?room=qa-pixel`). Never test in the public room.
- Don't edit `core.js` (except the `FEATURES` line), `index.html`, or another worker's feature file. If you need a new hook, ask for it.
- Prefix your net types, hudSlot ids, skin ids and mode ids with your feature name.
- Before publishing, use headless Chrome with 2 clients at 1440x900 and 390x844 and get 0 JS errors. Run `leakcheck.py` on your file; it blocks the substring `k`+`ey`, so use `'k'+'eydown'` and `e.code`.
- Keep the game neutral. No personal info, and nothing about who made it.

## State (read-only unless noted)
| | |
|---|---|
| `A.me` | your entity `{id,owner,n,c,s,bot,cells[]}`, or `null` while dead |
| `A.alive`, `A.myMass` | whether you're alive, and your total mass |
| `A.players` / `A.bots` | arrays of human and AI entities (yours included) |
| `A.entities` | Map of id to entity (players and bots) |
| `A.cells` | `[{cell,ent}]`, where a cell is `{id,x,y,m,vx,vy}` |
| `A.pellets` / `A.viruses` | deterministic arrays `{i,x,y,dead}`; `dead` is the respawn time in ms |
| `A.ejects` | Map of ejected blobs |
| `A.leaderboard` | `[{rank,id,name,mass,bot,me}]`, refreshed every 0.5 s |
| `A.room`, `A.id`, `A.W` (map size), `A.EAT` (1.25), `A.radius(m)`, `A.cam`, `A.view`, `A.input.stick`, `A.input.touch` | |

Only touch entities you own (`ent.owner == A.id`). Remote entities are overwritten by the network about 9 times a second.

## Actions
`A.split(opts)` (`opts.power` scales the fling speed), `A.eject()`, `A.play()`, `A.aim()` (world aim point).

## Events: `const off = A.on(name, fn)`
- `spawn(ent)`
- `eat({ent,cell,victim,mass})`: an entity you own ate a cell (fires after the victim confirms)
- `eaten({ent,cell,by,mass})`: one of your cells was eaten
- `death({ent,by,peak})`
- `split({ent,cells,opts})`, `eject({ent,blob})`
- `tick(dt)`, `kbd(code, event)` (call `event.preventDefault()` to stop the default Space/W handling), `mode(id)`
- `drawWorld(ctx)` (world space, under pellets), `draw(ctx)` (world space, over cells), `drawHud(ctx, w, h)` (screen space, CSS px)

## Net
`A.net.send(type, data, {keep, replace, maxAge, to})` and `A.net.on(type, (msg, fromId) => {})`.
- `keep: 1`: the message is stored and replayed to late joiners by the host.
- `replace: 'id'`: a newer kept message with the same type and id drops the older ones (latest state per object).
- `maxAge: ms`: it expires and isn't replayed after that.
- `A.net.keepCap(type, n)`: keep only the newest n messages of that type. Call it in `init`.
- `to: clientId`: sends to one client only.
- `A.net.id`, `A.net.isHost` (lowest-id live client, which also hosts the bots), `A.net.peers`, `A.net.kept()`.

Messages are batched into one Nostr ephemeral event about every 110 ms. Keep them small and don't send every frame.

**Reserved message fields:** `t`, `from`, `to`, `keep`, `rep`, `exp`, `kid`.
**Reserved types** (send throws): `pe`, `ve`, `ej`, `ee`, `eat`, `ok`, `bye`, `hello`, `sync`.

## UI
- `A.ui.button(label, title, fn)`: a round mobile-safe button in the right-hand stack above Split. There are 4 slots (more are ignored with a warning). The handler fires on pointerdown.
- `A.ui.panel(title, htmlOrNode, {onClose})` returns `{el, body, close()}`
- `A.ui.toast(text, ms)`
- `A.ui.hudSlot(id)` returns a div in the left HUD stack under the mass box (empty slots are hidden)

## Render
- `A.drawCell = (ctx, cell, ent, R, def) => { def(); /* extras */ }` overrides how every cell is drawn. `def()` draws the stock look. Only one override exists, so chain it: `const prev = A.drawCell;`
- `A.skins.add(id, {name, icon, draw(ctx, cell, ent, R)})` adds the skin to the start-screen picker. A skin draws on top of the colour fill. `ent.s` is the skin id, so other clients need the same feature loaded.

## Modes
`A.modes.add(id, {name, start(A), stop(A), tick(dt), spawnPos({bot}) -> {x,y}, canEat(ent) -> false, canSplit() -> false, canEject() -> false, botCount(n) -> n, botAI(ent) -> true (handled), onDeath({by,peak}) -> true (hide the death screen)})`. Every hook is optional. Switch with `A.modes.set(id)` and read `A.modes.current`. The default mode is `ffa`. Sync mode changes yourself with a kept net message.

## Physics
- `A.physics.addSpeedMod((cell, ent) => multiplier)` returns a remove function
- `A.physics.slowZone({x, y, r, mul})` is a shortcut for the above
- `A.physics.addObstacle((cell, ent, dt) => { /* push cell.x/y out */ })`
- `A.physics.circleWall({x, y, r})` is a solid round obstacle

These run on every client for the entities it owns, so register the same obstacles everywhere (deterministic positions, or a kept message).

## Split variants
`A.onSplit(info => {...})` runs for each cell before it splits. `info = {cell, ent, dir:{x,y}, speed, share, opts}`. You can change `speed`, `share` (the fraction that flies off, 0.5 by default) or `dir`, or set `info.cancel = true`.

Example of a charged fling: hold a button, then call `A.split({power: 1 + held})`, and in `onSplit` set `info.share = 0.3` when `opts.power > 1`.
