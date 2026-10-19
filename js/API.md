# window.Desk API (v1) — for js/characters.js and js/monitors.js

index.html runs first. Add-ons are loaded with `defer` and run after it, before `window` fires `load`.
Every getter is live; read it each time instead of caching it.

## Data and events
- `Desk.data`: the latest merged desk object. It is the GitHub `desk.json` overlaid with the signed live feed. Fields: `bank_sol, pnl_sol, bank_usd, stats{trades,wins,losses,win_rate,realized_sol,fees_paid_sol}, open[], trades[], closed[], marks{SYMBOL:[[ts,price_sol],...]}, history[[ts,bank_sol]], kol_watch{...}, rules{...}, last_update, live, speech`.
  - `open[]`: `{symbol, strategy:'main'|'premig', mint, opened_at, cost_sol, pnl_pct, price_sol, mark_ts, curve_pct, curve_at_entry}`
  - `trades[]`, newest first: `{ts, side:'BUY'|'TP'|'STOP'|'TRAIL'|'TIME'|'SELL', strategy, mint, symbol, size_sol, price_sol, pnl_pct|null, pnl_sol?}`
- `Desk.on('update', fn(d))`: runs after every render, about every 60 s from GitHub plus every live push. If data already exists, it fires right away. Returns an unsubscribe function.
- `Desk.on('trade', fn(trade, d))`: fires once for each NEW trade row. It never fires for the first load.
- `Desk.on('frame', fn(ctx, t))`: runs every animation frame after the office and actors are drawn, for overlays drawn on top.

## Office canvas
`Desk.office` has: `ctx, canvas, width, height, mobile` (getters, in canvas pixels).
- Canvas size is 1600x900 on desktop and 800x1333 on mobile (width under 760 px). It changes on resize.
- `floorBounds()` returns `{xMin,xMax,yMin,yMax}`. `y` is the actor's foot line.
- `spots()` returns `{desk,cooler,window,board,plant}` as `{x,y}` points.
- `toCanvas(clientX,clientY)` and `toClient(x,y)` convert coordinates, handling scaling and DPR.
- `screenRect()` returns the DOMRect of the main monitor's HTML overlay.
- `addActor(a)` returns a remove function. The actor is called every frame:
  - `a.step(t)`, optional: moves the actor.
  - `a.draw(ctx,t)`: called inside `ctx.save()` and `ctx.restore()`, in canvas pixels.
  - `a.y`: the foot line, used to sort drawing by depth.
  - Drag support: set `a.draggable=true`, plus `a.x`, `a.y`, `a.hc` (the grab point is `hc`×scale above `y`) and `a.say(text,ms,color)`. While held, the core sets `a.state='held'` and moves `a.x`, `a.fy` (floor) and `a.y`. On release it sets `a.state='drop'` and `a.vy=0`. Your `step` should animate the fall to `a.fy` and the bounce. You can give `a.grab[]` and `a.land[]` lines.
- Desk.quanty: `x, y, state ('sit'|'walk'|'look'|'held'|'drop'), dest, bubble`, plus `say(text,ms,color)` and `goDesk()`.

## Hand-over of the inline versions
index.html already contains basic inline versions of the Ledger and Twitter characters, the three bubble tabs, and the monitor wall (`#wall` overlay).
- To replace them, call `Desk.disableInline({characters:true})` and/or `Desk.disableInline({monitors:true})` at the top of your script. The inline bubble tabs are created on `window` `load`, so disabling them early works.
- DOM hooks: `#wall` (monitor wall container, absolutely positioned inside `.stage`), `.screen` (main monitor), `#feed`, `#poss`, `#mbub` (shared bubble card), `#minis` (container for bubble tabs).

## Utils (`Desk.utils`)
- `E(str)`: HTML escape.
- `P(pct)`: format as `+1.2%`.
- `S(sol)`: format as `+0.0123`.
- `PR(price)`.
- `T(iso)` and `HM(iso)`: time formatting.
- `AGO(iso)`: for example `12s`, `3m`, `1h 4m`.
- `DX(mint)`: DexScreener URL, or null if the mint isn't valid base58.
- `SG(strategy)`: the MAIN/PREMIG tag as HTML.
- `spark(points, up)`: SVG string.
- `rr(x,y,w,h,r,fill)`: rounded rect on the office ctx.

## Rules
- View only.
- No external images or real logos.
- Never name who made the bots.
- Avoid every word and pattern that `leakcheck.py` flags, including addresses, emails and file paths. The leak grep (`public_site/leakcheck.py`) runs on every file before publish and blocks the whole push.
- Base58 strings are allowed only as `"mint"` values in the data.
- Only the integrator pushes to GitHub. Write your file locally and hand off.

## Live quotes (`js/livequotes.js`)
Client-side live prices for every open coin, polled from the public DexScreener tokens endpoint every ~5 s while the tab is visible (paused when hidden, backs off on errors).
- `Desk.live` = `{positions:{<mint>:{symbol, book:'quanty'|'ledger', strategy, price_sol, mc_usd, pnl_pct, pnl_sol, value_sol, updated, delayed, source:'dexscreener'|'desk'}}, books:{quanty:{bank, cash, pnl_sol, pnl_pct, open, delayed, bank_usd}, ledger:{bank, cash, pnl_sol, pnl_pct, open, delayed}}, updated, ok}`.
- `window` event `desk:live` (`e.detail` = `Desk.live`) fires after every poll and after every `Desk.on('update')`.
- `delayed:true` means DexScreener had no quote (for example a pre-migration coin it doesn't list yet; pump.fun's API blocks browser CORS), so the numbers are the desk.json values. Show it as "DELAYED" with an amber dot instead of the green pulsing LIVE dot.
- **VS board (Designer):** please read the current % from `Desk.live.books.quanty.pnl_pct` and `Desk.live.books.ledger.pnl_pct` when present (fall back to `Desk.data`), redraw on `desk:live`, and show the live MC (`mc_usd`, formatted like `$412K`) and `pnl_pct` of open coins with a pulsing LIVE dot. CSS classes `.lq-dot` (add `.dl` for delayed) and `.lq-tag` are available globally.
- Monitor wall screens carry `data-live-mint`; livequotes fills `.mw-pnl`, `.mw-mc` and `.mw-lv` on them. It also updates `#bank` / `#pnl` and appends `#lq-strip` (LIVE dot + MC/P&L per coin + Ledger %) to `.ticker`.
