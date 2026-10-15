# Terrace & Tide

An original miniature city builder about connections, care, and a town that can sustain itself. Elevated SVG blocks, a muted botanical palette, three charter milestones and continuing sandbox play. No copied assets, maps, text or audio. No runtime dependencies or external requests.

## Play locally

```sh
cd /Users/intrepion/Documents/Codex/2026-10-11/task-26/kata-inspired-by-simcity-2000-codex-dot
npm ci
npm run build
npm run serve:detached
```

Open **http://127.0.0.1:5210/** in Chrome. The detached process serves only `dist`, binds to loopback and ends on logout/reboot; it creates no autostart. The command refuses an occupied foreign port. `server.log` and `.server.pid` record its local process. For a foreground server use `npm start`. For development use `npm run dev`. Ports 5173–5209 belong to earlier projects and are untouched.

Choose a tool and click tiles. Drag to paint roads/zones/wires/pipes with a mouse; touch can scroll and tap. Coordinate navigation and Apply tool provide precise access to tiles hidden by taller buildings or beyond the narrow viewport. Arrow keys move the map selection and Enter applies a tool. 1–9 choose buildings, W selects power lines, P underground pipes, I inspects, B bulldozes, Space pauses/plays, Escape cancels. Each occupied demolition and each reset/load asks for confirmation. Simulation pauses while a dialog is open or the tab is hidden.

## Simulation scope

16×16 fixed river/ridge terrain. Residential, commercial and industrial districts grow and decline by deterministic monthly steps. Roads provide transport; independent power-line and underground-pipe overlays deliver power/water with separate capacity reservations. Clinics and fire stations cover nearby homes on the same road network. Industry pollutes, parks mitigate. Taxes, workforce, employment, district demand and monthly upkeep explain success or stalls. One $3,000 emergency grant and fresh-start relief after removing all construction keep recovery possible.

Utilities reserve future maximum capacity, not present consumption. Each source attaches to **one** touching component of its own utility. Inspect districts and the power/underground overlays to diagnose missing service. New roads add no wires or pipes; surface bulldozing preserves utilities, with separate line/pipe removal tools. Service buildings need road access but do not themselves consume utilities. Traffic is road access only. There are no modeled cars, congestion, disasters, height engineering, external trading, debt interest, loans, or audio. The compact scenario intentionally rewards six clean home/shop pairs, and sandbox lets you experiment with industrial growth and networks.

Saves are browser-local: autosave after actions/months, manual Save/Load snapshot, JSON download, file import or paste-JSON import. Loading/importing validates terrain, building/occupancy bounds, finances and flags; corrupt saves leave the current city intact. An autosave that cannot be read starts a fresh paused city and reports the issue. File-upload automation may require Chrome extension file access; the paste path works with existing permissions.

## Validation and docs

`npm test`, `npm run typecheck`, `npm run build`, `npm audit --audit-level=moderate`. CI repeats these on every push. Domain fixtures use public construction controls; browser gameplay is separately recorded in [QA](docs/QA.md), including victory and recovery evidence. [Specification](docs/SPEC.md), [glossary](GLOSSARY.md), [decisions](docs/adr), and [independent review](docs/REVIEW.md) capture design and verification.

[Focused utility correction: research, save migration, checks and normal-input route](docs/UTILITY_FIDELITY.md). V1 roads migrate to both utility overlays while preserving finances and development; saves now use v2.
