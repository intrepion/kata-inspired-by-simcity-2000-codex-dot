# Independent power lines and underground pipes

2026-10-15. Repository `2026-10-11/task-26/kata-inspired-by-simcity-2000-codex-dot`; baseline `4b40b23937370c67c9f2e614f20ac9885ae23820`, clean before source work. Preview PID 84407, http://localhost:5210, preserved. Local changes only; no commits, pushes, new dependencies or external runtime assets.

## Primary research and bounded contract

Read the original [Maxis SimCity 2000 manual](https://classicreload.com/sites/default/files/sim-city-2000-manual.pdf), printed pages 17–18, 61–62 and 102–103, before planning. It distinguishes transport from power lines, requires wires across road divisions and offers a separate underground pipe tool/view. Independent infrastructure placement and diagnosis are the focused correction. The authored island, buildings, budget, demand equations and Harbor Charter remain.

User-delegated Grill with Docs/Implement defaults: each land tile may independently contain a surface building, power line and water pipe. New roads supply transport access alone. W selects Power line ($8), P selects Water pipe ($12); each crosses roads/zones and may be painted or applied with the existing coordinate/keyboard controls. Pipe tools select the underground map automatically, hiding above-ground buildings to expose blue connections. Power lines appear gold when connected to a source, red when unpowered. District overlays/inspector show actual reserved service independently.

Power and water each compute their own orthogonal components and maximum-capacity reservations. A source attaches to one touching component and contributes 600 exactly once; touching disconnected islands does not duplicate its output. Each zone reserves its planned maximum separately on each graph. Road access is required for growth, but cutting a road preserves both utilities. Remove wire / Remove pipe cut only that layer. Surface demolition leaves wires and pipes intact. A district can lose water while retaining power, then recover after reconnection.

## Compatibility and checks

Version 2 persists strict boolean wire/pipe fields. V1 autosave/manual/file imports keep their keys and upgrade existing roads into both overlays, without charging. Finances, developed occupants, milestones and history stay intact. New v2 roads add no implicit utilities. Existing protected terrain and corrupt-save checks remain.

Strict typecheck and **42/42 tests** pass. Retained construction/growth/tax/pollution/civic/charter/clock/save tests now explicitly lay the required infrastructure. A new city completes the charter in month 7 with $12,606, then continues sandbox; the $400 difference from the former fixture is exactly 20 road cells × ($8 wire + $12 pipe). Tests distinguish all three graph cuts, recovery, cross-layer coexistence, duplicate capacity, invalid/repeated construction and v2 saves.

The historical browser-played v1 city, recorded before this correction, at `qa/browser-played-city.json` migrates with identical terrain/occupancy, $313,582 treasury, month 503, milestones and history. Its entire economic/service summary is compared with a fixture generated using baseline HEAD's analyze function: 240 residents, 180 jobs, 96 satisfaction, 100% utility/civic coverage, $838 income, $232 upkeep, $606 surplus, 600 capacity each and 420 reserved. Another 150 months with save/reload each month remain valid and preserve population. These are domain tests, not new browser evidence.

The final original checkout strict typecheck, all 42 tests, repository format:check and production build passed (8 modules, 42.23 kB JS; Vite 5.98 s). A CSS plugin timing warning was informational; the build succeeded. Independent review passed with no remaining blockers. Normal-input browser acceptance passed after the renewed unlock and exclusive handoff, as recorded below. Native acceptance is recorded below; no preview restart was needed.

## Normal-input route

All coordinates below are **one-based**. Use Go to tile + Locate + Apply tool for precision, or click/drag the map. Start New city with confirmation, paused; an existing autosave is preserved until the user's normal new-city action.

1. Build roads along row 6, columns 3–8. Put a River pump at (3,5), Wind turbine at (4,5), Homes at (7,5). Inspect Homes: road yes, power and water missing. Step month: no residents.
2. W / Power line: lay row 6, columns 3–8. Inspect Homes: power yes, water missing. P / Water pipe: same cells; underground view exposes blue pipes. Step month: 10 residents arrive. Continue to 40 for the first charter grant. The initial lesson's infrastructure costs $1,970 total.
3. Remove pipe at (5,6), inspect Homes: road and power stay yes, water becomes missing. Step month: residents decline by 10. Reconnect using P at (5,6); step again to recover. Save, Load saved with confirmation: geometry, three layers, occupants and treasury return paused.
4. Optional independent transport check: surface-bulldoze road at (7,6) with its confirmation. Homes lose road access but retain power and water. Rebuild Road on that tile; both utility overlays are still there.
5. Full charter route: roads row 6 columns 3–12; branches columns 6 and 10 at rows 5 and 7–10. Add both utilities to every road tile. Pump (3,5), turbine (4,5), clinic (7,5), fire (8,5). Homes (5,5),(6,4),(7,7),(8,7),(9,5),(9,7). Shops (11,5),(12,5),(11,7),(12,7),(9,8),(11,8). Keep tax 9%; seven monthly steps reach the charter. Continue sandbox or inspect independent cut/reconnect behavior.

## Limits

Fixed isometric board and authored growth equations; no altitude, dense zone painting, vehicles/congestion, loans, underground subways or disasters. Lines/pipes cost once and have no extra monthly upkeep on this small board. Pumps retain the existing fixed output rather than weather/power-dependent pumping. Zones need both utilities at all densities in this authored challenge; the original's gradual water-density rules are not modeled. No full SimCity recreation claim.

## Native browser acceptance passed — 2026-10-15

The earlier 17:08 UTC locked-Mac inventory is historical. After the user confirmed unlock and the parent explicitly regranted exclusive access at 17:30 UTC, native inventory succeeded. The worker used only its new tab `222225564` at `http://fidelity-gta-worker-20261015.localhost:5210/`. Existing user/root/Witness tabs, original save origins and preview listeners were preserved. No game-state/model/DOM event injection or clock manipulation was used.

Normal coordinate controls built roads, sources and a home. Roads alone supplied neither utility and produced no growth. Wires enabled power only; separate pipes enabled water and growth to 40 residents/First neighbors. A pipe cut retained power and road access but reduced population to 30 after a month; reconnection recovered 40. A wire cut retained water and road access; reconnecting restored all three checks. Save/browser Reload retained 40 residents, $12,078, month 8, the first milestone, paused speed and both utility networks.

Fixed isometric board, native tool/coordinate/Locate/Apply/Step/Save controls and power/underground overlays were exercised. This introductory neighborhood completed the first milestone; full charter, road-only demolition, v1 migration and long-sandbox accounting remain source-test evidence. No source fix, test/build rerun or preview restart was required by native QA.

See [detailed local acceptance](LOCAL_ACCEPTANCE_2026-10-15.md) and the [screenshots and acceptance record](LOCAL_ACCEPTANCE_2026-10-15.md). Simulated guides and historical fixtures remain source-only evidence; the native results above are a separate observed pass. After all four projects, the worker closed only its own QA tab and explicitly released native ownership.
