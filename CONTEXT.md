# Terrace & Tide language

**District**: A tile zoned for homes, shops, or workshops. _Avoid_: counter, instant building.

**Road network**: A set of orthogonally connected road tiles. It provides transport access and civic connectivity; utilities use separate overlay components. _Avoid_: traffic simulation.

**Served district**: A district with road access and enough independent power-line and pipe capacity for its planned maximum occupancy. _Avoid_: nearby plant.

**Capacity**: The maximum residents and job spaces reserved separately on each utility network. Empty zones reserve their full capacity. _Avoid_: current usage.

**Jobs**: Available occupied workplace spaces; **workforce** is 60% of residents, rounded down; **employed** is the smaller of jobs and workforce. _Avoid_: population equals workers.

**Civic coverage**: A home's access to both a connected clinic and a connected fire station within four tiles of Manhattan distance. _Avoid_: citywide service.

**Charter**: The guided harbor-town scenario with three milestones and a final three-month stability requirement. _Avoid_: endless tutorial.

**Month**: One deterministic settlement cycle. _Avoid_: animation frame.

2026-10-15 focused correction: v2 tiles add independent wire/pipe overlays. Keep v1 storage keys; migrate existing v1 roads to both overlays without charge. See docs/UTILITY_FIDELITY.md and ADR 0003 for contract, research, acceptance and limits. Independent reviews, serialized checks/build and the focused native browser route are complete; see the local acceptance record for observed limits.
