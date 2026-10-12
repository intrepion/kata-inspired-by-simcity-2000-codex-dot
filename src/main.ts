import './style.css';
import {
  CATALOG,
  SIZE,
  analyze,
  advance,
  coords,
  createCity,
  demolish,
  id,
  isZone,
  place,
  rescue,
  setTax,
  tick,
  type City,
  type Kind,
  type Report,
} from './simulation';
import { drawMap, icon, type Overlay } from './art';
import { serialize, deserialize } from './save';
const $ = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const money = (v: number) => `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString('en-US')}`;
let city: City = createCity(),
  tool: Kind | 'inspect' | 'bulldoze' = 'inspect',
  overlay: Overlay = 'city',
  selected = id(5, 5),
  zoom = 1,
  painting = false,
  lastPaint = -1,
  clock = { elapsed: 0 },
  lastFrame = performance.now(),
  victoryShown = false;
let storageWarning = '';
try {
  const raw = localStorage.getItem('terrace-auto-v1');
  if (raw) {
    city = deserialize(raw);
    storageWarning = 'Autosave restored. The city is paused.';
  }
} catch {
  storageWarning =
    'Autosave unavailable or damaged. A fresh city is ready; manual file saves still work.';
}
$('#app').innerHTML = `
<header class="masthead"><a class="brand" href="#" aria-label="Terrace and Tide home"><span class="brand-mark">T<span>↗</span></span><span><strong>terrace <i>&</i> tide</strong><small>A CITY, ONE THOUGHTFUL BLOCK AT A TIME</small></span></a><div class="edition"><span class="live-dot"></span> THE HARBOR CHARTER <span class="edition-no">01 / FIELD EDITION</span></div><button class="quiet" id="help">Field guide <span>?</span></button></header>
<main>
<section class="city-header"><div><div class="eyebrow">YOUR NEXT GREAT PLACE</div><h1>Little harbor. <em>Big possibilities.</em></h1><p>Connect a neighborhood. Care for its people. Give it room to grow.</p></div><div class="time"><span id="date">SPRING · YEAR 1</span><div class="time-controls" aria-label="Simulation speed"><button id="pause" aria-label="Pause" title="Pause (Space)">Ⅱ</button><button id="play" aria-label="Play normal speed" title="1 month every 2 seconds">▶</button><button id="fast" aria-label="Play fast speed" title="1 month every half second">▶▶</button><button id="step" title="Advance one month while paused">Step month</button></div></div></section>
<section class="metrics" aria-label="City dashboard"><div><span>TREASURY</span><strong id="cash"></strong><small id="balance"></small></div><div><span>NEIGHBORS</span><strong id="population"></strong><small>People who call this home</small></div><div><span>WORK & OPPORTUNITY</span><strong id="jobs"></strong><small id="employment"></small></div><div><span>QUALITY OF LIFE</span><strong id="satisfaction"></strong><small id="coverage"></small></div><div class="demand"><span>DISTRICT DEMAND</span><div id="demand"></div><small>Homes / Shops / Workshops</small></div></section>
<div class="workbench">
<aside class="toolbox"><div class="panel-title"><span>01</span><h2>Make your mark</h2></div><p class="muted">Choose a tool, then a tile.</p><div class="tool-list">${Object.entries(
  CATALOG,
)
  .map(
    ([k, v]) =>
      `<button class="tool" data-tool="${k}" title="${v.hint} Shortcut ${v.shortcut}"><span class="tool-art">${icon(k as Kind)}</span><span><strong>${v.name}</strong><small>${money(v.cost)} <span>· ${money(v.upkeep)}/mo</span></small></span><kbd>${v.shortcut}</kbd></button>`,
  )
  .join(
    '',
  )}</div><div class="utility-tools"><button class="tool active" data-tool="inspect"><span class="glyph">⌖</span><strong>Inspect</strong><kbd>I</kbd></button><button class="tool" data-tool="bulldoze"><span class="glyph">⌫</span><strong>Bulldoze</strong><kbd>B</kbd></button></div><p class="tool-hint" id="tool-hint">Look closer. Every district has a story.</p></aside>
<section class="map-panel" aria-label="City planning map"><div class="map-toolbar"><div><span class="eyebrow">HARBOR BASIN</span><span class="map-tag">16 × 16 · river & ridge</span></div><div class="zoom"><button id="zoom-out" aria-label="Zoom out">−</button><span id="zoom-label">100%</span><button id="zoom-in" aria-label="Zoom in">+</button></div></div><div class="overlay-tabs" aria-label="Map overlays">${[
  ['city', 'City'],
  ['roads', 'Roads'],
  ['power', 'Power'],
  ['water', 'Water'],
  ['services', 'Civic'],
  ['pollution', 'Air'],
]
  .map(
    ([k, v]) =>
      `<button data-overlay="${k}" class="${k === 'city' ? 'active' : ''}" aria-pressed="${k === 'city'}">${v}</button>`,
  )
  .join(
    '',
  )}</div><div class="map-scroll" id="map-scroll"><svg id="map" role="group" viewBox="0 0 1040 575" aria-label="Isometric harbor map. Arrow keys move; Enter applies the selected tool." xmlns="http://www.w3.org/2000/svg"></svg></div><div class="map-bottom"><span id="legend">Meadow · River · Ridge · Districts grow upward</span><span class="north">↗ N</span></div><div class="selection-control"><span>Go to tile</span><label>Column <input id="column" type="number" min="1" max="16" value="6"></label><label>Row <input id="row" type="number" min="1" max="16" value="6"></label><button id="locate">Locate</button><button id="apply">Apply tool</button><small>Arrows + Enter on map · drag roads / zones · Escape cancels</small></div><div id="notice" class="notice" role="status" aria-live="polite">Start with a road, a wind turbine and a river pump. Your city is paused.</div></section>
<aside class="right-rail"><section class="charter panel"><div class="panel-title"><span>02</span><h2>The Harbor Charter</h2></div><p class="muted">A small town with a lasting future.</p><div id="milestones"></div><div class="charter-foot" id="charter-status">Three milestones. One good place.</div></section><section class="inspector panel"><div class="panel-title"><span>03</span><h2>Block notes</h2></div><div id="inspector"></div></section><section class="budget panel"><div class="panel-title"><span>04</span><h2>City ledger</h2></div><div id="ledger"></div><label class="tax-label" for="tax">Local tax <strong id="tax-value">9%</strong></label><input id="tax" type="range" min="5" max="15" step="1" value="${city.tax}" aria-label="Local tax percent"><div class="range-labels"><span>Growth · 5%</span><span>Pressure · 15%</span></div><button id="rescue" class="grant">Request $3,000 recovery grant</button></section></aside>
</div>
<footer><div><strong>Good cities begin with good connections.</strong><span>Original miniature city simulation · no external assets</span></div><nav aria-label="City files"><button id="save">Save</button><button id="load">Load saved</button><button id="export">Download save</button><button id="import">Import</button><button id="restart">New city</button></nav><span id="save-state">Autosave on</span></footer>
</main><input id="file" type="file" accept=".json,application/json" hidden><dialog id="dialog" aria-labelledby="dialog-title"><div id="dialog-content"></div></dialog>`;
const dialog = $<HTMLDialogElement>('#dialog');
let onConfirm: (() => void) | null = null;
function notify(message: string) {
  $('#notice').textContent = message;
}
function persist() {
  try {
    localStorage.setItem('terrace-auto-v1', serialize(city));
    $('#save-state').textContent = 'Autosaved · month ' + city.month;
  } catch {
    $('#save-state').textContent = 'Storage blocked · download a save';
  }
}
function modal(
  title: string,
  body: string,
  confirmText: string,
  action: () => void,
  cancelText = 'Cancel',
) {
  painting = false;
  clock.elapsed = 0;
  onConfirm = action;
  $('#dialog-content').innerHTML =
    `<div class="eyebrow">TERRACE & TIDE</div><h2 id="dialog-title">${title}</h2>${body}<div class="dialog-actions"><button id="cancel-dialog" class="quiet">${cancelText}</button><button id="confirm-dialog" class="primary">${confirmText}</button></div>`;
  if (!dialog.open) dialog.showModal();
  $('#cancel-dialog').onclick = () => dialog.close();
  $('#confirm-dialog').onclick = () => {
    const action = onConfirm;
    dialog.close();
    action?.();
  };
}
dialog.addEventListener('close', () => {
  onConfirm = null;
  painting = false;
  lastFrame = performance.now();
  clock.elapsed = 0;
});
function chooseTool(next: typeof tool) {
  tool = next;
  painting = false;
  lastPaint = -1;
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tool === tool);
    b.setAttribute('aria-pressed', String(b.dataset.tool === tool));
  });
  $('#tool-hint').textContent =
    tool === 'inspect'
      ? 'Look closer. Every district has a story.'
      : tool === 'bulldoze'
        ? 'Free removal. Each occupied tile asks for confirmation.'
        : CATALOG[tool as Exclude<Kind, 'empty'>].hint;
  render();
}
function selectTile(i: number, focus = false) {
  selected = i;
  const [x, y] = coords(i);
  $<HTMLInputElement>('#column').value = String(x + 1);
  $<HTMLInputElement>('#row').value = String(y + 1);
  render();
  if (focus) $<SVGGElement>(`[data-tile="${i}"]`).focus();
}
function applyTile(i: number) {
  const [x, y] = coords(i);
  selected = i;
  if (tool === 'inspect') {
    selectTile(i);
    return;
  }
  if (tool === 'bulldoze') {
    const t = city.tiles[i];
    if (t.kind === 'empty') {
      notify('Nothing to remove. The landscape is protected.');
      render();
      return;
    }
    const name = CATALOG[t.kind].name;
    modal(
      `Remove this ${name.toLowerCase()}?`,
      `<p>Column ${x + 1}, row ${y + 1}. Removal is free.${t.amount ? ` This removes ${t.amount} ${t.kind === 'residential' ? 'residents' : 'job spaces'}.` : ''} Connected districts may lose supply.</p>`,
      'Remove block',
      () => {
        demolish(city, x, y);
        notify(`${name} removed. Check network capacity before continuing.`);
        render();
        persist();
      },
    );
    return;
  }
  const result = place(city, x, y, tool as Exclude<Kind, 'empty'>);
  notify(result.message);
  selectTile(i);
  if (result.ok) persist();
}
function render() {
  const mapFocused = $('#map').contains(document.activeElement);
  const r = analyze(city);
  $('#cash').textContent = money(city.cash);
  $('#balance').textContent = `${r.net >= 0 ? '+' : ''}${money(r.net)} / month`;
  $('#balance').className = r.net < 0 ? 'negative' : 'positive';
  $('#population').textContent = String(r.population);
  $('#jobs').textContent = String(r.jobs) + ' jobs';
  $('#employment').textContent = `${r.employed} working / ${r.workforce} workforce`;
  $('#satisfaction').textContent = `${r.satisfaction}%`;
  $('#coverage').textContent = `${r.coverage}% health & fire coverage`;
  $('#demand').innerHTML = Object.entries(r.demand)
    .map(
      ([k, n]) =>
        `<span class="demand-bar ${k}" title="${k} demand ${n}%"><i style="height:${Math.max(5, n)}%"></i><b>${n}</b></span>`,
    )
    .join('');
  const seasons = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
  $('#date').textContent =
    `${seasons[Math.floor((city.month % 12) / 3)]} · YEAR ${Math.floor(city.month / 12) + 1} · MONTH ${city.month + 1}`;
  for (const [button, speed] of [
    ['pause', 0],
    ['play', 1],
    ['fast', 4],
  ] as const) {
    $('#' + button).classList.toggle('active', city.speed === speed);
    $('#' + button).setAttribute('aria-pressed', String(city.speed === speed));
  }
  $<HTMLButtonElement>('#step').disabled = city.speed !== 0;
  $('#map').innerHTML = drawMap(city, r, overlay, selected, tool);
  if (mapFocused && !dialog.open)
    $<SVGGElement>(`[data-tile="${selected}"]`).focus({ preventScroll: true });
  const legends: Record<Overlay, string> = {
    city: 'Meadow · River · Ridge · Districts grow upward',
    roads: 'RD = road access · × = isolated · numbers = network',
    power: `✓ supplied · × missing · ${r.power} capacity / ${r.reserved} reserved`,
    water: `✓ supplied · × missing · ${r.water} capacity / ${r.reserved} reserved`,
    services: 'H = health · F = fire · – = missing · both needed',
    pollution: 'Air pressure: green 0 · amber 1–44 · red 45+ stalls homes',
  };
  $('#legend').textContent = legends[overlay];
  renderInspector(r);
  renderMilestones(r);
  $('#ledger').innerHTML =
    `<div><span>Resident & workplace tax</span><strong class="positive">+${money(r.income)}</strong></div><div><span>Monthly operations</span><strong class="negative">−${money(r.upkeep)}</strong></div><div class="ledger-total"><span>Monthly balance</span><strong class="${r.net >= 0 ? 'positive' : 'negative'}">${r.net >= 0 ? '+' : ''}${money(r.net)}</strong></div><p>${r.upkeep === 0 && city.cash < 500 ? 'Empty harbor: next month brings $3,000 fresh-start relief.' : city.cash < 0 ? 'Treasury is in debt. Raise tax, remove idle infrastructure, or use your grant.' : r.net < 0 ? 'Construction phase: expenses arrive before residents. Grow a connected district.' : 'Operating in balance. Keep a reserve before expanding.'}</p>`;
  $('#tax-value').textContent = `${city.tax}%`;
  $<HTMLInputElement>('#tax').value = String(city.tax);
  const grant = $<HTMLButtonElement>('#rescue');
  grant.disabled = city.grant || city.cash >= 500;
  grant.textContent = city.grant
    ? 'Recovery grant already used'
    : city.cash >= 500
      ? 'Recovery grant unlocks below $500'
      : 'Request $3,000 recovery grant';
  if (city.won && !victoryShown) {
    victoryShown = true;
    modal(
      'A place worth staying.',
      `<div class="victory-seal">✦</div><p>The Harbor Charter is complete. You built a connected, caring town and held it in balance for three months.</p><div class="victory-stats"><span><strong>${r.population}</strong>neighbors</span><span><strong>${r.satisfaction}%</strong>quality of life</span><span><strong>${money(r.net)}</strong>monthly surplus</span></div><p>Your town keeps its charter. The next chapter is yours to build.</p>`,
      'Continue sandbox',
      () => {
        city.speed = 0;
        render();
        persist();
      },
      'Stay and admire',
    );
  }
}
function renderInspector(r: Report) {
  const t = city.tiles[selected],
    [x, y] = coords(selected),
    d = r.districts[selected];
  const name =
    t.kind === 'empty'
      ? t.terrain === 'land'
        ? 'Open meadow'
        : t.terrain === 'river'
          ? 'Protected river'
          : 'Rocky ridge'
      : CATALOG[t.kind].name;
  $('#inspector').innerHTML =
    `<div class="block-location">COLUMN ${x + 1} / ROW ${y + 1}</div><h3>${name}</h3>${d ? `<div class="block-count"><strong>${t.amount}</strong> / ${CATALOG[t.kind as 'residential'].max} ${t.kind === 'residential' ? 'residents' : 'jobs'}</div><p class="reason">${d.reason}</p><div class="checks"><span class="${d.road ? 'yes' : 'no'}">${d.road ? '✓' : '×'} Road</span><span class="${d.power ? 'yes' : 'no'}">${d.power ? '✓' : '×'} Power</span><span class="${d.water ? 'yes' : 'no'}">${d.water ? '✓' : '×'} Water</span><span class="${d.health ? 'yes' : 'no'}">${d.health ? '✓' : '–'} Health</span><span class="${d.safety ? 'yes' : 'no'}">${d.safety ? '✓' : '–'} Fire</span></div><p class="muted">Air pressure ${d.pollution}/100${t.kind === 'residential' ? ` · satisfaction ${d.satisfaction}%` : ''}. Reserves ${CATALOG[t.kind as 'residential'].max} units of each utility.</p>` : t.kind === 'road' ? `<p class="reason">Road network ${r.roadNetwork[selected] + 1}</p><p class="muted">${r.networks[r.roadNetwork[selected]]?.roads.length} road tiles. Power ${r.networks[r.roadNetwork[selected]]?.power}, water ${r.networks[r.roadNetwork[selected]]?.water}, reserved ${r.networks[r.roadNetwork[selected]]?.used}. Plants attach to one adjacent network.</p>` : t.kind === 'empty' ? `<p class="reason">${t.terrain === 'land' ? 'A little room for your next idea.' : t.terrain === 'river' ? 'Pumps belong on the shore, touching this water.' : 'The ridge is part of the landscape. Build around it.'}</p><p class="muted">Selected tool: ${tool === 'inspect' ? 'Inspect' : tool === 'bulldoze' ? 'Bulldoze' : CATALOG[tool as Exclude<Kind, 'empty'>].name}. Use Apply tool or click the map.</p>` : `<p class="reason">${CATALOG[t.kind].hint}</p><p class="muted">${money(CATALOG[t.kind].upkeep)} monthly upkeep.${['clinic', 'fire'].includes(t.kind) ? ' Shares coverage only with homes on an adjacent road network.' : ''}</p>`}`;
}
function renderMilestones(r: Report) {
  const requirements = [
    [
      'First neighbors',
      '40 people · connected utilities',
      r.population >= 40 && r.utilities === 100,
    ],
    [
      'A town that cares',
      '160 people · 80 jobs · 75% civic coverage',
      r.population >= 160 && r.jobs >= 80 && r.coverage >= 75,
    ],
    ['A lasting harbor', '240 people · 120 jobs · 3 stable months', false],
  ];
  $('#milestones').innerHTML = requirements
    .map(
      ([title, desc], i) =>
        `<div class="milestone ${city.milestones[i] ? 'complete' : ''}"><span class="milestone-number">${city.milestones[i] ? '✓' : String(i + 1).padStart(2, '0')}</span><div><strong>${title}</strong><small>${desc}</small>${i < 2 && !city.milestones[i] ? `<span class="reward">+${money(i === 0 ? 500 : 750)} charter grant</span>` : ''}${i === 2 ? `<div class="stability" aria-label="${city.stable} of 3 stable months">${[1, 2, 3].map((k) => `<i class="${city.stable >= k ? 'filled' : ''}"></i>`).join('')}</div>` : ''}</div></div>`,
    )
    .join('');
  $('#charter-status').innerHTML = city.won
    ? '<strong>✦ CHARTER COMPLETE · SANDBOX OPEN</strong>'
    : `<strong>${city.stable}/3 stable months</strong><p>Final: ≥65% happiness · all districts supplied · ≥75% civic · positive balance · $1,500 reserve.</p><div class="goal-checks">${[
        [r.population >= 240, 'People'],
        [r.jobs >= 120, 'Jobs'],
        [r.satisfaction >= 65, 'Happy'],
        [r.utilities === 100, 'Supply'],
        [r.coverage >= 75, 'Civic'],
        [r.net >= 0, 'Balance'],
        [city.cash >= 1500, 'Reserve'],
      ]
        .map(
          ([ok, title]) => `<span class="${ok ? 'yes' : 'no'}">${ok ? '✓' : '○'} ${title}</span>`,
        )
        .join('')}</div>`;
}
function help() {
  modal(
    'Build a harbor, one block at a time.',
    `<p>Roads are the roots of your city. A district and its plants must touch the same connected road network. Each zone reserves its full future utility capacity.</p><ol class="guide"><li><strong>Connect the shore.</strong> Paint a road on row 6, columns 3 through 12. Add branches at column 6 and 10 from row 5 through 10.</li><li><strong>Turn the lights on.</strong> Put a river pump at column 3, row 5 and a turbine at column 4, row 5. Both touch row 6. Each serves 600 reserved units.</li><li><strong>Make room for people.</strong> Zone homes beside roads, keeping them away from industry. Start with six homes and six shops: shops provide clean jobs.</li><li><strong>Care for the neighborhood.</strong> Place a clinic and fire station near the homes. Both cover homes within four tiles on the same road network. Use Civic overlay and Block notes.</li><li><strong>Let it settle.</strong> Press Play, or Step month while paused. Keep tax at 9%. Add jobs when homes stall. Maintain $1,500 reserve and a monthly surplus for three months to finish the charter.</li></ol><details><summary>Planning rules & recovery</summary><p>Homes grow 10/month if jobs are available (first 40 people can arrive without jobs). Shops and workshops grow when jobs are below workforce +40. Workforce is 60% of people. Only employed workers pay workplace tax. Industry pollutes within 3 tiles; parks reduce it. Homes stall at air pressure 45+, and residents leave at tax above 12% or missing utilities.</p><p>Utilities follow roads, not separate pipes or wires. Plants attach to one adjacent network. Traffic is abstracted; there are no vehicle jams, disasters, loans or external trading. Tax pays for operations. Demolition is free. If cash falls below $500, one $3,000 recovery grant helps you restructure. If you exhaust it, removing every constructed tile gives an empty harbor $3,000 fresh-start relief next month. Recovery always remains possible.</p></details><p class="muted">Shortcuts: 1–9 build tools, I inspect, B bulldoze, Space pause/play. Arrow keys navigate the selected map tile, Enter applies. Escape cancels. On small screens scroll the map or use Go to tile. Saves stay on this browser; download one for safekeeping.</p>`,
    'Start planning',
    () => {},
    'Close guide',
  );
}
$('#help').onclick = help;
document
  .querySelectorAll<HTMLButtonElement>('[data-tool]')
  .forEach((b) => (b.onclick = () => chooseTool(b.dataset.tool as typeof tool)));
