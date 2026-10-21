# Blockverse.io feature-module API

Each feature is `js/features/<name>.js` and exports `default { name, init(G) }`. Add its file name to `FEATURES` in `js/core.js`. Features load after the world, in order. If one feature throws, the error is logged and the rest still load.

## World
- `G.world.getBlock(x,y,z)`, `placeBlock(x,y,z,id)`, `removeBlock(x,y,z)`. These edits are synced to everyone and persisted.
- `G.world.height(x,z)` returns the top solid y. `G.world.solid(id)`. `G.BLOCKS[id] = {n, c, liquid?, glow?}`.
- `G.raycast(max)` returns `{x,y,z,b,n:[nx,ny,nz],dist}` or `null`. `G.breakBlock()`, `G.placeBlock()`.
- Paint layer, shared by top faces: `G.paint.set(x,y,z,color,owner)` (pass `color=null` to clear), `G.paint.get(x,y,z) -> {color,owner}`, `G.paint.count() -> {owner:n}`. It is synced and replayed for late joiners. The materials are unlit, so paint glows at night.

## Player and input
- `G.player = {pos, vel, yaw, pitch, onGround, speedMul, extra}`. Anything you put in `extra` rides along with your position packets, so other clients see it as `G.others.get(id).target.ex`.
- `G.input = {f, s, jump}`. `G.pauseInput()` / `G.resumeInput()`. Setting `G.frozen = true` freezes physics and time.
- `G.overlay()` returns a full-screen canvas (hidden by default; you set its display and handlers).
- `G.pushPlayers(centerVec3, radius, vecVec3)` applies an impulse to every player in range, on all clients.
- `G.respawn()`.

## Events
- Use `G.on(evt, fn)` to listen. The events are:
  - `tick(dt, now)`
  - `blockSet(x,y,z,id,remote)`
  - `beforeBreak(hit)`: set `hit.cancel = true` to block the break
  - `broke(hit)`
  - `jump`
  - `bounce`
  - `death(reason)`
  - `kbd(name)` (lowercased letter, or names like Shift)
  - `state:<featureId>(state)`

## Multiplayer
- `G.net.send(featureId, msg)` / `G.net.on(featureId, cb)`. Add `keep: 1` to a message to have it replayed to late joiners.
- `G.net.id`. `G.others` is a Map of `id -> {g: avatar group, target: last pos packet}`.
- `G.state(featureId)` and `G.setState(featureId, patch)` hold shared per-feature state, kept for late joiners.

## Physics
- `G.physics.add({pos: Vector3, vel?, radius?, bounce?, gravity?, drag?, mesh?})` returns a body that steps every tick against the voxels. Remove it with `G.physics.remove(b)`.

## UI
- `G.ui.addButton(emoji, title, fn)` adds a button to the right-side column.
- `G.ui.meter(topPx, color)` returns a setter `v => {}`.
- `G.ui.panel(options, cb)` shows a picker.
- `G.toast(text, ms)`. `G.label(text, color)` returns a THREE sprite. `G.mkAvatar(name, color)`.
- `G.infoExtra` is a function that appends text to the top-left HUD line. Chain it with the previous one.

## Transport
- Messages are batched into Nostr ephemeral events (kind 20420, tag `t=blockverse-io-w1`) about every 220 ms and published to 4 free public relays. Duplicates are dropped by event id.
- A newcomer sends `hello`, and a random existing peer answers with a `sync` containing up to 1500 block edits, the kept feature log and the time of day.
- Block edits are also flushed every 20 s by the leader (the lowest peer id) to ntfy.sh, and loaded from the last 12 h on start, so the world persists after everyone leaves, for up to about 12 h.
