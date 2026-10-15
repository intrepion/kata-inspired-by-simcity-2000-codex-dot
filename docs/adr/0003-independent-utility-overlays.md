# 0003 — Three independent infrastructure graphs

Accepted 2026-10-15. Keep the surface `kind` and add wire/pipe booleans to each land tile. Build transport components from roads and separate utility components from their overlays. A source contributes once to one touching component. Reserve each zone's future maximum on power and water separately, then combine with road access for growth. Civic coverage still depends on connected roads.

Use v2 schema with v1 road-to-both-overlay migration in the existing storage keys. Utility actions charge independently, surface placement/removal preserves overlay fields, and utility removal changes only its own field. The underground view hides buildings but retains selectable tile footprints. No utility equipment or economy expansion beyond the focused graph correction.
