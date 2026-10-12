# QA evidence

QA uses the user's existing supported local Chrome extension browser. A new game tab opened at http://127.0.0.1:5210/; earlier game tabs/servers were not touched. No Mac unlock, hidden browser-state mutation, security setting change or public hosting was used.

## Actual browser-played charter
The corrected implementation was built from an empty $14,000 city through visible tile controls, tool buttons and coordinate navigation. Human coordinates are 1-based:

- Roads: row 6, columns 3–12; columns 6 and 10, rows 5,7,8,9,10.
- Pump (3,5), turbine (4,5), clinic (7,5), fire station (8,5).
- Homes: (5,5), (6,4), (7,7), (8,7), (9,5), (9,7).
- Shops: (11,5), (12,5), (11,7), (12,7), (9,8), (11,8).

Construction leaves $9,050. Seven visible Step month actions settled these observed states:

| Settled month | Residents | Jobs | Treasury | Charter |
|---|---:|---:|---:|---|
|1|40|60|9,458|First neighbors +$500|
|3|160|120|10,652|Caring town +$750|
|5|240|180|11,794|Stable 1/3|
|6|240|180|12,400|Stable 2/3|
|7|240|180|13,006|Victory modal; 96% satisfaction, $606/mo surplus|

[Victory screenshot](../qa/charter-victory.jpg). Continue sandbox was activated through the normal button. Normal and fast controls were exercised; the final city ran naturally to settled month 503, still 240 residents/180 jobs/96%/$606 surplus and $313,582 treasury. It was paused and manually saved. The [played save](../qa/browser-played-city.json) was obtained from the visible export textarea, not hidden storage or state; it round-tripped through visible paste import. [Sandbox screenshot](../qa/sandbox-city.jpg).

## Actual browser interactions

- Canceled New city, demolition and Load dialogs: city/treasury unchanged. Confirmed New city only for disposable pressure scenarios; restored the manual charter city afterward. Dialogs stop settlement.
- Removed the road at (5,6): utilities disconnected, after a month population fell from 240 to 180 and jobs to 120. Rebuilt the road: next month restored 240/180. Duplicate Apply did not charge again. [Cut](../qa/network-cut.jpg).
- Raised tax with keyboard slider to 15%: residents declined, then restoring 9% restored growth.
- Built ten idle turbines: $5,000 cash, -$600/mo; ten Step actions reached -$1,000. Unaffordable construction refused without charge. Grant brought $2,000 and disabled its button. Free demolition stopped upkeep. A two-road, one-home/one-shop town with one pump/turbine recovered from $90 to $571 at $24/mo. [Pressure](../qa/budget-pressure.jpg), [recovered town](../qa/recovered-town.jpg).
- Final implementation fallback: ten turbines → debt → grant → further debt at -$4,000; demolished all ten through confirmation dialogs; next Step yielded $3,000 fresh-start relief. [Relief](../qa/fresh-start-relief.jpg). Thus even an exhausted grant cannot softlock an empty town.
- Placed connected industry at (7,8): the home (7,7) reached pollution 54, showed the explicit stall reason and declined, total people 230. Park (7,9) reduced pollution and restored 240 next month. Restored the saved clean town.
- Mouse drag painted five consecutive road tiles and charged exactly $150; a later click placed just one tile. Keyboard arrows/Enter and tool shortcuts worked. Escape/blur/cancel/pointercancel handlers clear painting. Native Space activated buttons after the review fix; focus remained on the selected map tile through automatic ticks.
- 390×844 responsive override: usable stacked tools/cards; actual coordinate construction and keyboard navigation; repeated placement charged once; horizontal map pan and zoom (100→125→100%) worked. Restored normal viewport. [Mobile](../qa/mobile-planning.jpg). Narrow screens intentionally pan a 540px map rather than shrinking tiles beyond readability.
- Manual Save/Load, canceled load and browser reload retained the correct state and resumed paused. Corrupt pasted JSON displayed an error and retained treasury. A valid visible JSON export imported with the exact treasury/month/charter.

## Automated evidence and limits

36 targeted tests initially passed after review, including network islands/cuts/reconnections, capacity overflow/restoration and plant nondeduplication, invalid/unaffordable/duplicate placement, free demolition, jobless growth cap, workforce/employment/demand/tax literals, pollution/parks, shared-network service coverage, exact charter thresholds and grants, insolvency/recovery, bounded long sandbox, pause/speed equivalence, interrupted clock catch-up, and malformed/corrupt/progression save rejection. A later fixture test checks the independently browser-played save. Public domain fixtures construct through place/tick; these automated simulations are **separate** from the actual browser play described above.

Chrome extension file chooser upload was blocked because Allow access to file URLs is disabled. That permission was left untouched. Paste-JSON import was fully exercised instead. Download event capture timed out, so automated native file download/picker completion is not claimed; visible export JSON and save/load/import round-trip are verified. Console warnings observed originated from another installed browser extension; no game-origin JavaScript error was observed. Cross-browser, real mobile touch hardware and OS download picker QA were not performed.

## Final delivery checks

Final tests/typecheck/format/build/audit and exact final-commit CI status are reported in the delivery response. Production serving uses scripts/serve.mjs in a detached session-only Node process, without boot/login registration. Root HTML, fingerprinted JavaScript/CSS and favicon must return HTTP 200; final supported Chrome reload is checked after switching off the development server. Current game remains paused with the browser-played town.
