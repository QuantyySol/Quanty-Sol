# Blockverse.io feature-module API

Each feature is `js/features/<name>.js` and exports `default { name, init(G) }`. Add its file name to `FEATURES` in `js/core.js`. Features load after the world, in order. If one feature throws, the error is logged and the rest still load.

## World
- `G.world.getBlock(x,y,z)`, `placeBlock(x,y,z,id)`, `removeBlock(x,y,z)`. These edits are synced to everyone and persisted.
- Both name sets work: `G.world.get(x,y,z)` = `getBlock`, `G.world.set(x,y,z,id)` = `placeBlock` (with `id=0` it removes), plus `G.world.solid(id)` and `G.world.height(x,z)`. The short names are the originals; the long names are aliases.
- `G.world.height(x,z)` returns the top solid y. `G.world.solid(id)`. `G.BLOCKS[id] = {n, c, liquid?, glow?}`.
- `G.raycast(max)` returns `{x,y,z,b,n:[nx,ny,nz],dist}` or `null`. `G.breakBlock()`, `G.placeBlock()`.
- Paint layer, all 6 faces: `G.paint.set(x,y,z,color,owner,face)` (pass `color=null` to clear), `G.paint.get(x,y,z,face) -> {color,owner,face}`, `G.paint.count() -> {owner:n}` (counts every face). `face` is one of `top|bottom|north|south|east|west` (north=-z, south=+z, east=+x, west=-x) and defaults to `top`, so old calls are unchanged. `G.paint.faceFromNormal(hit.n)` turns a `G.raycast()` normal into a face name. It is synced and replayed for late joiners. Placing a block clears paint on the faces it covers; removing one clears all its paint. The materials are unlit, so paint glows at night.

## Player and input
- `G.player = {pos, vel, yaw, pitch, onGround, speedMul, extra}`. Anything you put in `extra` rides along with your position packets, so other clients see it as `G.others.get(id).target.ex`.
- `G.input = {f, s, jump}`. `G.pauseInput()` / `G.resumeInput()`. `G.frozen` is only a flag: when true, core skips player physics and the day/night clock, but input is still read. To freeze controls, call `G.pauseInput()` (and `G.resumeInput()` after).
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
- `G.ui.button(emoji, title, fn)` (original) = `G.ui.addButton(...)` (alias) adds a feature button and returns it; toggle `.classList` `on` to highlight it. On touch screens, or once there are 13+ buttons, all feature buttons live in a tray (48px ☰ toggle at the bottom right, 2-column grid, last-used button pinned next to it). This is automatic; features don't need changes.
- `G.ui.meter(topPx, color)` returns a setter `v => {}`.
- `G.ui.panel(options, cb)` shows a picker.
- `G.toast(text, ms)`. `G.label(text, color)` returns a THREE sprite. `G.mkAvatar(name, color)`.
- `G.infoExtra` is a function that appends text to the top-left HUD line. Chain it with the previous one. The line is one line and ends in … if too long, so keep additions short.

## Transport
- Messages are batched into Nostr ephemeral events (kind 20420, tag `t=blockverse-io-w1`) about every 220 ms and published to 4 free public relays. Duplicates are dropped by event id.
- A newcomer sends `hello`, and a random existing peer answers with a `sync` containing up to 1500 block edits, the kept feature log and the time of day.
- Block edits are also flushed every 20 s by the leader (the lowest peer id) to ntfy.sh, and loaded from the last 12 h on start, so the world persists after everyone leaves, for up to about 12 h.

## Controls (core-owned)
- Touch: 8-way D-pad bottom-left (joystick available via the players list → "Controls"), drag right side to look. Right cluster: **A** Jump, **B** Attack (tap = swing, hold = break block every 450 ms), **X** Interact, **Y** Use slot (place block when unclaimed). Small toggles: 🏃 Sprint, 🧎 Crouch, 😀 Emote, 💬 Quick chat. ☰ tray unchanged.
- Desktop: WASD/arrows, Space jump, click = attack if a player/target is in reach else break, right click place, **Z** attack, **X** interact, **U** use, **C** crouch, **Ctrl** sprint, **V** emotes, **T** quick chat. Core no longer binds anything else; features already use b f g l q e r Shift.
- `G.mp = {sprint, crouch, attack(), interact(), use(), emote(name)}`. Sprint ×1.6 and crouch ×0.45 multiply on top of `G.player.speedMul`.

## Combat
- `G.combat.hp` (0–10, shown as 10 hearts), `G.combat.max`, `G.combat.heal(n)`.
- `G.combat.damage(target, amount=1, kb?)`: `target` is a player id, `'me'`, an `aim()` result, or a registered target. Player hits are synced (directed message), apply knockback `kb=[x,y,z]` and 0.7 s invulnerability. At 0 hp core fires `death('player'|'damage')` (so bloodstains still work), resets hp, and shows a kill-feed toast to everyone.
- `G.combat.addTarget({pos|obj|mesh, radius, name, kind, onHit(amount, byId), onInteract(byId)})` returns a remover. Register creatures, signs, contraptions or race gates so B and X can aim at them.
- `G.combat.aim()` returns the nearest player/target in front within 3.6 blocks (`{kind:'player',id,name,avatar}` or your target object), or `null`.

## Events (new)
- `attack(ev)`: `ev = {target, hit}`. `target` as from `aim()` or `null`; `hit` is a `G.raycast(4)` block when there's no target. Set `ev.cancel = true` to stop core applying damage.
- `interact(ev)`: `ev = {type:'player'|'block'|'none'|<target.kind>, target, hit}`. Set `ev.handled = true` to stop the default (calling `target.onInteract`, or greeting a player).
- `emote(name)` (local), `playerJoin(id, other)`.

## Use slot
- `G.ui.setUse({icon, label, onPress})` claims the **Y** button and returns a release function (`G.ui.clearUse(obj)` works too). The last claim wins, and releasing falls back to the previous claim, then to place block. Claim it when your context becomes relevant (e.g. near your contraption) and release it when you leave.

## Reserved net fields (do not use these in your messages)
- `G.net.send(featureId, msg)` overwrites `msg.t` with the feature id and `msg.from` with your id. Core also reads these fields on every message:
  - `t`: message type / feature id. Core-owned values: `set hello sync pos bye push paint state mp`, so don't name a feature any of these.
  - `from`: sender id (always overwritten).
  - `to`: if set, only that peer id processes the message (everyone else drops it). Only set it for directed messages.
  - `keep`: any truthy value stores the message and replays it to late joiners.
- In `sync` messages core uses the fields `edits kl time`, and in `pos` packets `x y z yaw name color ex hp cr`. Put per-player feature data in `G.player.extra` (`ex`), not at the top level.
