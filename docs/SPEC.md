# Terrace & Tide specification

## Autonomous decision frontier
User authorized recommended defaults and no design questions. Resolved tree: browser game → TypeScript/Vite, original SVG art and CSS, no external media; spatial simulation → 16×16 elevated isometric map, river and rocky ridge; systems → R/C/I + connected roads + power/water capacity + clinic/fire/parks; progression → Harbor Charter + continuing sandbox; persistence → local autosave plus explicit save/load/export/import; recovery → free demolition, taxes and one rescue grant; distribution → private repo and loopback-only production server on 5210. Original title and text, no copied maps/assets/music. No audio (quiet planning experience).

## Public seams authorized by delegated test mandate
Simulation: createCity, place, demolish, analyze, tick, advance, setTax, rescue. Persistence: serialize, deserialize. UI: map input, destructive dialogs and browser-visible controls. These seams are the scope of targeted red/green tests.

## Domain contract
- New city paused at $14,000, tax 9%, 16×16 deterministic map. Water and rock forbid ordinary building. Pump must touch river water. Turbine/pump each reserve 600 units per network; R reserves 40 power/water, C 30, I 40. Only adjacent roads carry supply. Shared network capacity cannot be duplicated.
- Placement on occupied/invalid/unaffordable tile never changes treasury or tile. Construction is one tile per action; drag paints roads and zones only and never charges a tile twice. Free demolition is confirmed for every occupied tile. Escape cancels painting/dialog. Terrain cannot be demolished.
- Districts grow by 10 occupancy/month to maximum 40 residents, 30 commercial jobs or 40 industrial jobs. Missing road/power/water causes 10/month decline. Residential growth requires sufficient jobs (first 40 residents allowed), tax <=12%, pollution <45 and satisfaction >=40. Business demand compares job capacity with workforce plus startup buffer. Taxes >12% cause home decline.
- Industry causes local pollution within distance 3, parks mitigate within 3. Connected clinic/fire each cover distance 4. Home satisfaction reflects tax, employment, pollution and both services. Inspectors explain stalls; six overlay choices redundantly use labels and color.
- Monthly resident tax = round(population × tax% ×28); workplace tax = round(employed × tax% ×18). Upkeep: road2, R/C/I1, turbine60, pump50, clinic35, fire35, park8. Debt stays bounded at -$1m; positive treasury capped $1bn. No negative occupancy/workforce/employment.
- Milestones: 1) 40 residents + active utilities; 2) 160 residents +80 jobs +75% civic coverage; 3) 240 residents +120 jobs +65 satisfaction +100% utilities +75% civic coverage +nonnegative monthly balance +cash>=1500 for 3 consecutive months. Rewards 500 and 750 once; victory stays latched. Sandbox continues after victory.
- Normal speed one month/2 seconds; fast one month/0.5 seconds. Pausing and modal dialogs stop settlement. Catch-up bounded and time ignored while hidden; equal simulated months give equal outcomes independent of speed. Optional Step month advances exactly one while paused.
- Local autosave, explicit manual save/load, download/import; corrupt saves report error and retain city. Restart requires cancelable confirmation. Help includes a viable construction plan. Keyboard tool shortcuts, map arrow keys/Enter, zoom, touch-friendly targets, narrow-screen pan/scroll.

## Verification
Targeted tests for spatial networks after cuts/reconnection, capacity overflow, placement guards, decline/demand/workforce, pollution/services, money/recovery, milestone exactness, independent elapsed time, strict saves. Browser gameplay starts empty, uses visible controls only, reaches ending, continues sandbox; inspect screenshots and responsive view. Browser QA must distinguish played actions from automated domain simulation. Test/typecheck/build/audit and exact-commit Actions must pass. Preserve ports 5173–5209.
