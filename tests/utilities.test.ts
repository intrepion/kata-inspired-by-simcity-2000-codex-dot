import { it, expect } from 'vitest';
import {
  createCity,
  place,
  layUtility,
  removeUtility,
  analyze,
  demolish,
  id,
  tick,
} from '../src/simulation';
import { serialize, deserialize } from '../src/save';
const lesson = () => {
  const c = createCity();
  for (let x = 2; x <= 7; x++) place(c, x, 5, 'road');
  place(c, 2, 4, 'water');
  place(c, 3, 4, 'power');
  place(c, 6, 4, 'residential');
  return c;
};
it('roads alone carry neither utility; separate overlays cross roads and zones', () => {
  const c = lesson(),
    home = id(6, 4);
  expect(analyze(c).districts[home]).toMatchObject({
    road: true,
    power: false,
    water: false,
    served: false,
  });
  tick(c);
  expect(c.tiles[home].amount).toBe(0);
  for (let x = 2; x <= 7; x++) expect(layUtility(c, x, 5, 'wire').ok).toBe(true);
  expect(analyze(c).districts[home]).toMatchObject({ power: true, water: false });
  for (let x = 2; x <= 7; x++) expect(layUtility(c, x, 5, 'pipe').ok).toBe(true);
  tick(c);
  expect(c.tiles[home].amount).toBe(10);
  expect(analyze(c).districts[home].served).toBe(true);
  expect(layUtility(c, 6, 4, 'wire').ok).toBe(true);
  expect(layUtility(c, 6, 4, 'pipe').ok).toBe(true);
  expect(c.tiles[home].kind).toBe('residential');
  const roundtrip = deserialize(serialize(c));
  expect(roundtrip).toEqual(c);
});
it('cutting a road keeps both supplies; independent wire and pipe cuts affect only their utility', () => {
  const c = lesson(),
    home = id(6, 4);
  for (let x = 2; x <= 7; x++) for (const u of ['wire', 'pipe'] as const) layUtility(c, x, 5, u);
  demolish(c, 6, 5);
  expect(analyze(c).districts[home]).toMatchObject({
    road: false,
    power: true,
    water: true,
    served: false,
  });
  place(c, 6, 5, 'road');
  removeUtility(c, 4, 5, 'wire');
  expect(analyze(c).districts[home]).toMatchObject({ road: true, power: false, water: true });
  layUtility(c, 4, 5, 'wire');
  removeUtility(c, 4, 5, 'pipe');
  expect(analyze(c).districts[home]).toMatchObject({ road: true, power: true, water: false });
  tick(c);
  expect(c.tiles[home].amount).toBe(0);
  layUtility(c, 4, 5, 'pipe');
  tick(c);
  expect(c.tiles[home].amount).toBe(10);
});
it('does not duplicate capacity at a crossing or bridge two wire islands through a plant', () => {
  const c = createCity();
  place(c, 5, 5, 'power');
  for (const [x, y] of [
    [4, 5],
    [6, 5],
  ]) {
    layUtility(c, x, y, 'wire');
    layUtility(c, x, y, 'pipe');
  }
  let r = analyze(c);
  expect(r.powerNetworks).toHaveLength(2);
  expect(r.power).toBe(600);
  expect(r.water).toBe(0);
  layUtility(c, 5, 5, 'wire');
  r = analyze(c);
  expect(r.powerNetworks).toHaveLength(1);
  expect(r.power).toBe(600);
  expect(r.waterNetworks).toHaveLength(2);
});
it('validates utility inputs, protected terrain and repeated placement without charge', () => {
  const c = createCity();
  for (const [x, y] of [
    [0, 0],
    [15, 0],
    [-1, 1],
    [NaN, 5],
  ])
    expect(layUtility(c, x, y, 'pipe').ok).toBe(false);
  expect(c.cash).toBe(14000);
  expect(layUtility(c, 5, 5, 'wire').ok).toBe(true);
  const cash = c.cash;
  expect(layUtility(c, 5, 5, 'wire').ok).toBe(false);
  expect(c.cash).toBe(cash);
  expect(removeUtility(c, 5, 5, 'wire')).toBe(true);
  expect(removeUtility(c, 5, 5, 'wire')).toBe(false);
  const bad = JSON.parse(serialize(c));
  delete bad.tiles[5].wire;
  expect(() => deserialize(JSON.stringify(bad))).toThrow();
});

it('migrates a genuine browser-played v1 city with exact economic/service report and continues a long sandbox', async () => {
  const { readFile } = await import('node:fs/promises');
  const raw = JSON.parse(
    await readFile(new URL('../qa/browser-played-city.json', import.meta.url), 'utf8'),
  );
  const expected = JSON.parse(
    await readFile(new URL('./fixtures/v1-browser-report.json', import.meta.url), 'utf8'),
  );
  const c = deserialize(JSON.stringify(raw));
  expect(c.version).toBe(2);
  expect(c.cash).toBe(raw.cash);
  expect(c.month).toBe(raw.month);
  expect(c.milestones).toEqual(raw.milestones);
  expect(c.history).toEqual(raw.history);
  expect(c.tiles).toEqual(
    raw.tiles.map((t: any) => ({ ...t, wire: t.kind === 'road', pipe: t.kind === 'road' })),
  );
  const report = analyze(c);
  for (const [k, v] of Object.entries(expected))
    expect(report[k as keyof typeof report], k).toEqual(v);
  for (let i = 0; i < 150; i++) {
    tick(c);
    expect(deserialize(serialize(c))).toEqual(c);
  }
  expect(c.won).toBe(true);
  expect(analyze(c).population).toBe(expected.population);
  expect(c.cash).toBeGreaterThan(raw.cash);
});