document.querySelectorAll<HTMLButtonElement>('[data-overlay]').forEach(
  (b) =>
    (b.onclick = () => {
      overlay = b.dataset.overlay as Overlay;
      document.querySelectorAll('[data-overlay]').forEach((e) => {
        e.classList.toggle('active', (e as HTMLElement).dataset.overlay === overlay);
        e.setAttribute('aria-pressed', String((e as HTMLElement).dataset.overlay === overlay));
      });
      render();
    }),
);
for (const [button, speed] of [
  ['pause', 0],
  ['play', 1],
  ['fast', 4],
] as const)
  $('#' + button).onclick = () => {
    city.speed = speed;
    clock.elapsed = 0;
    lastFrame = performance.now();
    painting = false;
    render();
    persist();
  };
$('#step').onclick = () => {
  if (city.speed !== 0) return;
  const messages = tick(city);
  notify(
    messages.join(' ') || `Month ${city.month} settled. Inspect a district to see what changed.`,
  );
  render();
  persist();
};
$('#tax').oninput = () => {
  setTax(city, Number($<HTMLInputElement>('#tax').value));
  render();
  persist();
};
$('#rescue').onclick = () => {
  if (rescue(city)) {
    notify('Recovery grant received. Remove idle costs and rebuild a smaller connected town.');
    render();
    persist();
  }
};
$('#locate').onclick = () => {
  const x = Number($<HTMLInputElement>('#column').value) - 1,
    y = Number($<HTMLInputElement>('#row').value) - 1;
  if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < SIZE && y < SIZE) {
    selectTile(id(x, y));
    $(`[data-tile="${selected}"]`).scrollIntoView({ block: 'nearest', inline: 'nearest' });
  } else notify('Choose a column and row from 1 to 16.');
};
$('#apply').onclick = () => applyTile(selected);
function setZoom(delta: number) {
  zoom = Math.max(0.75, Math.min(1.75, zoom + delta));
  $('#map').style.width = `${zoom * 100}%`;
  $('#zoom-label').textContent = `${Math.round(zoom * 100)}%`;
}
$('#zoom-out').onclick = () => setZoom(-0.25);
$('#zoom-in').onclick = () => setZoom(0.25);
const map = $('#map');
map.addEventListener('pointerdown', (e) => {
  const event = e as PointerEvent;
  const tile = (e.target as Element).closest<SVGElement>('[data-tile]');
  if (!tile || event.button !== 0 || dialog.open) return;
  const i = Number(tile.dataset.tile);
  painting =
    event.pointerType === 'mouse' &&
    ['road', 'residential', 'commercial', 'industrial'].includes(tool);
  lastPaint = i;
  applyTile(i);
});
map.addEventListener('pointerover', (e) => {
  if (!painting || dialog.open) return;
  const tile = (e.target as Element).closest<SVGElement>('[data-tile]');
  if (tile) {
    const i = Number(tile.dataset.tile);
    if (i !== lastPaint) {
      lastPaint = i;
      applyTile(i);
    }
  }
});
window.addEventListener('pointerup', () => {
  painting = false;
  lastPaint = -1;
});
window.addEventListener('pointercancel', () => {
  painting = false;
  lastPaint = -1;
});
window.addEventListener('blur', () => {
  painting = false;
  clock.elapsed = 0;
});
map.addEventListener('keydown', (e) => {
  const event = e as KeyboardEvent;
  if (dialog.open) return;
  const [x, y] = coords(selected);
  const dirs: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  if (dirs[event.key]) {
    event.preventDefault();
    const [dx, dy] = dirs[event.key];
    selectTile(id(Math.max(0, Math.min(15, x + dx)), Math.max(0, Math.min(15, y + dy))), true);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    applyTile(selected);
    $<SVGGElement>(`[data-tile="${selected}"]`)?.focus();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    painting = false;
    lastPaint = -1;
    return;
  }
  if (
    dialog.open ||
    /INPUT|TEXTAREA|SELECT/.test((e.target as Element).tagName) ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  const found = Object.entries(CATALOG).find(([, v]) => v.shortcut === e.key);
  if (found) chooseTool(found[0] as typeof tool);
  if (e.key.toLowerCase() === 'i') chooseTool('inspect');
  if (e.key.toLowerCase() === 'b') chooseTool('bulldoze');
  if (e.code === 'Space' && !(e.target as Element).closest('button,a,summary')) {
    e.preventDefault();
    city.speed = city.speed === 0 ? 1 : 0;
    clock.elapsed = 0;
    lastFrame = performance.now();
    render();
    persist();
  }
});
$('#save').onclick = () => {
  try {
    localStorage.setItem('terrace-manual-v1', serialize(city));
    notify(`City saved at month ${city.month}. Load saved restores this snapshot.`);
  } catch {
    notify('Browser storage is unavailable. Download a save instead.');
  }
};
$('#load').onclick = () => {
  try {
    const raw = localStorage.getItem('terrace-manual-v1');
    if (!raw) {
      notify('No manual save yet. Use Save first.');
      return;
    }
    const next = deserialize(raw);
    modal(
      'Load your saved city?',
      '<p>This replaces current progress with your last manual save. The restored city will be paused.</p>',
      'Load city',
      () => {
        city = next;
        victoryShown = city.won;
        clock.elapsed = 0;
        notify(`Manual save restored at month ${city.month}.`);
        render();
        persist();
      },
    );
  } catch (e) {
    notify((e as Error).message);
  }
};
$('#export').onclick = () => {
  const raw = serialize(city);
  modal(
    'Keep your city safe.',
    '<p>Download a JSON file, or select and copy the complete save below. Import accepts either a file or pasted JSON. These are local files; nothing is uploaded.</p><label class="save-json-label" for="export-json">City save JSON</label><textarea id="export-json" rows="5" readonly></textarea>',
    'Download JSON',
    () => {
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `terrace-tide-month-${city.month}.json`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Save download requested. You can also copy JSON from Download save.');
    },
    'Close',
  );
  $<HTMLTextAreaElement>('#export-json').value = raw;
};
$('#import').onclick = () => {
  modal(
    'Bring a city home.',
    '<p>Choose a downloaded save file, or paste its JSON below. Import replaces current progress and starts paused. A damaged save will leave your city untouched.</p><button id="choose-file" class="quiet">Choose save file</button><label class="save-json-label" for="save-json">Save JSON</label><textarea id="save-json" rows="5" placeholder="Paste the contents of a Terrace & Tide save…"></textarea>',
    'Import pasted city',
    () => {
      try {
        const next = deserialize($<HTMLTextAreaElement>('#save-json').value);
        city = next;
        victoryShown = city.won;
        clock.elapsed = 0;
        notify('City imported successfully.');
        render();
        persist();
      } catch (e) {
        notify((e as Error).message);
      }
    },
  );
  $('#choose-file').onclick = () => {
    dialog.close();
    $<HTMLInputElement>('#file').value = '';
    $<HTMLInputElement>('#file').click();
  };
};
$('#file').onchange = async () => {
  const file = $<HTMLInputElement>('#file').files?.[0];
  if (!file) return;
  try {
    if (file.size > 100000) throw new Error('Save file is too large. Your city has not changed.');
    const next = deserialize(await file.text());
    modal(
      'Import this city?',
      '<p>The validated file will replace current progress. Import starts paused.</p>',
      'Import city',
      () => {
        city = next;
        victoryShown = city.won;
        clock.elapsed = 0;
        notify('City imported successfully.');
        render();
        persist();
      },
    );
  } catch (e) {
    notify((e as Error).message);
  }
};
$('#restart').onclick = () =>
  modal(
    'Begin a new harbor?',
    '<p>Your current city will be replaced with an empty harbor and $14,000. Download or manually save it first if you want to return.</p>',
    'Start new city',
    () => {
      city = createCity();
      victoryShown = false;
      selected = id(5, 5);
      clock.elapsed = 0;
      chooseTool('inspect');
      notify('A fresh harbor. Start with a road, wind turbine and river pump.');
      persist();
    },
  );
document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now();
  clock.elapsed = 0;
  painting = false;
});
function frame(now: number) {
  const seconds = (now - lastFrame) / 1000;
  lastFrame = now;
  if (!dialog.open && !document.hidden && city.speed !== 0) {
    const month = city.month;
    const messages = advance(city, clock, seconds);
    if (month !== city.month) {
      if (messages.length) notify(messages.join(' '));
      render();
      persist();
    }
  }
  requestAnimationFrame(frame);
}
victoryShown = city.won;
render();
if (storageWarning) notify(storageWarning);
requestAnimationFrame(frame);
