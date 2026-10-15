import { CATALOG, SIZE, terrainAt, coords, isZone, type City } from './simulation';
export function serialize(city: City): string {
  return JSON.stringify(city);
}
const integer = (n: unknown, min: number, max: number): n is number =>
  typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n >= min && n <= max;
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
export function deserialize(text: string): City {
  const invalid = () =>
    new Error('This save is damaged or belongs to another game. Your city has not changed.');
  if (text.length > 100000) throw invalid();
  let c: unknown;
  try {
    c = JSON.parse(text);
  } catch {
    throw invalid();
  }
  if (
    !record(c) ||
    ![1, 2].includes(c.version as number) ||
    !Array.isArray(c.tiles) ||
    c.tiles.length !== SIZE * SIZE ||
    !integer(c.cash, -1000000, 1000000000) ||
    !integer(c.month, 0, 1000000) ||
    !integer(c.tax, 5, 15) ||
    ![0, 1, 4].includes(c.speed as number) ||
    typeof c.grant !== 'boolean' ||
    typeof c.won !== 'boolean' ||
    !integer(c.stable, 0, 3) ||
    !Array.isArray(c.milestones) ||
    c.milestones.length !== 3 ||
    c.milestones.some((v) => typeof v !== 'boolean') ||
    c.won !== c.milestones[2] ||
    (c.milestones[1] && !c.milestones[0]) ||
    (c.milestones[2] && !c.milestones[1]) ||
    !Array.isArray(c.history) ||
    c.history.length > 24
  )
    throw invalid();
  if (
    (c.stable > 0 && (!c.milestones[1] || c.month < c.stable + 1)) ||
    (c.stable === 3 && !c.won) ||
    (c.milestones[0] && c.month < 1) ||
    (c.milestones[1] && c.month < 2) ||
    (c.won && c.month < 4) ||
    c.history.length !== Math.min(24, c.month)
  )
    throw invalid();
  const tiles = c.tiles.map((t: unknown, i: number) => {
    const [x, y] = coords(i);
    if (
      !record(t) ||
      t.terrain !== terrainAt(x, y) ||
      typeof t.kind !== 'string' ||
      !(t.kind === 'empty' || Object.hasOwn(CATALOG, t.kind)) ||
      !integer(t.amount, 0, 40) ||
      t.amount % 10 !== 0
    )
      throw invalid();
    const kind = t.kind as City['tiles'][number]['kind'];
    if (
      (t.terrain !== 'land' && kind !== 'empty') ||
      (!isZone(kind) && t.amount !== 0) ||
      (isZone(kind) && t.amount > CATALOG[kind].max)
    )
      throw invalid();
    const legacy = c.version === 1;
    if (!legacy && (typeof t.wire !== 'boolean' || typeof t.pipe !== 'boolean')) throw invalid();
    const wire = legacy ? kind === 'road' : (t.wire as boolean),
      pipe = legacy ? kind === 'road' : (t.pipe as boolean);
    if (t.terrain !== 'land' && (wire || pipe)) throw invalid();
    return {
      terrain: t.terrain as City['tiles'][number]['terrain'],
      kind,
      amount: t.amount,
      wire,
      pipe,
    };
  });
  // A pump away from the river cannot be produced through ordinary controls.
  tiles.forEach((t, i) => {
    if (t.kind === 'water') {
      const [x, y] = coords(i);
      if (
        ![
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ].some(([a, b]) => a >= 0 && b >= 0 && a < SIZE && b < SIZE && terrainAt(a, b) === 'river')
      )
        throw invalid();
    }
  });
  const history = c.history.map((h: unknown) => {
    if (
      !record(h) ||
      !integer(h.pop, 0, 10240) ||
      !integer(h.cash, -1000000, 1000000000) ||
      !integer(h.net, -100000, 100000)
    )
      throw invalid();
    return { pop: h.pop, cash: h.cash, net: h.net };
  });
  return {
    version: 2,
    tiles,
    cash: c.cash,
    month: c.month,
    tax: c.tax,
    speed: 0,
    grant: c.grant,
    won: c.won,
    stable: c.stable,
    milestones: c.milestones as boolean[],
    history,
  };
}
